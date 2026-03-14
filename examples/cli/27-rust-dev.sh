#!/bin/bash
# Test: rust_dev tool
# Expected: Model should execute Rust code

PROMPT="Напиши и выполни простой Rust код: выведи 'Hello from Rust!'"

ollama-code --model krith/qwen2.5-coder-14b-instruct:IQ4_XS --yolo "$PROMPT"
