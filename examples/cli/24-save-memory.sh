#!/bin/bash
# Test: save_memory tool
# Expected: Model should save information to memory

PROMPT="Запомни: мой любимый язык программирования - Python"

ollama-code --model krith/qwen2.5-coder-14b-instruct:IQ4_XS --yolo "$PROMPT"
