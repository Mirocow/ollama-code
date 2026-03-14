#!/bin/bash
# Test: run_shell_command tool
# Expected: Model should execute a shell command

PROMPT="Выполни команду 'echo Hello from shell' и покажи результат"

ollama-code --model krith/qwen2.5-coder-14b-instruct:IQ4_XS --yolo "$PROMPT"
