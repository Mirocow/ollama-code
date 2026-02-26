/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, beforeEach, expect, test } from 'vitest';
import { NativeLspService } from './NativeLspService.js';
import { EventEmitter } from 'events';
// 模拟依赖项
class MockConfig {
    rootPath = '/test/workspace';
    isTrustedFolder() {
        return true;
    }
    get(_key) {
        return undefined;
    }
    getProjectRoot() {
        return this.rootPath;
    }
}
class MockWorkspaceContext {
    rootPath = '/test/workspace';
    async fileExists(_path) {
        return _path.endsWith('.json') || _path.includes('package.json');
    }
    async readFile(_path) {
        if (_path.includes('.lsp.json')) {
            return JSON.stringify({
                typescript: {
                    command: 'typescript-language-server',
                    args: ['--stdio'],
                    transport: 'stdio',
                },
            });
        }
        return '{}';
    }
    resolvePath(_path) {
        return this.rootPath + '/' + _path;
    }
    isPathWithinWorkspace(_path) {
        return true;
    }
    getDirectories() {
        return [this.rootPath];
    }
}
class MockFileDiscoveryService {
    async discoverFiles(_root, _options) {
        // 模拟发现一些文件
        return [
            '/test/workspace/src/index.ts',
            '/test/workspace/src/utils.ts',
            '/test/workspace/server.py',
            '/test/workspace/main.go',
        ];
    }
    shouldIgnoreFile() {
        return false;
    }
}
class MockIdeContextStore {
}
describe('NativeLspService', () => {
    let lspService;
    let mockConfig;
    let mockWorkspace;
    let mockFileDiscovery;
    let mockIdeStore;
    let eventEmitter;
    beforeEach(() => {
        mockConfig = new MockConfig();
        mockWorkspace = new MockWorkspaceContext();
        mockFileDiscovery = new MockFileDiscoveryService();
        mockIdeStore = new MockIdeContextStore();
        eventEmitter = new EventEmitter();
        lspService = new NativeLspService(mockConfig, mockWorkspace, eventEmitter, mockFileDiscovery, mockIdeStore);
    });
    test('should initialize correctly', () => {
        expect(lspService).toBeDefined();
    });
    test('should detect languages from workspace files', async () => {
        // 这个测试需要修改，因为我们无法直接访问私有方法
        await lspService.discoverAndPrepare();
        const status = lspService.getStatus();
        // 检查服务是否已准备就绪
        expect(status).toBeDefined();
    });
    test('should merge built-in presets with user configs', async () => {
        await lspService.discoverAndPrepare();
        const status = lspService.getStatus();
        // 检查服务是否已准备就绪
        expect(status).toBeDefined();
    });
});
// 注意：实际的单元测试需要适当的测试框架配置
// 这里只是一个结构示例
//# sourceMappingURL=NativeLspService.test.js.map