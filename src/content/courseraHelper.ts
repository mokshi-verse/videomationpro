import type { ExtensionSettings, DynamicIslandState } from '../types';

type Platform = 'coursera' | 'lnt' | 'unknown';

export class UniversalvideoMationPro {
  private settings: ExtensionSettings;
  private platform: Platform;
  private isProcessing = false;
  private isPaused = false;
  private observer: MutationObserver | null = null;
  private urlObserver: number | null = null;
  private lastUrl = '';
  private videoProcessed = new WeakSet<HTMLVideoElement>();
  private currentVideoDuration = 0;
  private statsIncrementedForCurrentVideo = false; // Prevent double counting
  
  // Quiz state
  private isQuizMode = false;
  private lastQuizQuestion = '';
  private quizObserver: MutationObserver | null = null;
  private courseraWaitingShown = false; // Track if waiting message was already shown
  
  private islandState: DynamicIslandState = {
    visible: false,
    mode: 'idle',
    video: {
      currentVideo: 0,
      totalVideos: 0,
      status: 'idle',
      progress: 0,
      statusText: 'Ready',
    },
    quiz: {
      currentQuestion: 0,
      totalQuestions: 0,
      extractedText: '',
      status: 'idle',
    },
    isPaused: false,
  };

  constructor(settings: ExtensionSettings) {
    this.settings = settings;
    this.platform = this.detectPlatform();
    this.lastUrl = window.location.href;
  }

  private detectPlatform(): Platform {
    const hostname = window.location.hostname.toLowerCase();
    
    if (hostname.includes('coursera')) {
      return 'coursera';
    }
    if (hostname.includes('lntedutech') || 
        hostname.includes('learnkonnect') || 
        hostname.includes('larsentoubro') ||
        hostname.includes('campus.lnt') ||
        hostname.includes('mbulearn') ||
        hostname.includes('lnt')) {
      return 'lnt';
    }
    return 'unknown';
  }

  updateSettings(settings: ExtensionSettings) {
    this.settings = settings;
  }

  initialize() {
    if (this.platform === 'unknown') {
      return;
    }
    
    this.watchForSPAChanges();
    this.watchForURLChanges();
    this.setupMessageListener();
    this.setupVideoPolling();
    this.setupQuizPolling();
    
    setTimeout(() => {
      this.checkForContent();
    }, 500); // Faster initial check
  }

  // Aggressive polling to catch quizzes on L&T and Coursera - FAST triggering
  private setupQuizPolling() {
    let lastQuizCheck = '';
    
    // Immediate check first
    if (this.platform === 'coursera' && this.isCourseraQuizPage()) {
      this.handleCourseraQuiz();
    } else if (this.platform === 'lnt' && this.isLntQuizPage()) {
      this.handleLntQuiz();
    }
    
    // Quick follow-up check after 500ms
    setTimeout(() => {
      if (this.platform === 'lnt' && this.isLntQuizPage()) {
        this.handleLntQuiz();
      } else if (this.platform === 'coursera' && this.isCourseraQuizPage()) {
        this.handleCourseraQuiz();
      }
    }, 500);
    
    // Poll every 500ms for FAST detection (was 1000ms)
    setInterval(() => {
      if (!this.settings.enabled) return;
      
      // Check L&T quiz
      if (this.platform === 'lnt' && this.isLntQuizPage()) {
        const currentFingerprint = document.body.innerText.substring(0, 500);
        if (currentFingerprint !== lastQuizCheck) {
          lastQuizCheck = currentFingerprint;
          this.handleLntQuiz();
        }
      }
      // Check Coursera quiz
      else if (this.platform === 'coursera' && this.isCourseraQuizPage()) {
        const currentFingerprint = document.body.innerText.substring(0, 500);
        if (currentFingerprint !== lastQuizCheck) {
          lastQuizCheck = currentFingerprint;
          this.handleCourseraQuiz();
        }
      }
      // Not a quiz page - but only exit quiz mode if URL confirms we left
      else {
        const url = window.location.href.toLowerCase();
        const stillOnAttempt = url.includes('/attempt');
        
        // Only exit quiz mode if we've actually navigated away from attempt page
        if (this.isQuizMode && !stillOnAttempt) {
          this.isQuizMode = false;
          this.lastQuizQuestion = '';
          this.updateIslandState({ mode: 'idle', visible: false });
          this.notifyIslandUpdate();
        }
        lastQuizCheck = '';
      }
    }, 500); // Faster polling - was 1000ms
  }

