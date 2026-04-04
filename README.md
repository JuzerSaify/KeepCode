<div align="center">

```
 █████╗ ██████╗ ███████╗██╗  ██╗
██╔══██╗██╔══██╗██╔════╝╚██╗██╔╝
███████║██████╔╝█████╗   ╚███╔╝ 
██╔══██║██╔═══╝ ██╔══╝   ██╔██╗ 
██║  ██║██║     ███████╗██╔╝ ██╗
╚═╝  ╚═╝╚═╝     ╚══════╝╚═╝  ╚═╝
```

# Apex — Autonomous AI Engineering Agent

**A fully autonomous, locally-running AI coding agent powered by [Ollama](https://ollama.com).**  
No cloud. No API keys. No subscriptions.

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
[![Ollama](https://img.shields.io/badge/Powered%20by-Ollama-black)](https://ollama.com)

</div>

---

## What is Apex?

Apex is a terminal-native autonomous software engineering agent. You give it a task in plain English; it explores your codebase, writes code, runs commands, fixes errors, and delivers a working result — all locally on your machine using any Ollama-compatible model.

It operates like a senior engineer: reads before writing, thinks before acting, verifies outcomes, and never stops until the task is done.

---

## Features

| Category | Capabilities |
|---|---|
| **Autonomy** | Prime directive: act without asking permission; infers intent and proceeds |
| **Tools** | 25+ built-in tools across read, write, execute, git, network, and utility categories |
| **Reasoning** | Mandatory `think` protocol before complex tasks; parallel hypothesis investigation |
| **Memory** | Per-project persistent memory (`.apex/memory.md`) + training insights |
| **Context** | Auto-compresses context when nearing model limits; preserves history across REPL turns |
| **UI** | Live `ora` spinners per status, per-tool elapsed timing, markdown-aware thought rendering |
| **Git** | Commit, diff, log, status tools with atomic change hygiene |
| **Security** | No cloud calls; all inference happens on your local Ollama instance |

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| [Node.js](https://nodejs.org) | ≥ 18.0.0 | Use `node --version` to check |
| [npm](https://npmjs.com) | ≥ 9 | Comes with Node.js |
| [Ollama](https://ollama.com) | latest | Must be running locally |
| A tool-capable model | see below | e.g. `qwen2.5-coder:7b` |

### Recommended Ollama Models

Apex needs a model with **native tool/function-calling support**. The following work well:

| Model | Size | Speed | Best For |
|---|---|---|---|
| `qwen2.5-coder:7b` | ~4.7 GB | Fast | General coding (recommended) |
| `qwen2.5-coder:14b` | ~9 GB | Medium | Better reasoning on complex tasks |
| `devstral:24b` | ~15 GB | Slow | Highest capability |
| `llama3.1:8b` | ~4.7 GB | Fast | General tasks |
| `mistral-nemo` | ~7 GB | Fast | Strong instruction following |

> **Tip:** Run `apex --auto-model` to let Apex automatically pick the best available model on your machine.

---

## Installation

### Option A — Install from GitHub (recommended)

```bash
# 1. Clone the repository
git clone https://github.com/JuzerSaify/apex.git
cd apex

# 2. Install dependencies
npm install

# 3. Build TypeScript
npm run build

# 4. Link globally so `apex` is available anywhere
npm link
```

### Option B — Development mode (no build step)

```bash
git clone https://github.com/JuzerSaify/apex.git
cd apex
npm install
# Run directly via ts-node (slower startup, no global command)
npx ts-node src/index.ts --help
```

---

## Ollama Setup

If you don't have Ollama installed:

```bash
# macOS / Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows — download from https://ollama.com/download
```

Start Ollama (it runs as a background service automatically after install):

```bash
ollama serve          # if not already running
```

Pull a recommended model:

```bash
ollama pull qwen2.5-coder:7b
```

Verify Ollama is running:

```bash
curl http://localhost:11434/api/tags
```

---

## Quick Start

```bash
# Interactive REPL (recommended for ongoing work)
apex

# Run a single task and exit
apex --run "scaffold a REST API with Express and TypeScript in ./my-api"

# Use a specific model
apex --model qwen2.5-coder:14b

# Auto-pick the best model on your machine
apex --auto-model

# Point to a non-default Ollama URL
apex --url http://192.168.1.50:11434

# Operate on a specific directory
apex --cwd /path/to/your/project
```

---

## CLI Reference

```
apex [options]

Options:
  -v, --version              Print version
  -m, --model <name>         Ollama model to use
  -u, --url <url>            Ollama base URL (default: http://localhost:11434)
  -t, --temperature <float>  Sampling temperature 0-2 (default: 0.7)
  -i, --iterations <n>       Max agent iterations per task (default: 50)
  -c, --cwd <path>           Working directory (default: current dir)
      --ctx <n>              Context window size in tokens (default: 16384)
      --max-tokens <n>       Max tokens per response (default: 8192)
  -y, --auto-approve         Skip approval prompts for tool calls
      --verbose              Stream model tokens live
      --auto-model           Auto-pick best available tool-capable model
  -r, --run <task>           Run single task, then exit
  -h, --help                 Show help
```

---

## REPL Commands

Once inside the interactive REPL, use these commands:

| Command | Description |
|---|---|
| `/help` | List all commands |
| `/models` | List available Ollama models with tool-support detection |
| `/model <name>` | Switch to a different model mid-session |
| `/status` | Show current session config (model, URL, temp, etc.) |
| `/history` | Preview conversation history (turn count + message previews) |
| `/clear` | Clear conversation history |
| `/exit` | Exit Apex |

---

## Project Structure

```
apex/
├── src/
│   ├── index.ts              # CLI entry point (Commander.js)
│   ├── agent/
│   │   ├── loop.ts           # Core agentic loop (think → tools → observe → repeat)
│   │   ├── compressor.ts     # Context compression when nearing token limit
│   │   ├── memory.ts         # Per-project persistent memory
│   │   └── trainer.ts        # Training insight extraction and injection
│   ├── providers/
│   │   └── ollama/           # Ollama API client (streaming, retry, model listing)
│   ├── tools/
│   │   ├── read/             # read_file, list_directory, search_files, glob
│   │   ├── write/            # write_file, edit_file, create_directory, copy/move/delete
│   │   ├── execute/          # bash, node_eval
│   │   ├── git/              # git_status, git_diff, git_commit, git_log
│   │   ├── network/          # fetch_url
│   │   ├── code/             # lint, run_tests
│   │   ├── utility/          # think, task_complete, memory_read/write, checkpoint
│   │   ├── registry.ts       # Tool registry and schema definitions
│   │   └── executor.ts       # Tool executor with approval flow
│   ├── prompt/
│   │   ├── builder.ts        # Assembles the full system prompt
│   │   └── sections/         # Modular prompt sections
│   │       ├── identity.ts   # Agent identity + OS/date/runtime context
│   │       ├── principles.ts # 14 core operating principles
│   │       ├── anti_patterns.ts
│   │       ├── task_patterns.ts
│   │       └── tools_guide.ts
│   ├── config/
│   │   ├── defaults.ts       # Default AgentConfig values
│   │   └── loader.ts         # .apex/config.json loader/merger
│   ├── types/
│   │   └── index.ts          # AgentConfig, AgentEvent, AgentState types
│   └── ui/
│       ├── renderer.ts       # EventRenderer — live spinners, tool timing, markdown output
│       ├── session.ts        # ApexSession — REPL + single-task runner
│       ├── theme.ts          # Chalk-based colour theme
│       └── components/
│           ├── banner.ts     # Startup banner with date/model/platform
│           ├── model_picker.ts
│           ├── spinner.ts
│           └── table.ts
├── dist/                     # Compiled JavaScript (generated by `npm run build`)
├── package.json
├── tsconfig.json
└── README.md
```

---

## Per-Project Configuration

Apex creates a `.apex/` directory in your working directory on first run:

```
your-project/
└── .apex/
    ├── config.json       # Project-level overrides (model, temp, iterations…)
    ├── memory.md         # Persistent agent memory for this project
    └── training/
        └── insights.json # Agent-discovered patterns and facts
```

**Example `.apex/config.json`:**

```json
{
  "model": "qwen2.5-coder:14b",
  "temperature": 0.5,
  "maxIterations": 80,
  "autoApprove": true
}
```

Config precedence: **CLI flags > `.apex/config.json` > built-in defaults**

---

## Available Tools

Apex exposes 25+ tools to the model:

### Read
- `read_file` — Read file contents with line range support
- `list_directory` — List directory contents recursively
- `search_files` — Regex search across files with context lines
- `glob` — Find files by glob pattern

### Write
- `write_file` — Create or overwrite a file
- `edit_file` — Surgical line-range edit (read-modify-write)
- `create_directory` — Create directories recursively
- `copy_file` / `move_file` / `delete_file`

### Execute
- `bash` — Run shell commands (120s timeout, streaming output)
- `node_eval` — Evaluate Node.js expressions in-process

### Git
- `git_status` / `git_diff` / `git_log` / `git_commit`

### Network
- `fetch_url` — HTTP GET with content extraction (120 KB limit)

### Code Quality
- `lint` — Run project linter (ESLint, tsc --noEmit, etc.)
- `run_tests` — Run test suite with optional filter

### Utility
- `think` — Structured reasoning scratchpad (never shown to user)
- `task_complete` — Signal task is done with a summary
- `memory_read` / `memory_write` — Project-scoped persistent notes
- `checkpoint` — Save/restore agent state mid-task

---

## Environment Variables

Apex is fully self-contained and requires no API keys. Optionally you can set:

```bash
# Override default Ollama URL
OLLAMA_HOST=http://localhost:11434

# Disable terminal colours (for CI/logging)
NO_COLOR=1

# Force a specific shell path
SHELL=/bin/bash
```

---

## Troubleshooting

### `apex: command not found`
```bash
# Re-run npm link from the project directory
cd /path/to/apex
npm link

# Or add npm global bin to PATH:
export PATH="$(npm root -g)/../.bin:$PATH"
```

### `ECONNREFUSED` — Ollama not running
```bash
# Start Ollama
ollama serve

# Verify it's up
curl http://localhost:11434
```

### Model doesn't use tools
Not all models support Ollama's tool-calling protocol. Stick to the recommended list above, or run `apex --auto-model` to auto-detect.

### `Cannot find module` errors after cloning
```bash
npm install          # install dependencies
npm run build        # compile TypeScript
```

### Context window errors
Reduce `--ctx` or use a model with a larger context window. Apex also auto-compresses context — you can lower `--iterations` if the model keeps running into limits.

---

## Building from Source

```bash
# Full build
npm run build

# Watch mode (rebuild on change)
npm run watch

# Type-check without emitting
npx tsc --noEmit
```

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make changes and run `npx tsc --noEmit` to ensure no type errors
4. Commit with conventional format: `feat(scope): description`
5. Open a Pull Request

---

## License

MIT — see [LICENSE](LICENSE)

---

<div align="center">
Built with TypeScript · Powered by Ollama · Runs 100% locally
</div>

A **fully autonomous, agentic AI coding CLI** built in TypeScript, inspired by Claude Code's architecture. Apex runs locally via **Ollama** — no cloud API keys required.

---

## Features

- **Fully autonomous agent loop** — ReAct pattern (think → act → observe → iterate) with up to N iterations
- **13 built-in tools** — file I/O, bash execution, web fetch, grep search, glob, memory, task completion
- **Ollama provider** — auto-discovers available models with interactive keyboard picker
- **Crystal-clear terminal UI** — colored panels, tool call display, streaming output, progress indicators
- **Accurate system prompt** — engineered like Claude Code's internal prompts with strict operating principles
- **Session memory** — persists notes across tool calls within a session
- **Project detection** — auto-reads `package.json`, `APEX.md`, git branch, and frameworks
- **Conversation history** — maintains context across multiple tasks in an interactive REPL

---

## Requirements

- **Node.js >= 18**
- **Ollama** running locally: [ollama.ai](https://ollama.ai)

---

## Installation

```bash
# Clone and install
cd apexag
npm install
npm run build

# Run directly
node dist/index.js

# Or install globally
npm link
apex
```

---

## Usage

### Interactive REPL (default)

```bash
apex
```

On first run, Apex will:
1. Connect to Ollama (`http://localhost:11434`)
2. Fetch available models — use arrow keys to select one
3. Open the interactive REPL

### Options

```
apex [options]

Options:
  -m, --model <model>     Ollama model (e.g. llama3.2, qwen2.5-coder:7b)
  -u, --url <url>         Ollama base URL (default: http://localhost:11434)
  -t, --temperature <n>   Sampling temperature 0.0–2.0 (default: 0.7)
  -i, --iterations <n>    Max agent iterations per task (default: 50)
  -c, --cwd <path>        Working directory (default: current dir)
  --auto-approve          Skip confirmation for write/execute tools
  --verbose               Stream tokens in real-time
  --ctx <n>               Context window size (default: 16384)
  --max-tokens <n>        Max tokens per response (default: 8192)
```

### Examples

```bash
# Use a specific model
apex --model qwen2.5-coder:7b

# Point at a specific project
apex --cwd ~/projects/myapp --model llama3.2

# Larger context for complex tasks
apex --model mixtral:8x7b --ctx 32768 --iterations 100

# Auto-approve for fully autonomous use
apex --model qwen2.5-coder:14b --auto-approve
```

---

## REPL Commands

| Command | Description |
|---------|-------------|
| `/help` | Show all commands |
| `/model` | Switch to a different model |
| `/clear` | Clear conversation history |
| `/cwd [path]` | Show or change working directory |
| `/config` | Show current config |
| `/tools` | List all available tools |
| `/verbose` | Toggle token streaming |
| `/auto-approve` | Toggle auto-approve |
| `/abort` | Abort current task |
| `/exit` | Quit Apex |
| `Ctrl+C` | Abort task / exit |

---

## Tools

### Read
| Tool | Description |
|------|-------------|
| `read_file` | Read file contents (with optional line range, 512KB limit) |
| `list_directory` | List dir contents, recursive with depth control |
| `search_files` | Regex search across files, with file pattern filtering |
| `glob` | Find files by glob pattern |

### Write
| Tool | Description |
|------|-------------|
| `write_file` | Write/create a file (creates dirs as needed) |
| `edit_file` | Surgical string replace with uniqueness check |
| `create_directory` | Create directories recursively |
| `delete_file` | Delete file or empty directory |

### Execute
| Tool | Description |
|------|-------------|
| `bash` | Run shell commands with stdout/stderr capture, timeout |

### Network
| Tool | Description |
|------|-------------|
| `fetch_url` | Fetch web pages, APIs, raw GitHub files |

### Utility
| Tool | Description |
|------|-------------|
| `think` | Record reasoning/analysis without acting |
| `task_complete` | Signal task done with summary |
| `memory_write` | Persist key-value notes for the session |

---

## Project Instructions (APEX.md)

Create an `APEX.md` file in your project root to give Apex project-specific instructions:

```markdown
# Project Instructions

- Use TypeScript strict mode
- Tests go in __tests__/ with Jest
- Follow the existing error handling pattern in src/utils/errors.ts
- Database migrations use Drizzle ORM
```

Apex will automatically read this at startup and follow your conventions.

---

## Architecture

```
src/
├── index.ts              # CLI entry point (Commander)
├── types.ts              # All TypeScript types and interfaces
├── agent/
│   └── loop.ts           # Agent loop (ReAct: think → act → observe)
├── providers/
│   └── ollama.ts         # Ollama API client (models, chat, streaming)
├── tools/
│   └── index.ts          # All 13 tools + tool registry
├── prompt/
│   └── system.ts         # System prompt builder (project-aware)
└── ui/
    ├── renderer.ts       # Terminal UI (chalk theme, event renderer, spinner)
    └── session.ts        # Interactive REPL + model picker
```

### Agent Loop

```
User Task
    │
    ▼
System Prompt + Context
    │
    ▼
┌─────────────────────────────────┐
│         OLLAMA MODEL            │
│                                 │
│  1. Think (reasoning)           │
│  2. Select tool(s)              │
│  3. Receive tool results        │
│  4. Iterate until done          │
└─────────────────────────────────┘
    │
    ▼
task_complete(summary) → Done
```

---

## Recommended Models

| Model | Best For | Pull Command |
|-------|----------|--------------|
| `qwen2.5-coder:7b` | Code tasks (fast) | `ollama pull qwen2.5-coder:7b` |
| `qwen2.5-coder:14b` | Code tasks (better) | `ollama pull qwen2.5-coder:14b` |
| `llama3.2` | General tasks | `ollama pull llama3.2` |
| `llama3.1:8b` | Balanced | `ollama pull llama3.1:8b` |
| `mistral` | Fast general | `ollama pull mistral` |
| `mixtral:8x7b` | Complex, long tasks | `ollama pull mixtral:8x7b` |
| `deepseek-coder-v2` | Deep coding | `ollama pull deepseek-coder-v2` |

> **Note:** Tool calling support varies by model. `qwen2.5-coder` and `llama3.x` have the best tool-use support in Ollama.

---

## License

MIT
