#!/bin/bash
# Test: typescript_dev tool
# Expected: Model should execute TypeScript code

PROMPT="Напиши и выполни TypeScript код: создай интерфейс User с полями name и age, создай экземпляр и выведи его"

ollama-code --model krith/qwen2.5-coder-14b-instruct:IQ4_XS --yolo "$PROMPT"
