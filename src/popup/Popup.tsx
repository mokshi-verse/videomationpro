import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  Clock,
  ChevronRight,
  Zap,
  CheckCircle2,
  Info,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { TooltipProvider } from '../components/ui/tooltip';
import { getSettings, getStats } from '../lib/storage';
import { formatTimeSaved } from '../lib/utils';
import type { ExtensionSettings, ExtensionStats } from '../types';
import { defaultSettings, defaultStats } from '../types';

const Popup: React.FC = () => {
  const [settings, setSettings] = useState<ExtensionSettings>(defaultSettings);
  const [stats, setStats] = useState<ExtensionStats>(defaultStats);
  const [showAbout, setShowAbout] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();

    // Listen for storage changes to update stats in real-time
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local' && changes['videoMationPro_stats']) {
        const newStats = changes['videoMationPro_stats'].newValue as ExtensionStats;
        if (newStats) {
          setStats(newStats);
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    // Refresh stats every 2 seconds to catch any updates
    const interval = setInterval(async () => {
      const latestStats = await getStats();
      setStats(latestStats);
    }, 2000);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const loadData = async () => {
    try {
      const [loadedSettings, loadedStats] = await Promise.all([
        getSettings(),
        getStats(),
      ]);
      setSettings(loadedSettings);
      setStats(loadedStats);
    } catch {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-[340px] min-w-[280px] max-w-full h-[340px] bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Zap className="w-8 h-8 text-slate-400" />
        </motion.div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="w-[340px] min-w-[280px] max-w-full h-[320px] bg-black overflow-hidden min-h-0 font-poppins">
        <AnimatePresence mode="wait">
          {!showAbout ? (
            <motion.div
              key="main"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex flex-col"
            >
              {/* Header */}
              <div className="px-4 pt-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-black border border-white/20 flex items-center justify-center overflow-hidden">
                      <img 
                        src="/icons/icon128.png" 
                        alt="Video Mation Pro"
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          // Fallback to Zap icon if image fails
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = '<svg class="w-4 h-4 text-white fill-white" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>';
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white">Video Mation Pro</h1>
                    <p className="text-[11px] text-slate-400">Video Automation</p>
                  </div>
                  {settings.enabled && (
                    <Badge variant="secondary" className="ml-auto bg-green-500/20 text-green-400 border-green-500/30 text-[11px] px-2 py-0.5">
                      Active
                    </Badge>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="p-4 space-y-3">
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardContent className="p-3">
                    <p className="text-[11px] text-slate-400 mb-2">Performance Stats</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-black/50 rounded-lg p-3 border border-slate-800">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Video className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[11px] text-slate-400">Videos</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{stats.videosCompleted}</p>
                      </div>
                      <div className="bg-black/50 rounded-lg p-3 border border-slate-800">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[11px] text-slate-400">Time Saved</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{formatTimeSaved(stats.timeSavedMinutes)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* About Button */}
                <Button
                  onClick={() => setShowAbout(true)}
                  variant="outline"
                  className="w-full h-10 bg-black border-slate-800 hover:bg-slate-900 text-white cursor-pointer text-[13px]"
                >
                  <Info className="w-3.5 h-3.5 mr-2" />
                  About
                  <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                </Button>

                {/* Footer */}
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Coursera + L&T Supported</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="about"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex flex-col"
            >
              {/* About Header */}
              <div className="px-4 pt-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setShowAbout(false)}
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-slate-400 cursor-pointer hover:text-white hover:bg-white/10"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </Button>
                  <h1 className="text-lg font-bold text-white">About</h1>
                </div>
              </div>

              {/* About Content */}
              <div className="p-4 space-y-3">
                {/* Features Card */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardContent className="p-3">
                    <p className="text-[13px] font-semibold text-white mb-2">Features</p>
                    <div className="space-y-2 text-[12px] text-slate-400">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />
                        <span>Supports Coursera & L&T courses</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />
                        <span>Random delays simulate human behavior</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />
                        <span>Auto-skip videos with smart detection</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* ThreadDev Card */}
                <Card 
                  className="bg-slate-900/50 border-slate-800 cursor-pointer hover:border-slate-700 transition-colors"
                  onClick={() => window.open('https://threaddev.in', '_blank')}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden">
                        <img 
                          src="/icons/threaddev_logo.png" 
                          alt="ThreadDev" 
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] font-semibold text-white flex items-center gap-1.5">
                          ThreadDev.in
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Our first online agency. Visit our website!
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Version */}
                <div className="flex items-center justify-center text-[12px] text-slate-500">
                  <span>Version 1.0.0 • Made with ♥️</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
};

export default Popup;
