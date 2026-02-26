import { jsx as _jsx } from "react/jsx-runtime";
import { Onboarding as BaseOnboarding } from '@ollama-code/webui';
import { generateIconUrl } from '../../utils/resourceUrl.js';
/**
 * VSCode Onboarding wrapper
 * Provides platform-specific icon URL to the webui Onboarding component
 */
export const Onboarding = ({ onLogin }) => {
    const iconUri = generateIconUrl('icon.png');
    return _jsx(BaseOnboarding, { iconUrl: iconUri, onGetStarted: onLogin });
};
//# sourceMappingURL=Onboarding.js.map