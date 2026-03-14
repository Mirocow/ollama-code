# Complete Tools Demo - Final Prompt

Copy and paste this ENTIRE prompt to test ALL 46 tools:

```
I want to test EVERY tool available in ollama-code. Execute each tool one by one and report the result.

WORKING DIRECTORY: /home/z/my-project/ollama-code

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CATEGORY 1: CORE TOOLS (3 tools)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. echo "Hello from ollama-code tools demo!"
2. Show current timestamp
3. Get the HOME environment variable

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CATEGORY 2: FILE TOOLS (6 tools)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. List directory contents of /home/z/my-project/ollama-code/packages
5. Glob for all *.ts files in /home/z/my-project/ollama-code/packages/core/src
6. Read file /home/z/my-project/ollama-code/package.json
7. Read multiple files: package.json from core and cli packages
8. Write file /home/z/my-project/ollama-code/examples/all-tools-demo/output/test.txt with "Hello"
9. Edit that file to change "Hello" to "Hello World"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CATEGORY 3: SHELL TOOL (1 tool)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

10. Run shell command: echo "Shell works!" && pwd && date

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CATEGORY 4: GIT TOOLS (3 tools)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

11. Show git status using git_smart
12. Show last 5 commits using git_advanced
13. List all branches using git_workflow

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CATEGORY 5: SEARCH TOOLS (3 tools)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

14. Grep for "export" in /home/z/my-project/ollama-code/packages/core/src/index.ts
15. Web search for "ollama code editor"
16. Web fetch from https://httpbin.org/get

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CATEGORY 6: DEV TOOLS (9 tools)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

17. python_dev: run print("Python works!")
18. nodejs_dev: run console.log("Node.js works!")
19. typescript_dev: check types in this project
20. golang_dev: run go version
21. rust_dev: run cargo --version
22. java_dev: run java -version
23. cpp_dev: run g++ --version
24. swift_dev: run swift --version (skip if not available)
25. php_dev: run php -v (skip if not available)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CATEGORY 7: DATABASE & DOCKER TOOLS (4 tools)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

26. docker: list containers
27. docker_project: show docker projects
28. redis: ping redis (skip if not available)
29. database: show database connections

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CATEGORY 8: CODE ANALYSIS TOOLS (5 tools)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

30. code_analyzer: analyze packages/core/src
31. find_unused_exports: find unused in core package
32. analyze_dependencies: show dependency tree
33. detect_dead_code: find dead code
34. diagram_generator: generate architecture diagram

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CATEGORY 9: PRODUCTIVITY TOOLS (2 tools)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

35. todo_write: create list with [x] Test echo, [ ] Test all others
36. exit_plan_mode: exit planning mode

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CATEGORY 10: MEMORY & AGENT TOOLS (3 tools)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

37. save_memory: "Tools demo completed at [current time]"
38. task: create subagent task
39. skill: list available skills

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CATEGORY 11: SSH & NETWORK TOOLS (5 tools)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

40. ssh_list_hosts: show SSH hosts
41. ssh_add_host: add test host (remove after)
42. lsp: show LSP capabilities
43. api_tester: test httpbin.org/get
44. model_storage: show storage info

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CATEGORY 12: MCP TOOLS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

45. List all available MCP tools and use one

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After testing all tools, provide a summary table:

| Category | Tools | Tested | Success | Failed | Skipped |
|----------|-------|--------|---------|--------|---------|
| Core | 3 | ? | ? | ? | ? |
| File | 6 | ? | ? | ? | ? |
| Shell | 1 | ? | ? | ? | ? |
| Git | 3 | ? | ? | ? | ? |
| Search | 3 | ? | ? | ? | ? |
| Dev | 9 | ? | ? | ? | ? |
| Database | 4 | ? | ? | ? | ? |
| Analysis | 5 | ? | ? | ? | ? |
| Productivity | 2 | ? | ? | ? | ? |
| Memory | 3 | ? | ? | ? | ? |
| SSH | 5 | ? | ? | ? | ? |
| MCP | ? | ? | ? | ? | ? |
| **TOTAL** | **46+** | ? | ? | ? | ? |
```

## How to Run

```bash
# 1. Build the project
cd /home/z/my-project/ollama-code
pnpm build

# 2. Start ollama-code
node packages/cli/dist/cli.js

# 3. Paste the entire prompt above

# 4. Watch it test all 46+ tools!
```
