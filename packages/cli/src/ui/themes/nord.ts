/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { type ColorsTheme, Theme } from './theme.js';

// Nord Theme - An arctic, north-bluish color palette
const nordColors: ColorsTheme = {
  type: 'dark',
  Background: '#2e3440',
  Foreground: '#d8dee9',
  LightBlue: '#88c0d0',
  AccentBlue: '#88c0d0',
  AccentPurple: '#b48ead',
  AccentCyan: '#8fbcbb',
  AccentGreen: '#a3be8c',
  AccentYellow: '#ebcb8b',
  AccentRed: '#bf616a',
  AccentYellowDim: '#8b7355',
  AccentRedDim: '#7d4a50',
  DiffAdded: '#3b4f3f',
  DiffRemoved: '#4a3b43',
  Comment: '#4c566a',
  Gray: '#4c566a',
  GradientColors: ['#88c0d0', '#81a1c1'],
};

export const Nord: Theme = new Theme(
  'Nord',
  'dark',
  {
    hljs: {
      display: 'block',
      overflowX: 'auto',
      padding: '0.5em',
      background: nordColors.Background,
      color: nordColors.Foreground,
    },
    'hljs-keyword': {
      color: nordColors.AccentPurple,
      fontWeight: 'bold',
    },
    'hljs-selector-tag': {
      color: nordColors.AccentPurple,
    },
    'hljs-literal': {
      color: nordColors.AccentBlue,
    },
    'hljs-section': {
      color: nordColors.AccentBlue,
      fontWeight: 'bold',
    },
    'hljs-link': {
      color: nordColors.AccentCyan,
    },
    'hljs-function .hljs-keyword': {
      color: nordColors.AccentBlue,
    },
    'hljs-subst': {
      color: nordColors.Foreground,
    },
    'hljs-string': {
      color: nordColors.AccentGreen,
    },
    'hljs-title': {
      color: nordColors.AccentBlue,
      fontWeight: 'bold',
    },
    'hljs-name': {
      color: nordColors.AccentBlue,
    },
    'hljs-type': {
      color: nordColors.AccentYellow,
    },
    'hljs-attribute': {
      color: nordColors.AccentYellow,
    },
    'hljs-symbol': {
      color: nordColors.AccentBlue,
    },
    'hljs-bullet': {
      color: nordColors.AccentCyan,
    },
    'hljs-addition': {
      color: nordColors.AccentGreen,
    },
    'hljs-variable': {
      color: nordColors.AccentCyan,
    },
    'hljs-template-tag': {
      color: nordColors.AccentGreen,
    },
    'hljs-template-variable': {
      color: nordColors.AccentGreen,
    },
    'hljs-comment': {
      color: nordColors.Comment,
      fontStyle: 'italic',
    },
    'hljs-quote': {
      color: nordColors.Comment,
      fontStyle: 'italic',
    },
    'hljs-deletion': {
      color: nordColors.AccentRed,
    },
    'hljs-meta': {
      color: nordColors.AccentBlue,
    },
    'hljs-doctag': {
      color: nordColors.AccentRed,
    },
    'hljs-strong': {
      fontWeight: 'bold',
    },
    'hljs-emphasis': {
      fontStyle: 'italic',
    },
    'hljs-number': {
      color: nordColors.AccentBlue,
    },
    'hljs-built_in': {
      color: nordColors.AccentCyan,
    },
    'hljs-params': {
      color: nordColors.AccentYellow,
    },
    'hljs-selector-class': {
      color: nordColors.AccentYellow,
    },
    'hljs-selector-id': {
      color: nordColors.AccentBlue,
    },
  },
  nordColors,
);
