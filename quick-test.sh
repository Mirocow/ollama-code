#!/bin/bash
# Quick test for Ollama API endpoints
# Usage: bash quick-test.sh

OLLAMA_HOST="${OLLAMA_HOST:-http://localhost:11434}"
MODEL="${OLLAMA_MODEL:-qwen3-coder:30b}"

echo "Testing Ollama at: $OLLAMA_HOST"
echo "Model: $MODEL"
echo ""

# Test server
echo "=== Server Status ==="
curl -s "$OLLAMA_HOST/api/version" || echo "Server not running!"
echo ""

# Test tags
echo ""
echo "=== Available Models ==="
curl -s "$OLLAMA_HOST/api/tags" | python3 -c "import sys,json; d=json.load(sys.stdin); [print(f'  - {m[\"name\"]} ({m[\"size\"]/1024/1024/1024:.1f} GB)') for m in d.get('models',[])]" 2>/dev/null || curl -s "$OLLAMA_HOST/api/tags"
echo ""

# Test generate
echo ""
echo "=== Test Generate ==="
echo 'curl -s $OLLAMA_HOST/api/generate -d '{"model":"$MODEL","prompt":"Say hi","stream":false}'
curl -s "$OLLAMA_HOST/api/generate" -d "{\"model\":\"$MODEL\",\"prompt\":\"Say hello in one word\",\"stream\":false}" | python3 -c "import sys,json; d=json.load(sys.stdin); print('Response:', d.get('response','ERROR'))" 2>/dev/null || echo "Model not available"
echo ""

# Test chat
echo ""
echo "=== Test Chat ==="
echo 'curl -s $OLLAMA_HOST/api/chat -d '{"model":"$MODEL","messages":[{"role":"user","content":"Hi"}]}'
curl -s "$OLLAMA_HOST/api/chat" -d "{\"model\":\"$MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"Say hello\"}],\"stream\":false}" | python3 -c "import sys,json; d=json.load(sys.stdin); print('Response:', d.get('message',{}).get('content','ERROR'))" 2>/dev/null || echo "Model not available"
