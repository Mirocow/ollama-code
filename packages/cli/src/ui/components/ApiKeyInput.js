import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Text } from 'ink';
import { TextInput } from './shared/TextInput.js';
import { theme } from '../semantic-colors.js';
import { useKeypress } from '../hooks/useKeypress.js';
import { t } from '../../i18n/index.js';
import { CodingPlanRegion } from '../../constants/codingPlan.js';
import Link from 'ink-link';
const CODING_PLAN_API_KEY_URL = 'https://bailian.console.aliyun.com/?tab=model#/efm/coding_plan';
const CODING_PLAN_INTL_API_KEY_URL = 'https://modelstudio.console.alibabacloud.com/?tab=dashboard#/efm/coding_plan';
export function ApiKeyInput({ onSubmit, onCancel, region = CodingPlanRegion.CHINA, }) {
    const [apiKey, setApiKey] = useState('');
    const [error, setError] = useState(null);
    const apiKeyUrl = region === CodingPlanRegion.GLOBAL
        ? CODING_PLAN_INTL_API_KEY_URL
        : CODING_PLAN_API_KEY_URL;
    useKeypress((key) => {
        if (key.name === 'escape') {
            onCancel();
        }
        else if (key.name === 'return') {
            const trimmedKey = apiKey.trim();
            if (!trimmedKey) {
                setError(t('API key cannot be empty.'));
                return;
            }
            onSubmit(trimmedKey);
        }
    }, { isActive: true });
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { children: t('Please enter your API key:') }) }), _jsx(TextInput, { value: apiKey, onChange: setApiKey, placeholder: "sk-sp-..." }), error && (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.status.error, children: error }) })), _jsx(Box, { marginTop: 1, children: _jsx(Text, { children: t('You can get your exclusive Coding Plan API-KEY here:') }) }), _jsx(Box, { marginTop: 0, children: _jsx(Link, { url: apiKeyUrl, fallback: false, children: _jsx(Text, { color: theme.status.success, underline: true, children: apiKeyUrl }) }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('(Press Enter to submit, Escape to cancel)') }) })] }));
}
//# sourceMappingURL=ApiKeyInput.js.map