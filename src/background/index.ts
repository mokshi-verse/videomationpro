// Background service worker for Chrome Extension
// Self-contained - no external imports to avoid chunking issues

// ============== INLINED TYPES ==============
interface ExtensionSettings {
  enabled: boolean;
  videoSettings: {
    autoPlay: boolean;
    skipIntros: boolean;
    playbackSpeed: number;
    autoComplete: boolean;
  };
  quizSettings: {
    extractQuestions: boolean;
    highlightAnswers: boolean;
  };
  discussionSettings: {
    autoGenerate: boolean;
    templates: string[];
  };
  antiDetection: {
    randomDelays: boolean;
    humanLikeBehavior: boolean;
  };
}

interface ExtensionStats {
  videosCompleted: number;
  quizzesExtracted: number;
  discussionsPosted: number;
  timeSavedMinutes: number;
  lastActiveDate: string;
}

interface MessageType {
  type: string;
  settings?: ExtensionSettings;
  stats?: Partial<ExtensionStats>;
}

// ============== INLINED DEFAULTS ==============
const defaultSettings: ExtensionSettings = {
  enabled: true,
  videoSettings: {
    autoPlay: true,
    skipIntros: true,
    playbackSpeed: 1.5,
    autoComplete: true,
  },
  quizSettings: {
    extractQuestions: true,
    highlightAnswers: true,
  },
  discussionSettings: {
    autoGenerate: true,
    templates: [
      "Great point! I'd like to add that...",
      "This reminds me of a concept from...",
      "I found this particularly interesting because...",
    ],
  },
  antiDetection: {
    randomDelays: true,
    humanLikeBehavior: true,
  },
};

const defaultStats: ExtensionStats = {
  videosCompleted: 0,
  quizzesExtracted: 0,
  discussionsPosted: 0,
  timeSavedMinutes: 0,
  lastActiveDate: new Date().toISOString().split('T')[0],
};

// ============== INLINED STORAGE FUNCTIONS ==============
const SETTINGS_KEY = 'videoMationPro_settings';
const STATS_KEY = 'videoMationPro_stats';

async function getSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(SETTINGS_KEY, (result) => {
      resolve((result[SETTINGS_KEY] as ExtensionSettings) || defaultSettings);
    });
  });
}

async function saveSettings(settings: ExtensionSettings): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [SETTINGS_KEY]: settings }, () => {
      resolve();
    });
  });
}

async function getStats(): Promise<ExtensionStats> {
  return new Promise((resolve) => {
    chrome.storage.local.get(STATS_KEY, (result) => {
      resolve((result[STATS_KEY] as ExtensionStats) || defaultStats);
    });
  });
}

async function saveStats(stats: ExtensionStats): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STATS_KEY]: stats }, () => {
      resolve();
    });
  });
}

async function updateStats(updates: Partial<ExtensionStats>): Promise<ExtensionStats> {
  const currentStats = await getStats();
  const newStats = { ...currentStats, ...updates };
  await saveStats(newStats);
  return newStats;
}

// ============== MAIN SERVICE WORKER LOGIC ==============

// Listen for keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-helper') {
    const settings = await getSettings();
    const newSettings: ExtensionSettings = {
      ...settings,
      enabled: !settings.enabled,
    };
    await saveSettings(newSettings);
    
    // Notify all tabs
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'TOGGLE_EXTENSION',
        enabled: newSettings.enabled,
      });
    }
  }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message: MessageType, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse);
  return true; // Keep channel open for async response
});

async function handleMessage(message: MessageType): Promise<unknown> {
  switch (message.type) {
    case 'GET_SETTINGS':
      return await getSettings();
    
    case 'SAVE_SETTINGS':
      if (message.settings) {
        await saveSettings(message.settings);
      }
      return { success: true };
    
    case 'GET_STATS':
      return await getStats();
    
    case 'UPDATE_STATS':
      if (message.stats) {
        return await updateStats(message.stats);
      }
      return await getStats();
    
    case 'INCREMENT_STAT': {
      const stat = (message as { stat?: string; amount?: number }).stat as keyof Pick<ExtensionStats, 'videosCompleted' | 'timeSavedMinutes'>;
      const amount = (message as { amount?: number }).amount || 1;
      if (stat) {
        const currentStats = await getStats();
        const newStats = {
          ...currentStats,
          [stat]: currentStats[stat] + amount,
          lastActiveDate: new Date().toISOString().split('T')[0],
        };
        await saveStats(newStats);
        return newStats;
      }
      return await getStats();
    }
    
    default:
      return { error: 'Unknown message type' };
  }
}

// Extension install/update handler
chrome.runtime.onInstalled.addListener(() => {
  // Extension installed or updated
});
