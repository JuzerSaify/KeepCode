export interface Tweet {
  content: string;
  mediaPath?: string; // place PNGs in marketing/assets/ and ref as "assets/name.png"
}

export interface Thread {
  id: string;
  title: string;
  category: "launch" | "comparison" | "tutorial" | "hook" | "showcase";
  tweets: Tweet[];
}

// ─── CAMPAIGN SCHEDULE ───────────────────────────────────────────────────────
// Day 1  09:00  launch          — main launch thread
// Day 1  18:00  hook_cost       — standalone cost hook
// Day 2  09:00  vs_claude       — comparison thread
// Day 2  18:00  hook_copilot    — copilot hook
// Day 3  09:00  free_local      — local Ollama setup thread
// Day 3  18:00  hook_memory     — memory hook
// Day 4  09:00  tools           — 40 tools showcase
// Day 4  18:00  hook_agent      — autonomous agent hook
// Day 5  09:00  reasoning       — thinking models thread
// Day 5  18:00  hook_terminal   — terminal hook

export const schedule = [
  { day: 1, hour: 9,  threadId: "launch" },
  { day: 1, hour: 18, threadId: "hook_cost" },
  { day: 2, hour: 9,  threadId: "vs_claude" },
  { day: 2, hour: 18, threadId: "hook_copilot" },
  { day: 3, hour: 9,  threadId: "free_local" },
  { day: 3, hour: 18, threadId: "hook_memory" },
  { day: 4, hour: 9,  threadId: "tools" },
  { day: 4, hour: 18, threadId: "hook_agent" },
  { day: 5, hour: 9,  threadId: "reasoning" },
  { day: 5, hour: 18, threadId: "hook_terminal" },
];

// ─── THREADS ─────────────────────────────────────────────────────────────────

