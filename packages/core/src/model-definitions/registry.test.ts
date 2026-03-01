/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  MODEL_FAMILIES,
  findModelFamily,
  getModelCapabilities,
  getModelDefinition,
  supportsTools,
  supportsVision,
  supportsThinking,
  getToolCallFormat,
  DEFAULT_VISION_MODEL,
  getDefaultVisionModel,
} from './registry.js';

describe('MODEL_FAMILIES', () => {
  it('should be an array', () => {
    expect(Array.isArray(MODEL_FAMILIES)).toBe(true);
  });

  it('should contain qwen family', () => {
    const qwen = MODEL_FAMILIES.find((f) => f.id === 'qwen');
    expect(qwen).toBeDefined();
    expect(qwen?.displayName).toBe('Qwen');
  });

  it('should contain llama family', () => {
    const llama = MODEL_FAMILIES.find((f) => f.id === 'llama');
    expect(llama).toBeDefined();
    expect(llama?.displayName).toBe('Llama');
  });

  it('should contain deepseek family', () => {
    const deepseek = MODEL_FAMILIES.find((f) => f.id === 'deepseek');
    expect(deepseek).toBeDefined();
  });

  it('should have pattern for each family', () => {
    for (const family of MODEL_FAMILIES) {
      expect(family.pattern).toBeInstanceOf(RegExp);
    }
  });

  it('should have defaultCapabilities for each family', () => {
    for (const family of MODEL_FAMILIES) {
      expect(family.defaultCapabilities).toBeDefined();
    }
  });

  it('should have defaultOutputFormat for each family', () => {
    for (const family of MODEL_FAMILIES) {
      expect(family.defaultOutputFormat).toBeDefined();
    }
  });
});

describe('findModelFamily', () => {
  it('should find qwen family for qwen models', () => {
    const family = findModelFamily('qwen3-coder:30b');
    expect(family?.id).toBe('qwen');
  });

  it('should find llama family for llama models', () => {
    const family = findModelFamily('llama3.2:latest');
    expect(family?.id).toBe('llama');
  });

  it('should find deepseek family for deepseek models', () => {
    const family = findModelFamily('deepseek-r1:70b');
    expect(family?.id).toBe('deepseek');
  });

  it('should find mistral family for mistral models', () => {
    const family = findModelFamily('mistral:7b');
    expect(family?.id).toBe('mistral');
  });

  it('should find phi family for phi models', () => {
    const family = findModelFamily('phi-3-mini:3.8b');
    expect(family?.id).toBe('phi');
  });

  it('should return null for unknown models', () => {
    const family = findModelFamily('unknown-model');
    expect(family).toBeNull();
  });
});

describe('getModelCapabilities', () => {
  it('should return capabilities for qwen models', () => {
    const caps = getModelCapabilities('qwen3-coder:30b');
    expect(caps.tools).toBe(true);
  });

  it('should return capabilities for llama3.1', () => {
    const caps = getModelCapabilities('llama3.1:70b');
    expect(caps.tools).toBe(true);
  });

  it('should return capabilities for llama3.2', () => {
    const caps = getModelCapabilities('llama3.2:latest');
    expect(caps.tools).toBe(true);
  });

  it('should return default capabilities for unknown models', () => {
    const caps = getModelCapabilities('unknown-model');
    expect(caps.tools).toBe(false);
    expect(caps.vision).toBe(false);
    expect(caps.thinking).toBe(false);
  });

  it('should detect vision for llava', () => {
    const caps = getModelCapabilities('llava:13b');
    expect(caps.vision).toBe(true);
  });

  it('should detect thinking for deepseek-r1', () => {
    const caps = getModelCapabilities('deepseek-r1:70b');
    expect(caps.thinking).toBe(true);
  });
});

describe('getModelDefinition', () => {
  it('should return full definition for known models', () => {
    const def = getModelDefinition('qwen3-coder:30b');

    expect(def.modelName).toBe('qwen3-coder:30b');
    expect(def.family).toBeDefined();
    expect(def.capabilities).toBeDefined();
    expect(def.outputFormat).toBeDefined();
  });

  it('should return unknown family for unknown models', () => {
    const def = getModelDefinition('completely-unknown-model');

    expect(def.family.id).toBe('unknown');
    expect(def.capabilities.tools).toBe(false);
  });
});

