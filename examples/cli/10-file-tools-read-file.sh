#!/bin/bash
# Test: read_file tool
# Expected: Model should read a file and show its contents

PROMPT="Прочитай файл package.json из текущей директории и покажи его содержимое"

ollama-code --model krith/qwen2.5-coder-14b-instruct:IQ4_XS --yolo "$PROMPT"
