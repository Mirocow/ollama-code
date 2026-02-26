#!/bin/bash
# Test Ollama API endpoints directly with curl
# Usage: ./test-ollama-curl.sh

OLLAMA_HOST="${OLLAMA_HOST:-http://localhost:11434}"
MODEL="${OLLAMA_MODEL:-qwen3-coder:30b}"

echo "============================================================"
echo "Ollama API Curl Test"
echo "============================================================"
echo "Host: $OLLAMA_HOST"
echo "Model: $MODEL"
echo ""

# Test 1: Get version
echo "1. GET /api/version"
echo "   curl -s $OLLAMA_HOST/api/version"
curl -s "$OLLAMA_HOST/api/version" | jq . 2>/dev/null || curl -s "$OLLAMA_HOST/api/version"
echo ""
echo ""

# Test 2: List models (/api/tags)
echo "2. GET /api/tags"
echo "   curl -s $OLLAMA_HOST/api/tags"
curl -s "$OLLAMA_HOST/api/tags" | jq '.models[] | {name, size: (.size / 1024 / 1024 / 1024 | . * 100 | floor / 100 | tostring + " GB")}' 2>/dev/null || curl -s "$OLLAMA_HOST/api/tags"
echo ""
echo ""

# Test 3: Show model (/api/show)
echo "3. POST /api/show"
echo "   curl -s $OLLAMA_HOST/api/show -d '{\"model\": \"$MODEL\"}'"
curl -s "$OLLAMA_HOST/api/show" -d "{\"model\": \"$MODEL\"}" | jq '{modelfile: .modelfile[0:200], details: .details}' 2>/dev/null || curl -s "$OLLAMA_HOST/api/show" -d "{\"model\": \"$MODEL\"}"
echo ""
echo ""

# Test 4: Generate (/api/generate)
echo "4. POST /api/generate"
echo "   curl -s $OLLAMA_HOST/api/generate -d '{\"model\": \"$MODEL\", \"prompt\": \"Say hello\"}'"
curl -s "$OLLAMA_HOST/api/generate" -d "{\"model\": \"$MODEL\", \"prompt\": \"Say hello in one word.\", \"stream\": false}" | jq '{model, response: .response[0:100], done, eval_count}' 2>/dev/null || curl -s "$OLLAMA_HOST/api/generate" -d "{\"model\": \"$MODEL\", \"prompt\": \"Say hello.\", \"stream\": false}"
echo ""
echo ""

# Test 5: Chat (/api/chat)
echo "5. POST /api/chat"
echo "   curl -s $OLLAMA_HOST/api/chat -d '{\"model\": \"$MODEL\", \"messages\": [{\"role\": \"user\", \"content\": \"Hi\"}]}'"
curl -s "$OLLAMA_HOST/api/chat" -d "{\"model\": \"$MODEL\", \"messages\": [{\"role\": \"user\", \"content\": \"Say hello in one word.\"}], \"stream\": false}" | jq '{model, message: .message.content, done}' 2>/dev/null || curl -s "$OLLAMA_HOST/api/chat" -d "{\"model\": \"$MODEL\", \"messages\": [{\"role\": \"user\", \"content\": \"Hi\"}], \"stream\": false}"
echo ""
echo ""

echo "============================================================"
echo "All curl tests completed!"
echo "============================================================"
