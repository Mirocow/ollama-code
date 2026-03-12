/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import { useState, useEffect } from 'react';
import { useWebSessionStore } from '@/stores/webSessionStore';

/**
 * Apply theme to document
 */
function applyTheme(theme: 'light' | 'dark' | 'system') {
  const root = document.documentElement;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
}

/**
 * Settings configuration type
 */
interface SettingsConfig {
  ollamaUrl: string;
  defaultModel: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  approvalMode: 'auto' | 'manual';
  contextWindow: number;
  maxTokens: number;
  temperature: number;
  enableTools: boolean;
  enableMcp: boolean;
  trustedFolders: string[];
}

const defaultSettings: SettingsConfig = {
  ollamaUrl: 'http://localhost:11434',
  defaultModel: 'llama3.2',
  theme: 'dark',
  language: 'en',
  approvalMode: 'manual',
  contextWindow: 128000,
  maxTokens: 4096,
  temperature: 0.7,
  enableTools: true,
  enableMcp: true,
  trustedFolders: [],
};

/**
 * Settings Panel Component
 */
export function SettingsPanel() {
  const [settings, setSettings] = useState<SettingsConfig>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<
    'general' | 'model' | 'tools' | 'security'
  >('general');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Get store actions for syncing
  const setSelectedModel = useWebSessionStore(
    (state) => state.setSelectedModel,
  );

  // Load settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setSettings({ ...defaultSettings, ...data });
          // Apply theme on load
          applyTheme(data.theme || 'dark');
          // Sync to localStorage
          localStorage.setItem(
            'ollama-code-settings',
            JSON.stringify({ ...defaultSettings, ...data }),
          );
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Apply theme when it changes
  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  // Save settings
  const saveSettings = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        // Sync defaultModel with store
        if (settings.defaultModel) {
          setSelectedModel(settings.defaultModel);
        }
        // Save to localStorage for immediate theme application on reload
        localStorage.setItem('ollama-code-settings', JSON.stringify(settings));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Test Ollama connection
  const testConnection = async () => {
    try {
      const response = await fetch('/api/models');
      const data = await response.json();
      alert(
        data.models?.length > 0
          ? `Connected! Found ${data.models.length} models.`
          : 'Connected but no models found.',
      );
    } catch (error) {
      alert('Connection failed: ' + (error as Error).message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-48 border-r border-border bg-muted/30 p-2">
        {[
          { id: 'general', label: 'General', icon: '⚙️' },
          { id: 'model', label: 'Model', icon: '🤖' },
          { id: 'tools', label: 'Tools', icon: '🔧' },
          { id: 'security', label: 'Security', icon: '🔒' },
        ].map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id as typeof activeSection)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 mb-1 ${
              activeSection === section.id
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            <span>{section.icon}</span>
            <span>{section.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl">
          <h2 className="text-xl font-semibold mb-6">
            {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}{' '}
            Settings
          </h2>

          {activeSection === 'general' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Ollama URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.ollamaUrl}
                    onChange={(e) =>
                      setSettings({ ...settings, ollamaUrl: e.target.value })
                    }
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-md"
                  />
                  <button
                    onClick={testConnection}
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
                  >
                    Test
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Theme</label>
                <select
                  value={settings.theme}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      theme: e.target.value as SettingsConfig['theme'],
                    })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Language
                </label>
                <select
                  value={settings.language}
                  onChange={(e) =>
                    setSettings({ ...settings, language: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                >
                  <option value="en">English</option>
                  <option value="ru">Русский</option>
                  <option value="zh">中文</option>
                </select>
              </div>
            </div>
          )}

          {activeSection === 'model' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Default Model
                </label>
                <input
                  type="text"
                  value={settings.defaultModel}
                  onChange={(e) =>
                    setSettings({ ...settings, defaultModel: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Context Window
                </label>
                <input
                  type="number"
                  value={settings.contextWindow}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contextWindow: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  value={settings.maxTokens}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      maxTokens: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Temperature: {settings.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      temperature: parseFloat(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>
          )}

          {activeSection === 'tools' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium">
                    Enable Tools
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Allow AI to use file, shell, and other tools
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSettings({
                      ...settings,
                      enableTools: !settings.enableTools,
                    })
                  }
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.enableTools ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.enableTools ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium">
                    Enable MCP
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Allow Model Context Protocol servers
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSettings({ ...settings, enableMcp: !settings.enableMcp })
                  }
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.enableMcp ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.enableMcp ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Approval Mode
                </label>
                <select
                  value={settings.approvalMode}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      approvalMode: e.target
                        .value as SettingsConfig['approvalMode'],
                    })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                >
                  <option value="manual">
                    Manual - Ask for each tool call
                  </option>
                  <option value="auto">Auto - Approve automatically</option>
                </select>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Trusted Folders
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Folders where tools can run without confirmation
                </p>
                <div className="space-y-2">
                  {settings.trustedFolders.map((folder, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={folder}
                        onChange={(e) => {
                          const newFolders = [...settings.trustedFolders];
                          newFolders[index] = e.target.value;
                          setSettings({
                            ...settings,
                            trustedFolders: newFolders,
                          });
                        }}
                        className="flex-1 px-3 py-2 bg-background border border-border rounded-md"
                      />
                      <button
                        onClick={() => {
                          setSettings({
                            ...settings,
                            trustedFolders: settings.trustedFolders.filter(
                              (_, i) => i !== index,
                            ),
                          });
                        }}
                        className="px-3 py-2 bg-destructive text-destructive-foreground rounded-md"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      setSettings({
                        ...settings,
                        trustedFolders: [...settings.trustedFolders, ''],
                      })
                    }
                    className="w-full px-3 py-2 border border-dashed border-border rounded-md text-muted-foreground hover:border-primary hover:text-primary"
                  >
                    + Add Folder
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Save button */}
          <div className="mt-8 pt-4 border-t border-border">
            <button
              onClick={saveSettings}
              disabled={isSaving}
              className={`px-6 py-2 rounded-md transition-colors disabled:opacity-50 ${
                saveSuccess
                  ? 'bg-green-600 text-white'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {isSaving
                ? 'Saving...'
                : saveSuccess
                  ? '✓ Saved!'
                  : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;
