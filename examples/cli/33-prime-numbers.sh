#!/bin/bash
# Test: Prime numbers calculation
# Expected: Model should find prime numbers using code

PROMPT="Найди все простые числа от 1 до 100 и выведи их в виде таблицы по 10 чисел в строке"

ollama-code --model krith/qwen2.5-coder-14b-instruct:IQ4_XS --yolo "$PROMPT"
