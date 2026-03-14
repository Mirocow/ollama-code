#!/bin/bash
# Simple test: count from 1 to 5
# Expected: Model should call python_dev tool and output numbers 1-5

# Set Ollama server URL
OLLAMA_URL="${OLLAMA_BASE_URL:-http://localhost:11434}"

ollama-code --model krith/qwen2.5-coder-14b-instruct:IQ4_XS --ollama-base-url "$OLLAMA_URL" --yolo "Count from 1 to 5 using Python"
