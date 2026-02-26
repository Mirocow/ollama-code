/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { useState } from 'react';
import { AuthType } from '@qwen-code/qwen-code-core';
import { Box, Text } from 'ink';
import Link from 'ink-link';
import { theme } from '../semantic-colors.js';
import { useKeypress } from '../hooks/useKeypress.js';
import { RadioButtonSelect } from '../components/shared/RadioButtonSelect.js';
import { OllamaConfigInput } from '../components/OllamaConfigInput.js';
import { useUIState } from '../contexts/UIStateContext.js';
import { useUIActions } from '../contexts/UIActionsContext.js';
import { useConfig } from '../contexts/ConfigContext.js';
import { t } from '../../i18n/index.js';

const OLLAMA_DOCUMENTATION_URL = 'https://github.com/ollama/ollama';

function parseDefaultAuthType(
  defaultAuthType: string | undefined,
): AuthType | null {
  if (
    defaultAuthType &&
    Object.values(AuthType).includes(defaultAuthType as AuthType)
  ) {
    return defaultAuthType as AuthType;
  }
  return null;
}

// View level for navigation
type ViewLevel = 'main' | 'config-input';

export function AuthDialog(): React.JSX.Element {
  const { pendingAuthType, authError } = useUIState();
  const { handleAuthSelect: onAuthSelect, onAuthError } = useUIActions();
  const config = useConfig();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewLevel, setViewLevel] = useState<ViewLevel>('main');

  // Main authentication entries - only Ollama
  const mainItems = [
    {
      key: AuthType.USE_OLLAMA,
      label: t('Ollama (Local LLM)'),
      value: AuthType.USE_OLLAMA,
    },
  ];

  const initialAuthIndex = Math.max(
    0,
    mainItems.findIndex((item) => {
      // Priority 1: pendingAuthType
      if (pendingAuthType) {
        return item.value === pendingAuthType;
      }

      // Priority 2: config.getAuthType() - the source of truth
      const currentAuthType = config.getAuthType();
      if (currentAuthType) {
        return item.value === currentAuthType;
      }

      // Priority 3: OLLAMA_DEFAULT_AUTH_TYPE env var
      const defaultAuthType = parseDefaultAuthType(
        process.env['OLLAMA_DEFAULT_AUTH_TYPE'],
      );
      if (defaultAuthType) {
        return item.value === defaultAuthType;
      }

      // Priority 4: default to USE_OLLAMA
      return item.value === AuthType.USE_OLLAMA;
    }),
  );

  const handleMainSelect = async (
    _value: (typeof mainItems)[number]['value'],
  ) => {
    setErrorMessage(null);
    onAuthError(null);

    // Show config input for Ollama
    setViewLevel('config-input');
  };

  const handleConfigSubmit = async (ollamaConfig: {
    baseUrl?: string;
    apiKey?: string;
    model?: string;
  }) => {
    setErrorMessage(null);
    // Convert to OllamaCredentials format
    await onAuthSelect(AuthType.USE_OLLAMA, {
      apiKey: ollamaConfig.apiKey,
      baseUrl: ollamaConfig.baseUrl,
      model: ollamaConfig.model,
    });
  };

  const handleGoBack = () => {
    setErrorMessage(null);
    onAuthError(null);
    if (viewLevel === 'config-input') {
      setViewLevel('main');
    }
  };

  useKeypress(
    (key) => {
      if (key.name === 'escape') {
        if (viewLevel === 'config-input') {
          handleGoBack();
          return;
        }

        // For main view
        if (errorMessage) {
          return;
        }
        if (config.getAuthType() === undefined) {
          setErrorMessage(
            t(
              'You must select an auth method to proceed. Press Ctrl+C again to exit.',
            ),
          );
          return;
        }
        onAuthSelect(undefined);
      }
    },
    { isActive: true },
  );

  // Render main auth selection
  const renderMainView = () => (
    <>
      <Box marginTop={1}>
        <Text>{t('How would you like to authenticate for this project?')}</Text>
      </Box>
      <Box marginTop={1}>
        <RadioButtonSelect
          items={mainItems}
          initialIndex={initialAuthIndex}
          onSelect={handleMainSelect}
        />
      </Box>
      <Box marginTop={1} paddingLeft={2}>
        <Text color={theme.text.secondary}>
          {t(
            'Ollama runs locally on your machine. No API key required for local instances.',
          )}
        </Text>
      </Box>
    </>
  );

  // Render Ollama configuration input
  const renderConfigInputView = () => (
    <Box marginTop={1}>
      <OllamaConfigInput
        onSubmit={handleConfigSubmit}
        onCancel={handleGoBack}
        defaultBaseUrl={
          config.getContentGeneratorConfig()?.baseUrl ||
          process.env['OLLAMA_BASE_URL'] ||
          process.env['OLLAMA_HOST'] ||
          'http://localhost:11434'
        }
        defaultModel={config.getContentGeneratorConfig()?.model}
      />
    </Box>
  );

  const getViewTitle = () => {
    switch (viewLevel) {
      case 'main':
        return t('Get started with Ollama');
      case 'config-input':
        return t('Ollama Configuration');
      default:
        return t('Get started with Ollama');
    }
  };

  return (
    <Box
      borderStyle="round"
      borderColor={theme?.border?.default}
      flexDirection="column"
      padding={1}
      width="100%"
    >
      <Text bold>{getViewTitle()}</Text>

      {viewLevel === 'main' && renderMainView()}
      {viewLevel === 'config-input' && renderConfigInputView()}

      {(authError || errorMessage) && (
        <Box marginTop={1}>
          <Text color={theme.status.error}>{authError || errorMessage}</Text>
        </Box>
      )}

      {viewLevel === 'main' && (
        <>
          <Box marginTop={1}>
            <Text color={theme.text.accent}>
              {t('(Use Enter to Set Auth)')}
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text color={theme.text.secondary}>
              {t('Requirements: Ollama must be installed and running locally.')}
            </Text>
          </Box>
          <Box marginTop={1}>
            <Link url={OLLAMA_DOCUMENTATION_URL} fallback={false}>
              <Text color={theme.text.link} underline>
                {OLLAMA_DOCUMENTATION_URL}
              </Text>
            </Link>
          </Box>
        </>
      )}
    </Box>
  );
}
