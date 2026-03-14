#!/bin/bash
# Test: Fibonacci sequence calculation
# Expected: Model should calculate Fibonacci numbers using code

PROMPT="Посчитай первые 20 чисел Фибоначчи и выведи их в виде таблицы"

ollama-code --model krith/qwen2.5-coder-14b-instruct:IQ4_XS --yolo "$PROMPT"
