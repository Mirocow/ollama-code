import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useContext, useMemo, useState } from 'react';
import { Box, Text } from 'ink';
import { AuthType, ModelSlashCommandEvent, logModelSlashCommand, } from '@ollama-code/ollama-code-core';
import { useKeypress } from '../hooks/useKeypress.js';
import { theme } from '../semantic-colors.js';
import { DescriptiveRadioButtonSelect } from './shared/DescriptiveRadioButtonSelect.js';
import { ConfigContext } from '../contexts/ConfigContext.js';
import { UIStateContext } from '../contexts/UIStateContext.js';
import { useSettings } from '../contexts/SettingsContext.js';
import { MAINLINE_CODER } from '../models/availableModels.js';
import { getPersistScopeForModelSelection } from '../../config/modelProvidersScope.js';
import { t } from '../../i18n/index.js';
function formatSourceBadge(source) {
    if (!source)
        return undefined;
    switch (source.kind) {
        case 'cli':
            return source.detail ? `CLI ${source.detail}` : 'CLI';
        case 'env':
            return source.envKey ? `ENV ${source.envKey}` : 'ENV';
        case 'settings':
            return source.settingsPath
                ? `Settings ${source.settingsPath}`
                : 'Settings';
        case 'modelProviders': {
            const suffix = source.authType && source.modelId
                ? `${source.authType}:${source.modelId}`
                : source.authType
                    ? `${source.authType}`
                    : source.modelId
                        ? `${source.modelId}`
                        : '';
            return suffix ? `ModelProviders ${suffix}` : 'ModelProviders';
        }
        case 'default':
            return source.detail ? `Default ${source.detail}` : 'Default';
        case 'computed':
            return source.detail ? `Computed ${source.detail}` : 'Computed';
        case 'programmatic':
            return source.detail ? `Programmatic ${source.detail}` : 'Programmatic';
        case 'unknown':
        default:
            return undefined;
    }
}
function readSourcesFromConfig(config) {
    if (!config) {
        return {};
    }
    const maybe = config;
    return maybe.getContentGeneratorConfigSources?.() ?? {};
}
function maskApiKey(apiKey) {
    if (!apiKey)
        return '(not set)';
    const trimmed = apiKey.trim();
    if (trimmed.length === 0)
        return '(not set)';
    if (trimmed.length <= 6)
        return '***';
    const head = trimmed.slice(0, 3);
    const tail = trimmed.slice(-4);
    return `${head}…${tail}`;
}
function persistModelSelection(settings, modelId) {
    const scope = getPersistScopeForModelSelection(settings);
    settings.setValue(scope, 'model.name', modelId);
}
function persistAuthTypeSelection(settings, authType) {
    const scope = getPersistScopeForModelSelection(settings);
    settings.setValue(scope, 'security.auth.selectedType', authType);
}
function handleModelSwitchSuccess({ settings, uiState, after, effectiveAuthType, effectiveModelId, isRuntime, }) {
    persistModelSelection(settings, effectiveModelId);
    if (effectiveAuthType) {
        persistAuthTypeSelection(settings, effectiveAuthType);
    }
    const baseUrl = after?.baseUrl ?? t('(default)');
    const maskedKey = maskApiKey(after?.apiKey);
    uiState?.historyManager.addItem({
        type: 'info',
        text: `authType: ${effectiveAuthType ?? '(none)'}` +
            `\n` +
            `Using ${isRuntime ? 'runtime ' : ''}model: ${effectiveModelId}` +
            `\n` +
            `Base URL: ${baseUrl}` +
            `\n` +
            `API key: ${maskedKey}`,
    }, Date.now());
}
function ConfigRow({ label, value, badge, }) {
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { children: [_jsx(Box, { minWidth: 12, flexShrink: 0, children: _jsxs(Text, { color: theme.text.secondary, children: [label, ":"] }) }), _jsx(Box, { flexGrow: 1, flexDirection: "row", flexWrap: "wrap", children: _jsx(Text, { children: value }) })] }), badge ? (_jsxs(Box, { children: [_jsx(Box, { minWidth: 12, flexShrink: 0, children: _jsx(Text, { children: " " }) }), _jsx(Box, { flexGrow: 1, children: _jsx(Text, { color: theme.text.secondary, children: badge }) })] })) : null] }));
}
export function ModelDialog({ onClose }) {
    const config = useContext(ConfigContext);
    const uiState = useContext(UIStateContext);
    const settings = useSettings();
    // Local error state for displaying errors within the dialog
    const [errorMessage, setErrorMessage] = useState(null);
    const authType = config?.getAuthType();
    const effectiveConfig = config?.getContentGeneratorConfig?.() ?? undefined;
    const sources = readSourcesFromConfig(config);
    const availableModelEntries = useMemo(() => {
        const allModels = config ? config.getAllConfiguredModels() : [];
        // Separate runtime models from registry models
        const runtimeModels = allModels.filter((m) => m.isRuntimeModel);
        const registryModels = allModels.filter((m) => !m.isRuntimeModel);
        // Group registry models by authType
        const modelsByAuthTypeMap = new Map();
        for (const model of registryModels) {
            const authType = model.authType;
            if (!modelsByAuthTypeMap.has(authType)) {
                modelsByAuthTypeMap.set(authType, []);
            }
            modelsByAuthTypeMap.get(authType).push(model);
        }
        // Fixed order: Ollama only
        const authTypeOrder = [AuthType.USE_OLLAMA];
        // Filter to only include authTypes that have registry models and maintain order
        const availableAuthTypes = new Set(modelsByAuthTypeMap.keys());
        const orderedAuthTypes = authTypeOrder.filter((t) => availableAuthTypes.has(t));
        // Build ordered list: runtime models first, then registry models grouped by authType
        const result = [];
        // Add all runtime models first
        for (const runtimeModel of runtimeModels) {
            result.push({
                authType: runtimeModel.authType,
                model: runtimeModel,
                isRuntime: true,
                snapshotId: runtimeModel.runtimeSnapshotId,
            });
        }
        // Add registry models grouped by authType
        for (const t of orderedAuthTypes) {
            for (const model of modelsByAuthTypeMap.get(t) ?? []) {
                result.push({ authType: t, model, isRuntime: false });
            }
        }
        return result;
    }, [config]);
    const MODEL_OPTIONS = useMemo(() => availableModelEntries.map(({ authType: t2, model, isRuntime, snapshotId }) => {
        // Runtime models use snapshotId directly (format: $runtime|${authType}|${modelId})
        const value = isRuntime && snapshotId ? snapshotId : `${t2}::${model.id}`;
        const title = (_jsxs(Text, { children: [_jsxs(Text, { bold: true, color: isRuntime ? theme.status.warning : theme.text.accent, children: ["[", t2, "]"] }), _jsx(Text, { children: ` ${model.label}` }), isRuntime && (_jsx(Text, { color: theme.status.warning, children: " (Runtime)" }))] }));
        // Include runtime indicator in description
        let description = model.description || '';
        if (isRuntime) {
            description = description
                ? `${description} (Runtime)`
                : 'Runtime model';
        }
        return {
            value,
            title,
            description,
            key: value,
        };
    }), [availableModelEntries]);
    const preferredModelId = config?.getModel() || MAINLINE_CODER;
    // Check if current model is a runtime model
    // Runtime snapshot ID is already in $runtime|${authType}|${modelId} format
    const activeRuntimeSnapshot = config?.getActiveRuntimeModelSnapshot?.();
    const preferredKey = activeRuntimeSnapshot
        ? activeRuntimeSnapshot.id
        : authType
            ? `${authType}::${preferredModelId}`
            : '';
    useKeypress((key) => {
        if (key.name === 'escape') {
            onClose();
        }
    }, { isActive: true });
    const initialIndex = useMemo(() => {
        const index = MODEL_OPTIONS.findIndex((option) => option.value === preferredKey);
        return index === -1 ? 0 : index;
    }, [MODEL_OPTIONS, preferredKey]);
    const handleSelect = useCallback(async (selected) => {
        setErrorMessage(null);
        let after;
        let effectiveAuthType;
        let effectiveModelId = selected;
        let isRuntime = false;
        if (!config) {
            onClose();
            return;
        }
        try {
            // Determine if this is a runtime model selection
            // Runtime model format: $runtime|${authType}|${modelId}
            isRuntime = selected.startsWith('$runtime|');
            let selectedAuthType;
            let modelId;
            if (isRuntime) {
                // For runtime models, extract authType from the snapshot ID
                // Format: $runtime|${authType}|${modelId}
                const parts = selected.split('|');
                if (parts.length >= 2 && parts[0] === '$runtime') {
                    selectedAuthType = parts[1];
                }
                else {
                    selectedAuthType = authType;
                }
                modelId = selected; // Pass the full snapshot ID to switchModel
            }
            else {
                const sep = '::';
                const idx = selected.indexOf(sep);
                selectedAuthType = (idx >= 0 ? selected.slice(0, idx) : authType);
                modelId = idx >= 0 ? selected.slice(idx + sep.length) : selected;
            }
            await config.switchModel(selectedAuthType, modelId);
            if (!isRuntime) {
                const event = new ModelSlashCommandEvent(modelId);
                logModelSlashCommand(config, event);
            }
            after = config.getContentGeneratorConfig?.();
            effectiveAuthType = after?.authType ?? selectedAuthType ?? authType;
            effectiveModelId = after?.model ?? modelId;
        }
        catch (e) {
            const baseErrorMessage = e instanceof Error ? e.message : String(e);
            const errorPrefix = isRuntime
                ? 'Failed to switch to runtime model.'
                : `Failed to switch model to '${effectiveModelId ?? selected}'.`;
            setErrorMessage(`${errorPrefix}\n\n${baseErrorMessage}`);
            return;
        }
        handleModelSwitchSuccess({
            settings,
            uiState,
            after,
            effectiveAuthType,
            effectiveModelId,
            isRuntime,
        });
        onClose();
    }, [authType, config, onClose, settings, uiState, setErrorMessage]);
    const hasModels = MODEL_OPTIONS.length > 0;
    return (_jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, flexDirection: "column", padding: 1, width: "100%", children: [_jsx(Text, { bold: true, children: t('Select Model') }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { color: theme.text.secondary, children: t('Current (effective) configuration') }), _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(ConfigRow, { label: "AuthType", value: authType }), _jsx(ConfigRow, { label: "Model", value: effectiveConfig?.model ?? config?.getModel?.() ?? '', badge: formatSourceBadge(sources['model']) }), authType === AuthType.USE_OLLAMA && (_jsxs(_Fragment, { children: [_jsx(ConfigRow, { label: "Base URL", value: effectiveConfig?.baseUrl ??
                                            t('(default: http://localhost:11434)'), badge: formatSourceBadge(sources['baseUrl']) }), _jsx(ConfigRow, { label: "API Key", value: effectiveConfig?.apiKey ? t('(set)') : t('(optional)'), badge: formatSourceBadge(sources['apiKey']) })] }))] })] }), !hasModels ? (_jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { color: theme.status.warning, children: t('No models available for the current authentication type ({{authType}}).', {
                            authType: authType ? String(authType) : t('(none)'),
                        }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Please configure models in settings.modelProviders or use environment variables.') }) })] })) : (_jsx(Box, { marginTop: 1, children: _jsx(DescriptiveRadioButtonSelect, { items: MODEL_OPTIONS, onSelect: handleSelect, initialIndex: initialIndex, showNumbers: true }) })), errorMessage && (_jsx(Box, { marginTop: 1, flexDirection: "column", paddingX: 1, children: _jsxs(Text, { color: theme.status.error, wrap: "wrap", children: ["\u2715 ", errorMessage] }) })), _jsx(Box, { marginTop: 1, flexDirection: "column", children: _jsx(Text, { color: theme.text.secondary, children: t('(Press Esc to close)') }) })] }));
}
//# sourceMappingURL=ModelDialog.js.map