export const threads: Thread[] = [

  // ── DAY 1 AM — LAUNCH ──────────────────────────────────────────────────────
  {
    id: "launch",
    title: "🚀 Launch Thread",
    category: "launch",
    tweets: [
      {
        content: `I just shipped an autonomous AI coding agent.

It reads your code, writes files, runs tests, fixes errors, commits — all by itself.

40 tools. 4 AI providers. Runs fully local with Ollama.

The best part: it's completely free and open source.

🧵 Here's what it can do:`,
        mediaPath: "assets/launch_hero.png",
      },
      {
        content: `You give it one task in plain English.

It handles everything else:
→ Reads the relevant files
→ Plans the changes
→ Edits code, adds tests
→ Runs the tests, fixes failures
→ Commits with a clean message

You watch. It ships.`,
        mediaPath: "assets/cli_demo.png",
      },
      {
        content: `It works with every major AI provider:

🟣 Ollama — fully local, zero cost
🟢 OpenAI — GPT-4o, o3
🔵 Anthropic — Claude Sonnet / Opus
🔴 Google — Gemini 2.0 Flash
⚡ DeepSeek — R1, V3

Same agent. Same 40 tools. Switch providers mid-session.`,
      },
      {
        content: `The CLI is built to feel premium.

◆ Live spinner shows: iteration count · tokens used · tool name
◆ Tool calls collapse to single lines — no wall of JSON
◆ Markdown rendered inline in terminal
◆ Full diff viewer before every file write

This is what a terminal coding tool should feel like.`,
        mediaPath: "assets/cli_demo.png",
      },
      {
        content: `Cross-session memory that actually works.

The agent remembers:
• Your codebase conventions
• Past decisions and reasoning
• Errors it already fixed
• Your preferences

Start a new session. It picks up exactly where it left off.`,
      },
      {
        content: `Checkpoint & resume — a feature no other agent has.

Hit a complex refactor? Checkpoint mid-task.
Server crash? Resume from the exact point.
Experiment and roll back? One command.

keepcode checkpoint save "before-auth-refactor"`,
      },
      {
        content: `MCP (Model Context Protocol) support built in.

Connect your database, GitHub, Figma, or any MCP server.
The agent gets those tools automatically. No code changes.

keepcode mcp add github npx @modelcontextprotocol/server-github

Now it can read issues, open PRs, review diffs.`,
      },
      {
        content: `Install in under 2 minutes:

git clone https://github.com/JuzerSaify/KeepCode
cd KeepCode
npm install && npm run build && npm link

keepcode

That's it. Pick a model. Give it a task. Ship.

→ github.com/JuzerSaify/KeepCode

⭐ Star it if this is what you've been looking for.`,
      },
    ],
  },

  // ── DAY 1 PM — HOOK: COST ──────────────────────────────────────────────────
  {
    id: "hook_cost",
    title: "💸 Hook: Cost Comparison",
    category: "hook",
    tweets: [
      {
        content: `The AI coding tool tax in 2026:

Claude Code → Anthropic API costs
Cursor Pro → $40/month
GitHub Copilot → $19/month
Devin → $500/month

KeepCode → $0

Open source. 40 tools. Runs local on Ollama.

→ github.com/JuzerSaify/KeepCode`,
      },
    ],
  },

  // ── DAY 2 AM — VS CLAUDE CODE ──────────────────────────────────────────────
  {
    id: "vs_claude",
    title: "⚔️ KeepCode vs Claude Code",
    category: "comparison",
    tweets: [
      {
        content: `Claude Code is excellent.

But it only runs Claude. Requires an Anthropic account. No offline mode. No checkpoint/resume. No MCP.

KeepCode does all of that. And it's free.

A direct breakdown: 🧵`,
      },
      {
        content: `Provider flexibility:

Claude Code: Claude models only ❌
KeepCode: Ollama · OpenAI · Anthropic · Gemini · DeepSeek ✅

If Anthropic has an outage, Claude Code is down.
KeepCode switches to local Ollama in one command.

/provider ollama`,
      },
      {
        content: `Offline capability:

Claude Code: requires internet, always ❌
KeepCode: runs fully local with Ollama ✅

Air-gapped machine? Private codebase? Slow connection?

keepcode --provider ollama --model qwen2.5-coder:14b

Zero data leaves your machine.`,
      },
      {
        content: `Built-in tools:

Claude Code: file ops, shell, basic git
KeepCode: 40 tools including:
→ Checkpoint & resume
→ Persistent memory
→ MCP server bridge
→ HTTP client
→ Regex replace
→ Summarize directory
→ Run & fix tests automatically`,
      },
      {
        content: `Respect to Anthropic — Claude is the best model for coding.

Point is: you should have a choice.

A tool that matches Claude Code's workflow with any model.
Free. Open source. No lock-in.

→ github.com/JuzerSaify/KeepCode`,
      },
    ],
  },

  // ── DAY 2 PM — HOOK: COPILOT ───────────────────────────────────────────────
  {
    id: "hook_copilot",
    title: "🤖 Hook: Copilot vs Agent",
    category: "hook",
    tweets: [
      {
        content: `Copilot autocompletes lines.

KeepCode completes tasks.

"Add OAuth to my Express app"

It reads your routes, writes the middleware, updates the config, adds tests, runs them, fixes failures, commits.

You typed one sentence.

→ github.com/JuzerSaify/KeepCode`,
      },
    ],
  },

  // ── DAY 3 AM — FREE LOCAL SETUP ────────────────────────────────────────────
  {
    id: "free_local",
    title: "🏠 Free Local Ollama Setup",
    category: "tutorial",
    tweets: [
      {
        content: `You can have a full autonomous AI coding agent on your machine for $0.

Step by step — takes 5 minutes. 🧵`,
      },
      {
        content: `Step 1 — Install Ollama

→ ollama.com/download (Mac / Windows / Linux)

It runs AI models locally. No cloud. No account. No API key.

Open source. 45k GitHub stars.`,
      },
      {
        content: `Step 2 — Pull a coding model

ollama pull qwen2.5-coder:14b

7B model: needs ~8GB RAM, runs on most laptops
14B model: needs ~16GB RAM, noticeably smarter
32B model: needs ~32GB RAM, very strong

Start with 14B if you can.`,
      },
      {
        content: `Step 3 — Install KeepCode

git clone https://github.com/JuzerSaify/KeepCode
cd KeepCode
npm install
npm run build
npm link`,
      },
      {
        content: `Step 4 — Run it

keepcode

The model picker opens. Select your Ollama model.
Type your task.
Watch it work.

No API key. No subscription. No rate limits.
Your hardware. Your data. Your agent.`,
        mediaPath: "assets/local_demo.png",
      },
      {
        content: `What can a free local model actually do?

I ran qwen2.5-coder:14b on a real task:
"Refactor the database layer to use connection pooling"

→ Read 6 files
→ Wrote the pool manager
→ Updated 3 consumers
→ Ran tests → 2 failures → fixed both
→ Committed

16 minutes. $0.

Not as fast as GPT-4o. But for $0, it's remarkable.`,
      },
      {
        content: `When should you use cloud models instead?

Complex architecture decisions → GPT-4o or Claude
Reasoning-heavy refactors → DeepSeek-R1
Maximum speed + quality → Claude Sonnet

KeepCode lets you switch with one command:
/provider anthropic

Pay for the hard stuff only. Free for the rest.`,
      },
    ],
  },

  // ── DAY 3 PM — HOOK: MEMORY ────────────────────────────────────────────────
  {
    id: "hook_memory",
    title: "🧠 Hook: Persistent Memory",
    category: "hook",
    tweets: [
      {
        content: `Every AI coding tool forgets you exist when the session ends.

KeepCode has persistent cross-session memory.

It remembers:
• Your naming conventions
• The architectural decisions you made
• The bugs it already fixed
• Your preferences

Session 2 is noticeably smarter than session 1.

→ github.com/JuzerSaify/KeepCode`,
      },
    ],
  },

  // ── DAY 4 AM — 40 TOOLS ────────────────────────────────────────────────────
  {
    id: "tools",
    title: "🔧 40 Tools Showcase",
    category: "showcase",
    tweets: [
      {
        content: `Most AI agents have 5–10 tools and call it done.

KeepCode has 40.

Here's why that number matters — and what the extra tools actually unlock. 🧵`,
      },
      {
        content: `File tools (the basics done right):

read_file · write_file · edit_file · patch_file
regex_replace · append_file · copy_file
move_file · delete_file
read_lines (specific line ranges)
read_json (load + query JSON)

edit_file understands diffs — it won't wipe a 500-line file to change 3 lines.`,
      },
      {
        content: `Codebase exploration:

list_files / list_directory / glob
search_files — regex search across entire codebase
summarize_directory — map of your project in one call
diff_files — compare two versions of a file

The agent maps your codebase before touching anything.
It doesn't guess. It knows.`,
      },
      {
        content: `Execution tools — this is where it gets powerful:

bash — run any shell command
run_tests — runs your test suite, reads results
lint — runs eslint/tsc, reads errors

The loop:
write code → run tests → read failures → fix → repeat

Fully autonomous. You set --auto-approve and come back.`,
        mediaPath: "assets/test_loop.png",
      },
      {
        content: `Git tools (the agent manages its own work):

git_status / git_diff / git_log
git_commit — stages, writes message, commits
git_extras — branch, stash, checkout, rebase

The agent commits as it goes.
Every logical step is a clean commit. Full history of its work.`,
      },
      {
        content: `Network tools — underrated:

fetch_url — get any web page (docs, APIs, READMEs)
http_request — full REST calls with auth headers + body

Real uses:
• Read the library docs before using it
• Hit your own API to test a new endpoint
• Check an external service status during a task`,
      },
      {
        content: `Memory & control tools:

memory_read / memory_write — persist facts across sessions
checkpoint — save and restore task state
think — structured internal reasoning step
plan — break complex tasks into subtasks
task_complete — clean signal when done
environment / process_info — know the runtime

All 40. Free. Open source.

→ github.com/JuzerSaify/KeepCode`,
        mediaPath: "assets/tools_list.png",
      },
    ],
  },

  // ── DAY 4 PM — HOOK: AUTONOMOUS ────────────────────────────────────────────
  {
    id: "hook_agent",
    title: "⚡ Hook: Autonomous Agent",
    category: "hook",
    tweets: [
      {
        content: `I typed one sentence last night:

"Add rate limiting to every public API endpoint"

Went to make coffee.

Came back to:
→ 12 files modified
→ Redis middleware written
→ Tests written and passing
→ 4 commits with clean messages

That's KeepCode.

→ github.com/JuzerSaify/KeepCode`,
      },
    ],
  },

  // ── DAY 5 AM — REASONING MODELS ────────────────────────────────────────────
  {
    id: "reasoning",
    title: "🧠 Reasoning Models in Your Terminal",
    category: "showcase",
    tweets: [
      {
        content: `Reasoning models (DeepSeek-R1, kimi-k2) think before they answer.

Watching one work through a complex refactor in your terminal is genuinely impressive.

KeepCode supports them natively. Here's what it looks like. 🧵`,
        mediaPath: "assets/thinking_model.png",
      },
      {
        content: `Regular models: token → token → token → answer

Reasoning models: think for 30–90 seconds → answer

The thinking is hidden from the UI. You see a clean spinner:

◆ Thinking  [2/50]  ↑8k ↓2k

Then the fully-formed response appears.

No noise. Just better answers.`,
        mediaPath: "assets/thinking_spinner.png",
      },
      {
        content: `How to use a reasoning model with KeepCode:

keepcode --provider openai --model kimi-k2-thinking:cloud

or locally:

ollama pull deepseek-r1:14b
keepcode --model deepseek-r1:14b

That's it. The agent handles the reasoning tokens automatically.`,
      },
      {
        content: `Where reasoning models actually help:

✅ Architecture decisions
✅ Debugging complex race conditions
✅ Refactors touching 20+ files
✅ Security audits
✅ Writing complex algorithms

For simple CRUD tasks: stick with qwen2.5-coder. Faster, cheaper.

Know when to use which. KeepCode lets you switch on demand.`,
      },
      {
        content: `One thing I learned shipping this:

Reasoning models need more context window.
32k tokens minimum — or the agent compresses and forgets prior reads.

KeepCode defaults to 32k context with intelligent history compression.

You don't think about it. It just works.`,
      },
    ],
  },

  // ── DAY 5 PM — HOOK: TERMINAL ──────────────────────────────────────────────
  {
    id: "hook_terminal",
    title: "💻 Hook: Terminal > IDE",
    category: "hook",
    tweets: [
      {
        content: `2026 and devs are still paying $40/month for a fancier text editor.

The terminal is back.

Run a full autonomous coding agent from your terminal.
Any repo. Any language. Any machine. $0.

keepcode --model qwen2.5-coder:14b --run "refactor auth module" --auto-approve

→ github.com/JuzerSaify/KeepCode`,
      },
    ],
  },
];
