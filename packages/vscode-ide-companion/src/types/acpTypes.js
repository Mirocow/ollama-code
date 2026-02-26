export const JSONRPC_VERSION = '2.0';
export const authMethod = 'qwen-oauth';
export { ApprovalMode, APPROVAL_MODE_MAP, APPROVAL_MODE_INFO, getApprovalModeInfoFromString, } from './approvalModeTypes.js';
// Cyclic next-mode mapping used by UI toggles and other consumers
export const NEXT_APPROVAL_MODE = {
    // Hide "plan" from the public toggle sequence for now
    // Cycle: default -> auto-edit -> yolo -> default
    default: 'auto-edit',
    'auto-edit': 'yolo',
    plan: 'yolo',
    yolo: 'default',
};
//# sourceMappingURL=acpTypes.js.map