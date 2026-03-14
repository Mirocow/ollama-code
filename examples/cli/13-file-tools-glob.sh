#!/bin/bash
# Test: glob tool
# Expected: Model should find files matching a pattern

PROMPT="Найди все TypeScript файлы (*.ts) в текущем проекте"

ollama-code --model krith/qwen2.5-coder-14b-instruct:IQ4_XS --yolo "$PROMPT"
