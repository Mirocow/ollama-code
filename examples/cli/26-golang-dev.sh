#!/bin/bash
# Test: golang_dev tool
# Expected: Model should execute Go code

PROMPT="Напиши и выполни простой Go код: выведи 'Hello from Go!'"

ollama-code --model krith/qwen2.5-coder-14b-instruct:IQ4_XS --yolo "$PROMPT"
