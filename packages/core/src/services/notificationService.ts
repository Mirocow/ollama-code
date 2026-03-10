/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Notification Service
 *
 * Provides system and sound notifications for important events:
 * - Operation completion
 * - Error alerts
 * - Model download completion
 * - Long-running task finish
 */

import { createDebugLogger } from '../utils/debugLogger.js';
import * as os from 'node:os';
import { execSync } from 'node:child_process';

const debugLogger = createDebugLogger('NOTIFICATIONS');

/**
 * Notification type
 */
export type NotificationType = 
  | 'success'
  | 'error'
  | 'warning'
  | 'info';

/**
 * Notification options
 */
export interface NotificationOptions {
  /** Title of the notification */
  title: string;
  /** Body/message of the notification */
  body: string;
  /** Type of notification */
  type?: NotificationType;
  /** Play sound */
  sound?: boolean;
  /** Sound file path or name */
  soundFile?: string;
}

/**
 * Notification configuration
 */
export interface NotificationConfig {
  /** Enable desktop notifications */
  enabled: boolean;
  /** Enable sound notifications */
  soundEnabled: boolean;
  /** Notify on completion */
  notifyOnComplete: boolean;
  /** Notify on errors */
  notifyOnError: boolean;
  /** Minimum operation duration (ms) to trigger notification */
  minDuration: number;
}

/**
 * Default notification configuration
 */
export const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  enabled: true,
  soundEnabled: true,
  notifyOnComplete: true,
  notifyOnError: true,
  minDuration: 30000, // 30 seconds
};

/**
 * Notification Service
 */
export class NotificationService {
  private static instance: NotificationService;
  private config: NotificationConfig;

  private constructor() {
    this.config = { ...DEFAULT_NOTIFICATION_CONFIG };
  }

  /**
   * Get singleton instance
   */
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get current configuration
   */
  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  /**
   * Send a notification
   */
  notify(options: NotificationOptions): void {
    if (!this.config.enabled) {
      debugLogger.debug('Notifications disabled, skipping');
      return;
    }

    const { title, body, type = 'info', sound = this.config.soundEnabled } = options;

    // Send desktop notification
    this.sendDesktopNotification(title, body, type);

    // Play sound if enabled
    if (sound) {
      this.playSound(type);
    }

    debugLogger.info(`Notification: [${type}] ${title}: ${body}`);
  }

  /**
   * Send desktop notification
   */
  private sendDesktopNotification(
    title: string,
    body: string,
    type: NotificationType,
  ): void {
    const platform = os.platform();

    try {
      if (platform === 'darwin') {
        // macOS
        const escapedTitle = title.replace(/"/g, '\\"');
        const escapedBody = body.replace(/"/g, '\\"');
        execSync(
          `osascript -e 'display notification "${escapedBody}" with title "${escapedTitle}"'`,
          { timeout: 5000 },
        );
      } else if (platform === 'linux') {
        // Linux - try notify-send
        const escapedTitle = title.replace(/"/g, '\\"');
        const escapedBody = body.replace(/"/g, '\\"');
        execSync(`notify-send "${escapedTitle}" "${escapedBody}"`, {
          timeout: 5000,
        });
      } else if (platform === 'win32') {
        // Windows - use PowerShell
        const escapedTitle = title.replace(/'/g, "''");
        const escapedBody = body.replace(/'/g, "''");
        execSync(
          `powershell -Command "[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null; [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null; $template = '<toast><visual><binding template=\\"ToastText01\\"><text id=\\"1\\">${escapedTitle}: ${escapedBody}</text></binding></visual></toast>'; $xml = New-Object Windows.Data.Xml.Dom.XmlDocument; $xml.LoadXml($template); $toast = New-Object Windows.UI.Notifications.ToastNotification $xml; [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('Ollama Code').Show($toast)"`,
          { timeout: 10000 },
        );
      }
    } catch (error) {
      debugLogger.warn('Failed to send desktop notification:', error);
    }
  }

  /**
   * Play notification sound
   */
  private playSound(type: NotificationType): void {
    const platform = os.platform();

    try {
      if (platform === 'darwin') {
        // macOS - use afplay or say
        const soundFile = this.getSoundFile(type);
        try {
          execSync(`afplay "${soundFile}"`, { timeout: 3000 });
        } catch {
          // Fallback to say command
          execSync(`say "notification"`, { timeout: 3000 });
        }
      } else if (platform === 'linux') {
        // Linux - try paplay or aplay
        try {
          execSync('paplay /usr/share/sounds/freedesktop/stereo/complete.oga', {
            timeout: 3000,
          });
        } catch {
          try {
            execSync('aplay /usr/share/sounds/alsa/Front_Center.wav', {
              timeout: 3000,
            });
          } catch {
            // No sound available
          }
        }
      } else if (platform === 'win32') {
        // Windows - use PowerShell
        execSync(
          `powershell -Command "(New-Object Media.SoundPlayer 'C:\\\\Windows\\\\Media\\\\notify.wav').PlaySync()"`,
          { timeout: 5000 },
        );
      }
    } catch (error) {
      debugLogger.warn('Failed to play notification sound:', error);
    }
  }

  /**
   * Get sound file for notification type
   */
  private getSoundFile(type: NotificationType): string {
    const sounds: Record<NotificationType, string> = {
      success: '/System/Library/Sounds/Glass.aiff',
      error: '/System/Library/Sounds/Basso.aiff',
      warning: '/System/Library/Sounds/Sosumi.aiff',
      info: '/System/Library/Sounds/Ping.aiff',
    };
    return sounds[type] || sounds.info;
  }

  /**
   * Notify operation complete
   */
  notifyComplete(operation: string, duration?: number): void {
    if (!this.config.notifyOnComplete) return;

    const durationStr = duration
      ? ` (${this.formatDuration(duration)})`
      : '';

    this.notify({
      title: 'Ollama Code',
      body: `${operation} completed${durationStr}`,
      type: 'success',
      sound: true,
    });
  }

  /**
   * Notify error
   */
  notifyError(operation: string, error: string): void {
    if (!this.config.notifyOnError) return;

    this.notify({
      title: 'Ollama Code Error',
      body: `${operation} failed: ${error}`,
      type: 'error',
      sound: true,
    });
  }

  /**
   * Notify model download complete
   */
  notifyModelDownloaded(modelName: string): void {
    this.notify({
      title: 'Model Downloaded',
      body: `${modelName} is ready to use`,
      type: 'success',
      sound: true,
    });
  }

  /**
   * Check if operation should trigger notification based on duration
   */
  shouldNotify(duration: number): boolean {
    return duration >= this.config.minDuration;
  }

  /**
   * Format duration for display
   */
  private formatDuration(ms: number): string {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes < 60) {
      return `${minutes}m ${remainingSeconds}s`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
}

/**
 * Export singleton instance
 */
export const notificationService = NotificationService.getInstance();
