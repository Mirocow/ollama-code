/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Typewriter Effect Component
 * Displays text with a typewriter-style animation effect
 */

import type React from 'react';
import { Box, Text } from 'ink';
import { useState, useEffect, useMemo } from 'react';
import { theme } from '../semantic-colors.js';
import { t } from '../../i18n/index.js';

export interface TypewriterEffectProps {
  /** Text to display */
  text: string;
  /** Characters per second */
  speed?: number;
  /** Whether animation is active */
  active?: boolean;
  /** Show cursor */
  showCursor?: boolean;
  /** Cursor character */
  cursorChar?: string;
  /** Callback when complete */
  onComplete?: () => void;
  /** Custom color */
  color?: string;
  /** Enable markdown-like formatting */
  enableFormatting?: boolean;
}

/**
 * Typewriter Effect Component
 *
 * Displays text character by character with configurable speed.
 * Supports cursor display and completion callback.
 *
 * @example
 * ```tsx
 * <TypewriterEffect
 *   text="Hello, world!"
 *   speed={50}
 *   showCursor
 *   active={isStreaming}
 * />
 * ```
 */
export const TypewriterEffect: React.FC<TypewriterEffectProps> = ({
  text,
  speed = 50,
  active = true,
  showCursor = true,
  cursorChar = '▌',
  onComplete,
  color = theme.text.primary,
  enableFormatting = false,
}) => {
  const [displayedLength, setDisplayedLength] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Reset when text changes
  useEffect(() => {
    setDisplayedLength(0);
    setIsComplete(false);
  }, [text]);

  // Animation effect
  useEffect(() => {
    if (!active || displayedLength >= text.length) {
      if (displayedLength >= text.length && !isComplete) {
        setIsComplete(true);
        onComplete?.();
      }
      return;
    }

    const interval = Math.round(1000 / speed);
    const timer = setInterval(() => {
      setDisplayedLength((prev) => {
        const next = prev + 1;
        if (next >= text.length) {
          clearInterval(timer);
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [active, displayedLength, text.length, speed, onComplete, isComplete]);

  const displayedText = text.substring(0, displayedLength);

  if (enableFormatting) {
    return (
      <Box>
        <FormattedText text={displayedText} color={color} />
        {showCursor && !isComplete && (
          <Text color={theme.text.accent}>{cursorChar}</Text>
        )}
      </Box>
    );
  }

  return (
    <Box>
      <Text color={color}>{displayedText}</Text>
      {showCursor && !isComplete && (
        <Text color={theme.text.accent}>{cursorChar}</Text>
      )}
    </Box>
  );
};

/**
 * Streaming Text Display
 * Shows text as it streams in, with cursor at the end
 */
export interface StreamingTextProps {
  /** Current text content */
  content: string;
  /** Whether streaming is active */
  isStreaming: boolean;
  /** Show cursor during streaming */
  showCursor?: boolean;
  /** Cursor style */
  cursorStyle?: 'block' | 'line' | 'underline';
  /** Enable word wrapping */
  wrap?: boolean;
  /** Max width */
  maxWidth?: number;
}

const CURSOR_CHARS = {
  block: '█',
  line: '▌',
  underline: '_',
};

export const StreamingText: React.FC<StreamingTextProps> = ({
  content,
  isStreaming,
  showCursor = true,
  cursorStyle = 'line',
  wrap = true,
  maxWidth,
}) => {
  const cursorChar = CURSOR_CHARS[cursorStyle];

  return (
    <Box flexDirection="column" width={maxWidth}>
      <Text color={theme.text.primary} wrap={wrap ? 'wrap' : 'truncate'}>
        {content}
      </Text>
      {isStreaming && showCursor && (
        <Text color={theme.text.accent}>{cursorChar}</Text>
      )}
    </Box>
  );
};

/**
 * Blinking Cursor Component
 */
export interface BlinkingCursorProps {
  /** Cursor character */
  char?: string;
  /** Blink rate in ms */
  blinkRate?: number;
  /** Color when visible */
  color?: string;
}

export const BlinkingCursor: React.FC<BlinkingCursorProps> = ({
  char = '▌',
  blinkRate = 500,
  color = theme.text.accent,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible((v) => !v);
    }, blinkRate);

    return () => clearInterval(timer);
  }, [blinkRate]);

  if (!visible) {
    return <Text> </Text>;
  }

  return <Text color={color}>{char}</Text>;
};

/**
 * Code Streaming Display
 * Shows code with syntax highlighting as it streams
 */
export interface CodeStreamingProps {
  /** Code content */
  code: string;
  /** Programming language */
  language?: string;
  /** Whether streaming is active */
  isStreaming?: boolean;
  /** Show line numbers */
  showLineNumbers?: boolean;
}

export const CodeStreaming: React.FC<CodeStreamingProps> = ({
  code,
  language,
  isStreaming = false,
  showLineNumbers = true,
}) => {
  const lines = code.split('\n');
  const lineNumberWidth = lines.length.toString().length;

  return (
    <Box flexDirection="column">
      {/* Language badge */}
      {language && (
        <Box marginBottom={0}>
          <Text backgroundColor={theme.ui.comment} color={theme.text.primary}>
            {' '}
            {language}{' '}
          </Text>
        </Box>
      )}

      {/* Code lines */}
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={theme.border.default}
        paddingX={1}
      >
        {lines.map((line, index) => (
          <Box key={index}>
            {showLineNumbers && (
              <Box width={lineNumberWidth + 1}>
                <Text color={theme.ui.comment}>
                  {(index + 1).toString().padStart(lineNumberWidth)}{' '}
                </Text>
              </Box>
            )}
            <Text color={theme.text.primary}>{line}</Text>
            {/* Cursor at end of last line if streaming */}
            {isStreaming && index === lines.length - 1 && (
              <BlinkingCursor char="▌" />
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

/**
 * Formatted Text Component
 * Applies basic markdown-like formatting
 */
interface FormattedTextProps {
  text: string;
  color?: string;
}

const FormattedText: React.FC<FormattedTextProps> = ({ text, color }) => {
  // Simple inline code detection
  const parts = useMemo(() => {
    const result: Array<{ text: string; code?: boolean }> = [];
    const codePattern = /`([^`]+)`/g;
    let lastIndex = 0;
    let match;

    while ((match = codePattern.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        result.push({ text: text.substring(lastIndex, match.index) });
      }
      // Add code match
      result.push({ text: match[1], code: true });
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      result.push({ text: text.substring(lastIndex) });
    }

    return result.length > 0 ? result : [{ text }];
  }, [text]);

  return (
    <Box>
      {parts.map((part, index) => (
        <Text
          key={index}
          color={part.code ? theme.text.accent : color}
          backgroundColor={part.code ? theme.ui.comment : undefined}
        >
          {part.code ? ` ${part.text} ` : part.text}
        </Text>
      ))}
    </Box>
  );
};

/**
 * Animated Text Reveal
 * Reveals text word by word for dramatic effect
 */
export interface AnimatedTextRevealProps {
  /** Text to reveal */
  text: string;
  /** Words per second */
  wordsPerSecond?: number;
  /** Whether animation is active */
  active?: boolean;
  /** Callback when complete */
  onComplete?: () => void;
}

export const AnimatedTextReveal: React.FC<AnimatedTextRevealProps> = ({
  text,
  wordsPerSecond = 5,
  active = true,
  onComplete,
}) => {
  const words = text.split(' ');
  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    if (!active || revealedCount >= words.length) return;

    const interval = Math.round(1000 / wordsPerSecond);
    const timer = setInterval(() => {
      setRevealedCount((prev) => {
        const next = prev + 1;
        if (next >= words.length) {
          clearInterval(timer);
          onComplete?.();
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [active, revealedCount, words.length, wordsPerSecond, onComplete]);

  const revealedText = words.slice(0, revealedCount).join(' ');

  return (
    <Box>
      <Text color={theme.text.primary}>{revealedText}</Text>
      {revealedCount < words.length && (
        <Text color={theme.ui.comment}>...</Text>
      )}
    </Box>
  );
};

/**
 * Typewriter Stats
 * Shows stats for typewriter animation
 */
export interface TypewriterStatsProps {
  /** Characters typed */
  charactersTyped: number;
  /** Time elapsed in seconds */
  elapsedTime: number;
  /** Show words per minute */
  showWPM?: boolean;
}

export const TypewriterStats: React.FC<TypewriterStatsProps> = ({
  charactersTyped,
  elapsedTime,
  showWPM = true,
}) => {
  const cps = elapsedTime > 0 ? charactersTyped / elapsedTime : 0;
  const wpm = elapsedTime > 0 ? (charactersTyped / 5 / elapsedTime) * 60 : 0;

  return (
    <Box>
      <Text color={theme.text.secondary}>
        {charactersTyped.toLocaleString()}{' '}
        {showWPM ? t('chars') : t('characters')}
      </Text>
      <Box marginLeft={2}>
        <Text color={theme.ui.comment}>{cps.toFixed(1)} c/s</Text>
      </Box>
      {showWPM && (
        <Box marginLeft={2}>
          <Text color={theme.ui.comment}>{wpm.toFixed(0)} WPM</Text>
        </Box>
      )}
    </Box>
  );
};
