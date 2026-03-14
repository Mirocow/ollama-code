#!/bin/bash
# Test: write_file tool
# Expected: Model should create a new file with specified content

PROMPT="Создай файл /tmp/test-ollama-code.txt с содержимым 'Hello from Ollama Code!'"

ollama-code --model krith/qwen2.5-coder-14b-instruct:IQ4_XS --yolo "$PROMPT"
