import type {
  ExtensionSettings,
  ExtensionStats,
} from '../types';
import {
  defaultSettings,
  defaultStats,
} from '../types';

// Storage keys
const SETTINGS_KEY = 'videoMationPro_settings';
const STATS_KEY = 'videoMationPro_stats';

// Get settings from chrome.storage
export async function getSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.get(SETTINGS_KEY, (result) => {
        resolve((result[SETTINGS_KEY] as ExtensionSettings) || defaultSettings);
      });
    } else {
      // Fallback for development
      const stored = localStorage.getItem(SETTINGS_KEY);
      resolve(stored ? JSON.parse(stored) : defaultSettings);
    }
  });
}

// Save settings to chrome.storage
export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set({ [SETTINGS_KEY]: settings }, () => {
        resolve();
      });
    } else {
      // Fallback for development
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      resolve();
    }
  });
}

// Get stats from chrome.storage
export async function getStats(): Promise<ExtensionStats> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(STATS_KEY, (result) => {
        resolve((result[STATS_KEY] as ExtensionStats) || defaultStats);
      });
    } else {
      // Fallback for development
      const stored = localStorage.getItem(STATS_KEY);
      resolve(stored ? JSON.parse(stored) : defaultStats);
    }
  });
}

// Save stats to chrome.storage
export async function saveStats(stats: ExtensionStats): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ [STATS_KEY]: stats }, () => {
        resolve();
      });
    } else {
      // Fallback for development
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
      resolve();
    }
  });
}

// Update specific stats
export async function updateStats(updates: Partial<ExtensionStats>): Promise<ExtensionStats> {
  const currentStats = await getStats();
  const newStats = { ...currentStats, ...updates };
  await saveStats(newStats);
  return newStats;
}

// Increment a specific stat
export async function incrementStat(
  key: keyof Pick<ExtensionStats, 'videosCompleted' | 'timeSavedMinutes'>,
  amount: number = 1
): Promise<ExtensionStats> {
  const currentStats = await getStats();
  const newStats = {
    ...currentStats,
    [key]: currentStats[key] + amount,
    lastActiveDate: new Date().toISOString().split('T')[0],
  };
  await saveStats(newStats);
  return newStats;
}

// Reset stats
export async function resetStats(): Promise<void> {
  await saveStats(defaultStats);
}
