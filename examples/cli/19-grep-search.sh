#!/bin/bash
# Test: grep_search tool
# Expected: Model should search for text patterns in files

PROMPT="Найди все упоминания слова 'import' в TypeScript файлах текущей директории"

ollama-code --model krith/qwen2.5-coder-14b-instruct:IQ4_XS --yolo "$PROMPT"
