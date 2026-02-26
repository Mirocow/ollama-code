import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import { IdeIntegrationNudge } from '../IdeIntegrationNudge.js';
import { CommandFormatMigrationNudge } from '../CommandFormatMigrationNudge.js';
import { LoopDetectionConfirmation } from './LoopDetectionConfirmation.js';
import { FolderTrustDialog } from './FolderTrustDialog.js';
import { ShellConfirmationDialog } from './ShellConfirmationDialog.js';
import { ConsentPrompt } from './ConsentPrompt.js';
import { SettingInputPrompt } from './SettingInputPrompt.js';
import { PluginChoicePrompt } from './PluginChoicePrompt.js';
import { ThemeDialog } from './ThemeDialog.js';
import { SettingsDialog } from './SettingsDialog.js';
import { AuthDialog } from '../auth/AuthDialog.js';
import { EditorSettingsDialog } from './EditorSettingsDialog.js';
import { PermissionsModifyTrustDialog } from './PermissionsModifyTrustDialog.js';
import { ModelDialog } from './ModelDialog.js';
import { ApprovalModeDialog } from './ApprovalModeDialog.js';
import { theme } from '../semantic-colors.js';
import { useUIState } from '../contexts/UIStateContext.js';
import { useUIActions } from '../contexts/UIActionsContext.js';
import { useConfig } from '../contexts/ConfigContext.js';
import { useSettings } from '../contexts/SettingsContext.js';
import process from 'node:process';
import {} from '../hooks/useHistoryManager.js';
import { IdeTrustChangeDialog } from './IdeTrustChangeDialog.js';
import { WelcomeBackDialog } from './WelcomeBackDialog.js';
import { ModelSwitchDialog } from './ModelSwitchDialog.js';
import { AgentCreationWizard } from './subagents/create/AgentCreationWizard.js';
import { AgentsManagerDialog } from './subagents/manage/AgentsManagerDialog.js';
import { SessionPicker } from './SessionPicker.js';
import { t } from '../../i18n/index.js';
// Props for DialogManager
export const DialogManager = ({ addItem, terminalWidth, }) => {
    const config = useConfig();
    const settings = useSettings();
    const uiState = useUIState();
    const uiActions = useUIActions();
    const { constrainHeight, terminalHeight, staticExtraHeight, mainAreaWidth } = uiState;
    if (uiState.showWelcomeBackDialog && uiState.welcomeBackInfo?.hasHistory) {
        return (_jsx(WelcomeBackDialog, { welcomeBackInfo: uiState.welcomeBackInfo, onSelect: uiActions.handleWelcomeBackSelection, onClose: uiActions.handleWelcomeBackClose }));
    }
    if (uiState.showIdeRestartPrompt) {
        return _jsx(IdeTrustChangeDialog, { reason: uiState.ideTrustRestartReason });
    }
    if (uiState.shouldShowIdePrompt) {
        return (_jsx(IdeIntegrationNudge, { ide: uiState.currentIDE, onComplete: uiActions.handleIdePromptComplete }));
    }
    if (uiState.shouldShowCommandMigrationNudge) {
        return (_jsx(CommandFormatMigrationNudge, { tomlFiles: uiState.commandMigrationTomlFiles, onComplete: uiActions.handleCommandMigrationComplete }));
    }
    if (uiState.isFolderTrustDialogOpen) {
        return (_jsx(FolderTrustDialog, { onSelect: uiActions.handleFolderTrustSelect, isRestarting: uiState.isRestarting }));
    }
    if (uiState.shellConfirmationRequest) {
        return (_jsx(ShellConfirmationDialog, { request: uiState.shellConfirmationRequest }));
    }
    if (uiState.loopDetectionConfirmationRequest) {
        return (_jsx(LoopDetectionConfirmation, { onComplete: uiState.loopDetectionConfirmationRequest.onComplete }));
    }
    if (uiState.confirmationRequest) {
        return (_jsx(ConsentPrompt, { prompt: uiState.confirmationRequest.prompt, onConfirm: uiState.confirmationRequest.onConfirm, terminalWidth: terminalWidth }));
    }
    if (uiState.confirmUpdateExtensionRequests.length > 0) {
        const request = uiState.confirmUpdateExtensionRequests[0];
        return (_jsx(ConsentPrompt, { prompt: request.prompt, onConfirm: request.onConfirm, terminalWidth: terminalWidth }));
    }
    if (uiState.settingInputRequests.length > 0) {
        const request = uiState.settingInputRequests[0];
        // Use settingName as key to force re-mount when switching between different settings
        return (_jsx(SettingInputPrompt, { settingName: request.settingName, settingDescription: request.settingDescription, sensitive: request.sensitive, onSubmit: request.onSubmit, onCancel: request.onCancel, terminalWidth: terminalWidth }, request.settingName));
    }
    if (uiState.pluginChoiceRequests.length > 0) {
        const request = uiState.pluginChoiceRequests[0];
        return (_jsx(PluginChoicePrompt, { marketplaceName: request.marketplaceName, plugins: request.plugins, onSelect: request.onSelect, onCancel: request.onCancel, terminalWidth: terminalWidth }, request.marketplaceName));
    }
    if (uiState.isThemeDialogOpen) {
        return (_jsxs(Box, { flexDirection: "column", children: [uiState.themeError && (_jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: theme.status.error, children: uiState.themeError }) })), _jsx(ThemeDialog, { onSelect: uiActions.handleThemeSelect, onHighlight: uiActions.handleThemeHighlight, settings: settings, availableTerminalHeight: constrainHeight ? terminalHeight - staticExtraHeight : undefined, terminalWidth: mainAreaWidth })] }));
    }
    if (uiState.isEditorDialogOpen) {
        return (_jsxs(Box, { flexDirection: "column", children: [uiState.editorError && (_jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: theme.status.error, children: uiState.editorError }) })), _jsx(EditorSettingsDialog, { onSelect: uiActions.handleEditorSelect, settings: settings, onExit: uiActions.exitEditorDialog })] }));
    }
    if (uiState.isSettingsDialogOpen) {
        return (_jsx(Box, { flexDirection: "column", children: _jsx(SettingsDialog, { settings: settings, onSelect: (settingName) => {
                    if (settingName === 'ui.theme') {
                        uiActions.openThemeDialog();
                        return;
                    }
                    if (settingName === 'general.preferredEditor') {
                        uiActions.openEditorDialog();
                        return;
                    }
                    uiActions.closeSettingsDialog();
                }, onRestartRequest: () => process.exit(0), availableTerminalHeight: terminalHeight - staticExtraHeight, config: config }) }));
    }
    if (uiState.isApprovalModeDialogOpen) {
        const currentMode = config.getApprovalMode();
        return (_jsx(Box, { flexDirection: "column", children: _jsx(ApprovalModeDialog, { settings: settings, currentMode: currentMode, onSelect: uiActions.handleApprovalModeSelect, availableTerminalHeight: constrainHeight ? terminalHeight - staticExtraHeight : undefined }) }));
    }
    if (uiState.isModelDialogOpen) {
        return _jsx(ModelDialog, { onClose: uiActions.closeModelDialog });
    }
    if (uiState.isVisionSwitchDialogOpen) {
        return _jsx(ModelSwitchDialog, { onSelect: uiActions.handleVisionSwitchSelect });
    }
    if (uiState.isAuthDialogOpen || uiState.authError) {
        return (_jsx(Box, { flexDirection: "column", children: _jsx(AuthDialog, {}) }));
    }
    if (uiState.isAuthenticating) {
        // Show authenticating message for Ollama
        return (_jsx(Box, { flexDirection: "column", padding: 1, children: _jsx(Text, { color: theme.text.accent, children: t('Connecting to Ollama...') }) }));
    }
    if (uiState.isPermissionsDialogOpen) {
        return (_jsx(PermissionsModifyTrustDialog, { onExit: uiActions.closePermissionsDialog, addItem: addItem }));
    }
    if (uiState.isSubagentCreateDialogOpen) {
        return (_jsx(AgentCreationWizard, { onClose: uiActions.closeSubagentCreateDialog, config: config }));
    }
    if (uiState.isAgentsManagerDialogOpen) {
        return (_jsx(AgentsManagerDialog, { onClose: uiActions.closeAgentsManagerDialog, config: config }));
    }
    if (uiState.isResumeDialogOpen) {
        return (_jsx(SessionPicker, { sessionService: config.getSessionService(), currentBranch: uiState.branchName, onSelect: uiActions.handleResume, onCancel: uiActions.closeResumeDialog }));
    }
    return null;
};
//# sourceMappingURL=DialogManager.js.map