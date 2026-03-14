#!/bin/bash
# Test: python_dev tool with exec action
# Expected: Model should execute inline Python code

PROMPT="Выполни Python код: посчитай сумму чисел от 1 до 100 и выведи результат"

ollama-code --model krith/qwen2.5-coder-14b-instruct:IQ4_XS --yolo "$PROMPT"
