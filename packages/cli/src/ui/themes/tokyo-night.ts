/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { type ColorsTheme, Theme } from './theme.js';

// Tokyo Night Theme - A dark theme inspired by Tokyo Night
const tokyoNightColors: ColorsTheme = {
  type: 'dark',
  Background: '#1a1b26',
  Foreground: '#c0caf5',
  LightBlue: '#7aa2f7',
  AccentBlue: '#7aa2f7',
  AccentPurple: '#bb9af7',
  AccentCyan: '#7dcfff',
  AccentGreen: '#9ece6a',
  AccentYellow: '#e0af68',
  AccentRed: '#f7768e',
  AccentYellowDim: '#725938',
  AccentRedDim: '#6e3a4a',
  DiffAdded: '#1e3a2f',
  DiffRemoved: '#3a1e2a',
  Comment: '#565f89',
  Gray: '#565f89',
  GradientColors: ['#bb9af7', '#7aa2f7'],
};

export const TokyoNight: Theme = new Theme(
  'Tokyo Night',
  'dark',
  {
    hljs: {
      display: 'block',
      overflowX: 'auto',
      padding: '0.5em',
      background: tokyoNightColors.Background,
      color: tokyoNightColors.Foreground,
    },
    'hljs-keyword': {
      color: tokyoNightColors.AccentPurple,
      fontWeight: 'bold',
    },
    'hljs-selector-tag': {
      color: tokyoNightColors.AccentPurple,
      fontWeight: 'bold',
    },
    'hljs-literal': {
      color: tokyoNightColors.AccentYellow,
    },
    'hljs-section': {
      color: tokyoNightColors.AccentBlue,
      fontWeight: 'bold',
    },
    'hljs-link': {
      color: tokyoNightColors.AccentCyan,
    },
    'hljs-function .hljs-keyword': {
      color: tokyoNightColors.AccentBlue,
    },
    'hljs-subst': {
      color: tokyoNightColors.Foreground,
    },
    'hljs-string': {
      color: tokyoNightColors.AccentGreen,
    },
    'hljs-title': {
      color: tokyoNightColors.AccentBlue,
      fontWeight: 'bold',
    },
    'hljs-name': {
      color: tokyoNightColors.AccentBlue,
    },
    'hljs-type': {
      color: tokyoNightColors.AccentYellow,
    },
    'hljs-attribute': {
      color: tokyoNightColors.AccentCyan,
    },
    'hljs-symbol': {
      color: tokyoNightColors.AccentYellow,
    },
    'hljs-bullet': {
      color: tokyoNightColors.AccentCyan,
    },
    'hljs-addition': {
      color: tokyoNightColors.AccentGreen,
    },
    'hljs-variable': {
      color: tokyoNightColors.AccentCyan,
    },
    'hljs-template-tag': {
      color: tokyoNightColors.AccentGreen,
    },
    'hljs-template-variable': {
      color: tokyoNightColors.AccentGreen,
    },
    'hljs-comment': {
      color: tokyoNightColors.Comment,
      fontStyle: 'italic',
    },
    'hljs-quote': {
      color: tokyoNightColors.Comment,
      fontStyle: 'italic',
    },
    'hljs-deletion': {
      color: tokyoNightColors.AccentRed,
    },
    'hljs-meta': {
      color: tokyoNightColors.AccentCyan,
    },
    'hljs-doctag': {
      color: tokyoNightColors.AccentRed,
    },
    'hljs-strong': {
      fontWeight: 'bold',
    },
    'hljs-emphasis': {
      fontStyle: 'italic',
    },
    'hljs-number': {
      color: tokyoNightColors.AccentYellow,
    },
    'hljs-built_in': {
      color: tokyoNightColors.AccentCyan,
    },
    'hljs-params': {
      color: tokyoNightColors.AccentYellow,
    },
  },
  tokyoNightColors,
);