describe('supportsTools', () => {
  it('should return true for qwen-coder models', () => {
    expect(supportsTools('qwen3-coder:30b')).toBe(true);
    expect(supportsTools('qwen2.5-coder:7b')).toBe(true);
  });

  it('should return true for qwen3 models', () => {
    expect(supportsTools('qwen3:30b')).toBe(true);
  });

  it('should return false for qwen2.5 base models', () => {
    expect(supportsTools('qwen2.5:7b')).toBe(false);
  });

  it('should return true for qwen2.5-instruct models', () => {
    expect(supportsTools('qwen2.5-instruct:7b')).toBe(true);
  });

  it('should return true for llama3.1+', () => {
    expect(supportsTools('llama3.1:70b')).toBe(true);
    expect(supportsTools('llama3.2:latest')).toBe(true);
    expect(supportsTools('llama3.3:70b')).toBe(true);
  });

  it('should return true for codellama', () => {
    expect(supportsTools('codellama:34b')).toBe(true);
  });

  it('should return true for deepseek models', () => {
    expect(supportsTools('deepseek-coder:33b')).toBe(true);
    expect(supportsTools('deepseek-r1:70b')).toBe(true);
  });

  it('should return true for codestral', () => {
    expect(supportsTools('codestral:22b')).toBe(true);
  });

  it('should return true for mixtral', () => {
    expect(supportsTools('mixtral:8x7b')).toBe(true);
  });

  it('should return true for mistral instruct', () => {
    expect(supportsTools('mistral:7b-instruct')).toBe(true);
  });

  it('should return false for base mistral', () => {
    expect(supportsTools('mistral:7b')).toBe(false);
  });

  it('should return false for unknown models', () => {
    expect(supportsTools('unknown-model')).toBe(false);
  });
});

describe('supportsVision', () => {
  it('should return true for llava', () => {
    expect(supportsVision('llava:13b')).toBe(true);
  });

  it('should return true for moondream', () => {
    expect(supportsVision('moondream')).toBe(true);
  });

  it('should return true for bakllava', () => {
    expect(supportsVision('bakllava')).toBe(true);
  });

  it('should return true for llama3.2-vision', () => {
    expect(supportsVision('llama3.2-vision')).toBe(true);
  });

  it('should return true for gemma-3', () => {
    expect(supportsVision('gemma-3-27b')).toBe(true);
  });

  it('should return false for non-vision models', () => {
    expect(supportsVision('llama3.2')).toBe(false);
    expect(supportsVision('qwen3-coder')).toBe(false);
  });
});

describe('supportsThinking', () => {
  it('should return true for qwq', () => {
    expect(supportsThinking('qwq:32b')).toBe(true);
  });

  it('should return true for deepseek-r1', () => {
    expect(supportsThinking('deepseek-r1:70b')).toBe(true);
  });

  it('should return false for non-thinking models', () => {
    expect(supportsThinking('llama3.2')).toBe(false);
    expect(supportsThinking('qwen3-coder')).toBe(false);
  });
});

describe('getToolCallFormat', () => {
  it('should return qwen format for qwen models', () => {
    expect(getToolCallFormat('qwen3-coder')).toBe('qwen');
  });

  it('should return deepseek format for deepseek models', () => {
    expect(getToolCallFormat('deepseek-r1')).toBe('deepseek');
  });

  it('should return mistral format for mistral models', () => {
    expect(getToolCallFormat('mistral:7b')).toBe('mistral');
  });

  it('should return phi format for phi models', () => {
    expect(getToolCallFormat('phi-3-mini')).toBe('phi');
  });

  it('should return native for llama models', () => {
    expect(getToolCallFormat('llama3.2')).toBe('native');
  });

  it('should return auto for unknown models', () => {
    const format = getToolCallFormat('unknown-model');
    expect(format).toBe('auto');
  });
});

describe('DEFAULT_VISION_MODEL', () => {
  it('should be llava', () => {
    expect(DEFAULT_VISION_MODEL).toBe('llava');
  });
});

describe('getDefaultVisionModel', () => {
  it('should return llava', () => {
    expect(getDefaultVisionModel()).toBe('llava');
  });
});

