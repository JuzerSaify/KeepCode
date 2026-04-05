# KeepCode

**KeepCode** is a fully autonomous AI coding agent that runs entirely **locally via Ollama** — no API keys, no cloud, no usage limits. Give it a task; it plans, explores your codebase, edits files, runs commands, calls APIs, and ships a result.

[![npm](https://img.shields.io/npm/v/keepcode?color=blueviolet)](https://www.npmjs.com/package/keepcode)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
[![Ollama](https://img.shields.io/badge/Powered%20by-Ollama-black)](https://ollama.com)

---

## Why KeepCode?

| | KeepCode | Claude Code | Codex CLI | Aider |
|---|---|---|---|---|
| Local / offline | ✅ | ❌ | ❌ | ✅ (partial) |
| Free to run | ✅ | ❌ API costs | ❌ OpenAI key | ✅ (partial) |
| No account needed | ✅ | ❌ | ❌ | ✅ |
| 38 built-in tools | ✅ | limited | limited | limited |
| TypeScript native | ✅ | Node | Rust | Python |

---

## Install

```bash
git clone https://github.com/JuzerSaify/apex
cd apex
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

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `-m, --model` | interactive | Ollama model name |
| `-u, --url` | `http://localhost:11434` | Ollama base URL |
| `-r, --run` | interactive | Single task, then exit |
| `-y, --auto-approve` | `false` | Skip tool-call confirmation |
| `--verbose` | `false` | Stream tokens as they arrive |
| `--auto-model` | `false` | Auto-pick best available model |
| `-i, --iterations` | `50` | Max agent iterations per task |
| `-c, --cwd` | `process.cwd()` | Working directory |
| `--ctx` | `16384` | Context window size |
| `--max-tokens` | `8192` | Max tokens per response |

---

## Tools (38 total)

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
  providers/    Ollama HTTP client
  tools/        All 38 tool implementations organised by category
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
- Ollama with at least one model pulled

---

## License

MIT


## Install

```bash
git clone https://github.com/JuzerSaify/apex
cd apex
npm install
npm run build
npm link
```

Requires [Ollama](https://ollama.com) running locally (or point `--url` at a remote instance).

## Usage

```bash
# Interactive — pick your model, then type your task
apex

# Direct task
apex --model qwen2.5-coder:7b --run "add input validation to the login endpoint"

# Auto-approve all tool calls (no confirmation prompts)
apex --model llama3.1:8b --run "fix the failing tests" --auto-approve

# Point at a remote Ollama instance
apex --model deepseek-r1:14b --url http://192.168.1.10:11434 --run "refactor auth module"
```

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--model`, `-m` | interactive | Ollama model to use |
| `--url` | `http://localhost:11434` | Ollama base URL |
| `--run`, `-r` | interactive | Task to execute non-interactively |
| `--auto-approve` | false | Skip tool-call confirmation prompts |
| `--verbose` | false | Stream tokens as they arrive |
| `--max-iter` | 50 | Max agent iterations |
| `--working-dir` | `cwd` | Root directory for all file operations |

## Tools (38 total)

### Read
| Tool | Description |
|------|-------------|
| `read_file` | Read file with optional line range |
| `read_lines` | Read multiple non-contiguous line ranges in one call |
| `read_json` | Read JSON file with optional dot-path query |
| `list_directory` | Tree view with depth control |
| `list_files` | Flat recursive listing with extension filter |
| `search_files` | Regex search across files |
| `glob` | Pattern-match files (e.g. `**/*.test.ts`) |
| `summarize_directory` | File count, extension breakdown, size, recently modified |

### Write
| Tool | Description |
|------|-------------|
| `edit_file` | Surgical find-and-replace (primary editing tool) |
| `patch_file` | Apply multiple edits to one file atomically |
| `write_file` | Full file write |
| `append_file` | Append content to file |
| `regex_replace` | Bulk regex-based replacement |
| `write_json` | Write JSON or update a single key |
| `create_directory` | Create nested directories |
| `delete_file` | Delete a file |
| `move_file` | Move or rename a file |
| `copy_file` | Copy a file |

### Execute
| Tool | Description |
|------|-------------|
| `bash` | Run any shell command (120s timeout) |
| `node_eval` | Evaluate a JavaScript snippet in-process |

### Network
| Tool | Description |
|------|-------------|
| `fetch_url` | GET a URL (docs, raw files, APIs) |
| `http_request` | Full HTTP client: POST/PUT/PATCH/DELETE with headers + body |

### Git
| Tool | Description |
|------|-------------|
| `git_status` | Working tree status |
| `git_diff` | Review changes |
| `git_log` | Commit history |
| `git_commit` | Stage and commit |
| `git_stash` | Push/pop/list/apply/drop stash |
| `git_branch` | List/create/switch/delete branches |
| `git_pull` | Pull with optional rebase |

### Code Quality
| Tool | Description |
|------|-------------|
| `lint` | Run project linter |
| `run_tests` | Run test suite with optional filter |

### Utility
| Tool | Description |
|------|-------------|
| `think` | Reason through a problem before acting |
| `plan` | Display a structured execution plan |
| `diff_files` | Unified diff between two files or file vs. string |
| `environment` | Read env vars with secret redaction |
| `process_info` | Check running processes and port usage |
| `memory_write` | Persist project facts across sessions |
| `memory_read` | Recall persisted facts |
| `checkpoint` | Save/restore agent state |
| `task_complete` | Signal verified task completion |

## Project Layout

```
src/
  agent/          # Core loop, memory, compression, trainer
  config/         # Defaults and config loader
  prompt/         # System prompt builder and sections
  providers/      # Ollama HTTP client
  tools/          # All 38 tool implementations
  types/          # TypeScript interfaces
  ui/             # Terminal renderer and components
```

## How It Works

1. **Plans** — calls `plan` at the start of multi-step tasks to show its approach
2. **Explores** — reads files, searches code, inspects environment with `summarize_directory`
3. **Acts** — writes files with `patch_file`/`edit_file`, runs commands via `bash`, calls APIs with `http_request`
4. **Verifies** — re-reads files, runs tests, diffs before/after with `diff_files`
5. **Completes** — calls `task_complete` only after verification passes

The agent stores learnings in `.apex/` — memory, training insights, and checkpoints persist across sessions.

## Requirements

- Node.js 18+
- Ollama with at least one model pulled (`ollama pull qwen2.5-coder:7b`)

## License

MIT
