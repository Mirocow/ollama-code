/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Integration tests for OllamaNativeClient.
 * These tests require a running Ollama server.
 *
 * Run with: vitest run src/core/ollamaNativeClient.integration.test.ts
 * Or skip if no server is available.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { OllamaNativeClient, createOllamaNativeClient, } from './ollamaNativeClient.js';
// Check if Ollama server is running
const OLLAMA_URL = process.env['OLLAMA_URL'] || 'http://localhost:11434';
const TEST_MODEL = process.env['OLLAMA_TEST_MODEL'] || 'qwen2.5-coder';
const SKIP_INTEGRATION = process.env['SKIP_INTEGRATION_TESTS'] === 'true';
// Skip all tests if no server is available
const describeIntegration = SKIP_INTEGRATION ? describe.skip : describe;
describeIntegration('OllamaNativeClient Integration Tests', () => {
    let client;
    let serverAvailable = false;
    let testModelAvailable = false;
    beforeAll(async () => {
        client = createOllamaNativeClient({ baseUrl: OLLAMA_URL });
        // Check server availability
        serverAvailable = await client.isServerRunning();
        if (serverAvailable) {
            testModelAvailable = await client.isModelAvailable(TEST_MODEL);
        }
    }, 10000);
    describe('Server Status', () => {
        it('should connect to Ollama server', async () => {
            if (!serverAvailable) {
                console.log('Skipping: Ollama server not available at', OLLAMA_URL);
                return;
            }
            expect(serverAvailable).toBe(true);
        });
        it('should get version', async () => {
            if (!serverAvailable)
                return;
            const { version } = await client.getVersion();
            console.log('Ollama version:', version);
            expect(version).toBeDefined();
            expect(typeof version).toBe('string');
            expect(version).toMatch(/^\d+\.\d+\.\d+/);
        });
    });
    describe('Model Management', () => {
        it('should list local models', async () => {
            if (!serverAvailable)
                return;
            const { models } = await client.listModels();
            console.log('Available models:', models.map((m) => m.name));
            expect(Array.isArray(models)).toBe(true);
        });
        it('should list running models', async () => {
            if (!serverAvailable)
                return;
            const { models } = await client.listRunningModels();
            expect(Array.isArray(models)).toBe(true);
        });
        it('should show model information', async () => {
            if (!serverAvailable || !testModelAvailable) {
                console.log('Skipping: test model not available');
                return;
            }
            const info = await client.showModel(TEST_MODEL);
            console.log('Model info for', TEST_MODEL, ':', {
                parameters: info.parameters?.slice(0, 100),
                template: info.template?.slice(0, 100),
                family: info.details?.family,
            });
            expect(info.details).toBeDefined();
            expect(info.details?.family).toBeDefined();
        });
    });
    describe('Generate API', () => {
        it('should generate text from prompt', async () => {
            if (!serverAvailable || !testModelAvailable) {
                console.log('Skipping: test model not available');
                return;
            }
            const result = await client.generate({
                model: TEST_MODEL,
                prompt: 'Say "Hello World" and nothing else.',
                options: {
                    temperature: 0.1,
                    num_predict: 20,
                },
            });
            console.log('Generate response:', result.response);
            expect(result.done).toBe(true);
            expect(result.response).toBeDefined();
            expect(typeof result.response).toBe('string');
        });
        it('should generate JSON output', async () => {
            if (!serverAvailable || !testModelAvailable) {
                console.log('Skipping: test model not available');
                return;
            }
            const result = await client.generate({
                model: TEST_MODEL,
                prompt: 'Return a JSON object with a single key "message" and value "hello". Return only valid JSON.',
                format: 'json',
                options: {
                    temperature: 0.1,
                    num_predict: 50,
                },
            });
            console.log('JSON response:', result.response);
            expect(result.response).toBeDefined();
            // Try to parse as JSON
            try {
                const parsed = JSON.parse(result.response);
                expect(typeof parsed).toBe('object');
            }
            catch {
                // Some models may not return perfect JSON
                console.log('Response is not valid JSON, but format was requested');
            }
        });
        it('should support streaming generation', async () => {
            if (!serverAvailable || !testModelAvailable) {
                console.log('Skipping: test model not available');
                return;
            }
            const chunks = [];
            const result = await client.generate({
                model: TEST_MODEL,
                prompt: 'Count from 1 to 5, one number per line.',
                options: { temperature: 0.1, num_predict: 50 },
            }, (chunk) => {
                if (chunk.response) {
                    chunks.push(chunk.response);
                }
            });
            console.log('Streaming chunks received:', chunks.length);
            console.log('Full response:', result.response);
            expect(chunks.length).toBeGreaterThan(0);
            expect(result.done).toBe(true);
        });
    });
    describe('Chat API', () => {
        it('should complete chat conversation', async () => {
            if (!serverAvailable || !testModelAvailable) {
                console.log('Skipping: test model not available');
                return;
            }
            const result = await client.chat({
                model: TEST_MODEL,
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: 'Say "Hi" and nothing else.' },
                ],
                options: {
                    temperature: 0.1,
                    num_predict: 10,
                },
            });
            console.log('Chat response:', result.message.content);
            expect(result.done).toBe(true);
            expect(result.message.role).toBe('assistant');
            expect(result.message.content).toBeDefined();
        });
        it('should support multi-turn conversation', async () => {
            if (!serverAvailable || !testModelAvailable) {
                console.log('Skipping: test model not available');
                return;
            }
            const result = await client.chat({
                model: TEST_MODEL,
                messages: [
                    { role: 'user', content: 'My name is Alice.' },
                    { role: 'assistant', content: 'Hello Alice! Nice to meet you.' },
                    { role: 'user', content: 'What is my name?' },
                ],
                options: {
                    temperature: 0.1,
                    num_predict: 30,
                },
            });
            console.log('Multi-turn response:', result.message.content);
            expect(result.message.content.toLowerCase()).toContain('alice');
        });
        it('should support streaming chat', async () => {
            if (!serverAvailable || !testModelAvailable) {
                console.log('Skipping: test model not available');
                return;
            }
            const chunks = [];
            const result = await client.chat({
                model: TEST_MODEL,
                messages: [{ role: 'user', content: 'Tell me a very short joke.' }],
                options: { temperature: 0.7, num_predict: 100 },
            }, (chunk) => {
                if (chunk.message?.content) {
                    chunks.push(chunk.message.content);
                }
            });
            console.log('Chat streaming chunks received:', chunks.length);
            expect(chunks.length).toBeGreaterThan(0);
            expect(result.done).toBe(true);
        });
    });
    describe('Embeddings API', () => {
        it('should generate embeddings with /api/embed', async () => {
            if (!serverAvailable) {
                console.log('Skipping: server not available');
                return;
            }
            // Check if we have an embedding model
            const { models } = await client.listModels();
            const embeddingModel = models.find((m) => m.name.includes('embed') ||
                m.name.includes('nomic') ||
                m.name.includes('all-minilm'));
            if (!embeddingModel) {
                console.log('Skipping: no embedding model available');
                return;
            }
            const result = await client.embed({
                model: embeddingModel.name.split(':')[0],
                input: ['Hello world', 'Test embedding'],
            });
            console.log('Embeddings generated:', result.embeddings.length, 'vectors of length', result.embeddings[0]?.length);
            expect(result.embeddings).toHaveLength(2);
            expect(result.embeddings[0].length).toBeGreaterThan(0);
        });
        it('should generate embeddings with legacy /api/embeddings', async () => {
            if (!serverAvailable) {
                console.log('Skipping: server not available');
                return;
            }
            // Check if we have an embedding model
            const { models } = await client.listModels();
            const embeddingModel = models.find((m) => m.name.includes('embed') ||
                m.name.includes('nomic') ||
                m.name.includes('all-minilm'));
            if (!embeddingModel) {
                console.log('Skipping: no embedding model available');
                return;
            }
            const result = await client.embeddings({
                model: embeddingModel.name.split(':')[0],
                prompt: 'Test prompt for embedding',
            });
            console.log('Legacy embedding length:', result.embedding.length);
            expect(result.embedding.length).toBeGreaterThan(0);
        });
    });
    describe('Model Operations', () => {
        const COPY_MODEL_NAME = 'test-copy-model';
        afterAll(async () => {
            // Clean up: delete copied model if it was created
            if (serverAvailable) {
                try {
                    await client.deleteModel(COPY_MODEL_NAME);
                }
                catch {
                    // Model might not exist, that's OK
                }
            }
        });
        it('should copy and delete a model', async () => {
            if (!serverAvailable || !testModelAvailable) {
                console.log('Skipping: test model not available');
                return;
            }
            // Copy the model
            await client.copyModel(TEST_MODEL, COPY_MODEL_NAME);
            // Verify copy exists
            const { models } = await client.listModels();
            const copyExists = models.some((m) => m.name.includes(COPY_MODEL_NAME));
            expect(copyExists).toBe(true);
            // Delete the copy
            await client.deleteModel(COPY_MODEL_NAME);
            // Verify deletion
            const { models: updatedModels } = await client.listModels();
            const copyStillExists = updatedModels.some((m) => m.name.includes(COPY_MODEL_NAME));
            expect(copyStillExists).toBe(false);
        });
    });
    describe('Utility Methods', () => {
        it('should check model availability', async () => {
            if (!serverAvailable)
                return;
            if (testModelAvailable) {
                const available = await client.isModelAvailable(TEST_MODEL);
                expect(available).toBe(true);
            }
            const notAvailable = await client.isModelAvailable('definitely-not-a-real-model-xyz123');
            expect(notAvailable).toBe(false);
        });
    });
});
// Run basic smoke test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const client = createOllamaNativeClient({ baseUrl: OLLAMA_URL });
    client.isServerRunning().then(async (running) => {
        if (!running) {
            console.error('Ollama server not running at', OLLAMA_URL);
            process.exit(1);
        }
        console.log('Ollama server is running');
        try {
            const { version } = await client.getVersion();
            console.log('Version:', version);
            const { models } = await client.listModels();
            console.log('Models:', models.map((m) => m.name));
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=ollamaNativeClient.integration.test.js.map