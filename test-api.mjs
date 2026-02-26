#!/usr/bin/env node
/**
 * Test script for Ollama API
 * Usage: node test-api.mjs
 */

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'qwen3-coder:30b';

console.log('='.repeat(60));
console.log('Ollama API Test');
console.log('='.repeat(60));
console.log(`Host: ${OLLAMA_HOST}`);
console.log(`Model: ${MODEL}`);
console.log('');

// Test 1: Version
console.log('1. Testing /api/version...');
try {
  const res = await fetch(`${OLLAMA_HOST}/api/version`);
  if (res.ok) {
    const data = await res.json();
    console.log(`   ✓ Ollama version: ${data.version}`);
  } else {
    console.log(`   ✗ Server not responding: ${res.status}`);
    process.exit(1);
  }
} catch (e) {
  console.log(`   ✗ Connection failed: ${e.message}`);
  console.log('   Make sure Ollama is running: ollama serve');
  process.exit(1);
}

// Test 2: List models
console.log('');
console.log('2. Testing /api/tags...');
try {
  const res = await fetch(`${OLLAMA_HOST}/api/tags`);
  const data = await res.json();
  console.log(`   ✓ Found ${data.models?.length || 0} models:`);
  for (const m of (data.models || []).slice(0, 5)) {
    const size = (m.size / 1024 / 1024 / 1024).toFixed(2);
    console.log(`     - ${m.name} (${size} GB)`);
  }
} catch (e) {
  console.log(`   ✗ Error: ${e.message}`);
}

// Test 3: Show model
console.log('');
console.log(`3. Testing /api/show for ${MODEL}...`);
try {
  const res = await fetch(`${OLLAMA_HOST}/api/show`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL })
  });
  if (res.ok) {
    const data = await res.json();
    console.log(`   ✓ Model: ${MODEL}`);
    console.log(`     Family: ${data.details?.family || 'unknown'}`);
    console.log(`     Parameters: ${data.details?.parameter_size || 'unknown'}`);
  } else {
    const err = await res.text();
    console.log(`   ✗ Model not found: ${err}`);
    console.log(`   Hint: ollama pull ${MODEL}`);
  }
} catch (e) {
  console.log(`   ✗ Error: ${e.message}`);
}

// Test 4: Generate
console.log('');
console.log('4. Testing /api/generate...');
try {
  const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt: 'Say "Hello" in one word.',
      stream: false
    })
  });
  if (res.ok) {
    const data = await res.json();
    console.log(`   ✓ Response: "${data.response?.trim()}"`);
    console.log(`     Tokens: ${data.eval_count || 'N/A'}`);
  } else {
    const err = await res.text();
    console.log(`   ✗ Error: ${err}`);
  }
} catch (e) {
  console.log(`   ✗ Error: ${e.message}`);
}

// Test 5: Chat
console.log('');
console.log('5. Testing /api/chat...');
try {
  const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: 'Say "Hi"' }],
      stream: false
    })
  });
  if (res.ok) {
    const data = await res.json();
    console.log(`   ✓ Response: "${data.message?.content?.trim()}"`);
  } else {
    const err = await res.text();
    console.log(`   ✗ Error: ${err}`);
  }
} catch (e) {
  console.log(`   ✗ Error: ${e.message}`);
}

console.log('');
console.log('='.repeat(60));
console.log('All tests completed!');
console.log('='.repeat(60));
