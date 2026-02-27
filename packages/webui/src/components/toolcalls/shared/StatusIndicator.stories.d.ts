/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { StatusIndicator } from './LayoutComponents.js';
/**
 * StatusIndicator displays a colored dot with status text.
 */
declare const meta: Meta<typeof StatusIndicator>;
export default meta;
type Story = StoryObj<typeof meta>;
export declare const Pending: Story;
export declare const InProgress: Story;
export declare const Completed: Story;
export declare const Failed: Story;
