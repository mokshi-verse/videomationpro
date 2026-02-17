

# Videomation Pro! ⚡
<p align="center">
  <img src="public/icons/icon128.png" alt="Video Mation Pro Logo" width="128" height="128">
</p>

<p align="center">
  <strong>A powerful Chrome extension for college students to efficiently complete Coursera and L&T EduTech courses with smart automation.</strong>
</p>



# Video Mation Pro
Video Mation Pro is a powerful Chrome extension designed to enhance video interaction, automation, and productivity workflows directly inside your browser.  Built with modern web technologies, this extension streamlines video-based tasks and improves user efficiency with a clean, lightweight, and responsive interface.

- Bypasses Coursera and L&T bot detection systems
- Skips videos and extracts content using realistic human delays
- Supports both L&T and Coursera platforms
- Saves a lot of your precious time


## How to get the extension
<p align="center">
  <video src="public/videomationdemo.mp4" controls width="480" poster="public/icons/icon128.png">
    Your browser does not support the video tag.

https://github.com/user-attachments/assets/d13d1f21-bef0-4d95-b2a1-b6e8d2260a11


  </video>
</p>

Follow the demo video above carefully.

1. Click on the Drive link and download the VideomationPro ZIP file:  
  [Download from Google Drive](https://drive.google.com/file/d/15SYejuLYYdxW6GGIlmFoHFa0j1HcoPwA/view?usp=sharing)
2. Extract the downloaded ZIP file.
3. Open Google Chrome → go to Extensions → Manage Extensions.
4. Turn ON Developer Mode (top-right corner).
5. After enabling it, you’ll see the Load Unpacked option at the top-left corner.
6. Click Load Unpacked.
7. Navigate to the folder where you extracted the ZIP file and select the DIST folder.
8. Videomation Pro will now be added to your Chrome browser.
9. Make sure to pin the extension for easy access.

Now open your Coursera or L&T courses, and you’ll see:
• All videos getting skipped with realistic human delays
• Quiz questions along with all options extracted properly

You can simply copy the extracted text and paste it into chat assistants like ChatGPT, Gemini, Grok, etc. to get the answers.

Yes, Comet Browser can do these things even faster, but it requires Perplexity Pro for those features. So using Videomation Pro is a solid and free alternative.

Honestly, this extension helps a lot while completing courses on both Coursera & L&T platforms.

If you want to try this extension, please use the Drive link provided.
Also, make sure to share this demo video and Drive link with your classmates and friends who really need this.

If any issue occurs with the extension, please reload the page multiple times so the DOM scripts refresh properly and work smoothly.


I’d really appreciate your feedback and any future bug reports.  
Please feel free to DM me anytime.  
threaddev.in@gmail.com  
mokshithgoudpolwp@gmail.com


---

Made with ♥️ by ThreadDev  
ThreadDev is a student-led online agency where we build websites for businesses.  
Visit our website: [threaddev.in](https://threaddev.in)

##  Features

### 🎬 Video Automation
- **Smart Detection**: Automatically detects video lectures on Coursera and L&T EduTech
- **Human-like Behavior**: Plays first few seconds, then seeks to end with random playback speeds (1.25x - 1.75x)
- **Auto-progression**: Automatically clicks "Next" button after video completion
- **Pause/Resume Control**: Full control with pause and resume functionality
- **Real-time Progress**: Live tracking via Dynamic Island UI

###  Quiz Extraction (Quiz Mode)
- **Auto-detect Quizzes**: Detects quiz pages on both Coursera and L&T
- **Question + Options**: Extracts questions with A) B) C) D) formatted options
- **One-click Copy**: Easy copy button for single questions
- **Multi-question Support**: Handles both single and multiple question quizzes

###  Reading Items (Coursera)
- **Auto-complete**: Automatically clicks "Mark as Complete" button
- **Fast Processing**: Quick completion with minimal delays

###  Dynamic Island UI
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

##  Installation

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

##  Supported Platforms

| Platform | Video Skip | Quiz Extract | 
|----------|:----------:|:------------:|
| Coursera | ✅ | ✅ | 
| L&T EduTech | ✅ | ✅ | 


## 🛠️ Tech Stack

- **React 19** + **TypeScript**
- **Vite** - Fast build tool
- **Tailwind CSS 4** + **shadcn/ui**
- **Chrome Extension Manifest V3**


## ⚠️ Disclaimer

This extension is for **educational purposes only**. Use responsibly and in accordance with platform terms of service.
This is a non-profit extension. I got nothing from this.
It’s more like an open-source tool for college students.


## License

MIT License


<p align="center">Built with ❤️ for college students By threaddev.in</p>
