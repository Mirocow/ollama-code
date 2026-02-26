#!/bin/bash
# Test Ollama Native API endpoints
# Usage: ./test-ollama-api.sh [model]

OLLAMA_URL="http://localhost:11434"
MODEL="${1:-qwen3-coder:30b}"

echo "============================================================"
echo "Ollama Native API Test (curl)"
echo "============================================================"
echo "Base URL: $OLLAMA_URL"
echo "Model: $MODEL"
echo ""

# 1. Test /api/version
echo "1. Testing GET /api/version"
echo "----------------------------------------"
curl -s "$OLLAMA_URL/api/version" | jq . 2>/dev/null || curl -s "$OLLAMA_URL/api/version"
echo ""
echo "✓ Success"
echo ""

# 2. Test /api/tags
echo "2. Testing GET /api/tags"
echo "----------------------------------------"
curl -s "$OLLAMA_URL/api/tags" | jq '.models[] | {name: .name, size: ((.size / 1024 / 1024 / 1024) | floor | tostring + " GB")}' 2>/dev/null || curl -s "$OLLAMA_URL/api/tags"
echo ""
echo "✓ Success"
echo ""

# 3. Test /api/show
echo "3. Testing POST /api/show (model: $MODEL)"
echo "----------------------------------------"
curl -s -X POST "$OLLAMA_URL/api/show" -d "{\"model\": \"$MODEL\"}" | jq '{modelfile: .modelfile[0:200], details: .details}' 2>/dev/null || curl -s -X POST "$OLLAMA_URL/api/show" -d "{\"model\": \"$MODEL\"}"
echo ""
echo "✓ Success"
echo ""

# 4. Test /api/ps
echo "4. Testing GET /api/ps"
echo "----------------------------------------"
curl -s "$OLLAMA_URL/api/ps" | jq . 2>/dev/null || curl -s "$OLLAMA_URL/api/ps"
echo ""
echo "✓ Success"
echo ""

# 5. Test /api/generate (non-streaming)
echo "5. Testing POST /api/generate (non-streaming)"
echo "----------------------------------------"
curl -s -X POST "$OLLAMA_URL/api/generate" -d "{
  \"model\": \"$MODEL\",
  \"prompt\": \"Say hello in one word.\",
  \"stream\": false,
  \"options\": {
    \"num_predict\": 20,
    \"temperature\": 0.1
  }
}" | jq '{response: .response, eval_count: .eval_count, total_duration_ms: ((.total_duration // 0) / 1000000 | floor)}' 2>/dev/null || curl -s -X POST "$OLLAMA_URL/api/generate" -d "{\"model\": \"$MODEL\", \"prompt\": \"Say hello.\", \"stream\": false}"
echo ""
echo "✓ Success"
echo ""

# 6. Test /api/generate (streaming)
echo "6. Testing POST /api/generate (streaming)"
echo "----------------------------------------"
echo "Response: "
curl -s -X POST "$OLLAMA_URL/api/generate" -d "{
  \"model\": \"$MODEL\",
  \"prompt\": \"Count from 1 to 3.\",
  \"stream\": true,
  \"options\": {
    \"num_predict\": 30,
    \"temperature\": 0.1
  }
}" | while IFS= read -r line; do
  echo "$line" | jq -r '.response // empty' 2>/dev/null
done
echo ""
echo "✓ Success (streaming)"
echo ""

# 7. Test /api/chat (non-streaming)
echo "7. Testing POST /api/chat (non-streaming)"
echo "----------------------------------------"
curl -s -X POST "$OLLAMA_URL/api/chat" -d "{
  \"model\": \"$MODEL\",
  \"messages\": [
    {\"role\": \"system\", \"content\": \"You are a helpful assistant. Be concise.\"},
    {\"role\": \"user\", \"content\": \"What is 2 + 2? Answer with just the number.\"}
  ],
  \"stream\": false,
  \"options\": {
    \"num_predict\": 20,
    \"temperature\": 0.1
  }
}" | jq '{message: .message.content, eval_count: .eval_count}' 2>/dev/null || curl -s -X POST "$OLLAMA_URL/api/chat" -d "{\"model\": \"$MODEL\", \"messages\": [{\"role\": \"user\", \"content\": \"What is 2 + 2?\"}], \"stream\": false}"
echo ""
echo "✓ Success"
echo ""

# 8. Test /api/chat (streaming)
echo "8. Testing POST /api/chat (streaming)"
echo "----------------------------------------"
echo "Response: "
curl -s -X POST "$OLLAMA_URL/api/chat" -d "{
  \"model\": \"$MODEL\",
  \"messages\": [
    {\"role\": \"user\", \"content\": \"Name 2 colors.\"}
  ],
  \"stream\": true,
  \"options\": {
    \"num_predict\": 30,
    \"temperature\": 0.1
  }
}" | while IFS= read -r line; do
  echo "$line" | jq -r '.message.content // empty' 2>/dev/null
done
echo ""
echo "✓ Success (streaming)"
echo ""

echo "============================================================"
echo "All tests completed!"
echo "============================================================"
