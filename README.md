# ⚡ Video Mation Pro

<p align="center">
  <img src="public/icons/icon128.png" alt="Video Mation Pro Logo" width="128" height="128">
</p>

<p align="center">
  <strong>A powerful Chrome extension for college students to efficiently complete Coursera and L&T EduTech courses with smart automation.</strong>
</p>

---

## ✨ Features

### 🎬 Video Automation
- **Smart Detection**: Automatically detects video lectures on Coursera and L&T EduTech
- **Human-like Behavior**: Plays first few seconds, then seeks to end with random playback speeds (1.25x - 1.75x)
- **Auto-progression**: Automatically clicks "Next" button after video completion
- **Pause/Resume Control**: Full control with pause and resume functionality
- **Real-time Progress**: Live tracking via Dynamic Island UI

### 📝 Quiz Extraction (Quiz Mode)
- **Auto-detect Quizzes**: Detects quiz pages on both Coursera and L&T
- **Question + Options**: Extracts questions with A) B) C) D) formatted options
- **One-click Copy**: Easy copy button for single questions
- **Multi-question Support**: Handles both single and multiple question quizzes

### 📖 Reading Items (Coursera)
- **Auto-complete**: Automatically clicks "Mark as Complete" button
- **Fast Processing**: Quick completion with minimal delays

### 🏝️ Dynamic Island UI
- **Floating Interface**: Beautiful dark notification bar
- **Draggable**: Drag from header to reposition anywhere
- **Position Memory**: Remembers position across page reloads
- **Video Mode**: Shows progress ring and status text
- **Quiz Mode**: Displays extracted questions with copy functionality

### 📊 Performance Stats
- **Videos Completed**: Track total videos skipped
- **Time Saved**: See total time saved in minutes
- **Persistent Storage**: Stats saved across browser sessions

## 🛡️ Anti-Detection Features

- **Random Delays**: 500-2000ms human-like pauses
- **Variable Speed**: Playback speeds between 1.25x-1.75x (never 2x)
- **Real Click Events**: Uses proper DOM events for natural interactions
- **No Auto-Fill**: Quiz answers must be entered manually

## 🚀 Installation

1. Clone/download this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Open Chrome → `chrome://extensions/`
5. Enable **Developer mode** (top right)
6. Click **Load unpacked**
7. Select the `videomation` folder

## 🌐 Supported Platforms

| Platform | Video Skip | Quiz Extract | Reading Complete |
|----------|:----------:|:------------:|:----------------:|
| Coursera | ✅ | ✅ | ✅ |
| L&T EduTech | ✅ | ✅ | ❌ |


## 🛠️ Tech Stack

- **React 19** + **TypeScript**
- **Vite** - Fast build tool
- **Tailwind CSS 4** + **shadcn/ui**
- **Chrome Extension Manifest V3**


## ⚠️ Disclaimer

This extension is for **educational purposes only**. Use responsibly and in accordance with platform terms of service.

## 📝 License

MIT License

---

<p align="center">Built with ❤️ for college students By threaddev.in</p>
