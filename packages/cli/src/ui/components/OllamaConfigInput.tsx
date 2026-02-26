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

interface OllamaConfigInputProps {
  onSubmit: (config: {
    baseUrl?: string;
    apiKey?: string;
    model?: string;
  }) => Promise<void>;
  onCancel: () => void;
  defaultBaseUrl?: string;
  defaultModel?: string;
}

type InputField = 'baseUrl' | 'model' | 'apiKey';

export function OllamaConfigInput({
  onSubmit,
  onCancel,
  defaultBaseUrl = 'http://localhost:11434',
  defaultModel,
}: OllamaConfigInputProps): React.JSX.Element {
  const [baseUrl, setBaseUrl] = useState(defaultBaseUrl);
  const [model, setModel] = useState(defaultModel || '');
  const [apiKey, setApiKey] = useState('');
  const [currentField, setCurrentField] = useState<InputField>('baseUrl');
  const [currentValue, setCurrentValue] = useState(baseUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fields: InputField[] = ['baseUrl', 'model', 'apiKey'];
  const fieldValues: Record<InputField, string> = {
    baseUrl,
    model,
    apiKey,
  };
  const fieldSetters: Record<InputField, (val: string) => void> = {
    baseUrl: setBaseUrl,
    model: setModel,
    apiKey: setApiKey,
  };

  useKeypress(
    (key) => {
      if (key.name === 'escape') {
        onCancel();
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
      }

      if (key.name === 'tab' || key.name === 'down') {
        // Save current and move to next
        fieldSetters[currentField](currentValue);
        const currentIndex = fields.indexOf(currentField);
        const nextIndex = (currentIndex + 1) % fields.length;
        setCurrentField(fields[nextIndex]);
        setCurrentValue(fieldValues[fields[nextIndex]]);
      }

      if (key.name === 'up') {
        // Save current and move to previous
        fieldSetters[currentField](currentValue);
        const currentIndex = fields.indexOf(currentField);
        const prevIndex = (currentIndex - 1 + fields.length) % fields.length;
        setCurrentField(fields[prevIndex]);
        setCurrentValue(fieldValues[fields[prevIndex]]);
      }

      if (key.name === 'backspace') {
        setCurrentValue(currentValue.slice(0, -1));
      } else if (key.name === 'delete') {
        setCurrentValue('');
      } else if (key.sequence && key.sequence.length === 1) {
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
    const finalApiKey = currentField === 'apiKey' ? currentValue : apiKey;

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
        apiKey: finalApiKey.trim() || undefined,
      });
    } catch (err) {
      setError(t('Failed to configure: {{message}}', { message: String(err) }));
      setIsSubmitting(false);
    }
  };

  const renderField = (
    field: InputField,
    label: string,
    value: string,
    isCurrent: boolean,
    placeholder?: string,
    helpText?: string,
  ) => (
    <Box flexDirection="column" marginTop={1}>
      <Box>
        <Text
          bold={isCurrent}
          color={isCurrent ? theme.text.accent : theme.text.secondary}
        >
          {isCurrent ? '❯ ' : '  '}
          {label}
          {': '}
        </Text>
        <Text color={theme.text.primary}>
          {isCurrent ? `${value}|` : (value || placeholder)}
        </Text>
      </Box>
      {helpText && isCurrent && (
        <Box paddingLeft={2}>
          <Text color={theme.text.secondary} dimColor>
            {helpText}
          </Text>
        </Box>
      )}
    </Box>
  );

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>{t('Configure Ollama Connection')}</Text>
      </Box>

      {renderField(
        'baseUrl',
        t('Base URL'),
        currentField === 'baseUrl' ? currentValue : baseUrl,
        currentField === 'baseUrl',
        'http://localhost:11434',
        t('Ollama server URL (default: http://localhost:11434)'),
      )}

      {renderField(
        'model',
        t('Model'),
        currentField === 'model' ? currentValue : model,
        currentField === 'model',
        'llama3.2',
        t('Model to use (e.g., llama3.2, qwen2.5-coder)'),
      )}

      {renderField(
        'apiKey',
        t('API Key'),
        currentField === 'apiKey' ? currentValue : apiKey,
        currentField === 'apiKey',
        t('(optional)'),
        t('Only needed for remote Ollama instances'),
      )}

      {error && (
        <Box marginTop={1}>
          <Text color={theme.status.error}>{error}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text color={theme.text.secondary} dimColor>
          {t('Use Tab/↑↓ to navigate, Enter to submit, Esc to cancel')}
        </Text>
      </Box>

      {isSubmitting && (
        <Box marginTop={1}>
          <Text color={theme.text.accent}>{t('Connecting...')}</Text>
        </Box>
      )}
    </Box>
  );
}