describe('Model-specific overrides', () => {
  describe('Qwen family', () => {
    it('should support tools for qwen3-coder', () => {
      expect(supportsTools('qwen3-coder:30b')).toBe(true);
    });

    it('should support tools for qwen2.5-coder', () => {
      expect(supportsTools('qwen2.5-coder:14b')).toBe(true);
    });

    it('should support tools for qwen3-tools', () => {
      expect(supportsTools('qwen3-tools:30b')).toBe(true);
    });

    it('should not support tools for qwen2.5 base', () => {
      expect(supportsTools('qwen2.5:7b')).toBe(false);
    });

    it('should support tools for qwen2.5-instruct', () => {
      expect(supportsTools('qwen2.5-instruct:7b')).toBe(true);
    });
  });

  describe('Llama family', () => {
    it('should support tools for llama3.1', () => {
      expect(supportsTools('llama3.1:70b')).toBe(true);
    });

    it('should support tools for llama3.2', () => {
      expect(supportsTools('llama3.2:3b')).toBe(true);
    });

    it('should support tools for llama3.3', () => {
      expect(supportsTools('llama3.3:70b')).toBe(true);
    });

    it('should support tools and vision for llama3.2-vision', () => {
      expect(supportsTools('llama3.2-vision')).toBe(true);
      expect(supportsVision('llama3.2-vision')).toBe(true);
    });

    it('should support tools for codellama', () => {
      expect(supportsTools('codellama:34b')).toBe(true);
    });

    it('should not support tools for llama2', () => {
      expect(supportsTools('llama2:70b')).toBe(false);
    });
  });

  describe('DeepSeek family', () => {
    it('should support tools for deepseek-coder', () => {
      expect(supportsTools('deepseek-coder-v2:33b')).toBe(true);
    });

    it('should support tools and thinking for deepseek-r1', () => {
      expect(supportsTools('deepseek-r1:70b')).toBe(true);
      expect(supportsThinking('deepseek-r1:70b')).toBe(true);
    });

    it('should support tools for deepseek-v3', () => {
      expect(supportsTools('deepseek-v3:70b')).toBe(true);
    });
  });

  describe('Mistral family', () => {
    it('should support tools for codestral', () => {
      expect(supportsTools('codestral:22b')).toBe(true);
    });

    it('should support tools for mixtral', () => {
      expect(supportsTools('mixtral:8x7b')).toBe(true);
    });

    it('should support tools for mistral instruct', () => {
      expect(supportsTools('mistral:7b-instruct')).toBe(true);
    });

    it('should support tools for mistral-small', () => {
      expect(supportsTools('mistral-small:24b')).toBe(true);
    });

    it('should support tools for mistral-large', () => {
      expect(supportsTools('mistral-large:123b')).toBe(true);
    });

    it('should not support tools for base mistral', () => {
      expect(supportsTools('mistral:7b')).toBe(false);
    });
  });

  describe('Gemma family', () => {
    it('should support tools for gemma-3', () => {
      expect(supportsTools('gemma-3-27b')).toBe(true);
    });

    it('should support tools for codegemma', () => {
      expect(supportsTools('codegemma:7b')).toBe(true);
    });

    it('should support tools for gemma instruct', () => {
      expect(supportsTools('gemma-2-9b-it')).toBe(true);
    });

    it('should not support tools for gemma-2 base', () => {
      expect(supportsTools('gemma-2-9b')).toBe(false);
    });
  });

  describe('Phi family', () => {
    it('should support tools for phi-3', () => {
      expect(supportsTools('phi-3-mini:3.8b')).toBe(true);
    });

    it('should support tools for phi-3.5', () => {
      expect(supportsTools('phi-3.5:3.8b')).toBe(true);
    });

    it('should support tools for phi-4', () => {
      expect(supportsTools('phi-4:14b')).toBe(true);
    });

    it('should not support tools for phi-2', () => {
      expect(supportsTools('phi-2:2.7b')).toBe(false);
    });
  });

  describe('Yi family', () => {
    it('should support tools for yi-coder', () => {
      expect(supportsTools('yi-coder:9b')).toBe(true);
    });

    it('should support tools for yi-large', () => {
      expect(supportsTools('yi-large')).toBe(true);
    });

    it('should support tools for yi-chat', () => {
      expect(supportsTools('yi-chat:34b')).toBe(true);
    });

    it('should not support tools for base yi', () => {
      expect(supportsTools('yi-34b')).toBe(false);
    });
  });

  describe('Granite family', () => {
    it('should support tools for granite-3', () => {
      expect(supportsTools('granite-3.0:8b')).toBe(true);
    });

    it('should support tools for granite-code', () => {
      expect(supportsTools('granite-code:34b')).toBe(true);
    });

    it('should support tools for granite-instruct', () => {
      expect(supportsTools('granite-instruct')).toBe(true);
    });
  });

  describe('Other families', () => {
    it('should support tools for command models', () => {
      expect(supportsTools('command-r:35b')).toBe(true);
      expect(supportsTools('command-r-plus:104b')).toBe(true);
    });

    it('should support tools for dbrx-instruct', () => {
      expect(supportsTools('dbrx-instruct')).toBe(true);
    });

    it('should not support tools for base dbrx', () => {
      expect(supportsTools('dbrx:132b')).toBe(false);
    });

    it('should support tools for solar-pro', () => {
      expect(supportsTools('solar-pro')).toBe(true);
    });

    it('should support tools for solar instruct', () => {
      expect(supportsTools('solar-10.7b-instruct')).toBe(true);
    });

    it('should not support tools for starcoder', () => {
      expect(supportsTools('starcoder2:15b')).toBe(false);
    });

    it('should not support tools for llava', () => {
      expect(supportsTools('llava:13b')).toBe(false);
    });
  });
});
