import { buildSystemPrompt } from '../prompt/builder.js';
import { OllamaProvider } from '../providers/ollama/index.js';
import { executeTool, promptApproval } from '../tools/executor.js';
import { getToolDefinitions } from '../tools/registry.js';
import { TASK_COMPLETE_SIGNAL } from '../tools/utility/task_complete.js';
import { needsCompression, compressMessages, estimateTokens } from './compressor.js';
import { recordRun, deriveInsights } from './trainer.js';
import { initApexDirs } from './memory.js';
import type {
  AgentConfig,
  AgentState,
  Message,
  ToolCall,
  AgentEvent,
  EventListener,
} from '../types/index.js';

export class ApexAgent {
  private listeners: EventListener[] = [];
  private abortRequested = false;
  private provider: OllamaProvider;
  private sessionMemory = new Map<string, string>();
  /** Tracks consecutive turns with no tool calls — used to detect stalled model */
  private noToolStreak = 0;

  constructor(private config: AgentConfig) {
    this.provider = new OllamaProvider(config.ollamaUrl);
  }

  on(listener: EventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  abort(): void {
    this.abortRequested = true;
    this.emit({ type: 'abort' });
  }

  private emit(event: AgentEvent): void {
    for (const l of this.listeners) l(event);
  }

  async run(userTask: string, priorMessages: Message[] = []): Promise<AgentState> {
    this.abortRequested = false;
    await initApexDirs(this.config.workingDir);

    const systemPrompt = await buildSystemPrompt(this.config, userTask);
    const tools = getToolDefinitions();

    const state: AgentState = {
      status: 'thinking',
      iterations: 0,
      messages: [
        { role: 'system', content: systemPrompt },
        ...priorMessages,
        { role: 'user', content: userTask },
      ],
      toolCallCount: 0,
      startTime: Date.now(),
      tokenCount: 0,
    };

    this.noToolStreak = 0;

    while (state.iterations < this.config.maxIterations) {
      if (this.abortRequested) {
        state.status = 'aborted';
        break;
      }

      state.iterations++;
      this.emit({
        type: 'iteration_start',
        iteration: state.iterations,
        maxIterations: this.config.maxIterations,
      });

      // Compress if near context limit
      if (needsCompression(state.messages, this.config)) {
        const beforeTokens = estimateTokens(state.messages);
        this.emit({ type: 'status_change', status: 'compressing', message: 'Compressing context...' });
        const { compressed } = compressMessages(state.messages, 10);
        state.messages = compressed;
        this.emit({
          type: 'compress',
          fromTokens: beforeTokens,
          toTokens: estimateTokens(compressed),
        });
      }

      let response;
      try {
        this.emit({ type: 'status_change', status: 'thinking' });

        if (this.config.verbose) {
          // Streaming mode
          let fullContent = '';
          const streamMsgs = [...state.messages];
          for await (const chunk of this.provider.stream(streamMsgs, tools, this.config)) {
            const token = chunk.message?.content ?? '';
            if (token) {
              fullContent += token;
              this.emit({ type: 'token', token });
            }
            if (chunk.done) {
              state.tokenCount += chunk.eval_count ?? 0;
            }
          }
          // Re-fetch non-streaming for tool_calls
          response = await this.provider.chat(streamMsgs, tools, this.config);
          if (!response.message.tool_calls && fullContent) {
            response.message.content = fullContent;
          }
        } else {
          response = await this.provider.chat(state.messages, tools, this.config);
          state.tokenCount += response.eval_count ?? 0;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        state.status = 'error';
        state.error = msg;
        this.emit({ type: 'error', message: msg, recoverable: false });
        break;
      }

      const assistantContent = response.message.content ?? '';
      const toolCalls = this.provider.parseToolCalls(response);

      // Emit thought if there's a text response
      if (assistantContent.trim()) {
        this.emit({ type: 'thought', content: assistantContent });
      }

      // If the model returned text with no tool calls — check for completion
      if (toolCalls.length === 0) {
        state.messages.push({ role: 'assistant', content: assistantContent });
        this.noToolStreak++;

        // Explicit task_complete signal in text (some models inline it)
        if (assistantContent.includes(TASK_COMPLETE_SIGNAL)) {
          state.status = 'complete';
          state.result = assistantContent;
          this.emit({ type: 'complete', summary: assistantContent, state });
          break;
        }

        // Model stalled: 3 textual turns in a row with no tools → nudge once more then exit
        if (this.noToolStreak >= 3) {
          state.status = 'complete';
          state.result = assistantContent;
          this.emit({ type: 'complete', summary: assistantContent, state });
          break;
        }

        // Nudge the model to continue using tools or signal completion
        this.emit({ type: 'status_change', status: 'thinking', message: 'Awaiting tool use...' });
        state.messages.push({
          role: 'user',
          content:
            'Please continue working on the task. Use your available tools to make progress. ' +
            'When the task is fully complete and verified, call the task_complete tool with a summary.',
        });
        continue;
      }

      // Tool calls received — reset the stall counter
      this.noToolStreak = 0;

      // Emit plan event if model used the think tool with numbered steps
      const thinkCall = toolCalls.find((c) => c.name === 'think');
      if (thinkCall) {
        const thought = String(thinkCall.arguments.thought ?? '');
        const steps = thought
          .split('\n')
          .filter((l) => /^\s*\d+[.)\-]\s+/.test(l))
          .map((l) => l.replace(/^\s*\d+[.)\-]\s+/, '').trim());
        if (steps.length >= 2) {
          this.emit({ type: 'plan', steps });
        }
      }

      // Add assistant message with tool calls
      state.messages.push({
        role: 'assistant',
        content: assistantContent || `Calling ${toolCalls.length} tool(s)...`,
      });

      // Execute all tool calls
      this.emit({ type: 'status_change', status: 'calling_tool' });

      for (const call of toolCalls) {
        if (this.abortRequested) break;

        this.emit({ type: 'tool_call', call });
        state.toolCallCount++;

        const result = await executeTool(
          call,
          this.config,
          this.config.autoApprove ? undefined : promptApproval
        );

        this.emit({ type: 'tool_result', result });
        state.messages.push({
          role: 'tool',
          content: result.output,
        });

        // Check if task_complete was called
        if (result.output.startsWith(TASK_COMPLETE_SIGNAL)) {
          const summary = result.output.slice(TASK_COMPLETE_SIGNAL.length).trim();
          state.status = 'complete';
          state.result = summary;
          this.emit({ type: 'complete', summary, state });

          // Record training data asynchronously
          const insights = deriveInsights(state, userTask);
          recordRun(this.config, userTask, state, insights).catch(() => {});
          return state;
        }
      }

      this.emit({ type: 'status_change', status: 'observing' });
    }

    if (state.iterations >= this.config.maxIterations && state.status !== 'complete') {
      state.status = 'error';
      state.error = `Reached max iterations (${this.config.maxIterations})`;
      this.emit({ type: 'error', message: state.error, recoverable: false });
    }

    // Record training data
    const insights = deriveInsights(state, userTask);
    recordRun(this.config, userTask, state, insights).catch(() => {});

    return state;
  }
}
