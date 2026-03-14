#!/bin/bash
# Test: read_many_files tool
# Expected: Model should read multiple files at once

PROMPT="Прочитай файлы package.json и README.md из текущей директории одновременно"

ollama-code --model krith/qwen2.5-coder-14b-instruct:IQ4_XS --yolo "$PROMPT"
