#!/bin/bash
# Test: list_directory tool
# Expected: Model should list files in a directory

PROMPT="Покажи содержимое текущей директории"

ollama-code --model krith/qwen2.5-coder-14b-instruct:IQ4_XS --yolo "$PROMPT"
