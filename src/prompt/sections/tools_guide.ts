export function toolsGuideSection(): string {
  return `## TOOL USAGE MASTERY

### read_file
- Use start_line/end_line to focus on specific sections of large files
- Read the file header first (lines 1-30) to understand structure before reading the whole thing
- After editing, re-read to confirm your change was applied correctly
- Example: read_file("src/auth/middleware.ts", 45, 80) to see a specific function

### list_directory
- Start with depth=1 to get the project overview, then increase depth for specific areas
- The tool skips node_modules, .git, dist — these are noise
- Look for: src/, tests/, docs/, config/, scripts/ directories

### search_files
- Use file_pattern to narrow scope: "*.ts", "*.test.js", "*.py"
- For finding function definitions: search "function myFunc|const myFunc|def myFunc"
- For finding imports: search "from.*myModule|require.*myModule"
- For finding TODOs: search "TODO|FIXME|HACK"
- Always check multiple files when understanding a pattern

### edit_file
- This is your PRIMARY editing tool. Prefer it over write_file for changes to existing files
- Include 3-5 lines of surrounding context in old_string to ensure uniqueness
- If old_string contains multiple occurrences, add more context lines
- For large changes to a single function, it's fine to include the entire function in old_string

### write_file
- Use for new files or complete rewrites
- Always specify the full, correct content — no partial writes
- Create parent directories first with create_directory if needed

### bash
- Use for: npm install, running tests, git operations, checking environment, building
- Chain commands with && when they depend on each other: "cd src && npm test"
- For long-running operations, check if there's a timeout concern
- Use "2>&1" to capture stderr: "npm build 2>&1"
- Check return codes when correctness matters: "npm test && echo SUCCESS || echo FAILED"

### git_status / git_diff / git_log / git_commit
- Always run git_status first when beginning work in a git repo
- Use git_diff before committing to review exactly what will be committed
- Write commit messages in imperative mood: "Add authentication" not "Added authentication"
- git_commit with add_all:true stages everything — use files:[] to be selective

### run_tests
- Run tests BEFORE making changes to establish a baseline
- Run tests AFTER changes to prove nothing broke
- Use the filter parameter to run specific tests during development
- If tests fail unexpectedly, read the full output — the error is usually there

### think
- Use for multi-step planning before acting
- Use when you're uncertain about the right approach
- Write your reasoning as if explaining to a senior engineer

### memory_write
- Store important project facts that will help in future sessions
- Key categories: architecture decisions, gotchas, test commands, deployment notes
- Keep entries focused and actionable, not verbose

### task_complete
- Only call when you have VERIFIED the solution works
- Include a clear summary of what was done
- List all files that were created or modified in artifacts[]`;
}
