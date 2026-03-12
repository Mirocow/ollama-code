/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { commandService } from '@/lib/commands';
import type { SlashCommand } from '@/lib/commands';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (command: string) => void;
}

/**
 * Command palette component for slash commands
 */
export function CommandPalette({
  isOpen,
  onClose,
  onSelect,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [commands, setCommands] = useState<SlashCommand[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load commands on mount
  useEffect(() => {
    setCommands(commandService.getCommands());
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Filter commands based on query
  const filteredCommands = query
    ? commands.filter(
        (cmd) =>
          cmd.name.toLowerCase().includes(query.toLowerCase()) ||
          cmd.description.toLowerCase().includes(query.toLowerCase()) ||
          cmd.altNames?.some((alt) =>
            alt.toLowerCase().includes(query.toLowerCase()),
          ),
      )
    : commands;

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(
            (prev) =>
              (prev - 1 + filteredCommands.length) % filteredCommands.length,
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            onSelect(`/${filteredCommands[selectedIndex].name}`);
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filteredCommands, selectedIndex, onSelect, onClose],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Palette */}
      <div className="relative w-full max-w-lg bg-background border border-border rounded-lg shadow-lg overflow-hidden">
        {/* Input */}
        <div className="flex items-center border-b border-border">
          <span className="pl-4 text-muted-foreground">/</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search commands..."
            className="flex-1 px-2 py-3 bg-transparent outline-none"
          />
        </div>

        {/* Commands list */}
        <div className="max-h-[50vh] overflow-auto">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-3 text-muted-foreground text-center">
              No commands found
            </div>
          ) : (
            filteredCommands.map((cmd, index) => (
              <button
                key={cmd.name}
                onClick={() => {
                  onSelect(`/${cmd.name}`);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full text-left px-4 py-2 flex items-center justify-between ${
                  index === selectedIndex ? 'bg-primary/10' : 'hover:bg-muted'
                }`}
              >
                <div>
                  <span className="font-mono text-primary">/{cmd.name}</span>
                  {cmd.altNames && cmd.altNames.length > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({cmd.altNames.map((a) => `/${a}`).join(', ')})
                    </span>
                  )}
                </div>
                <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                  {cmd.description}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground flex gap-4">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
