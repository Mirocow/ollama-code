#!/bin/bash
# Test: Complex multi-tool workflow
# Expected: Model should use multiple tools in sequence

PROMPT="Создай файл /tmp/test-data.txt с числами от 1 до 10 (каждое на новой строке), затем прочитай его и посчитай сумму этих чисел с помощью Python"

ollama-code --model krith/qwen2.5-coder-14b-instruct:IQ4_XS --yolo "$PROMPT"
