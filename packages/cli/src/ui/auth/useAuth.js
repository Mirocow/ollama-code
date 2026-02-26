/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { AuthEvent, AuthType, getErrorMessage, logAuth, } from '@ollama-code/ollama-code-core';
import { useCallback, useEffect, useState } from 'react';
import { getPersistScopeForModelSelection } from '../../config/modelProvidersScope.js';
import { AuthState, MessageType } from '../types.js';
import { t } from '../../i18n/index.js';
export const useAuthCommand = (settings, config, addItem, onAuthChange) => {
    const unAuthenticated = config.getAuthType() === undefined;
    const [authState, setAuthState] = useState(unAuthenticated ? AuthState.Updating : AuthState.Unauthenticated);
    const [authError, setAuthError] = useState(null);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(unAuthenticated);
    const onAuthError = useCallback((error) => {
        setAuthError(error);
        if (error) {
            setAuthState(AuthState.Updating);
            setIsAuthDialogOpen(true);
        }
    }, [setAuthError, setAuthState]);
    const handleAuthFailure = useCallback((error) => {
        setIsAuthenticating(false);
        const errorMessage = t('Failed to authenticate. Message: {{message}}', {
            message: getErrorMessage(error),
        });
        onAuthError(errorMessage);
        // Log authentication failure
        const authEvent = new AuthEvent(AuthType.USE_OLLAMA, 'manual', 'error', errorMessage);
        logAuth(config, authEvent);
    }, [onAuthError, config]);
    const handleAuthSuccess = useCallback(async (credentials) => {
        try {
            const authTypeScope = getPersistScopeForModelSelection(settings);
            // Persist authType
            settings.setValue(authTypeScope, 'security.auth.selectedType', AuthType.USE_OLLAMA);
            // Persist model from ContentGenerator config
            const contentGeneratorConfig = config.getContentGeneratorConfig();
            if (contentGeneratorConfig?.model) {
                settings.setValue(authTypeScope, 'model.name', contentGeneratorConfig.model);
            }
            // Persist credentials if provided (for remote instances)
            if (credentials) {
                if (credentials?.apiKey != null) {
                    settings.setValue(authTypeScope, 'security.auth.apiKey', credentials.apiKey);
                }
                if (credentials?.baseUrl != null) {
                    settings.setValue(authTypeScope, 'security.auth.baseUrl', credentials.baseUrl);
                }
            }
        }
        catch (error) {
            handleAuthFailure(error);
            return;
        }
        setAuthError(null);
        setAuthState(AuthState.Authenticated);
        setIsAuthDialogOpen(false);
        setIsAuthenticating(false);
        // Trigger UI refresh to update header information
        onAuthChange?.();
        // Add success message to history
        addItem({
            type: MessageType.INFO,
            text: t('Authenticated successfully with Ollama.'),
        }, Date.now());
        // Log authentication success
        const authEvent = new AuthEvent(AuthType.USE_OLLAMA, 'manual', 'success');
        logAuth(config, authEvent);
    }, [settings, handleAuthFailure, config, addItem, onAuthChange]);
    const performAuth = useCallback(async (credentials) => {
        try {
            await config.refreshAuth(AuthType.USE_OLLAMA);
            await handleAuthSuccess(credentials);
        }
        catch (e) {
            handleAuthFailure(e);
        }
    }, [config, handleAuthSuccess, handleAuthFailure]);
    const handleAuthSelect = useCallback(async (authType, credentials) => {
        if (!authType || authType !== AuthType.USE_OLLAMA) {
            setIsAuthDialogOpen(false);
            setAuthError(null);
            return;
        }
        setAuthError(null);
        setIsAuthDialogOpen(false);
        setIsAuthenticating(true);
        if (credentials) {
            const settingsGenerationConfig = settings.merged.model
                ?.generationConfig;
            config.updateCredentials({
                apiKey: credentials.apiKey,
                baseUrl: credentials.baseUrl,
                model: credentials.model,
            }, settingsGenerationConfig);
            await performAuth(credentials);
        }
        else {
            await performAuth();
        }
    }, [config, performAuth, settings.merged.model?.generationConfig]);
    const openAuthDialog = useCallback(() => {
        setIsAuthDialogOpen(true);
    }, []);
    const cancelAuthentication = useCallback(() => {
        // Log authentication cancellation
        if (isAuthenticating) {
            const authEvent = new AuthEvent(AuthType.USE_OLLAMA, 'manual', 'cancelled');
            logAuth(config, authEvent);
        }
        setIsAuthenticating(false);
        setIsAuthDialogOpen(true);
        setAuthError(null);
    }, [isAuthenticating, config]);
    useEffect(() => {
        // Check for default auth type in environment
        const defaultAuthType = process.env['OLLAMA_DEFAULT_AUTH_TYPE'];
        if (defaultAuthType && defaultAuthType !== AuthType.USE_OLLAMA) {
            onAuthError(t('Invalid OLLAMA_DEFAULT_AUTH_TYPE value: "{{value}}". Only USE_OLLAMA is supported.', { value: defaultAuthType }));
        }
    }, [onAuthError]);
    return {
        authState,
        setAuthState,
        authError,
        onAuthError,
        isAuthDialogOpen,
        isAuthenticating,
        pendingAuthType: AuthType.USE_OLLAMA,
        qwenAuthState: undefined, // Not used for Ollama
        handleAuthSelect,
        handleCodingPlanSubmit: async () => {
            // Not applicable for Ollama
        },
        openAuthDialog,
        cancelAuthentication,
    };
};
//# sourceMappingURL=useAuth.js.map