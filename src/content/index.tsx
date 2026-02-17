import React from 'react';
import ReactDOM from 'react-dom/client';
import type { DynamicIslandState } from '../types';
import { defaultDynamicIslandState, defaultSettings } from '../types';
import { UniversalvideoMationPro } from './courseraHelper';

const styles = {
  container: {
    all: 'initial' as const,
    position: 'fixed' as const,
    top: '16px',
    right: '16px',
    zIndex: 2147483647,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    width: '320px',
    userSelect: 'none' as const,
  },
  card: {
    background: '#0a0a0a',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
    overflow: 'hidden',
  },
  header: {
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#000000',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    touchAction: 'none' as const,
    userSelect: 'none' as const,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  icon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #333333, #1a1a1a)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
  },
  label: {
    fontSize: '9px',
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  status: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#fff',
    maxWidth: '120px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  progress: {
    width: '36px',
    height: '36px',
    position: 'relative' as const,
  },
  progressText: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '8px',
    fontWeight: 700,
    color: '#fff',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  pauseBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    transition: 'background 0.2s',
  },
  pauseBtnActive: {
    background: 'rgba(34, 197, 94, 0.3)',
  },
  closeBtn: {
    width: '22px',
    height: '22px',
    borderRadius: '6px',
    background: 'rgba(255, 255, 255, 0.08)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  content: {
    padding: '12px 14px',
    background: '#0a0a0a',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  statLabel: {
    fontSize: '9px',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  badge: {
    padding: '3px 7px',
    borderRadius: '10px',
    fontSize: '9px',
    fontWeight: 600,
  },
  badgeActive: {
    background: 'linear-gradient(135deg, #333333, #1a1a1a)',
    color: '#fff',
  },
  badgeDone: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#fff',
  },
  badgeIdle: {
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  badgePaused: {
    background: 'rgba(251, 191, 36, 0.2)',
    color: '#fbbf24',
  },
  bar: {
    height: '3px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #ffffff, #a0a0a0)',
    borderRadius: '3px',
    transition: 'width 0.4s ease',
  },
  idle: {
    textAlign: 'center' as const,
    padding: '16px 12px',
  },
  idleIcon: {
    width: '40px',
    height: '40px',
    margin: '0 auto 10px',
    background: 'linear-gradient(135deg, #333333, #1a1a1a)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  idleTitle: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#fff',
    marginBottom: '3px',
  },
  idleSub: {
    fontSize: '10px',
    color: 'rgba(255, 255, 255, 0.35)',
  },
  // Quiz mode styles
  quizContainer: {
    padding: '8px 0',
  },
  quizHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  quizLabel: {
    fontSize: '9px',
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  quizProgress: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#fff',
  },
  quizTextArea: {
    width: '100%',
    minHeight: '120px',
    maxHeight: '220px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '11px',
    lineHeight: '1.5',
    color: '#fff',
    resize: 'none' as const,
    outline: 'none',
    fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
    fontVariantLigatures: 'none',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    letterSpacing: '0.02em',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
    overflow: 'auto' as const,
    cursor: 'text' as const,
    caretColor: 'transparent',
  },
  copyInstruction: {
    marginTop: '8px',
    padding: '8px 10px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.05)',
    fontSize: '9px',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center' as const,
    lineHeight: '1.4',
  },
  // ContentEditable div style for Coursera single question (better selection support)
  quizEditor: {
    width: '100%',
    minHeight: '120px',
    maxHeight: '220px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '11px',
    lineHeight: '1.5',
    color: '#fff',
    outline: 'none',
    fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
    fontVariantLigatures: 'none',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    letterSpacing: '0.02em',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
    overflow: 'auto' as const,
    cursor: 'text' as const,
    userSelect: 'text' as const,
  },
};

const VideoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
    <path d="m22 8-6 4 6 4V8Z" />
    <rect width="14" height="12" x="2" y="6" rx="2" />
  </svg>
);

const CloseIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const PlayIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff" stroke="#fff" strokeWidth="1">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const PauseIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff" stroke="#fff" strokeWidth="1">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

const ZapIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" stroke="#fff" strokeWidth="1">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const QuizIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
  </svg>
);

const ProgressRing: React.FC<{ value: number }> = ({ value }) => {
  const r = 14;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;

  return (
    <div style={styles.progress}>
      <svg width="36" height="36" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
        <circle
          cx="18" cy="18" r={r} fill="none" stroke="#fff" strokeWidth="3"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>
      <span style={styles.progressText}>{Math.round(value)}%</span>
    </div>
  );
};

interface Props {
  state: DynamicIslandState;
  onClose: () => void;
  onTogglePause: () => void;
}

// Storage key for island position
const ISLAND_POSITION_KEY = 'videomation-island-pos';

