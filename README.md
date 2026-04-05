<div align="center">

# KeepCode

**Autonomous AI coding agent · runs locally or in the cloud · no vendor lock-in**

[![npm](https://img.shields.io/npm/v/keepcode?color=7C3AED&label=npm&style=flat-square)](https://www.npmjs.com/package/keepcode)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-F59E0B?style=flat-square)](LICENSE)
[![Ollama](https://img.shields.io/badge/Ollama-local%20AI-black?style=flat-square)](https://ollama.com)
[![Providers](https://img.shields.io/badge/Providers-OpenAI%20·%20Anthropic%20·%20Gemini%20·%20Ollama-blueviolet?style=flat-square)](#multi-provider-support)

</div>

---

Give KeepCode a task — it **plans**, explores your codebase, edits files, runs shell commands, calls APIs, and ships a result. All from your terminal.

- **40 built-in tools** — read, write, shell, git, network, code-quality, memory, checkpoints
- **Multi-provider** — OpenAI GPT-4o, Anthropic Claude, Google Gemini, Ollama (fully local)
- **Cloud sync** — sessions and memory backed up to Supabase; Google OAuth login
- **MCP support** — connect any MCP server; tools bridged into the agent automatically
- **Premium CLI** — full markdown rendering, sticky headers, VS Code detection

---

## Why KeepCode?

| | KeepCode | Claude Code | Codex CLI | Aider | Copilot |
|---|:---:|:---:|:---:|:---:|:---:|
| 🆓 Free to use | ✅ always | ❌ API costs | ❌ OpenAI key | ✅ w/ local | ✅ limited |
| 🏠 Fully local / offline | ✅ | ❌ | ❌ | ✅ partial | ❌ |
| 🔑 No account needed | ✅ | ❌ | ❌ | ✅ | ❌ |
| 🔧 40 built-in tools | ✅ | partial | partial | partial | partial |
| 🧠 Cross-session memory | ✅ | ✅ | ✅ | ⚠️ | ❌ |
| 💾 Checkpoint & resume | ✅ | ❌ | ❌ | ❌ | ❌ |
| 🔌 Multi-provider AI | ✅ 4 providers | ❌ Claude only | ❌ OpenAI only | ✅ | partial |
| 🔒 Built-in security guards | ✅ | — | — | — | — |
| 📦 TypeScript native | ✅ | Node.js | Rust | Python | — |

> Full breakdown → [COMPARISON.md](COMPARISON.md)

---

## Install

```bash
git clone https://github.com/JuzerSaify/KeepCode
cd KeepCode
npm install
npm run build
npm link
```

Requires **[Ollama](https://ollama.com)** running locally (or point `--url` at a remote instance).

```bash
ollama pull qwen2.5-coder:7b   # recommended starter model
```

---

## Quick Start

```bash
# Interactive mode — pick a model, then type your task
keepcode

# Run a single task and exit
keepcode --model qwen2.5-coder:7b --run "add input validation to the login endpoint"

# Skip all confirmation prompts
keepcode --model llama3.1:8b --run "fix the failing tests" --auto-approve

# Point at a remote Ollama instance
keepcode --model deepseek-r1:14b --url http://192.168.1.10:11434 --run "refactor auth module"

# Stream tokens as they arrive
keepcode --model qwen2.5-coder:14b --verbose --run "explain this codebase"
```

---

## CLI Reference

| Flag | Default | Description |
|------|---------|-------------|
| `-m, --model` | interactive | Model name (e.g. `qwen2.5-coder:7b`, `gpt-4o`, `claude-sonnet-4-5`) |
| `--provider` | `ollama` | AI provider: `ollama` · `openai` · `anthropic` · `gemini` |
| `--api-key` | env var | API key (auto-read from `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GEMINI_API_KEY`) |
| `-u, --url` | `http://localhost:11434` | Ollama base URL |
| `-r, --run` | interactive | Task to execute, then exit |
| `-y, --auto-approve` | `false` | Skip tool-call confirmation prompts |
| `--verbose` | `false` | Stream tokens as they arrive |
| `--auto-model` | `false` | Auto-pick best available local model |
| `-i, --iterations` | `50` | Max agent iterations per task |
| `-c, --cwd` | `process.cwd()` | Working directory for all file operations |
| `--ctx` | `16384` | Context window size (tokens) |
| `--max-tokens` | `8192` | Max tokens per model response |

---

## REPL Commands

Inside the interactive session:

| Command | Description |
|---------|-------------|
| `/help` | Show all available commands |
| `/models` | List available models for the current provider |
| `/model <name>` | Switch to a different model mid-session |
| `/provider [name]` | Show or switch AI provider |
| `/tools` | List all 40 registered tools by category |
| `/history` | Show conversation history summary |
| `/sessions` | Show recent cloud sessions (requires login) |
| `/status` | Show config, VS Code version, and session info |
| `/whoami` | Show current logged-in user |
| `/clear` | Clear conversation history |
| `/exit` | Exit KeepCode |

---

## Multi-Provider Support

```bash
# Ollama — local, free, private
keepcode --provider ollama --model qwen2.5-coder:14b

# OpenAI
OPENAI_API_KEY=sk-... keepcode --provider openai --model gpt-4o

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-... keepcode --provider anthropic --model claude-sonnet-4-5

# Google Gemini
GEMINI_API_KEY=AI... keepcode --provider gemini --model gemini-2.0-flash
```

All providers share the same 40-tool interface, full markdown rendering, and cross-session memory.

---

## Cloud Sync & Auth

```bash
keepcode login      # Google OAuth — opens browser
keepcode logout
keepcode profile
keepcode sessions   # List recent cloud sessions
```

When logged in, sessions and memory sync to Supabase — accessible from any machine.

---

## MCP Support

```bash
keepcode mcp add filesystem npx @modelcontextprotocol/server-filesystem /path/to/dir
keepcode mcp add github npx @modelcontextprotocol/server-github
keepcode mcp list
```

MCP tools appear as `serverName__toolName` in the agent's tool registry.

---

## Tools (40 total)

### Read
| Tool | Description |
|------|-------------|
| `read_file` | Read file content with optional line range |
| `read_lines` | Read multiple non-contiguous line ranges in one call |
| `read_json` | Read JSON file with optional dot-path query (`"scripts.build"`) |
| `list_directory` | Directory tree view with depth control |
| `list_files` | Flat recursive listing with extension filter |
| `search_files` | Regex search across files with match context |
| `glob` | Pattern-match files (e.g. `**/*.test.ts`) |
| `summarize_directory` | File-count, extension breakdown, size, recently-modified |

### Write
| Tool | Description |
|------|-------------|
| `edit_file` | Surgical find-and-replace — primary editing tool |
| `patch_file` | Apply multiple find-and-replace edits atomically in one call |
| `write_file` | Full file write (creates parent directories) |
| `append_file` | Append content to a file |
| `regex_replace` | Bulk regex-based replacement with flags |
| `write_json` | Write JSON or update a single key without overwriting |
| `create_directory` | Create nested directories |
| `delete_file` | Delete a file |
| `move_file` | Move or rename a file |
| `copy_file` | Copy a file |

### Execute
| Tool | Description |
|------|-------------|
| `bash` | Run any shell command (120 s timeout, Windows PowerShell aware) |
| `node_eval` | Evaluate a JavaScript expression in-process |

### Network
| Tool | Description |
|------|-------------|
| `fetch_url` | GET a URL — docs, raw GitHub files, REST APIs |
| `http_request` | Full HTTP client: POST/PUT/PATCH/DELETE with headers and body |

### Git
| Tool | Description |
|------|-------------|
| `git_status` | Working-tree status |
| `git_diff` | Review staged and unstaged changes |
| `git_log` | Commit history |
| `git_commit` | Stage all and commit with message |
| `git_stash` | Push / pop / list / apply / drop stash entries |
| `git_branch` | List / create / switch / delete branches |
| `git_pull` | Pull from remote with optional rebase |

### Code Quality
| Tool | Description |
|------|-------------|
| `lint` | Run the project linter |
| `run_tests` | Run test suite with optional pattern filter |

### Utility
| Tool | Description |
|------|-------------|
| `think` | Reason through a problem before acting (not visible to model) |
| `plan` | Display a structured execution plan to the user |
| `diff_files` | Unified diff between two files or a file vs. proposed string |
| `environment` | Read env vars with prefix filter and automatic secret redaction |
| `process_info` | Check running processes and port usage (cross-platform) |
| `memory_write` | Persist project facts to `.keepcode/memory.md` across sessions |
| `memory_read` | Recall facts written in previous sessions |
| `checkpoint` | Save / restore agent state mid-task |
| `task_complete` | Signal verified task completion (terminates the run loop) |

---

## Project Layout

```
src/
  agent/        Core loop, memory, compression, trainer
  config/       Defaults and config loader (.keepcode/config.json)
  prompt/       System prompt builder + sections (identity, principles, tools_guide…)
  providers/    Ollama · OpenAI · Anthropic · Gemini
  tools/        All 40 tool implementations organised by category
  types/        TypeScript interfaces (AgentConfig, Message, ToolCall…)
  ui/           Terminal renderer, REPL, components (spinner, model picker, banner…)
```

---

## How It Works

1. **Plans** — calls `plan` at the start of multi-step tasks so you can see its approach
2. **Explores** — reads files, searches code with `search_files`, inspects the project with `summarize_directory`
3. **Acts** — edits files with `patch_file`/`edit_file`, runs builds via `bash`, calls external APIs with `http_request`
4. **Verifies** — re-reads modified files, runs tests, diffs changes with `diff_files` before calling `task_complete`
5. **Learns** — stores project facts in `.keepcode/memory.md`; relevant insights are injected into the next session

---

## Persistent Storage

KeepCode stores state in `.keepcode/` inside your project (gitignored by default):

```
.keepcode/
  memory.md          Cross-session notes written by memory_write
  config.json        Per-project configuration overrides
  training/
    insights.json    Aggregated agent learnings used to improve future runs
  checkpoints/       Saved mid-task snapshots
  knowledge/         Optional project-specific context files
```

---

## Recommended Models

| Model | Size | Best for |
|-------|------|----------|
| `qwen2.5-coder:7b` | ~4 GB | Fast iteration, everyday tasks |
| `qwen2.5-coder:14b` | ~8 GB | Complex multi-file tasks |
| `deepseek-r1:14b` | ~8 GB | Reasoning-heavy refactors |
| `llama3.1:8b` | ~5 GB | Balanced general coding |
| `codellama:13b` | ~8 GB | Code completion focused |

---

## Security

- **Path traversal protection** — file write tools (`write_file`, `edit_file`, `patch_file`) reject paths that escape the working directory
- **SSRF guard** — `fetch_url` and `http_request` block requests to private IP ranges (RFC 1918, 127.0.0.1, 169.254.x.x metadata endpoints)
- **Dangerous command detection** — `bash` blocks fork bombs, `rm -rf /`, `mkfs`, and other destructive shell patterns
- **Secret redaction** — the `environment` tool automatically masks values whose keys contain `SECRET`, `TOKEN`, `KEY`, or `PASSWORD`

---

## Requirements

- Node.js 18+
- For local models: **[Ollama](https://ollama.com)** with at least one model pulled (`ollama pull qwen2.5-coder:7b`)
- For cloud models: API key for OpenAI / Anthropic / Gemini

---

## License

MIT — free forever, including commercial use.

---

<div align="center">

⭐ **Star this repo if KeepCode saves you API costs** ⭐

[COMPARISON.md](COMPARISON.md) · [CHANGELOG.md](CHANGELOG.md) · [Issues](https://github.com/JuzerSaify/KeepCode/issues)

</div>
