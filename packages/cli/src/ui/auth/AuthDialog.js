import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { AuthType } from '@ollama-code/ollama-code-core';
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
function parseDefaultAuthType(defaultAuthType) {
    if (defaultAuthType &&
        Object.values(AuthType).includes(defaultAuthType)) {
        return defaultAuthType;
    }
    return null;
}
export function AuthDialog() {
    const { pendingAuthType, authError } = useUIState();
    const { handleAuthSelect: onAuthSelect, onAuthError } = useUIActions();
    const config = useConfig();
    const [errorMessage, setErrorMessage] = useState(null);
    const [viewLevel, setViewLevel] = useState('main');
    // Main authentication entries - only Ollama
    const mainItems = [
        {
            key: AuthType.USE_OLLAMA,
            label: t('Ollama (Local LLM)'),
            value: AuthType.USE_OLLAMA,
        },
    ];
    const initialAuthIndex = Math.max(0, mainItems.findIndex((item) => {
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
        const defaultAuthType = parseDefaultAuthType(process.env['OLLAMA_DEFAULT_AUTH_TYPE']);
        if (defaultAuthType) {
            return item.value === defaultAuthType;
        }
        // Priority 4: default to USE_OLLAMA
        return item.value === AuthType.USE_OLLAMA;
    }));
    const handleMainSelect = async (_value) => {
        setErrorMessage(null);
        onAuthError(null);
        // Show config input for Ollama
        setViewLevel('config-input');
    };
    const handleConfigSubmit = async (ollamaConfig) => {
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
    useKeypress((key) => {
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
                setErrorMessage(t('You must select an auth method to proceed. Press Ctrl+C again to exit.'));
                return;
            }
            onAuthSelect(undefined);
        }
    }, { isActive: true });
    // Render main auth selection
    const renderMainView = () => (_jsxs(_Fragment, { children: [_jsx(Box, { marginTop: 1, children: _jsx(Text, { children: t('How would you like to authenticate for this project?') }) }), _jsx(Box, { marginTop: 1, children: _jsx(RadioButtonSelect, { items: mainItems, initialIndex: initialAuthIndex, onSelect: handleMainSelect }) }), _jsx(Box, { marginTop: 1, paddingLeft: 2, children: _jsx(Text, { color: theme.text.secondary, children: t('Ollama runs locally on your machine. No API key required for local instances.') }) })] }));
    // Render Ollama configuration input
    const renderConfigInputView = () => (_jsx(Box, { marginTop: 1, children: _jsx(OllamaConfigInput, { onSubmit: handleConfigSubmit, onCancel: handleGoBack, defaultBaseUrl: config.getContentGeneratorConfig()?.baseUrl ||
                process.env['OLLAMA_BASE_URL'] ||
                process.env['OLLAMA_HOST'] ||
                'http://localhost:11434', defaultModel: config.getContentGeneratorConfig()?.model }) }));
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
    return (_jsxs(Box, { borderStyle: "round", borderColor: theme?.border?.default, flexDirection: "column", padding: 1, width: "100%", children: [_jsx(Text, { bold: true, children: getViewTitle() }), viewLevel === 'main' && renderMainView(), viewLevel === 'config-input' && renderConfigInputView(), (authError || errorMessage) && (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.status.error, children: authError || errorMessage }) })), viewLevel === 'main' && (_jsxs(_Fragment, { children: [_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.accent, children: t('(Use Enter to Set Auth)') }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Requirements: Ollama must be installed and running locally.') }) }), _jsx(Box, { marginTop: 1, children: _jsx(Link, { url: OLLAMA_DOCUMENTATION_URL, fallback: false, children: _jsx(Text, { color: theme.text.link, underline: true, children: OLLAMA_DOCUMENTATION_URL }) }) })] }))] }));
}
//# sourceMappingURL=AuthDialog.js.map