/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { useState } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { useKeypress } from '../hooks/useKeypress.js';
import { t } from '../../i18n/index.js';

interface FirstRunSetupProps {
  onSubmit: (config: { baseUrl: string; model: string }) => Promise<void>;
  onCancel: () => void;
}

type InputField = 'baseUrl' | 'model';

const DEFAULT_BASE_URL = 'http://localhost:11434';
const DEFAULT_MODEL = 'qwen2.5-coder';

export function FirstRunSetup({
  onSubmit,
  onCancel,
}: FirstRunSetupProps): React.JSX.Element {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [currentField, setCurrentField] = useState<InputField>('baseUrl');
  const [currentValue, setCurrentValue] = useState(baseUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fields: InputField[] = ['baseUrl', 'model'];
  const fieldValues: Record<InputField, string> = {
    baseUrl,
    model,
  };
  const fieldSetters: Record<InputField, (val: string) => void> = {
    baseUrl: setBaseUrl,
    model: setModel,
  };

  useKeypress(
    (key) => {
      if (key.name === 'escape') {
        onCancel();
        return;
      }

      // Handle paste (Ctrl+V)
      if (key.paste && key.sequence) {
        setCurrentValue(currentValue + key.sequence);
        return;
      }

      if (key.name === 'return' || key.name === 'enter') {
        // Save current field value and move to next or submit
        fieldSetters[currentField](currentValue);

        const currentIndex = fields.indexOf(currentField);
        if (currentIndex === fields.length - 1) {
          // Last field, submit
          handleSubmit();
        } else {
          // Move to next field
          setCurrentField(fields[currentIndex + 1]);
          setCurrentValue(fieldValues[fields[currentIndex + 1]]);
        }
        return;
      }

      if (key.name === 'tab' || key.name === 'down') {
        // Save current and move to next
        fieldSetters[currentField](currentValue);
        const currentIndex = fields.indexOf(currentField);
        const nextIndex = (currentIndex + 1) % fields.length;
        setCurrentField(fields[nextIndex]);
        setCurrentValue(fieldValues[fields[nextIndex]]);
        return;
      }

      if (key.name === 'up') {
        // Save current and move to previous
        fieldSetters[currentField](currentValue);
        const currentIndex = fields.indexOf(currentField);
        const prevIndex = (currentIndex - 1 + fields.length) % fields.length;
        setCurrentField(fields[prevIndex]);
        setCurrentValue(fieldValues[fields[prevIndex]]);
        return;
      }

      if (key.name === 'backspace') {
        setCurrentValue(currentValue.slice(0, -1));
        return;
      }

      if (key.name === 'delete') {
        setCurrentValue('');
        return;
      }

      // Regular character input
      if (key.sequence && key.sequence.length === 1 && !key.ctrl && !key.meta) {
        setCurrentValue(currentValue + key.sequence);
      }
    },
    { isActive: !isSubmitting },
  );

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setError(null);

    const finalBaseUrl = currentField === 'baseUrl' ? currentValue : baseUrl;
    const finalModel = currentField === 'model' ? currentValue : model;

    // Validate baseUrl
    if (!finalBaseUrl.trim()) {
      setError(t('Base URL is required'));
      return;
    }

    // Validate model
    if (!finalModel.trim()) {
      setError(t('Model name is required'));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        baseUrl: finalBaseUrl.trim(),
        model: finalModel.trim(),
      });
    } catch (err) {
      setError(t('Failed to configure: {{message}}', { message: String(err) }));
      setIsSubmitting(false);
    }
  };

  const renderField = (
    _field: InputField,
    label: string,
    value: string,
    isCurrent: boolean,
    placeholder: string,
  ) => (
    <Box flexDirection="column" marginY={1}>
      <Box marginBottom={1}>
        <Text
          bold={isCurrent}
          color={isCurrent ? theme.text.accent : theme.text.secondary}
        >
          {label}
        </Text>
      </Box>
      <Box
        borderStyle="round"
        borderColor={isCurrent ? theme.text.accent : theme.border.default}
        paddingX={1}
      >
        <Text color={isCurrent ? theme.text.primary : theme.text.secondary}>
          {isCurrent ? `${value}█` : value || placeholder}
        </Text>
      </Box>
    </Box>
  );

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color={theme.text.accent}>
          {t('Welcome to Ollama Code!')}
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text color={theme.text.secondary}>
          {t('First-time setup: Configure your Ollama connection')}
        </Text>
      </Box>

      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={theme.border.default}
        paddingX={2}
        paddingY={1}
      >
        <Box marginBottom={1}>
          <Text bold>{t('Configure Ollama Connection')}</Text>
        </Box>

        {renderField(
          'baseUrl',
          t('Server URL (OLLAMA_HOST)'),
          currentField === 'baseUrl' ? currentValue : baseUrl,
          currentField === 'baseUrl',
          DEFAULT_BASE_URL,
        )}

        {renderField(
          'model',
          t('Model (OLLAMA_MODEL)'),
          currentField === 'model' ? currentValue : model,
          currentField === 'model',
          DEFAULT_MODEL,
        )}

        {error && (
          <Box marginTop={1}>
            <Text color={theme.status.error}>{error}</Text>
          </Box>
        )}

        <Box marginTop={1}>
          <Text color={theme.text.secondary} dimColor>
            {t('Tab/↑↓: switch • Enter: confirm • Esc: cancel • Ctrl+V: paste')}
          </Text>
        </Box>

        {isSubmitting && (
          <Box marginTop={1}>
            <Text color={theme.text.accent}>
              {t('Saving configuration...')}
            </Text>
          </Box>
        )}
      </Box>

      <Box marginTop={1}>
        <Text color={theme.text.secondary} dimColor>
          {t(
            'Make sure Ollama is installed and running. Visit: https://ollama.ai',
          )}
        </Text>
      </Box>
    </Box>
  );
}
