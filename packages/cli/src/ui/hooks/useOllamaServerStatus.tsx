/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Config } from '@ollama-code/ollama-code-core';

export interface OllamaServerStatus {
  isAvailable: boolean;
  error: string | null;
  isLoading: boolean;
  checkServer: () => Promise<boolean>;
}

/**
 * Hook to check Ollama server availability.
 * Returns server status and provides a function to re-check.
 */
export function useOllamaServerStatus(
  config: Config | null | undefined,
): OllamaServerStatus {
  const [isAvailable, setIsAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isCheckingRef = useRef(false);

  const checkServer = useCallback(async (): Promise<boolean> => {
    if (!config || isCheckingRef.current) {
      return isAvailable;
    }

    isCheckingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // Get Ollama client and check connection
      const ollamaClient = config.getOllamaNativeClient?.();

      if (!ollamaClient) {
        setIsAvailable(false);
        setError('Ollama клиент недоступен');
        return false;
      }

      // Try to list models - this will test the connection
      await ollamaClient.listModels();

      // If we got here, server is available
      setIsAvailable(true);
      setError(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      // Parse common errors
      let friendlyError = 'Сервер Ollama недоступен';

      if (
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('connect')
      ) {
        friendlyError =
          'Не удалось подключиться к серверу Ollama. Проверьте, что сервер запущен (ollama serve).';
      } else if (
        errorMessage.includes('ETIMEDOUT') ||
        errorMessage.includes('timeout')
      ) {
        friendlyError = 'Таймаут подключения к серверу Ollama.';
      } else if (errorMessage.includes('ENOTFOUND')) {
        friendlyError = 'Сервер Ollama не найден. Проверьте URL в настройках.';
      } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
        friendlyError = 'Ошибка авторизации при подключении к Ollama.';
      } else if (errorMessage.includes('fetch failed')) {
        friendlyError =
          'Сервер Ollama не отвечает. Убедитесь, что Ollama установлен и запущен.';
      }

      setIsAvailable(false);
      setError(friendlyError);
      return false;
    } finally {
      setIsLoading(false);
      isCheckingRef.current = false;
    }
  }, [config, isAvailable]);

  // Check server on mount
  useEffect(() => {
    if (config) {
      checkServer();
    }
  }, [config, checkServer]);

  return {
    isAvailable,
    error,
    isLoading,
    checkServer,
  };
}
