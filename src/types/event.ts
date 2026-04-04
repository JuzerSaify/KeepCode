import type { AgentStatus, AgentState } from './agent.js';
import type { ToolCall, ToolResult } from './tool.js';

export type AgentEventType =
  | 'status_change'
  | 'token'
  | 'tool_call'
  | 'tool_result'
  | 'thought'
  | 'plan'
  | 'compress'
  | 'error'
  | 'complete'
  | 'abort'
  | 'iteration_start'
  | 'training_insight';

export interface StatusChangeEvent {
  type: 'status_change';
  status: AgentStatus;
  message?: string;
}

export interface TokenEvent {
  type: 'token';
  token: string;
}

export interface ToolCallEvent {
  type: 'tool_call';
  call: ToolCall;
}

export interface ToolResultEvent {
  type: 'tool_result';
  result: ToolResult;
}

export interface ThoughtEvent {
  type: 'thought';
  content: string;
}

export interface PlanEvent {
  type: 'plan';
  steps: string[];
}

export interface CompressEvent {
  type: 'compress';
  fromTokens: number;
  toTokens: number;
}

export interface ErrorEvent {
  type: 'error';
  message: string;
  recoverable: boolean;
}

export interface CompleteEvent {
  type: 'complete';
  summary: string;
  state: AgentState;
}

export interface AbortEvent {
  type: 'abort';
}

export interface IterationStartEvent {
  type: 'iteration_start';
  iteration: number;
  maxIterations: number;
}

export interface TrainingInsightEvent {
  type: 'training_insight';
  insight: string;
}

export type AgentEvent =
  | StatusChangeEvent
  | TokenEvent
  | ToolCallEvent
  | ToolResultEvent
  | ThoughtEvent
  | PlanEvent
  | CompressEvent
  | ErrorEvent
  | CompleteEvent
  | AbortEvent
  | IterationStartEvent
  | TrainingInsightEvent;

export type EventListener = (event: AgentEvent) => void;
