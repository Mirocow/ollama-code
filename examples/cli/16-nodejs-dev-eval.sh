#!/bin/bash
# Test: nodejs_dev tool with eval action
# Expected: Model should execute inline JavaScript code

PROMPT="Выполни JavaScript код: создай массив чисел от 1 до 10 и выведи его"

ollama-code --model krith/qwen2.5-coder-14b-instruct:IQ4_XS --yolo "$PROMPT"