  // Aggressive polling to catch videos that load dynamically (especially for L&T)
  private setupVideoPolling() {
    if (this.platform !== 'lnt') return;
    
    // Poll every 500ms to catch dynamically loaded videos
    const pollInterval = setInterval(() => {
      if (!this.settings.enabled || !this.settings.autoVideo || this.isPaused) return;
      
      const videos = document.querySelectorAll('video');
      for (const video of videos) {
        const v = video as HTMLVideoElement;
        const videoWithListener = v as HTMLVideoElement & { __videoMationListener?: boolean; __videoMationPolled?: boolean };
        
        // Skip if already has listener or already processed
        if (videoWithListener.__videoMationListener || videoWithListener.__videoMationPolled || this.videoProcessed.has(v)) {
          continue;
        }
        
        // Mark as polled
        videoWithListener.__videoMationPolled = true;
        
        // Attach play listener immediately
        const playHandler = () => {
          v.removeEventListener('play', playHandler);
          videoWithListener.__videoMationListener = true;
          
          // Start handling immediately
          if (!this.videoProcessed.has(v) && !this.isProcessing) {
            this.handleVideo(v);
          }
        };
        
        v.addEventListener('play', playHandler);
      }
    }, 500);
    
    // Clean up after 60 seconds to save resources
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 60000);
  }

  private watchForSPAChanges() {
    this.observer = new MutationObserver(() => {
      if (!this.isProcessing && !this.isPaused && this.settings.enabled && this.settings.autoVideo) {
        this.checkForContent();
      }
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private watchForURLChanges() {
    this.urlObserver = window.setInterval(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== this.lastUrl) {
        this.lastUrl = currentUrl;
        this.isProcessing = false;
        this.videoProcessed = new WeakSet();
        this.statsIncrementedForCurrentVideo = false; // Reset stats flag for new page
        this.courseraWaitingShown = false; // Reset waiting flag for new quiz attempt
        this.lastQuizQuestion = ''; // Reset last quiz question to prevent stale data
        // Fast check for quiz pages on URL change
        if (this.platform === 'coursera' && currentUrl.toLowerCase().includes('/attempt')) {
          setTimeout(() => this.handleCourseraQuiz(), 300);
        }
        setTimeout(() => {
          this.checkForContent();
        }, 500); // Faster - was 1000ms
      }
    }, 500); // Faster URL polling - was 1000ms

    window.addEventListener('popstate', () => {
      this.isProcessing = false;
      setTimeout(() => this.checkForContent(), 300); // Faster - was 500ms
    });

    window.addEventListener('hashchange', () => {
      this.isProcessing = false;
      setTimeout(() => this.checkForContent(), 300); // Faster - was 500ms
    });
  }

  private setupMessageListener() {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'SETTINGS_UPDATE') {
        this.updateSettings(message.settings);
      } else if (message.type === 'SKIP_VIDEO') {
        this.forceSkip();
      } else if (message.type === 'TOGGLE_EXTENSION') {
        this.settings.enabled = message.enabled;
        if (!message.enabled) {
          this.hideIsland();
        } else {
          this.checkForContent();
        }
      } else if (message.type === 'PAUSE_AUTOMATION') {
        this.pauseAutomation();
      } else if (message.type === 'RESUME_AUTOMATION') {
        this.resumeAutomation();
      }
    });

    window.addEventListener('message', (e) => {
      if (e.data?.type === 'TOGGLE_PAUSE') {
        if (this.isPaused) {
          this.resumeAutomation();
        } else {
          this.pauseAutomation();
        }
      }
    });
  }

  pauseAutomation() {
    this.isPaused = true;
    this.updateIslandState({ isPaused: true });
    this.notifyIslandUpdate();
  }

  resumeAutomation() {
    this.isPaused = false;
    // Reset processing state to allow new video detection
    this.isProcessing = false;
    // Clear processed videos to allow re-processing
    this.videoProcessed = new WeakSet();
    this.statsIncrementedForCurrentVideo = false; // Reset stats flag
    this.updateIslandState({ isPaused: false });
    this.notifyIslandUpdate();
    // Re-check for content (will find and restart video)
    setTimeout(() => {
      this.checkForContent();
    }, 100);
  }

  private checkForContent() {
    if (!this.settings.enabled || this.isPaused) {
      return;
    }
    
    // Check for L&T Final Assessment Quiz first
    if (this.platform === 'lnt' && this.isLntQuizPage()) {
      this.handleLntQuiz();
      return;
    }
    
    // Only check for video if autoVideo is enabled
    if (!this.settings.autoVideo) {
      return;
    }
    
    if (this.platform === 'coursera' && this.isReadingPage()) {
      this.handleReadingItem();
      return;
    }
    
    this.checkForVideo();
  }

  // Check if this is a L&T slide video (has prev/next arrows) - should be ignored completely
  private isLntSlideVideo(): boolean {
    // Method 1: Check for nav#nav-controls element (MOST RELIABLE)
    const navControls = document.querySelector('nav#nav-controls');
    if (navControls) {
      return true;
    }
    
    // Method 2: Check for bottom-bar section with left/right navigation (Example Programs pattern)
    const bottomBar = document.querySelector('section#bottom-bar');
    if (bottomBar) {
      // Check if there are navigation controls (< >) in the bottom bar area
      const navControlsInBottom = bottomBar.querySelector('nav, [aria-label*="navigation"]');
      if (navControlsInBottom) {
        return true;
      }
    }
    
    // Method 3: Check for nav with aria-label containing "slide navigation"
    const navElements = document.querySelectorAll('nav[aria-label]');
    for (const nav of navElements) {
      const ariaLabel = (nav.getAttribute('aria-label') || '').toLowerCase();
      if (ariaLabel.includes('slide') || ariaLabel === 'slide navigation') {
        return true;
      }
    }
    
    // Method 4: Check for left/right arrow buttons at bottom of video player
    const allButtons = document.querySelectorAll('button, [role="button"]');
    let hasLeftArrow = false;
    let hasRightArrow = false;
    for (const btn of allButtons) {
      const rect = btn.getBoundingClientRect();
      // Check if button is at the bottom of the viewport (navigation area)
      if (rect.top > window.innerHeight * 0.8) {
        const text = (btn.textContent || '').trim();
        const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
        if (text === '<' || text === '>' || ariaLabel.includes('previous') || ariaLabel.includes('next')) {
          if (text === '<' || ariaLabel.includes('previous')) hasLeftArrow = true;
          if (text === '>' || ariaLabel.includes('next')) hasRightArrow = true;
        }
      }
    }
    if (hasLeftArrow && hasRightArrow) {
      return true;
    }
    
    // Method 5: Check for NEXT button with data-acc-text attribute
    const nextButtons = document.querySelectorAll('[data-acc-text]');
    for (const el of nextButtons) {
      const accText = (el.getAttribute('data-acc-text') || '').toLowerCase().trim();
      if (accText === 'next' || accText === 'previous') {
        return true;
      }
    }
    
    // Method 2: Look for SVG tspan containing exactly "NEXT" or navigation text
    const tspans = document.querySelectorAll('tspan');
    for (const t of tspans) {
      const text = (t.textContent || '').trim().toUpperCase();
      if (text === 'NEXT' || text === 'PREVIOUS' || text === '<' || text === '>') {
        return true;
      }
    }
    
    // Method 3: Check for slide counter format like "1/20" with navigation arrows nearby
    const allText = document.body.innerText || '';
    const hasSlideCounter = /\b\d{1,2}\/\d{1,2}\b/.test(allText);
    
    // Method 4: Look for navigation arrow SVGs or buttons
    const allElements = document.querySelectorAll('button, [role="button"], svg, g');
    for (const el of allElements) {
      const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
      const title = (el.getAttribute('title') || '').toLowerCase();
      const className = (el.className || '').toString().toLowerCase();
      
      // Check for explicit next/previous labels
      if (ariaLabel === 'next' || ariaLabel === 'previous' ||
          title === 'next' || title === 'previous' ||
          ariaLabel.includes('next slide') || ariaLabel.includes('previous slide')) {
        return true;
      }
      
      // Check for arrow classes combined with slide counter
      if (hasSlideCounter && (className.includes('arrow') || className.includes('nav-btn'))) {
        return true;
      }
    }
    
    return false;
  }

  // Detect L&T Final Assessment Quiz page - quizzes with radio buttons OR checkboxes
  private isLntQuizPage(): boolean {
    const url = window.location.href.toLowerCase();
    
    // Check if we're in coursePlayer OR scormPlayer (iframe) OR index_lms.html
    const isLntPlayer = url.includes('courseplayer') || 
                        url.includes('scormplayer') || 
                        url.includes('index_lms') ||
                        url.includes('lmsplayerpremium') ||
                        url.includes('lntedutech.com');
    
    if (!isLntPlayer) return false;
    
    // CRITICAL: Check for actual radio buttons OR checkboxes (quiz indicator)
    const radioButtons = document.querySelectorAll('input[type="radio"]');
    const checkboxButtons = document.querySelectorAll('input[type="checkbox"]');
    if (radioButtons.length === 0 && checkboxButtons.length === 0) return false;
    
    // Check if there's a video playing - if yes, NOT a quiz page
    const videos = document.querySelectorAll('video');
    for (const video of videos) {
      const v = video as HTMLVideoElement;
      // If video has valid duration and is visible, this is a video page
      if (v.duration > 0 && isFinite(v.duration) && this.isVideoVisible(v)) {
        return false;
      }
    }
    
    // Check for "Next" button (most quizzes have this)
    let foundNext = false;
    document.querySelectorAll('button, [role="button"], [data-acc-text]').forEach(el => {
      const text = (el.textContent || el.getAttribute('data-acc-text') || '').toLowerCase();
      if (text.includes('next') || text === 'next') {
        foundNext = true;
      }
    });
    
    // Also check tspan for "Next" text
    const tspans = document.querySelectorAll('tspan');
    tspans.forEach(t => {
      if ((t.textContent || '').toLowerCase().trim() === 'next') {
        foundNext = true;
      }
    });
    
    // Must have radio buttons OR checkboxes AND next button to be a quiz
    const totalInputs = radioButtons.length + checkboxButtons.length;
    return totalInputs >= 2 && foundNext;
  }

  // Handle L&T Final Assessment Quiz
  private handleLntQuiz() {
    // Extract question info FIRST before showing UI
    const quizInfo = this.extractQuizInfo();
    
    // Only show UI if we successfully extracted content
    if (!quizInfo || !quizInfo.extractedText || quizInfo.extractedText.trim().length < 10) {
      // Don't show UI if no valid content - silently return
      return;
    }
    
    // Check if question has changed
    if (quizInfo.extractedText === this.lastQuizQuestion) {
      return;
    }
    
    this.lastQuizQuestion = quizInfo.extractedText;
    this.isQuizMode = true;
    
    // Update island state for quiz mode
    this.updateIslandState({
      visible: true,
      mode: 'quiz',
      quiz: {
        currentQuestion: quizInfo.currentQuestion,
        totalQuestions: quizInfo.totalQuestions,
        extractedText: quizInfo.extractedText,
        status: 'ready',
      },
    });
    this.notifyIslandUpdate();
    
    // Set up observer to detect question changes
    this.setupQuizObserver();
  }

  // Extract quiz information from the page - QUESTION + OPTIONS
  private extractQuizInfo(): { currentQuestion: number; totalQuestions: number; extractedText: string } | null {
    // ===== STEP 1: Find question number (e.g., "1/20") =====
    let currentQuestion = 1;
    let totalQuestions = 0;
    
    const allText = document.body.innerText;
    const quizMatch = allText.match(/\b(\d{1,2})\/(\d{1,2})\b/);
    if (quizMatch) {
      currentQuestion = parseInt(quizMatch[1]) || 1;
      totalQuestions = parseInt(quizMatch[2]) || 0;
    }
    
    // ===== STEP 2: Extract the full question text =====
    const question = this.extractFullQuestion();
    
    // Return null only if we have nothing
    if (!question) {
      return null;
    }
    
    // ===== STEP 3: Extract options using radio button positions =====
    const options = this.extractLntOptions();
    
    // ===== STEP 4: Build output - QUESTION + OPTIONS =====
    let formattedText = '';
    
    // Add question with Q#) format
    if (currentQuestion > 0) {
      formattedText = `Q${currentQuestion}) `;
    }
    formattedText += question;
    
    // Add options if found
    if (options.length > 0) {
      formattedText += '\n';
      options.forEach((opt, i) => {
        formattedText += `\n${String.fromCharCode(65 + i)}) ${opt}`;
      });
    }
    
    return {
      currentQuestion,
      totalQuestions,
      extractedText: formattedText.trim(),
    };
  }
  
  // Extract options from L&T quiz using radio button OR checkbox positions
  private extractLntOptions(): string[] {
    // Get both radio buttons AND checkboxes
    const radios = [...document.querySelectorAll('input[type="radio"]')];
    const checkboxes = [...document.querySelectorAll('input[type="checkbox"]')];
    const allInputs = [...radios, ...checkboxes];
    if (allInputs.length === 0) return [];
    
    // Get Y positions of all input buttons (radio or checkbox)
    const radioYs = allInputs
      .map(r => r.getBoundingClientRect().top)
      .sort((a, b) => a - b);
    
    const firstRadioY = radioYs[0];
    
    // Get all SVG text elements below the first radio button
    let lines = [...document.querySelectorAll('svg text, svg tspan')]
      .map(el => {
        const r = el.getBoundingClientRect();
        return { text: this.cleanText(el.textContent || ''), top: r.top };
      })
      .filter(x => x.text && x.top >= firstRadioY - 5);
    
    // Remove duplicates based on text + position
    const seen = new Set<string>();
    lines = lines.filter(x => {
      const key = `${x.text}__${Math.round(x.top)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    
    lines.sort((a, b) => a.top - b.top);
    
    const options: string[] = [];
    
    // Extract option text between each radio button position
    for (let i = 0; i < radioYs.length; i++) {
      const startY = radioYs[i] - 6;
      const endY = (radioYs[i + 1] ?? Infinity) - 6;
      
      const optionLines = lines
        .filter(l => l.top >= startY && l.top < endY)
        .map(l => l.text);
      
      let optionText = this.cleanText(optionLines.join(' '));
      
      // Remove trailing button words like "Next", "Submit", etc.
      optionText = optionText.replace(/\b(next|previous|submit|finish|continue)\b\s*$/gi, '').trim();
      
      if (optionText) options.push(optionText);
    }
    
    // Remove duplicate options
    return [...new Set(options)];
  }
  
  // Check if text is a slide counter (e.g., "1/20", "2 / 15")
  private isSlideCounter(text: string): boolean {
    return /^\d+\s*\/\s*\d+$/.test(text);
  }
  
  // Extract FULL question text from SVG - POSITION-BASED extraction
  // Only extracts text ABOVE the first radio button or checkbox (question area)
  private extractFullQuestion(): string {
    // Junk words to remove
    const junkWords = [
      'mode', 'extracted question', 'then press to copy', 'press to copy',
      'ctrl+c', 'quiz', 'ready to copy', 'correct', 'incorrect', 'next',
      'slide:', 'round', 'rectangle', 'single', 'corner', 'l&t', 'edutech',
      'click on text area', 'menu', 'playback', 'previous', 'submit',
      'start', 'back', 'skip', 'continue', 'logo'
    ];
    
    // ===== STEP 1: Find the first radio button OR checkbox (gap separator) =====
    const firstRadio = document.querySelector('input[type="radio"]');
    const firstCheckbox = document.querySelector('input[type="checkbox"]');
    
    // Get the topmost input (radio or checkbox)
    let firstInputTop: number | null = null;
    if (firstRadio) {
      firstInputTop = firstRadio.getBoundingClientRect().top;
    }
    if (firstCheckbox) {
      const checkboxTop = firstCheckbox.getBoundingClientRect().top;
      if (firstInputTop === null || checkboxTop < firstInputTop) {
        firstInputTop = checkboxTop;
      }
    }
    
    if (firstInputTop === null) {
      // Fallback: if no radio or checkbox, just get longest SVG text
      return this.extractFallbackQuestion();
    }
    
    const radioTop = firstInputTop;
    
    // ===== STEP 2: Extract only SVG text ABOVE the first input =====
    const svgTexts = [...document.querySelectorAll('svg text, svg tspan')]
      .map(el => {
        const rect = el.getBoundingClientRect();
        return { text: this.cleanText(el.textContent || ''), top: rect.top };
      })
      .filter(x => x.text.length > 0 && x.top < radioTop - 8)  // Only text ABOVE options
      .filter(x => !this.isSlideCounter(x.text))
      .sort((a, b) => a.top - b.top);  // Sort by vertical position
    
    // ===== STEP 3: Remove duplicates while keeping order =====
    const seen = new Set<string>();
    const lines: string[] = [];
    for (const x of svgTexts) {
      if (!seen.has(x.text)) {
        seen.add(x.text);
        lines.push(x.text);
      }
    }
    
    // ===== STEP 4: Join all lines to form the full question =====
    let question = this.cleanText(lines.join(' '));
    
    // ===== STEP 5: Fix common issues =====
    // Fix broken "rom" -> "from"
    question = question.replace(/\brom\b/gi, 'from');
    
    // Fix merged words like "fromachine" -> "from machine"
    question = question.replace(/\bfromachine\b/gi, 'from machine');
    question = question.replace(/\bfrommachine\b/gi, 'from machine');
    
    // Remove slide counters like 9/20
    question = question.replace(/\b\d+\s*\/\s*\d+\b/g, ' ');
    
    // Remove junk phrases
    for (const w of junkWords) {
      const re = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      question = question.replace(re, ' ');
    }
    
    // Remove standalone "In" word (noise fix)
    question = question.replace(/\bIn\b/g, ' ');
    
    // Apply additional fixMissingF fixes
    question = this.fixMissingF(question);
    
    // Final clean
    question = this.cleanText(question);
    
    return question;
  }
  
  // Fallback question extraction when no radio buttons found
  private extractFallbackQuestion(): string {
    let texts = [...document.querySelectorAll('svg text, svg tspan')]
      .map(el => this.cleanText(el.textContent || ''))
      .filter(t => t.length > 0)
      .filter(t => !this.isSlideCounter(t));
    
    texts = [...new Set(texts)];
    
    // Find text with '?' or longest text
    let question = 
      [...texts].reverse().find(t => t.includes('?')) ||
      texts.reduce((longest, current) => current.length > longest.length ? current : longest, '');
    
    if (question) {
      question = this.fixMissingF(question);
    }
    
    return question;
  }
  
  // Helper: Clean text by removing weird symbols and extra spaces
  private cleanText(str: string): string {
    return (str || '')
      .replace(/\u00a0/g, ' ')  // Non-breaking space
      .replace(/[^\x20-\x7E]/g, ' ')  // Remove weird symbols, keep basic ASCII
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  // Fix missing 'f' character that SVG sometimes doesn't render properly
  private fixMissingF(str: string): string {
    return str
      .replace(/\bper orms\b/gi, 'performs')
      .replace(/\bo the\b/gi, 'of the')
      .replace(/\bollowing\b/gi, 'following')
      .replace(/\brequency\b/gi, 'frequency')
      .replace(/\brequencies\b/gi, 'frequencies')
      .replace(/\brom the\b/gi, 'from the')
      .replace(/\bor the\b/gi, 'for the')
      .replace(/\bi ter\b/gi, 'filter')
      .replace(/\binter ace\b/gi, 'interface')
      .replace(/\binter acing\b/gi, 'interfacing')
      .replace(/\bcon iguration\b/gi, 'configuration')
      .replace(/\bde ault\b/gi, 'default')
      .replace(/\bdi erent\b/gi, 'different')
      .replace(/\bin ormation\b/gi, 'information')
      .replace(/\bspeci ic\b/gi, 'specific')
      .replace(/\bper orm\b/gi, 'perform');
  }

  // ===== COURSERA QUIZ DETECTION =====
  private isCourseraQuizPage(): boolean {
    if (this.platform !== 'coursera') {
      return false;
    }
    
    const url = window.location.href.toLowerCase();
    
    // CRITICAL: Block quiz mode on view-feedback pages (result pages)
    // These show completed quiz results, not active quizzes
    if (url.includes('/view-feedback') || url.includes('view-feedback')) {
      return false;
    }
    
    // Primary detection: URL-based (most reliable)
    // If URL contains /attempt, we're definitely on a quiz page
    const isAttemptUrl = url.includes('/attempt');
    
    // Secondary URL patterns
    const isQuizUrl = url.includes('/assignment-submission/') || 
                      url.includes('/quiz/') ||
                      url.includes('/exam/');
    
    // If we're on an /attempt URL, always return true (sticky quiz mode)
    if (isAttemptUrl) {
      return true;
    }
    
    // For other quiz URLs, check for DOM elements
    if (isQuizUrl) {
      // Check for question content (cml-viewer contains question text)
      const questionElements = document.querySelectorAll(
        '[data-testid="cml-viewer"], .rc-CML, [class*="cml"], [class*="question"]'
      );
      
      // Check for radio/checkbox inputs (options)
      const optionInputs = document.querySelectorAll(
        'input[type="radio"], input[type="checkbox"]'
      );
      
      // Be more lenient - just need some question content OR options
      return questionElements.length > 0 || optionInputs.length >= 2;
    }
    
    return false;
  }

  // Handle Coursera Quiz/Assignment - with retry mechanism for delayed question loading
  private handleCourseraQuiz() {
    // Try extracting quiz data
    const quizInfo = this.extractCourseraQuizInfo();
    
    // If quiz not ready yet (no questions found) → show waiting ONLY ONCE and retry
    if (!quizInfo || !quizInfo.extractedText || quizInfo.extractedText.trim().length < 10) {
      // Show waiting message ONLY if not shown before (prevents mid-quiz/end-quiz waiting text)
      if (!this.courseraWaitingShown) {
        this.courseraWaitingShown = true;
        
        this.updateIslandState({
          visible: true,
          mode: 'quiz',
          quiz: {
            currentQuestion: 0,
            totalQuestions: 0,
            extractedText: '⏳ Waiting for Coursera questions to load...',
            status: 'detecting',
          },
        });
        this.notifyIslandUpdate();
      }
      
      // Retry again after 2.5 seconds
      setTimeout(() => {
        if (this.isCourseraQuizPage()) {
          this.handleCourseraQuiz();
        }
      }, 1000);
      
      return;
    }
    
    // Question extracted successfully → reset waiting flag (won't show waiting again during this quiz)
    this.courseraWaitingShown = true;
    
    // If same question already shown → don't update again
    if (quizInfo.extractedText === this.lastQuizQuestion) {
      return;
    }
    
    this.lastQuizQuestion = quizInfo.extractedText;
    this.isQuizMode = true;
    
    // Update UI with extracted questions
    this.updateIslandState({
      visible: true,
      mode: 'quiz',
      quiz: {
        currentQuestion: quizInfo.currentQuestion,
        totalQuestions: quizInfo.totalQuestions,
        extractedText: quizInfo.extractedText,
        status: 'ready',
      },
    });
    this.notifyIslandUpdate();
    
    // Set up observer for question changes
    this.setupCourseraQuizObserver();
  }

  // Extract quiz info from Coursera - REWRITTEN to match working console code exactly
  private extractCourseraQuizInfo(): { currentQuestion: number; totalQuestions: number; extractedText: string } | null {
    // Helper: Check if element is really visible (not CSS hidden)
    const isReallyVisible = (el: Element): boolean => {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return false;
      }
      if (rect.width < 20 || rect.height < 20) {
        return false;
      }
      return true;
    };

    // ✅ Find all possible question containers (expanded for essay questions)
    const candidates = [
      ...document.querySelectorAll('fieldset'),
      ...document.querySelectorAll('div[role="group"]'),
      ...document.querySelectorAll('div[data-testid*="submission"]'),
      ...document.querySelectorAll('div[data-testid*="part-Submission"]'),
      // Additional containers for essay/textarea questions
      ...document.querySelectorAll('div[data-testid*="prompt"]'),
      ...document.querySelectorAll('div[id*="prompt"]'),
      ...document.querySelectorAll('div[class*="FormPart"]'),
      ...document.querySelectorAll('div[class*="question"]'),
      ...document.querySelectorAll('div[class*="Question"]'),
    ];

    // ✅ Filter blocks - must be visible, not option containers, have inputs OR textarea, have question element
    let blocks = candidates.filter((b) => {
      if (!isReallyVisible(b)) return false;

      // Reject option containers
      if (b.classList.contains('rc-Option')) return false;
      if (b.closest('.rc-Option')) return false;
      if (b.closest('label')) return false;

      // Check for radio/checkbox inputs (multiple choice questions)
      const radioCheckboxInputs = b.querySelectorAll('input[type="radio"], input[type="checkbox"]');
      
      // Check for textarea/text/number inputs (open-ended/essay/numerical questions)
      const textInputs = b.querySelectorAll('textarea, input[type="text"], input[type="number"]');
      
      // Must have either 2+ radio/checkbox inputs OR at least 1 textarea/text/number input
      const hasMultipleChoice = radioCheckboxInputs.length >= 2;
      const hasTextInput = textInputs.length >= 1;
      
      if (!hasMultipleChoice && !hasTextInput) return false;

      const hasQuestionEl =
        b.querySelector('[data-testid="cml-viewer"]') ||
        b.querySelector('legend') ||
        b.querySelector('h3') ||
        b.querySelector('p');

      return !!hasQuestionEl;
    });

    // ✅ Remove nested duplicates: keep only top-most blocks
    blocks = blocks.filter((b) => !blocks.some((o) => o !== b && o.contains(b)));

    // ✅ FALLBACK: If no blocks found, look for textarea/input questions directly
    if (blocks.length === 0) {
      // Look for textarea, text input, and number input fields
      const inputFields = document.querySelectorAll('textarea, input[type="text"], input[type="number"]');
      for (const inputField of inputFields) {
        if (!isReallyVisible(inputField)) continue;
        
        // Skip if it's part of an already-found option block
        if (inputField.closest('.rc-Option')) continue;
        
        // Find the parent container that has the question
        let parent = inputField.parentElement;
        for (let i = 0; i < 15 && parent; i++) {
          const qEl = parent.querySelector('[data-testid="cml-viewer"]') || 
                      parent.querySelector('legend') ||
                      parent.querySelector('h3') || 
                      parent.querySelector('p');
          if (qEl && isReallyVisible(parent)) {
            // Make sure this container isn't already included
            if (!blocks.some(b => b === parent || b.contains(parent!) || parent!.contains(b))) {
              blocks.push(parent);
            }
            break;
          }
          parent = parent.parentElement;
        }
      }
      // Remove nested duplicates again
      blocks = blocks.filter((b) => !blocks.some((o) => o !== b && o.contains(b)));
    }

    // ✅ Remove duplicate questions
    const seenQ = new Set<string>();
    const finalBlocks: Element[] = [];

    for (const b of blocks) {
      const qEl =
        b.querySelector('[data-testid="cml-viewer"]') ||
        b.querySelector('legend') ||
        b.querySelector('h3') ||
        b.querySelector('p');

      const qText = this.cleanCourseraText((qEl as HTMLElement)?.innerText || qEl?.textContent || '');
      if (!qText || qText.length < 10) continue;

      if (seenQ.has(qText)) continue;
      seenQ.add(qText);
      finalBlocks.push(b);
    }

    if (finalBlocks.length === 0) {
      return null;
    }

    // ✅ Extract questions and options (exactly like console code)
    const results: Array<{ question: string; options: string[]; hasImageOptions: boolean; isInputQuestion: boolean; hasImageInQuestion: boolean; hasSuperscript: boolean }> = [];

    for (const block of finalBlocks) {
      const qEl =
        block.querySelector('[data-testid="cml-viewer"]') ||
        block.querySelector('legend') ||
        block.querySelector('h3') ||
        block.querySelector('p');

      let question = this.cleanCourseraText((qEl as HTMLElement)?.innerText || qEl?.textContent || '');
      question = question.replace(/^\d+\.\s*/, '');

      // Check if question contains images
      const hasImageInQuestion = this.hasImagesInElement(qEl);
      
      // Check if question contains superscript/subscript (mathematical formulas)
      const questionHasSuperscript = this.hasSuperscriptContent(qEl, question);

      // Check for input field questions (textarea/text input - essay/open-ended questions)
      const hasInputField = block.querySelector('textarea, input[type="text"], input[type="number"]') !== null;

      // Get all radio/checkbox inputs
      const inputs = [...block.querySelectorAll('input[type="radio"], input[type="checkbox"]')];

      // If this is a textarea/text question with no radio/checkbox options, extract question only
      if (hasInputField && inputs.length === 0) {
        results.push({ question, options: [], hasImageOptions: false, isInputQuestion: true, hasImageInQuestion, hasSuperscript: questionHasSuperscript });
        continue;
      }

      // ✅ Extract options - EXACTLY like the working console code
      const options = inputs.map((input) => {
        // Case 1: Input is inside a label
        const label1 = input.closest('label');
        if (label1) {
          return this.cleanCourseraText((label1 as HTMLElement).innerText || label1.textContent || '');
        }

        // Case 2: Input is sibling of label (checkbox pattern)
        const parent = input.closest('.rc-Option') || input.parentElement;
        if (parent) {
          const label2 = parent.querySelector('label');
          if (label2) {
            return this.cleanCourseraText((label2 as HTMLElement).innerText || label2.textContent || '');
          }
          return this.cleanCourseraText((parent as HTMLElement).innerText || parent.textContent || '');
        }

        return '';
      }).filter(Boolean);

      const uniqueOptions = [...new Set(options)];

      // Check for image options
      const hasImageOptions = inputs.some((input) => {
        const label = input.closest('label') || (input.closest('.rc-Option') || input.parentElement)?.querySelector('label');
        return label ? this.hasImagesInElement(label) : false;
      });
      
      // Check if any option contains superscript/subscript
      const optionsHaveSuperscript = inputs.some((input) => {
        const label = input.closest('label') || (input.closest('.rc-Option') || input.parentElement)?.querySelector('label');
        if (!label) return false;
        const labelText = (label as HTMLElement).innerText || label.textContent || '';
        return this.hasSuperscriptContent(label, labelText);
      });
      
      // Combined superscript check
      const hasSuperscript = questionHasSuperscript || optionsHaveSuperscript;

      // Additional check: if we have input field but still got here with few options
      if (hasInputField && uniqueOptions.length < 2) {
        results.push({ question, options: [], hasImageOptions: false, isInputQuestion: true, hasImageInQuestion, hasSuperscript });
        continue;
      }

      if (hasImageOptions && uniqueOptions.length < 2) {
        results.push({ question, options: [], hasImageOptions: true, isInputQuestion: false, hasImageInQuestion, hasSuperscript });
        continue;
      }

      // Normal question with options
      results.push({ question, options: uniqueOptions, hasImageOptions, isInputQuestion: false, hasImageInQuestion, hasSuperscript });
    }

    if (results.length === 0) {
      return null;
    }

    // Format output
    const formattedText = results
      .map((q, idx) => {
        // If question has superscript/mathematical formulas - show message only, skip extraction
        if (q.hasSuperscript) {
          return `Q${idx + 1}) (Contains mathematical formulas/superscripts - please copy the question manually from the page)`;
        }
        
        let output = `Q${idx + 1}) ${q.question}`;
        
        // Add image note if question contains images (but still show options if available)
        if (q.hasImageInQuestion) {
          output += '\n\n(Question contains images/diagrams - please copy them manually.)';
        }
        
        // Input field question - no options, just the question
        if (q.isInputQuestion) {
          output += '\n\n(This is an input/text field question - type your answer directly)';
          return output;
        }
        
        // Image options - can't extract option text
        if (q.hasImageOptions && q.options.length === 0) {
          output += '\n\n(Options contain images - please copy them manually from the page)';
          return output;
        }
        
        // Add options if available
        if (q.options.length > 0) {
          const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
          const opts = q.options
            .map((op, i) => `${letters[i]}) ${op}`)
            .join('\n');
          output += '\n' + opts;
        }

        return output;
      })
      .join('\n\n------------------------------------\n\n');

    return {
      currentQuestion: 1,
      totalQuestions: results.length,
      extractedText: formattedText,
    };
  }

  // Helper: Clean Coursera text - REMOVES Monaco CSS/code junk
  private cleanCourseraText(text: string): string {
    let cleaned = (text || '');
    
    // Remove Monaco editor CSS junk (common patterns)
    cleaned = cleaned.replace(/\.monaco-[^}]+\{[^}]*\}/g, ''); // Remove .monaco-* { ... }
    cleaned = cleaned.replace(/\.monaco-list[^{]*\{[^}]*\}/g, '');
    cleaned = cleaned.replace(/background-color:\s*#[a-fA-F0-9]+;?/g, '');
    cleaned = cleaned.replace(/color:\s*#[a-fA-F0-9]+;?/g, '');
    cleaned = cleaned.replace(/border:\s*[^;]+;?/g, '');
    cleaned = cleaned.replace(/box-shadow:\s*[^;]+;?/g, '');
    cleaned = cleaned.replace(/Enter to Rename[^.]*\./g, '');
    cleaned = cleaned.replace(/Shift\+Enter to Preview[^.]*\./g, '');
    cleaned = cleaned.replace(/Information:\s*Pressing Tab[^.]*\./g, '');
    cleaned = cleaned.replace(/Toggle this behavior[^.]*\./g, '');
    cleaned = cleaned.replace(/Control\+M\.?/g, '');
    cleaned = cleaned.replace(/list_id_\d+/g, '');
    cleaned = cleaned.replace(/\s*:\s*focus\s*/g, '');
    cleaned = cleaned.replace(/\s*:\s*hover\s*/g, '');
    cleaned = cleaned.replace(/\s*!important\s*/g, '');
    cleaned = cleaned.replace(/\{[^}]*\}/g, ''); // Remove any remaining CSS blocks
    
    // Clean up whitespace
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.replace(/[^\x20-\x7E]/g, '');
    
    return cleaned.trim();
  }

  // Check if element contains images/SVGs
  private hasImagesInElement(el: Element | null): boolean {
    if (!el) return false;
    return el.querySelector('img, svg, figure, [class*=\"cml-image\"], [data-testid*=\"image\"]') !== null;
  }

  // Check if element or text contains superscript/subscript (mathematical formulas)
  private hasSuperscriptContent(el: Element | null, text: string): boolean {
    if (!el) return false;
    
    // Check for actual <sup> or <sub> elements
    const hasSuperscriptElements = el.querySelector('sup, sub, [class*="superscript"], [class*="subscript"], mjx-container, .MathJax, [class*="math"], [class*="katex"]') !== null;
    if (hasSuperscriptElements) return true;
    
    // Check for MathJax or KaTeX rendered content
    const hasMathJax = el.querySelector('[id*="MathJax"], .MathJax_Display, .MathJax_Preview') !== null;
    if (hasMathJax) return true;
    
    // Check text for superscript description patterns (accessibility text)
    const superscriptPatterns = [
      /start superscript/i,
      /end superscript/i,
      /start subscript/i,
      /end subscript/i,
      /superscript,/i,
      /subscript,/i,
      /start fraction/i,
      /end fraction/i,
      /square root of/i,
      /left parenthesis/i,
      /right parenthesis/i,
    ];
    
    for (const pattern of superscriptPatterns) {
      if (pattern.test(text)) return true;
    }
    
    return false;
  }

  // Observer for Coursera quiz page changes - FAST detection
  private setupCourseraQuizObserver() {
    if (this.quizObserver) {
      this.quizObserver.disconnect();
    }
    
    this.quizObserver = new MutationObserver(() => {
      if (this.isQuizMode && this.platform === 'coursera') {
        setTimeout(() => {
          this.handleCourseraQuiz();
        }, 150); // Faster - was 300ms
      }
    });
    
    this.quizObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  // Set up observer to detect when question changes
  private setupQuizObserver() {
    // Clean up existing observer
    if (this.quizObserver) {
      this.quizObserver.disconnect();
    }
    
    // Watch for changes in the main content area
    this.quizObserver = new MutationObserver(() => {
      if (this.isQuizMode && this.platform === 'lnt') {
        // Debounce the check
        setTimeout(() => {
          this.handleLntQuiz();
        }, 300);
      }
    });
    
    // Observe the body for changes
    this.quizObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  private isReadingPage(): boolean {
    const url = window.location.href.toLowerCase();
    if (url.includes('/supplement') || url.includes('/reading')) {
      return true;
    }
    
    const readingIndicators = document.querySelectorAll(
      '[data-testid="reading-item"], .rc-ReadingItem, [class*="reading"], [class*="Reading"], [class*="supplement"]'
    );
    
    const hasVideo = document.querySelector('video');
    if (!hasVideo && readingIndicators.length > 0) {
      return true;
    }
    
    const markCompleteBtn = this.findMarkCompleteButton();
    if (markCompleteBtn && !hasVideo) {
      return true;
    }
    
    return false;
  }

  private findMarkCompleteButton(): HTMLElement | null {
    const selectors = [
      'button[data-testid="mark-complete-button"]',
      'button[aria-label*="Mark as completed"]',
      'button[aria-label*="mark as completed"]',
      '[class*="MarkAsComplete"] button',
      '[class*="markComplete"] button',
      '[class*="mark-complete"] button',
    ];

    for (const selector of selectors) {
      const btn = document.querySelector(selector) as HTMLElement;
      if (btn && this.isVisible(btn) && !this.isDisabled(btn)) {
        return btn;
      }
    }

    const buttons = document.querySelectorAll('button, [role="button"]');
    for (const btn of buttons) {
      const text = (btn.textContent || '').toLowerCase().trim();
      if ((text.includes('mark') && text.includes('complete')) || 
          text === 'mark as completed' || 
          text === 'mark complete') {
        const element = btn as HTMLElement;
        if (this.isVisible(element) && !this.isDisabled(element)) {
          return element;
        }
      }
    }

    return null;
  }

  private async handleReadingItem() {
    if (this.isProcessing || this.isPaused) return;
    
    // First, check if "Mark as complete" button exists
    // If not (item already completed), don't show island or do anything
    const markCompleteBtn = this.findMarkCompleteButton();
    if (!markCompleteBtn) {
      // Item is already completed - don't show island
      return;
    }
    
    this.isProcessing = true;
    this.statsIncrementedForCurrentVideo = false; // Reset for new reading item
    this.currentVideoDuration = 60; // Assume 1 min for reading items

    this.updateIslandState({
      visible: true,
      mode: 'video',
      video: {
        currentVideo: 0,
        totalVideos: 0,
        status: 'playing-start',
        progress: 20,
        statusText: 'Reading item detected...',
      },
    });
    this.notifyIslandUpdate();

    // Quick delay then immediately click mark complete
    await this.fastDelay();

    if (this.isPaused) {
      this.isProcessing = false;
      return;
    }

    // Click "Mark as complete" button immediately
    this.simulateClick(markCompleteBtn);
    
    await this.incrementStats();
    
    this.updateIslandState({
      video: { ...this.islandState.video, status: 'completed', progress: 100, statusText: 'Done!' },
    });
    this.notifyIslandUpdate();

    await this.fastDelay();
    this.isProcessing = false;
    
    // Keep island visible - user can manually close it if needed
  }

  private checkForVideo() {
    if (!this.settings.enabled || !this.settings.autoVideo || this.isPaused) return;
    
    // First check for videos in main document
    const mainVideos = Array.from(document.querySelectorAll('video'));
    
    // Also check iframes for embedded video players (common in L&T)
    const iframeVideos: HTMLVideoElement[] = [];
    const iframes = document.querySelectorAll('iframe');
    for (const iframe of iframes) {
      try {
        const iframeDoc = (iframe as HTMLIFrameElement).contentDocument || 
                          (iframe as HTMLIFrameElement).contentWindow?.document;
        if (iframeDoc) {
          const videos = iframeDoc.querySelectorAll('video');
          iframeVideos.push(...Array.from(videos));
        }
      } catch {
        // Cross-origin iframe, can't access
      }
    }
    
    const videos = [...mainVideos, ...iframeVideos];
    
    for (const video of videos) {
      const v = video as HTMLVideoElement;
      const isVisible = this.isVideoVisible(v);
      const hasValidDuration = v.duration > 0 && isFinite(v.duration);
      
      if (hasValidDuration && !v.ended && !this.videoProcessed.has(v) && isVisible) {
        // For L&T: Skip slide videos with prev/next arrows
        if (this.platform === 'lnt') {
          // Check if this is a slide video that should be ignored
          if (this.isLntSlideVideo()) {
            // Don't process slide videos - they have quizzes at the end
            return;
          }
          
          // Set up play listener if not already processing
          if (!v.paused && v.currentTime > 0) {
            this.handleVideo(v);
            return;
          } else {
            // Add one-time play listener to detect when user starts the video
            const videoWithListener = v as HTMLVideoElement & { __videoMationListener?: boolean };
            if (!this.videoProcessed.has(v) && !videoWithListener.__videoMationListener) {
              const playHandler = () => {
                v.removeEventListener('play', playHandler);
                delete videoWithListener.__videoMationListener;
                // Check again if it's a slide video
                if (this.isLntSlideVideo()) {
                  return;
                }
                // Immediate response - no delay
                if (!this.videoProcessed.has(v)) {
                  this.handleVideo(v);
                }
              };
              v.addEventListener('play', playHandler);
              videoWithListener.__videoMationListener = true;
            }
            return;
          }
        }
        // For Coursera: Start immediately
        this.handleVideo(v);
        return;
      }
    }

    // Only hide island if not in quiz mode and not processing video
    if (this.islandState.visible && !this.isProcessing && !this.isQuizMode) {
      this.hideIsland();
    }
  }

  private isVideoVisible(video: HTMLVideoElement): boolean {
    const rect = video.getBoundingClientRect();
    return rect.width > 100 && rect.height > 100;
  }

  private async handleVideo(video: HTMLVideoElement) {
    if (this.isProcessing || this.isPaused) return;
    
    // Wait for video metadata to be fully loaded
    const waitForValidDuration = (): Promise<boolean> => {
      return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 100; // 10 seconds max wait (100 * 100ms)
        
        const checkDuration = () => {
          attempts++;
          const dur = video.duration;
          
          // Check if duration is valid: exists, is a number, is finite, and > 0
          if (dur !== undefined && 
              dur !== null && 
              typeof dur === 'number' && 
              !isNaN(dur) && 
              isFinite(dur) && 
              dur > 0) {
            resolve(true);
            return;
          }
          
          // Also check readyState - must be at least HAVE_METADATA (1)
          if (video.readyState >= 1 && dur > 0 && isFinite(dur)) {
            resolve(true);
            return;
          }
          
          if (attempts >= maxAttempts) {
            resolve(false);
            return;
          }
          
          setTimeout(checkDuration, 100);
        };
        
        // Also listen for loadedmetadata event as backup
        const onLoaded = () => {
          video.removeEventListener('loadedmetadata', onLoaded);
          if (video.duration > 0 && isFinite(video.duration)) {
            resolve(true);
          }
        };
        video.addEventListener('loadedmetadata', onLoaded);
        
        checkDuration();
      });
    };
    
    // Wait for valid duration
    const isValid = await waitForValidDuration();
    if (!isValid) {
      console.warn('[VideoMation] Video duration never became valid, skipping');
      return;
    }
    
    // Double-check duration is still valid
    if (!video.duration || !isFinite(video.duration) || video.duration <= 0 || isNaN(video.duration)) {
      console.warn('[VideoMation] Video duration invalid after wait, skipping');
      return;
    }
    
    // Additional wait for video to be fully ready for seeking
    // This prevents the currentTime error by ensuring the video is buffered
    await new Promise<void>((resolve) => {
      const checkReady = () => {
        // readyState >= 2 means HAVE_CURRENT_DATA (can play current frame)
        // readyState >= 3 means HAVE_FUTURE_DATA (can play ahead)
        if (video.readyState >= 2 && video.duration > 0 && isFinite(video.duration)) {
          resolve();
        } else {
          setTimeout(checkReady, 200);
        }
      };
      checkReady();
      // Timeout after 3 seconds
      setTimeout(resolve, 3000);
    });
    
    // Final validation before proceeding
    if (!video.duration || !isFinite(video.duration) || video.duration <= 0) {
      console.warn('[VideoMation] Video still not ready, skipping');
      return;
    }
    
    this.isProcessing = true;
    this.videoProcessed.add(video);
    this.statsIncrementedForCurrentVideo = false; // Reset for new video
    
    this.currentVideoDuration = video.duration || 0;

    const videoInfo = this.getVideoInfo();
    
    this.updateIslandState({
      visible: true,
      mode: 'video',
      video: {
        currentVideo: videoInfo.current,
        totalVideos: videoInfo.total,
        status: 'playing-start',
        progress: 0,
        statusText: 'Loading video...',
      },
    });
    this.notifyIslandUpdate();

    try {
      video.muted = false;
      video.volume = 0.1;
      
      // Brief wait for video to be ready
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Start playing
      await video.play().catch(() => {});
      
      // Update to 25% progress
      this.updateIslandState({
        video: { ...this.islandState.video, progress: 25, statusText: 'Playing start...' },
      });
      this.notifyIslandUpdate();
      
      // Brief wait for video to stabilize
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await this.waitForTimeOrPause(video, 1.0);
      
      if (this.isPaused) {
        this.isProcessing = false;
        return;
      }

      // Wait for video to be ready for seeking (readyState >= 2)
      await new Promise<void>((resolve) => {
        let attempts = 0;
        const check = () => {
          attempts++;
          const dur = video.duration;
          if ((video.readyState >= 2 && dur > 0 && isFinite(dur)) || attempts > 20) {
            resolve();
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });
      
      // Validate duration before seeking - comprehensive check
      const duration = video.duration;
      if (duration === undefined || duration === null || !isFinite(duration) || duration <= 0 || isNaN(duration) || typeof duration !== 'number') {
        this.updateIslandState({
          video: { ...this.islandState.video, status: 'completed', progress: 100, statusText: 'Done!' },
        });
        this.notifyIslandUpdate();
        await this.incrementStats();
        this.isProcessing = false;
        return;
      }

      // Calculate seek time with extra safety
      let seekTime = duration - 2;
      if (seekTime < 0) seekTime = 0;
      
      // CRITICAL: Use Number.isFinite for proper validation
      if (!Number.isFinite(seekTime) || !Number.isFinite(duration)) {
        this.updateIslandState({
          video: { ...this.islandState.video, status: 'completed', progress: 100, statusText: 'Done!' },
        });
        this.notifyIslandUpdate();
        await this.incrementStats();
        this.isProcessing = false;
        return;
      }
      
      // Safely set currentTime with try-catch
      try {
        if (video && Number.isFinite(video.duration) && Number.isFinite(seekTime)) {
          video.currentTime = seekTime;
        } else {
          throw new Error('Invalid video state');
        }
      } catch {
        this.updateIslandState({
          video: { ...this.islandState.video, status: 'completed', progress: 100, statusText: 'Done!' },
        });
        this.notifyIslandUpdate();
        await this.incrementStats();
        this.isProcessing = false;
        return;
      }
      
      const speed = this.settings.playbackSpeedMin + 
        Math.random() * (this.settings.playbackSpeedMax - this.settings.playbackSpeedMin);
      video.playbackRate = speed;
      await video.play().catch(() => {});

      this.updateIslandState({
        video: { ...this.islandState.video, status: 'playing-end', progress: 85, statusText: 'Playing end...' },
      });
      this.notifyIslandUpdate();

      await this.waitForVideoEnd(video);

      if (this.isPaused) {
        this.isProcessing = false;
        return;
      }

      this.updateIslandState({
        video: { ...this.islandState.video, status: 'completed', progress: 100, statusText: 'Done!' },
      });
      this.notifyIslandUpdate();

      await this.incrementStats();

      await this.randomDelay();

      // Pause and stop the video to prevent looping (especially for L&T)
      video.pause();
      video.currentTime = video.duration;

      await this.clickNext();

    } catch {
      //sliently ignore
    } finally {
      this.isProcessing = false;
      
      // Keep island visible - don't auto-hide for video mode
      // User can manually close it using the X button
    }
  }

  private waitForTimeOrPause(video: HTMLVideoElement, targetTime: number): Promise<void> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(), 10000);
      
      const check = () => {
        if (this.isPaused) {
          clearTimeout(timeout);
          resolve();
          return;
        }
        if (video.currentTime >= targetTime || video.ended) {
          clearTimeout(timeout);
          resolve();
        } else {
          requestAnimationFrame(check);
        }
      };
      check();
    });
  }

  private waitForVideoEnd(video: HTMLVideoElement): Promise<void> {
    return new Promise((resolve) => {
      if (video.ended || video.currentTime >= video.duration - 0.5) {
        resolve();
        return;
      }

      const onEnded = () => {
        video.removeEventListener('ended', onEnded);
        resolve();
      };
      video.addEventListener('ended', onEnded);

      const check = setInterval(() => {
        if (this.isPaused) {
          clearInterval(check);
          video.removeEventListener('ended', onEnded);
          resolve();
          return;
        }
        if (video.ended || video.currentTime >= video.duration - 0.5) {
          clearInterval(check);
          video.removeEventListener('ended', onEnded);
          resolve();
        }
      }, 500);

      setTimeout(() => {
        clearInterval(check);
        video.removeEventListener('ended', onEnded);
        resolve();
      }, 30000);
    });
  }

  private async clickNext() {
    if (this.isPaused) return;

    const selectors = this.getNextButtonSelectors();
    
    for (const selector of selectors) {
      try {
        const btn = document.querySelector(selector) as HTMLElement;
        if (btn && this.isVisible(btn) && !this.isDisabled(btn)) {
          this.simulateClick(btn);
          return;
        }
      } catch {
        continue;
      }
    }

    const buttons = document.querySelectorAll('button, a, [role="button"], .btn');
    for (const btn of buttons) {
      const text = (btn.textContent || '').toLowerCase().trim();
      if ((text === 'next' || text.includes('next lesson') || text.includes('continue') || text.includes('next video') || text.includes('go to next')) && 
          this.isVisible(btn as HTMLElement) && !this.isDisabled(btn as HTMLElement)) {
        this.simulateClick(btn as HTMLElement);
        return;
      }
    }
  }

  private getNextButtonSelectors(): string[] {
    return [
      'button[data-testid="next-button"]',
      'button[aria-label="Go to next item"]',
      'button[aria-label="Next"]',
      'button[aria-label="next"]',
      '.rc-NextButton button',
      '[class*="NextButton"] button',
      '.btn-primary[data-disabled="false"]',
      'button[class*="next"]',
      'a[class*="next"]',
      '[class*="next-button"]',
      '[class*="next-btn"]',
      '.btn-next',
      '.next-button',
      '.next-btn',
    ];
  }


  private getVideoInfo(): { current: number; total: number } {
    let current = 1, total = 1;

    const progressEls = document.querySelectorAll('[class*="progress"], [class*="Progress"], .lesson-count, .video-count');
    for (const el of progressEls) {
      const text = el.textContent || '';
      const match = text.match(/(\d+)\s*(?:of|\/|out of)\s*(\d+)/i);
      if (match) {
        current = parseInt(match[1]) || 1;
        total = parseInt(match[2]) || 1;
        break;
      }
    }

    return { current, total };
  }

  private forceSkip() {
    const video = document.querySelector('video') as HTMLVideoElement;
    if (video) {
      video.currentTime = video.duration - 0.5;
    }
    
  }

  private async randomDelay(): Promise<void> {
    const min = this.settings.humanDelayMin;
    const max = this.settings.humanDelayMax;
    const delay = min + Math.random() * (max - min);
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  // Faster delay for quicker operations (quarter of normal delay)
  private async fastDelay(): Promise<void> {
    const min = this.settings.humanDelayMin / 4;
    const max = this.settings.humanDelayMax / 4;
    const delay = min + Math.random() * (max - min);
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  // Find the "Mark as complete" button
  private isVisible(el: HTMLElement): boolean {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return !!(
      (el.offsetWidth || el.offsetHeight || rect.width || rect.height) &&
      style.visibility !== 'hidden' &&
      style.display !== 'none'
    );
  }

  private isDisabled(el: HTMLElement): boolean {
    return el.hasAttribute('disabled') || 
           el.getAttribute('aria-disabled') === 'true' ||
           el.classList.contains('disabled');
  }

  private isExtensionContextValid(): boolean {
    try {
      // Check if chrome.runtime and chrome.storage are available and not invalidated
      return !!(chrome?.runtime?.id && chrome?.storage?.local);
    } catch {
      return false;
    }
  }

  private simulateClick(element: HTMLElement) {
    element.focus();
    ['mousedown', 'mouseup', 'click'].forEach(type => {
      element.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
    });
  }

  private async incrementStats(): Promise<void> {
    // CRITICAL: Prevent double counting - only increment once per video/item
    if (this.statsIncrementedForCurrentVideo) {
      return;
    }
    // NOTE: Flag will be set to true AFTER successful save, not here
    
    if (!this.isExtensionContextValid()) {
      return;
    }
    
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      return;
    }
    
    // Use the full video duration for time saved (more accurate)
    const videoDurationSeconds = this.currentVideoDuration;
    let timeSavedMinutes = Math.round(videoDurationSeconds / 60);
    // If video is longer than 30 seconds but less than 1 minute, count as 1 minute
    if (videoDurationSeconds > 30 && timeSavedMinutes === 0) {
      timeSavedMinutes = 1;
    }
    
    const STATS_KEY = 'videoMationPro_stats';
    
    const defaultStats = {
      videosCompleted: 0,
      quizzesExtracted: 0,
      discussionsPosted: 0,
      timeSavedMinutes: 0,
      lastActiveDate: new Date().toISOString().split('T')[0],
    };
    
    try {
      // Double-check context and storage before chrome API call
      if (!this.isExtensionContextValid() || !chrome?.storage?.local) {
        return;
      }
      
      // Use Promise wrapper for better reliability
      const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
        if (!this.isExtensionContextValid() || !chrome?.storage?.local) {
          reject(new Error('Extension context or storage invalidated'));
          return;
        }
        chrome.storage.local.get(STATS_KEY, (result) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(result);
          }
        });
      });
      
      const stored = result[STATS_KEY] as typeof defaultStats | undefined;
      const currentStats = stored ? { ...defaultStats, ...stored } : defaultStats;
      
      // Update stats
      const newStats = {
        ...currentStats,
        videosCompleted: currentStats.videosCompleted + 1,
        timeSavedMinutes: currentStats.timeSavedMinutes + timeSavedMinutes,
        lastActiveDate: new Date().toISOString().split('T')[0],
      };
      
      // Save with Promise wrapper
      await new Promise<void>((resolve, reject) => {
        chrome.storage.local.set({ [STATS_KEY]: newStats }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
      
      // SUCCESS: Mark as incremented AFTER successful save
      this.statsIncrementedForCurrentVideo = true;
      
    } catch (error) {
      console.error('❌ [VideoMation] Error saving stats:', error);
      // Fallback: try sendMessage to background
      try {
        await chrome.runtime.sendMessage({ type: 'INCREMENT_STAT', stat: 'videosCompleted', amount: 1 });
        if (timeSavedMinutes > 0) {
          await chrome.runtime.sendMessage({ type: 'INCREMENT_STAT', stat: 'timeSavedMinutes', amount: timeSavedMinutes });
        }
        // SUCCESS via fallback: Mark as incremented
        this.statsIncrementedForCurrentVideo = true;
      } catch {
        // Silent fail - stats are non-critical
      }
    }
  }

  private updateIslandState(updates: Partial<DynamicIslandState>) {
    this.islandState = {
      ...this.islandState,
      ...updates,
      video: updates.video ? { ...this.islandState.video, ...updates.video } : this.islandState.video,
    };
  }

  private hideIsland() {
    this.updateIslandState({ visible: false, mode: 'idle' });
    this.notifyIslandUpdate();
  }

  private notifyIslandUpdate() {
    window.postMessage({ type: 'VIDEO_MATION_STATE_UPDATE', state: this.islandState }, '*');
  }

  cleanup() {
    if (this.urlObserver) clearInterval(this.urlObserver);
    if (this.observer) this.observer.disconnect();
    this.hideIsland();
  }
}
