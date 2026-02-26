import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box } from 'ink';
import { Header } from './Header.js';
import { Tips } from './Tips.js';
import { useSettings } from '../contexts/SettingsContext.js';
import { useConfig } from '../contexts/ConfigContext.js';
import { useUIState } from '../contexts/UIStateContext.js';
export const AppHeader = ({ version }) => {
    const settings = useSettings();
    const config = useConfig();
    const uiState = useUIState();
    const contentGeneratorConfig = config.getContentGeneratorConfig();
    const authType = contentGeneratorConfig?.authType;
    const model = uiState.currentModel;
    const targetDir = config.getTargetDir();
    const showBanner = !config.getScreenReader();
    const showTips = !(settings.merged.ui?.hideTips || config.getScreenReader());
    return (_jsxs(Box, { flexDirection: "column", children: [showBanner && (_jsx(Header, { version: version, authType: authType, model: model, workingDirectory: targetDir })), showTips && _jsx(Tips, {})] }));
};
//# sourceMappingURL=AppHeader.js.map