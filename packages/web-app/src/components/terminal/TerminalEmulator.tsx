/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

/** Configuration constants */
const CONFIG = {
  /** Client sends ping every 8 seconds */
  CLIENT_HEARTBEAT_INTERVAL: 8000,
  /** Server must respond within 20 seconds */
  PONG_TIMEOUT: 20000,
  /** Auto-reconnect delay */
  RECONNECT_DELAY: 2000,
  /** Max reconnect attempts */
  MAX_RECONNECT_ATTEMPTS: 5,
};

/**
 * Terminal emulator component using xterm.js with robust WebSocket handling
 */
export function TerminalEmulator() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pongTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const reconnectAttemptsRef = useRef(0);

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  /**
   * Clear all timers
   */
  const clearTimers = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    if (pongTimeoutRef.current) {
      clearTimeout(pongTimeoutRef.current);
      pongTimeoutRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  /**
   * Initialize terminal
   */
  const initTerminal = useCallback(() => {
    if (!terminalRef.current || xtermRef.current) return;

    const xterm = new XTerm({
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        cursorAccent: '#000000',
        selectionBackground: '#264f78',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5',
      },
      fontFamily: '"Cascadia Code", "Fira Code", "Source Code Pro", monospace',
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 10000,
      allowTransparency: true,
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    xterm.loadAddon(new WebLinksAddon());

    xterm.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // Write welcome message
    xterm.writeln(
      '\x1b[1;36m╔══════════════════════════════════════════════╗\x1b[0m',
    );
    xterm.writeln(
      '\x1b[1;36m║     Ollama Code - Terminal Emulator          ║\x1b[0m',
    );
    xterm.writeln(
      '\x1b[1;36m╚══════════════════════════════════════════════╝\x1b[0m',
    );
    xterm.writeln('');
    xterm.writeln(
      '\x1b[90mConnect to a shell session using the button above.\x1b[0m',
    );
    xterm.writeln('');

    // Handle resize
    const handleResize = () => {
      fitAddon.fit();
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        const dims = fitAddon.proposeDimensions();
        if (dims) {
          socketRef.current.send(
            JSON.stringify({
              type: 'resize',
              cols: dims.cols,
              rows: dims.rows,
            }),
          );
        }
      }
    };
    window.addEventListener('resize', handleResize);

    // Handle input
    xterm.onData((data) => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'input', data }));
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  /**
   * Start heartbeat mechanism
   */
  const startHeartbeat = useCallback(
    (socket: WebSocket) => {
      clearTimers();

      // Send periodic pings
      heartbeatRef.current = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' }));

          // Set pong timeout
          if (pongTimeoutRef.current) {
            clearTimeout(pongTimeoutRef.current);
          }
          pongTimeoutRef.current = setTimeout(() => {
            console.warn('[Terminal] Pong timeout, reconnecting...');
            socket.close(4000, 'Pong timeout');
          }, CONFIG.PONG_TIMEOUT);
        }
      }, CONFIG.CLIENT_HEARTBEAT_INTERVAL);
    },
    [clearTimers],
  );

  /**
   * Connect to shell WebSocket with auto-reconnect
   */
  const connectToShell = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN || isConnecting) {
      return;
    }

    setIsConnecting(true);
    clearTimers();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/terminal`;

    console.log('[Terminal] Connecting to', wsUrl);
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('[Terminal] Connected');
      setIsConnected(true);
      setIsConnecting(false);
      reconnectAttemptsRef.current = 0;

      xtermRef.current?.writeln('\x1b[32m✓ Connected to shell\x1b[0m');
      xtermRef.current?.writeln('');

      // Send initial resize
      if (fitAddonRef.current && xtermRef.current) {
        const dims = fitAddonRef.current.proposeDimensions();
        if (dims) {
          socket.send(
            JSON.stringify({
              type: 'resize',
              cols: dims.cols,
              rows: dims.rows,
            }),
          );
        }
      }

      startHeartbeat(socket);
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case 'output':
            xtermRef.current?.write(message.data);
            break;
          case 'exit':
            xtermRef.current?.writeln('');
            xtermRef.current?.writeln(
              `\x1b[33mProcess exited with code ${message.code}\x1b[0m`,
            );
            setIsConnected(false);
            break;
          case 'error':
            xtermRef.current?.writeln(`\x1b[31mError: ${message.data}\x1b[0m`);
            break;
          case 'ping':
            socket.send(JSON.stringify({ type: 'pong' }));
            break;
          case 'pong':
            // Clear pong timeout on response
            if (pongTimeoutRef.current) {
              clearTimeout(pongTimeoutRef.current);
              pongTimeoutRef.current = null;
            }
            break;
        }
      } catch {
        xtermRef.current?.write(event.data);
      }
    };

    socket.onclose = (event) => {
      console.log(
        '[Terminal] Disconnected, code:',
        event.code,
        'reason:',
        event.reason,
      );
      setIsConnected(false);
      setIsConnecting(false);
      clearTimers();

      const wasClean = event.code === 1000 || event.code === 1005;
      const shouldReconnect =
        !wasClean &&
        reconnectAttemptsRef.current < CONFIG.MAX_RECONNECT_ATTEMPTS;

      if (!wasClean) {
        xtermRef.current?.writeln('');
        xtermRef.current?.writeln(
          `\x1b[33m✗ Disconnected (code: ${event.code})\x1b[0m`,
        );
      }

      // Auto-reconnect on abnormal close
      if (shouldReconnect) {
        reconnectAttemptsRef.current++;
        const delay = CONFIG.RECONNECT_DELAY * reconnectAttemptsRef.current;
        xtermRef.current?.writeln(
          `\x1b[36mReconnecting in ${delay / 1000}s (attempt ${reconnectAttemptsRef.current}/${CONFIG.MAX_RECONNECT_ATTEMPTS})...\x1b[0m`,
        );
        reconnectTimeoutRef.current = setTimeout(() => {
          connectToShell();
        }, delay);
      } else if (
        reconnectAttemptsRef.current >= CONFIG.MAX_RECONNECT_ATTEMPTS
      ) {
        xtermRef.current?.writeln(
          '\x1b[31mMax reconnect attempts reached. Click Connect to try again.\x1b[0m',
        );
        reconnectAttemptsRef.current = 0;
      }
    };

    socket.onerror = (error) => {
      console.error('[Terminal] Error:', error);
      setIsConnected(false);
      setIsConnecting(false);
      xtermRef.current?.writeln('');
      xtermRef.current?.writeln('\x1b[31m✗ Connection error\x1b[0m');
    };

    socketRef.current = socket;
  }, [isConnecting, clearTimers, startHeartbeat]);

  /**
   * Disconnect from shell
   */
  const disconnectFromShell = useCallback(() => {
    clearTimers();
    reconnectAttemptsRef.current = CONFIG.MAX_RECONNECT_ATTEMPTS; // Prevent auto-reconnect

    if (socketRef.current) {
      socketRef.current.close(1000, 'User disconnect');
      socketRef.current = null;
    }
  }, [clearTimers]);

  /**
   * Clear terminal
   */
  const clearTerminal = useCallback(() => {
    xtermRef.current?.clear();
  }, []);

  // Initialize terminal on mount
  useEffect(() => {
    initTerminal();
  }, [initTerminal]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
      socketRef.current?.close();
      xtermRef.current?.dispose();
    };
  }, [clearTimers]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="h-10 border-b border-border flex items-center px-4 gap-4 bg-muted/30">
        <span className="text-sm font-medium">Terminal</span>
        <div className="ml-auto flex items-center gap-2">
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              isConnected
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
            }`}
          >
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          <button
            onClick={isConnected ? disconnectFromShell : connectToShell}
            disabled={isConnecting}
            className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
          >
            {isConnecting
              ? 'Connecting...'
              : isConnected
                ? 'Disconnect'
                : 'Connect'}
          </button>
          <button
            onClick={clearTerminal}
            className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Terminal container */}
      <div
        ref={terminalRef}
        className="flex-1 bg-[#1e1e1e] p-2 overflow-hidden"
        style={{ height: 'calc(100% - 40px)' }}
      />
    </div>
  );
}

export default TerminalEmulator;
