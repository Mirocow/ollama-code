/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import { CodingPlanRegion } from '../../constants/codingPlan.js';
interface ApiKeyInputProps {
    onSubmit: (apiKey: string) => void;
    onCancel: () => void;
    region?: CodingPlanRegion;
}
export declare function ApiKeyInput({ onSubmit, onCancel, region, }: ApiKeyInputProps): React.JSX.Element;
export {};
