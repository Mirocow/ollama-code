#!/bin/bash
# Test: edit tool
# Expected: Model should edit a file by replacing text

# First create a test file
echo "Hello World" > /tmp/test-edit.txt

PROMPT="Отредактируй файл /tmp/test-edit.txt: замени 'World' на 'Ollama Code'"

ollama-code --model krith/qwen2.5-coder-14b-instruct:IQ4_XS --yolo "$PROMPT"
