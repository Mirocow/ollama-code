/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * VSCode-specific Onboarding adapter
 * Uses webui Onboarding component with platform-specific icon URL
 */
import type { FC } from 'react';
interface OnboardingPageProps {
    onLogin: () => void;
}
/**
 * VSCode Onboarding wrapper
 * Provides platform-specific icon URL to the webui Onboarding component
 */
export declare const Onboarding: FC<OnboardingPageProps>;
export {};
