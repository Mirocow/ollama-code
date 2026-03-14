#!/bin/bash
# Test: run_shell_command tool - complex command
# Expected: Model should execute a complex shell command with pipes

PROMPT="Выполни команду 'ls -la | head -5' и покажи результат"

ollama-code --model krith/qwen2.5-coder-14b-instruct:IQ4_XS --yolo "$PROMPT"
