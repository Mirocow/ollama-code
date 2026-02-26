#!/bin/bash
# Test script for qwen3-coder:30b model
# Usage: ./test-qwen3-coder.sh [OLLAMA_URL]
#
# Prerequisites:
# 1. Ollama server running at OLLAMA_URL (default: http://localhost:11434)
# 2. Model qwen3-coder:30b pulled: ollama pull qwen3-coder:30b

OLLAMA_URL=${1:-http://localhost:11434}

echo "=========================================="
echo "Testing qwen3-coder:30b model"
echo "Ollama URL: $OLLAMA_URL"
echo "=========================================="

# Run the test
OLLAMA_URL=$OLLAMA_URL OLLAMA_TEST_MODEL=qwen3-coder:30b npx tsx scripts/test-ollama-api.ts
