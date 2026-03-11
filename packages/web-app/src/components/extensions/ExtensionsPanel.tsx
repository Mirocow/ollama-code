/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import { useState, useEffect } from 'react';

/**
 * Extension type
 */
interface Extension {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  installed: boolean;
  author?: string;
  homepage?: string;
}

/**
 * Extensions Panel Component
 */
export function ExtensionsPanel() {
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'installed' | 'marketplace'>('installed');

  // Load extensions
  useEffect(() => {
    async function loadExtensions() {
      try {
        const response = await fetch('/api/extensions');
        if (response.ok) {
          const data = await response.json();
          setExtensions(data.extensions || []);
        }
      } catch (error) {
        console.error('Failed to load extensions:', error);
        // Set demo extensions for preview
        setExtensions([
          { id: 'git-tools', name: 'Git Tools', version: '1.0.0', description: 'Git integration tools', enabled: true, installed: true, author: 'Ollama Code' },
          { id: 'web-search', name: 'Web Search', version: '1.2.0', description: 'Search the web for information', enabled: true, installed: true, author: 'Ollama Code' },
          { id: 'lsp-tools', name: 'LSP Tools', version: '0.9.0', description: 'Language Server Protocol integration', enabled: false, installed: true, author: 'Ollama Code' },
          { id: 'docker-tools', name: 'Docker Tools', version: '1.1.0', description: 'Docker container management', enabled: false, installed: false, author: 'Community' },
          { id: 'aws-tools', name: 'AWS Tools', version: '0.5.0', description: 'AWS cloud integration', enabled: false, installed: false, author: 'Community' },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
    loadExtensions();
  }, []);

  // Toggle extension
  const toggleExtension = async (id: string, enabled: boolean) => {
    try {
      await fetch(`/api/extensions/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      setExtensions(extensions.map((ext) =>
        ext.id === id ? { ...ext, enabled } : ext
      ));
    } catch (error) {
      console.error('Failed to toggle extension:', error);
    }
  };

  // Install extension
  const installExtension = async (id: string) => {
    try {
      await fetch(`/api/extensions/${id}/install`, { method: 'POST' });
      setExtensions(extensions.map((ext) =>
        ext.id === id ? { ...ext, installed: true, enabled: true } : ext
      ));
    } catch (error) {
      console.error('Failed to install extension:', error);
    }
  };

  // Uninstall extension
  const uninstallExtension = async (id: string) => {
    try {
      await fetch(`/api/extensions/${id}`, { method: 'DELETE' });
      setExtensions(extensions.map((ext) =>
        ext.id === id ? { ...ext, installed: false, enabled: false } : ext
      ));
    } catch (error) {
      console.error('Failed to uninstall extension:', error);
    }
  };

  // Filter extensions
  const filteredExtensions = extensions.filter((ext) =>
    ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ext.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const installedExtensions = filteredExtensions.filter((ext) => ext.installed);
  const marketplaceExtensions = filteredExtensions.filter((ext) => !ext.installed);

  if (isLoading) {
    return <div className="flex h-full items-center justify-center">Loading extensions...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search extensions..."
            className="flex-1 px-4 py-2 bg-background border border-border rounded-md"
          />
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveTab('installed')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'installed' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
            }`}
          >
            Installed ({installedExtensions.length})
          </button>
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'marketplace' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
            }`}
          >
            Marketplace ({marketplaceExtensions.length})
          </button>
        </div>
      </div>

      {/* Extensions list */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid gap-4">
          {(activeTab === 'installed' ? installedExtensions : marketplaceExtensions).map((extension) => (
            <div
              key={extension.id}
              className="p-4 border border-border rounded-lg bg-card"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{extension.name}</h3>
                    <span className="text-xs text-muted-foreground">v{extension.version}</span>
                    {extension.installed && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        extension.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {extension.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{extension.description}</p>
                  {extension.author && (
                    <p className="text-xs text-muted-foreground mt-2">by {extension.author}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {extension.installed ? (
                    <>
                      <button
                        onClick={() => toggleExtension(extension.id, !extension.enabled)}
                        className={`px-3 py-1.5 rounded-md text-sm ${
                          extension.enabled
                            ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            : 'bg-primary text-primary-foreground hover:bg-primary/90'
                        }`}
                      >
                        {extension.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => uninstallExtension(extension.id)}
                        className="px-3 py-1.5 bg-destructive text-destructive-foreground rounded-md text-sm hover:bg-destructive/90"
                      >
                        Uninstall
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => installExtension(extension.id)}
                      className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
                    >
                      Install
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {(activeTab === 'installed' ? installedExtensions : marketplaceExtensions).length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              {activeTab === 'installed' ? 'No extensions installed' : 'No extensions found'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExtensionsPanel;
