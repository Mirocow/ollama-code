/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { type ColorsTheme, Theme } from './theme.js';

// Catppuccin Mocha Theme - A soothing pastel dark theme
const catppuccinColors: ColorsTheme = {
  type: 'dark',
  Background: '#1e1e2e',
  Foreground: '#cdd6f4',
  LightBlue: '#89dceb',
  AccentBlue: '#89b4fa',
  AccentPurple: '#cba6f7',
  AccentCyan: '#94e2d5',
  AccentGreen: '#a6e3a1',
  AccentYellow: '#f9e2af',
  AccentRed: '#f38ba8',
  AccentYellowDim: '#8b7f55',
  AccentRedDim: '#7d4a5a',
  DiffAdded: '#2f4a3f',
  DiffRemoved: '#4a2f3f',
  Comment: '#6c7086',
  Gray: '#6c7086',
  GradientColors: ['#cba6f7', '#89b4fa'],
};

export const Catppuccin: Theme = new Theme(
  'Catppuccin',
  'dark',
  {
    hljs: {
      display: 'block',
      overflowX: 'auto',
      padding: '0.5em',
      background: catppuccinColors.Background,
      color: catppuccinColors.Foreground,
    },
    'hljs-keyword': {
      color: catppuccinColors.AccentPurple,
      fontWeight: 'bold',
    },
    'hljs-selector-tag': {
      color: catppuccinColors.AccentRed,
    },
    'hljs-literal': {
      color: catppuccinColors.AccentBlue,
    },
    'hljs-section': {
      color: catppuccinColors.AccentBlue,
      fontWeight: 'bold',
    },
    'hljs-link': {
      color: catppuccinColors.AccentCyan,
    },
    'hljs-function .hljs-keyword': {
      color: catppuccinColors.AccentBlue,
    },
    'hljs-subst': {
      color: catppuccinColors.Foreground,
    },
    'hljs-string': {
      color: catppuccinColors.AccentGreen,
    },
    'hljs-title': {
      color: catppuccinColors.AccentBlue,
      fontWeight: 'bold',
    },
    'hljs-name': {
      color: catppuccinColors.AccentBlue,
    },
    'hljs-type': {
      color: catppuccinColors.AccentYellow,
    },
    'hljs-attribute': {
      color: catppuccinColors.AccentYellow,
    },
    'hljs-symbol': {
      color: catppuccinColors.AccentRed,
    },
    'hljs-bullet': {
      color: catppuccinColors.AccentCyan,
    },
    'hljs-addition': {
      color: catppuccinColors.AccentGreen,
    },
    'hljs-variable': {
      color: catppuccinColors.AccentCyan,
    },
    'hljs-template-tag': {
      color: catppuccinColors.AccentGreen,
    },
    'hljs-template-variable': {
      color: catppuccinColors.AccentGreen,
    },
    'hljs-comment': {
      color: catppuccinColors.Comment,
      fontStyle: 'italic',
    },
    'hljs-quote': {
      color: catppuccinColors.Comment,
      fontStyle: 'italic',
    },
    'hljs-deletion': {
      color: catppuccinColors.AccentRed,
    },
    'hljs-meta': {
      color: catppuccinColors.AccentBlue,
    },
    'hljs-doctag': {
      color: catppuccinColors.AccentRed,
    },
    'hljs-strong': {
      fontWeight: 'bold',
    },
    'hljs-emphasis': {
      fontStyle: 'italic',
    },
    'hljs-number': {
      color: catppuccinColors.AccentYellow,
    },
    'hljs-built_in': {
      color: catppuccinColors.AccentCyan,
    },
    'hljs-params': {
      color: catppuccinColors.AccentYellow,
    },
    'hljs-selector-class': {
      color: catppuccinColors.AccentYellow,
    },
    'hljs-selector-id': {
      color: catppuccinColors.AccentBlue,
    },
    'hljs-regexp': {
      color: catppuccinColors.AccentRed,
    },
  },
  catppuccinColors,
);