// Get saved position from localStorage
const getSavedPosition = (): { x: number; y: number } | null => {
  try {
    const saved = localStorage.getItem(ISLAND_POSITION_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore parse errors
  }
  return null;
};

// Save position to localStorage
const savePosition = (x: number, y: number) => {
  try {
    localStorage.setItem(ISLAND_POSITION_KEY, JSON.stringify({ x, y }));
  } catch {
    // Ignore storage errors
  }
};

const DynamicIsland: React.FC<Props> = ({ state, onClose, onTogglePause }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const headerRef = React.useRef<HTMLDivElement>(null);
  const editorRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [position, setPosition] = React.useState<{ x: number; y: number } | null>(null);
  const dragOffset = React.useRef({ x: 0, y: 0 });

  // Load saved position on mount
  React.useEffect(() => {
    const saved = getSavedPosition();
    if (saved) {
      setPosition(saved);
    }
  }, []);

  // Mouse/Touch event handlers for dragging - ONLY from header
  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    // Don't start drag if clicking on buttons
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }

    setIsDragging(true);
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    e.preventDefault();
  };

  const handleHeaderTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }

    setIsDragging(true);
    const touch = e.touches[0];
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      dragOffset.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
  };

  // Select all text in contentEditable div using execCommand (GUARANTEED to work on Coursera)
  const selectAllEditorText = React.useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    
    editor.focus();
    document.execCommand('selectAll');
  }, []);

  // Handle click anywhere on the card - select text if in quiz mode
  const handleCardClick = React.useCallback((e: React.MouseEvent) => {
    // Don't select if clicking on buttons
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    
    // In quiz mode, single click anywhere selects all text
    if (state.mode === 'quiz' && editorRef.current) {
      selectAllEditorText();
    }
  }, [state.mode, selectAllEditorText]);

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      let x = e.clientX - dragOffset.current.x;
      let y = e.clientY - dragOffset.current.y;

      // Keep inside screen boundaries
      const maxX = window.innerWidth - container.offsetWidth;
      const maxY = window.innerHeight - container.offsetHeight;

      x = Math.max(0, Math.min(x, maxX));
      y = Math.max(0, Math.min(y, maxY));

      setPosition({ x, y });
      savePosition(x, y);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const touch = e.touches[0];
      let x = touch.clientX - dragOffset.current.x;
      let y = touch.clientY - dragOffset.current.y;

      const maxX = window.innerWidth - container.offsetWidth;
      const maxY = window.innerHeight - container.offsetHeight;

      x = Math.max(0, Math.min(x, maxX));
      y = Math.max(0, Math.min(y, maxY));

      setPosition({ x, y });
      savePosition(x, y);
    };

    const handleMouseUp = () => setIsDragging(false);
    const handleTouchEnd = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  if (!state.visible) return null;

  const isPaused = state.isPaused || false;
  const isQuizMode = state.mode === 'quiz';

  const getBadge = () => {
    if (isPaused) return { style: { ...styles.badge, ...styles.badgePaused }, text: '⏸ Paused' };
    if (isQuizMode) return { style: { ...styles.badge, ...styles.badgeActive }, text: 'Quiz' };
    const { status } = state.video;
    if (status === 'completed') return { style: { ...styles.badge, ...styles.badgeDone }, text: '✓ Done' };
    if (status === 'idle') return { style: { ...styles.badge, ...styles.badgeIdle }, text: '◉ Ready' };
    return { style: { ...styles.badge, ...styles.badgeActive }, text: '▶ Active' };
  };

  const badge = getBadge();

  // Calculate container style with position
  const containerStyle: React.CSSProperties = {
    ...styles.container,
    cursor: 'default',
    ...(position ? {
      left: position.x,
      top: position.y,
      right: 'auto',
      transform: 'none',
    } : {}),
  };

  // Header style with drag cursor
  const headerStyle: React.CSSProperties = {
    ...styles.header,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div 
      ref={containerRef}
      style={containerStyle}
    >
      <style>{`
        #videomation-root {
          all: initial !important;
          position: fixed !important;
          z-index: 2147483647 !important;
        }
        #cskip-island * { box-sizing: border-box; margin: 0; padding: 0; }
        #cskip-island button:hover { filter: brightness(1.2); }
        #cskip-island textarea:focus { border-color: rgba(255, 255, 255, 0.25); }
        #cskip-island textarea::-webkit-scrollbar { width: 6px; }
        #cskip-island textarea::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); border-radius: 3px; }
        #cskip-island textarea::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 3px; transition: background 0.2s; }
        #cskip-island textarea::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.35); }
        #cskip-island textarea { scrollbar-width: thin; scrollbar-color: rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05); }
        #cskip-island .quiz-editor::-webkit-scrollbar { width: 6px; }
        #cskip-island .quiz-editor::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); border-radius: 3px; }
        #cskip-island .quiz-editor::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 3px; transition: background 0.2s; }
        #cskip-island .quiz-editor::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.35); }
        #cskip-island .quiz-editor { scrollbar-width: thin; scrollbar-color: rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05); }
        @media (max-width: 480px) {
          #cskip-island { width: 260px !important; }
          #cskip-island .quiz-textarea { min-height: 80px !important; max-height: 140px !important; }
          #cskip-island .quiz-editor { min-height: 80px !important; max-height: 140px !important; }
        }
      `}</style>
      <div id="cskip-island" style={styles.card} onClick={handleCardClick}>
        <div 
          ref={headerRef}
          style={headerStyle}
          onMouseDown={handleHeaderMouseDown}
          onTouchStart={handleHeaderTouchStart}
        >
          <div style={styles.headerLeft}>
            <div style={styles.icon}>{isQuizMode ? <QuizIcon /> : <VideoIcon />}</div>
            <div>
              <div style={styles.label}>{isQuizMode ? 'Quiz Mode' : state.mode === 'video' ? 'Video Mode' : 'Standby'}</div>
              <div style={styles.status}>
                {isPaused ? 'Paused' : isQuizMode ? 'Ready to Copy' : state.video.statusText}
              </div>
            </div>
          </div>
          <div style={styles.headerRight}>
            {state.mode === 'video' && <ProgressRing value={state.video.progress} />}
            {/* Only show pause button for video mode, not quiz mode */}
            {!isQuizMode && (
              <button 
                style={{ ...styles.pauseBtn, ...(isPaused ? {} : styles.pauseBtnActive) }} 
                onClick={onTogglePause}
                title={isPaused ? 'Resume automation' : 'Pause automation'}
              >
                {isPaused ? <PlayIcon /> : <PauseIcon />}
              </button>
            )}
            {/* Only show close button for video mode, not quiz mode */}
            {!isQuizMode && (
              <button style={styles.closeBtn} onClick={onClose}><CloseIcon /></button>
            )}
          </div>
        </div>

        <div style={styles.content}>
          {isQuizMode && state.quiz ? (
            <div style={styles.quizContainer}>
              <div style={styles.quizHeader}>
                <div style={styles.quizLabel}>Extracted Question</div>
                <div style={badge.style}>{badge.text}</div>
              </div>
              <div
                ref={editorRef}
                className="quiz-editor"
                contentEditable
                suppressContentEditableWarning
                spellCheck={false}
                style={styles.quizEditor}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  // Single click - select all text immediately
                  selectAllEditorText();
                }}
                dangerouslySetInnerHTML={{
                  __html: (state.quiz.extractedText || 'Detecting quiz...').replace(/\n/g, '<br>')
                }}
              />
              <div style={styles.copyInstruction}>
                💡 Click anywhere, then press <strong>Ctrl+C</strong> to copy
              </div>
            </div>
          ) : state.mode === 'video' ? (
            <>
              <div style={styles.row}>
                <div>
                  <div style={styles.statLabel}>Progress</div>
                </div>
                <div style={badge.style}>{badge.text}</div>
              </div>
              <div style={styles.bar}>
                <div style={{ ...styles.barFill, width: `${state.video.progress}%` }} />
              </div>
            </>
          ) : (
            <div style={styles.idle}>
              <div style={styles.idleIcon}><ZapIcon /></div>
              <div style={styles.idleTitle}>Ready to Skip</div>
              <div style={styles.idleSub}>Navigate to a video</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

let helper: UniversalvideoMationPro | null = null;

const App: React.FC = () => {
  const [state, setState] = React.useState<DynamicIslandState>(defaultDynamicIslandState);

  React.useEffect(() => {
    if (!helper) {
      chrome.storage.sync.get('settings', (result) => {
        const settings = { ...defaultSettings, ...(result.settings || {}) };
        helper = new UniversalvideoMationPro(settings);
        helper.initialize();
      });
    }

    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'VIDEO_MATION_STATE_UPDATE') {
        setState(e.data.state);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleClose = () => {
    setState(prev => ({ ...prev, visible: false }));
  };

  const handleTogglePause = () => {
    window.postMessage({ type: 'TOGGLE_PAUSE' }, '*');
    setState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  return <DynamicIsland state={state} onClose={handleClose} onTogglePause={handleTogglePause} />;
};

function init() {
  if (document.getElementById('videomation-root')) {
    return;
  }
  
  const container = document.createElement('div');
  container.id = 'videomation-root';
  
  // Attach to document.documentElement (html root) instead of body
  // This fixes dragging issues on L&T and other sites with complex DOM
  if (document.documentElement) {
    document.documentElement.appendChild(container);
  } else if (document.body) {
    document.body.appendChild(container);
  }
  
  ReactDOM.createRoot(container).render(<App />);
}

// ✅ MutationObserver to re-inject island if Coursera SPA removes it
function setupIslandReinjection() {
  let reinjectTimeout: ReturnType<typeof setTimeout> | null = null;
  
  const observer = new MutationObserver(() => {
    // Check if our container was removed
    if (!document.getElementById('videomation-root')) {
      // Debounce to avoid multiple rapid re-injections
      if (reinjectTimeout) clearTimeout(reinjectTimeout);
      reinjectTimeout = setTimeout(() => {
        init();
      }, 100);
    }
  });
  
  // Only start observing if body exists
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: false, // Only watch direct children to reduce overhead
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init();
    setupIslandReinjection();
  });
} else {
  init();
  setupIslandReinjection();
}

// Export for module
export { init };
