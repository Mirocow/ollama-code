import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { useKeypress } from '../hooks/useKeypress.js';
import { t } from '../../i18n/index.js';
export function OllamaConfigInput({ onSubmit, onCancel, defaultBaseUrl = 'http://localhost:11434', defaultModel, }) {
    const [baseUrl, setBaseUrl] = useState(defaultBaseUrl);
    const [model, setModel] = useState(defaultModel || '');
    const [apiKey, setApiKey] = useState('');
    const [currentField, setCurrentField] = useState('baseUrl');
    const [currentValue, setCurrentValue] = useState(baseUrl);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const fields = ['baseUrl', 'model', 'apiKey'];
    const fieldValues = {
        baseUrl,
        model,
        apiKey,
    };
    const fieldSetters = {
        baseUrl: setBaseUrl,
        model: setModel,
        apiKey: setApiKey,
    };
    useKeypress((key) => {
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
            }
            else {
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
        }
        else if (key.name === 'delete') {
            setCurrentValue('');
        }
        else if (key.sequence && key.sequence.length === 1) {
            setCurrentValue(currentValue + key.sequence);
        }
    }, { isActive: !isSubmitting });
    const handleSubmit = async () => {
        if (isSubmitting)
            return;
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
        }
        catch (err) {
            setError(t('Failed to configure: {{message}}', { message: String(err) }));
            setIsSubmitting(false);
        }
    };
    const renderField = (field, label, value, isCurrent, placeholder, helpText) => (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsxs(Box, { children: [_jsxs(Text, { bold: isCurrent, color: isCurrent ? theme.text.accent : theme.text.secondary, children: [isCurrent ? '❯ ' : '  ', label, ': '] }), _jsx(Text, { color: theme.text.primary, children: isCurrent ? `${value}|` : (value || placeholder) })] }), helpText && isCurrent && (_jsx(Box, { paddingLeft: 2, children: _jsx(Text, { color: theme.text.secondary, dimColor: true, children: helpText }) }))] }));
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { bold: true, children: t('Configure Ollama Connection') }) }), renderField('baseUrl', t('Base URL'), currentField === 'baseUrl' ? currentValue : baseUrl, currentField === 'baseUrl', 'http://localhost:11434', t('Ollama server URL (default: http://localhost:11434)')), renderField('model', t('Model'), currentField === 'model' ? currentValue : model, currentField === 'model', 'llama3.2', t('Model to use (e.g., llama3.2, qwen2.5-coder)')), renderField('apiKey', t('API Key'), currentField === 'apiKey' ? currentValue : apiKey, currentField === 'apiKey', t('(optional)'), t('Only needed for remote Ollama instances')), error && (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.status.error, children: error }) })), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, dimColor: true, children: t('Use Tab/↑↓ to navigate, Enter to submit, Esc to cancel') }) }), isSubmitting && (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.accent, children: t('Connecting...') }) }))] }));
}
//# sourceMappingURL=OllamaConfigInput.js.map