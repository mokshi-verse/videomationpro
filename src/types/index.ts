// Extension types and interfaces

export interface ExtensionSettings {
  enabled: boolean;
  autoVideo: boolean;
  humanDelayMin: number;
  humanDelayMax: number;
  playbackSpeedMin: number;
  playbackSpeedMax: number;
}

export interface ExtensionStats {
  videosCompleted: number;
  timeSavedMinutes: number;
  lastActiveDate: string;
}

export interface VideoStatus {
  currentVideo: number;
  totalVideos: number;
  status: 'idle' | 'playing-start' | 'seeking' | 'playing-end' | 'completed';
  progress: number;
  statusText: string;
}

export interface QuizStatus {
  currentQuestion: number;
  totalQuestions: number;
  extractedText: string;
  status: 'idle' | 'detecting' | 'extracting' | 'ready' | 'copied' | 'error';
}

export interface DiscussionStatus {
  status: 'idle' | 'detecting' | 'posting' | 'completed';
  statusText: string;
}

export interface DynamicIslandState {
  visible: boolean;
  mode: 'video' | 'quiz' | 'idle';
  video: VideoStatus;
  quiz?: QuizStatus;
  isPaused?: boolean;
}

export const defaultSettings: ExtensionSettings = {
  enabled: true,
  autoVideo: true,
  humanDelayMin: 500,
  humanDelayMax: 2000,
  playbackSpeedMin: 1.25,
  playbackSpeedMax: 1.75,
};

export const defaultStats: ExtensionStats = {
  videosCompleted: 0,
  timeSavedMinutes: 0,
  lastActiveDate: new Date().toISOString().split('T')[0],
};

export const defaultDynamicIslandState: DynamicIslandState = {
  visible: false,
  mode: 'idle',
  video: {
    currentVideo: 0,
    totalVideos: 0,
    status: 'idle',
    progress: 0,
    statusText: 'Waiting...',
  },
  quiz: {
    currentQuestion: 0,
    totalQuestions: 0,
    extractedText: '',
    status: 'idle',
  },
};

// Message types for communication between popup/content script
export type MessageType = 
  | { type: 'GET_SETTINGS'; }
  | { type: 'SAVE_SETTINGS'; settings: ExtensionSettings }
  | { type: 'GET_STATS'; }
  | { type: 'UPDATE_STATS'; stats: Partial<ExtensionStats> }
  | { type: 'GET_STATUS'; }
  | { type: 'TOGGLE_EXTENSION'; enabled: boolean }
  | { type: 'SKIP_VIDEO'; }
  | { type: 'PAUSE_AUTOMATION'; }
  | { type: 'RESUME_AUTOMATION'; }
  | { type: 'COPY_QUIZ'; }
  | { type: 'STATUS_UPDATE'; state: DynamicIslandState };
