import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Interval, SavedTimer, IntervalType, TimerMode } from '../types';
import Section from './Section';
import CollapsibleSection from './CollapsibleSection';
import IconButton from './IconButton';
import Popover from './Popover';
import InfoIcon from './InfoIcon';
import TumblerPicker from './TumblerPicker';

// --- CONSTANTS ---
const INTERVAL_COLORS: Record<IntervalType, string> = {
  prep: 'bg-yellow-400',
  work: 'bg-red-500',
  rest: 'bg-green-500',
  cooldown: 'bg-blue-500',
};

const DEFAULT_ALERT_TIMINGS = [10, 3, 2, 1];

// --- AUDIO UTILITY ---
const audioManager = (() => {
  let audioContext: AudioContext | null = null;
  const init = () => {
    if (!audioContext && typeof window !== 'undefined') {
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.error("Web Audio API is not supported in this browser");
      }
    }
  };
  const playSound = (type: 'short' | 'long' | 'extra-long', volume: number) => {
    init();
    if (!audioContext) return; // Guard early

    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const compressor = audioContext.createDynamicsCompressor();

    // Aggressive compressor settings for punch
    compressor.threshold.setValueAtTime(-50, audioContext.currentTime);
    compressor.knee.setValueAtTime(40, audioContext.currentTime);
    compressor.ratio.setValueAtTime(12, audioContext.currentTime);
    compressor.attack.setValueAtTime(0, audioContext.currentTime); // Instant attack
    compressor.release.setValueAtTime(0.25, audioContext.currentTime);

    // Chain: Oscillator -> Compressor -> Gain -> Destination
    oscillator.connect(compressor);
    compressor.connect(gainNode);
    gainNode.connect(audioContext.destination);

    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    
    let frequency: number;
    let duration: number;

    switch (type) {
        case 'short':
            frequency = 880;
            duration = 0.1;
            break;
        case 'extra-long':
            frequency = 440;
            duration = 0.8;
            break;
        case 'long':
        default:
            frequency = 440;
            duration = 0.4;
            break;
    }
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'square'; // Use a square wave for a richer, louder tone
    
    oscillator.start(audioContext.currentTime);
    
    // Still use ramp for a clean fade-out to prevent clicks
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + duration);
    oscillator.stop(audioContext.currentTime + duration);
  };
  return { playSound };
})();

// --- SPEECH UTILITY ---
const speechManager = (() => {
  // Cache for pre-created utterances to avoid delays
  const utteranceCache: Map<string, SpeechSynthesisUtterance> = new Map();

  const ensureVoicesLoaded = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    // Try to load voices - on mobile this might return empty array initially
    // This call triggers voice loading on browsers that support it
    window.speechSynthesis.getVoices();
  };

  const selectVoice = (voiceGender: 'male' | 'female'): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

    const voices = window.speechSynthesis.getVoices();

    // If no voices available yet, return null and rely on default voice
    if (voices.length === 0) return null;

    // Filter for English voices
    const englishVoices = voices.filter(voice =>
      voice.lang.startsWith('en-') || voice.lang === 'en'
    );

    if (englishVoices.length === 0) return null;

    if (voiceGender === 'female') {
      // Priority order for female voices:
      // 1. Kate (macOS)
      // 2. Microsoft Libby (Windows)
      // 3. en-GB-female variants (Android)
      // 4. Other female voices
      const priorityVoices = ['kate', 'libby'];

      // Try priority voices first
      for (const priority of priorityVoices) {
        const voice = englishVoices.find(v =>
          v.name.toLowerCase().includes(priority)
        );
        if (voice) return voice;
      }

      // Try en-GB female variants (Android)
      const gbFemale = englishVoices.find(v =>
        v.lang.includes('en-GB') && v.name.toLowerCase().includes('female')
      );
      if (gbFemale) return gbFemale;

      // Fallback to any female voice
      const femaleKeywords = ['female', 'woman', 'samantha', 'victoria', 'karen', 'moira', 'tessa', 'fiona'];
      const anyFemale = englishVoices.find(voice =>
        femaleKeywords.some(keyword => voice.name.toLowerCase().includes(keyword))
      );
      if (anyFemale) return anyFemale;
    } else {
      // Male voice selection (keep existing logic)
      const maleKeywords = ['male', 'man', 'daniel', 'fred', 'thomas', 'oliver', 'rishi'];
      const preferredVoice = englishVoices.find(voice =>
        maleKeywords.some(keyword => voice.name.toLowerCase().includes(keyword))
      );
      if (preferredVoice) return preferredVoice;
    }

    // Return first English voice or any voice as fallback
    return englishVoices[0] || voices[0] || null;
  };

  const createUtterance = (text: string, volume: number, voiceGender: 'male' | 'female'): SpeechSynthesisUtterance => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = volume;

    // Apply gender-specific voice characteristics
    if (voiceGender === 'female') {
      utterance.pitch = 0.85;  // Slightly lower, warmer tone
      utterance.rate = 0.9;    // Unhurried, calm pacing
      utterance.lang = 'en-GB'; // British English for Kate/Libby
    } else {
      utterance.pitch = 1.0;   // Default pitch for male
      utterance.rate = 1.0;    // Default rate for male
      utterance.lang = 'en-US'; // American English
    }

    const selectedVoice = selectVoice(voiceGender);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    return utterance;
  };

  // Pre-cache utterances for countdown numbers to eliminate delay
  const preCacheNumbers = (volume: number, voiceGender: 'male' | 'female') => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    // Clear old cache
    utteranceCache.clear();

    // Pre-create utterances for numbers 1-60
    for (let i = 1; i <= 60; i++) {
      const cacheKey = `${i}-${voiceGender}`;
      const utterance = createUtterance(String(i), volume, voiceGender);
      utteranceCache.set(cacheKey, utterance);
    }
  };

  const speak = (text: string, volume: number, voiceGender: 'male' | 'female' = 'female') => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Cancel any ongoing speech to prevent queue buildup (important for mobile)
    window.speechSynthesis.cancel();

    // Re-check voices are loaded (important for mobile browsers)
    ensureVoicesLoaded();

    // Try to use cached utterance for numbers
    const cacheKey = `${text}-${voiceGender}`;
    let utterance = utteranceCache.get(cacheKey);

    // If not in cache, create new utterance
    if (!utterance) {
      utterance = createUtterance(text, volume, voiceGender);
    } else {
      // Update volume for cached utterance (in case it changed)
      utterance.volume = volume;
    }

    window.speechSynthesis.speak(utterance);
  };

  // Initialize speech synthesis for mobile browsers (must be called from user interaction)
  const initialize = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    // Force voice loading - important for mobile browsers
    window.speechSynthesis.getVoices();

    // On iOS, we need to call speak() from a user gesture to initialize
    // Speak an empty utterance to wake up the speech synthesis
    const utterance = new SpeechSynthesisUtterance('');
    utterance.volume = 0;
    window.speechSynthesis.speak(utterance);

    // Immediately cancel to prevent any sound
    setTimeout(() => {
      window.speechSynthesis.cancel();
      ensureVoicesLoaded();
    }, 10);
  };

  // Initialize voices on load
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    // On mobile (especially iOS), voices load asynchronously
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      ensureVoicesLoaded();
    });

    // Try initial load (works on desktop, returns empty on mobile initially)
    ensureVoicesLoaded();
  }

  return { speak, initialize, preCacheNumbers };
})();


// --- CUSTOM HOOKS ---
const useIsMobile = (breakpoint = 768) => {
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < breakpoint : false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        const handleResize = () => {
            setIsMobile(window.innerWidth < breakpoint);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [breakpoint]);

    return isMobile;
};

const useWakeLock = () => {
  const wakeLockRef = useRef<any>(null);
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch (err) {
        console.error(`${(err as Error).name}, ${(err as Error).message}`);
      }
    }
  };
  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };
  useEffect(() => {
    return () => { releaseWakeLock(); };
  }, []);
  return { requestWakeLock, releaseWakeLock };
};

const useTimer = ({ intervals, rounds, onComplete, onIntervalChange, alertTimings, alertVolume, useSpeech, voiceGender }: {
    intervals: Interval[],
    rounds: number,
    onComplete: () => void,
    onIntervalChange: (intervalIndex: number, round: number) => void,
    alertTimings: number[],
    alertVolume: number,
    useSpeech: boolean,
    voiceGender: 'male' | 'female'
}) => {
  const [status, setStatus] = useState<'idle' | 'running' | 'paused'>('idle');
  const [currentIntervalIndex, setCurrentIntervalIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(intervals[0]?.duration || 0);

  const timerRef = useRef<number | null>(null);
  const hiddenAtRef = useRef<number | null>(null);

  const totalWorkoutTime = useMemo(() => {
    const totalIntervalsTime = intervals.reduce((sum, i) => sum + i.duration, 0);
    return totalIntervalsTime * rounds;
  }, [intervals, rounds]);

  const timeElapsed = useMemo(() => {
    let elapsed = 0;
    if (rounds > 1) {
        const singleRoundTime = intervals.reduce((sum, i) => sum + i.duration, 0);
        if (currentRound > 1) elapsed += (currentRound - 1) * singleRoundTime;
    }
    for (let i = 0; i < currentIntervalIndex; i++) {
      elapsed += intervals[i].duration;
    }
    const currentIntervalDuration = intervals[currentIntervalIndex]?.duration || 0;
    elapsed += (currentIntervalDuration - timeLeft);
    return elapsed;
  }, [currentRound, currentIntervalIndex, timeLeft, intervals, rounds]);

  const stopTicking = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const nextInterval = useCallback(() => {
    onIntervalChange(currentIntervalIndex, currentRound);
    if (currentIntervalIndex < intervals.length - 1) {
      const nextIndex = currentIntervalIndex + 1;
      setCurrentIntervalIndex(nextIndex);
      setTimeLeft(intervals[nextIndex].duration);
    } else if (currentRound < rounds) {
      const nextRound = currentRound + 1;
      setCurrentRound(nextRound);
      setCurrentIntervalIndex(0);
      setTimeLeft(intervals[0].duration);
    } else {
      stopTicking();
      setStatus('idle');
      onComplete();
    }
  }, [currentIntervalIndex, currentRound, intervals, rounds, onComplete, onIntervalChange, stopTicking]);
  
  const previousInterval = useCallback(() => {
    onIntervalChange(currentIntervalIndex, currentRound);
    if (currentIntervalIndex > 0) {
        const prevIndex = currentIntervalIndex - 1;
        setCurrentIntervalIndex(prevIndex);
        setTimeLeft(intervals[prevIndex].duration);
    } else if (currentRound > 1) {
        const prevRound = currentRound - 1;
        const prevIndex = intervals.length - 1;
        setCurrentRound(prevRound);
        setCurrentIntervalIndex(prevIndex);
        setTimeLeft(intervals[prevIndex].duration);
    } else {
        // At the very beginning, just reset the current timer
        setTimeLeft(intervals[0].duration);
    }
  }, [currentIntervalIndex, currentRound, intervals, onIntervalChange]);

  const startTicking = useCallback(() => {
    stopTicking();
    if (document.visibilityState === 'visible') {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          const newValue = prev - 1;

          // Trigger speech/beep immediately for the NEW value before React updates display
          // This ensures audio starts processing at the exact moment of countdown
          if (alertTimings.includes(newValue)) {
            if (useSpeech) {
              speechManager.speak(String(newValue), alertVolume, voiceGender);
            } else {
              audioManager.playSound('long', alertVolume);
            }
          }

          if (prev <= 1) {
            // Always play the extra-long beep at 0 seconds, even in voice mode
            audioManager.playSound('extra-long', alertVolume);
            nextInterval();
            return 0;
          }
          return newValue;
        });
      }, 1000);
    }
  }, [stopTicking, nextInterval, alertTimings, alertVolume, useSpeech, voiceGender]);
  
  // Main effect to control the timer based on status
  useEffect(() => {
    if (status === 'running') {
      startTicking();
    } else {
      stopTicking();
    }
    return stopTicking;
  }, [status, startTicking, stopTicking]);

  // Effect for handling page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (status === 'running') {
          hiddenAtRef.current = Date.now();
          stopTicking();
        }
      } else { // 'visible'
        if (status === 'running' && hiddenAtRef.current) {
          const elapsedSeconds = Math.floor((Date.now() - hiddenAtRef.current) / 1000);
          hiddenAtRef.current = null;

          if (elapsedSeconds > 0) {
            let newTimeLeft = timeLeft;
            let newIntervalIndex = currentIntervalIndex;
            let newRound = currentRound;
            let timeToAdvance = elapsedSeconds;

            while (timeToAdvance > 0 && !(newRound > rounds)) {
              if (timeToAdvance >= newTimeLeft) {
                timeToAdvance -= newTimeLeft;

                if (newIntervalIndex < intervals.length - 1) {
                  newIntervalIndex++;
                } else if (newRound < rounds) {
                  newRound++;
                  newIntervalIndex = 0;
                } else {
                  newRound++; // This will end the loop
                  break;
                }
                newTimeLeft = intervals[newIntervalIndex].duration;
              } else {
                newTimeLeft -= timeToAdvance;
                timeToAdvance = 0;
              }
            }
            
            if (newRound > rounds) {
                onComplete();
                return;
            }

            setTimeLeft(newTimeLeft);
            setCurrentIntervalIndex(newIntervalIndex);
            setCurrentRound(newRound);
            onIntervalChange(newIntervalIndex, newRound);
          }
          
          startTicking();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [status, timeLeft, currentIntervalIndex, currentRound, rounds, intervals, onComplete, startTicking, stopTicking, onIntervalChange]);

  useEffect(() => {
      setTimeLeft(intervals[0]?.duration || 0);
      setCurrentIntervalIndex(0);
      setCurrentRound(1);
  }, [intervals, rounds]);

  const start = () => setStatus('running');
  const pause = () => setStatus('paused');
  const reset = () => {
    setStatus('idle');
    setCurrentIntervalIndex(0);
    setCurrentRound(1);
    setTimeLeft(intervals[0]?.duration || 0);
  };
  const skip = () => {
    if (status === 'idle') return;
    nextInterval();
  };
  const back = () => {
    if (status === 'idle') return;
    previousInterval();
  };

  return { status, start, pause, reset, skip, back, currentIntervalIndex, currentRound, timeLeft, timeElapsed, totalWorkoutTime };
};

// --- HELPER & UI COMPONENTS ---

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
};

const TimeInput = ({ value, onChange }: { value: number, onChange: (value: number) => void }) => {
    const [minutes, setMinutes] = useState(Math.floor(value / 60));
    const [seconds, setSeconds] = useState(value % 60);

    useEffect(() => {
        setMinutes(Math.floor(value / 60));
        setSeconds(value % 60);
    }, [value]);

    const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMinutes = parseInt(e.target.value) || 0;
        setMinutes(newMinutes);
        onChange(newMinutes * 60 + seconds);
    };
    const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newSeconds = parseInt(e.target.value) || 0;
        setSeconds(newSeconds);
        onChange(minutes * 60 + newSeconds);
    };

    return (
        <div className="flex items-center gap-1 bg-white dark:bg-slate-700 p-1 rounded-md border border-slate-300 dark:border-slate-600">
            <input type="number" value={minutes.toString().padStart(2, '0')} onChange={handleMinutesChange} className="w-12 text-center bg-transparent focus:outline-none text-slate-900 dark:text-slate-50" aria-label="Minutes" />
            <span className="font-bold text-slate-900 dark:text-slate-50">:</span>
            <input type="number" value={seconds.toString().padStart(2, '0')} onChange={handleSecondsChange} max="59" className="w-12 text-center bg-transparent focus:outline-none text-slate-900 dark:text-slate-50" aria-label="Seconds" />
        </div>
    );
};

// --- Mobile Tumbler Picker Components ---

const TumblerTimePicker = ({ value, onChange }: { value: number; onChange: (newValue: number) => void }) => {
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;

    const minuteValues = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);
    const secondValues = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);
    
    const handleMinutesChange = (newMinutes: number | string) => {
        onChange(Number(newMinutes) * 60 + seconds);
    };

    const handleSecondsChange = (newSeconds: number | string) => {
        onChange(minutes * 60 + Number(newSeconds));
    };

    return (
        <div className="flex justify-center items-center">
            <TumblerPicker 
                values={minuteValues}
                currentValue={minutes}
                onChange={handleMinutesChange}
                label="min"
                itemHeight={40}
                containerHeight={120}
            />
            <TumblerPicker 
                values={secondValues}
                currentValue={seconds}
                onChange={handleSecondsChange}
                label="sec"
                itemHeight={40}
                containerHeight={120}
            />
        </div>
    );
};

const TumblerSetsPicker = ({ value, onChange }: { value: number; onChange: (newValue: number) => void }) => {
    const setValues = useMemo(() => Array.from({ length: 99 }, (_, i) => i + 1), []);

    return (
        <div className="flex justify-center items-center">
            <TumblerPicker
                values={setValues}
                currentValue={value}
                onChange={(val) => onChange(Number(val))}
                label="sets"
                itemHeight={40}
                containerHeight={120}
            />
        </div>
    );
};

const TumblerAlertPicker = ({ value, onChange }: { value: number | null; onChange: (newValue: number | null) => void }) => {
    // 0 represents "empty/disabled", then 1-60 for actual seconds
    const alertValues = useMemo(() => [0, ...Array.from({ length: 60 }, (_, i) => i + 1)], []);

    return (
        <div className="flex justify-center items-center">
            <TumblerPicker
                values={alertValues}
                currentValue={value ?? 0}
                onChange={(val) => {
                    const numVal = Number(val);
                    onChange(numVal === 0 ? null : numVal);
                }}
                label="sec"
                itemHeight={40}
                containerHeight={120}
            />
        </div>
    );
};

const VolumeControl = ({ volume, onVolumeChange }: { volume: number; onVolumeChange: (v: number) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);
    
    return (
        <div className="relative" ref={popoverRef}>
            <button onClick={() => setIsOpen(prev => !prev)} className="p-3 rounded-lg bg-black/30 text-white" aria-label="Adjust volume">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 bg-black/50 backdrop-blur-sm p-4 rounded-lg w-48 animate-popIn z-10">
                    <label htmlFor="active-timer-volume" className="block text-sm font-medium mb-2">Volume</label>
                    <input
                        id="active-timer-volume"
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                        className="w-full"
                    />
                </div>
            )}
        </div>
    );
};

const TimerDisplay = ({ 
    status,
    currentInterval,
    nextInterval,
    timeLeft,
    currentRound,
    rounds,
    timeElapsed,
    totalWorkoutTime,
    onStart,
    onPause,
    onReset,
    onSkip,
    onBack,
    onExit,
    alertVolume,
    onVolumeChange
}: any) => {

    const currentIntervalProgress = (currentInterval.duration - timeLeft) / currentInterval.duration * 100;
    const totalProgress = timeElapsed / totalWorkoutTime * 100;

    return (
        <div className={`fixed inset-0 flex flex-col justify-between p-4 md:p-8 transition-colors duration-500 ${currentInterval.color}`} style={{ backgroundColor: currentInterval.color.startsWith('#') ? currentInterval.color : undefined }}>
            <div className="flex justify-between items-start text-white gap-2">
                <div className="text-left bg-black/30 p-3 rounded-lg">
                    <p className="font-semibold text-lg">{currentRound > 1 ? `Round ${currentRound} of ${rounds}`: ''}</p>
                    <p className="text-3xl font-bold">{currentInterval.name}</p>
                    <div className="mt-2 flex gap-2">
                        <IconButton onClick={onBack} variant="secondary" className="!py-1 !px-3 !text-sm">&larr; Back</IconButton>
                        <IconButton onClick={onSkip} variant="info" className="!py-1 !px-3 !text-sm">Skip &rarr;</IconButton>
                    </div>
                </div>
                <div className="flex items-start gap-2">
                    {nextInterval && (
                        <div className="text-right bg-black/30 p-3 rounded-lg opacity-80">
                            <p className="text-sm">NEXT</p>
                            <p className="font-semibold text-xl">{nextInterval.name}</p>
                        </div>
                    )}
                    <VolumeControl volume={alertVolume} onVolumeChange={onVolumeChange} />
                </div>
            </div>

            <div className="text-center">
                <p className="text-white font-mono" style={{ fontSize: 'min(25vw, 200px)', lineHeight: 1 }}>
                    {formatTime(timeLeft)}
                </p>
            </div>

            <div>
                 <div className="mb-4">
                    <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white/80 rounded-full" style={{ width: `${currentIntervalProgress}%` }}></div>
                    </div>
                    <div className="flex justify-between text-white/90 text-sm mt-1">
                        <span>Interval Time</span>
                        <span>{formatTime(timeElapsed)} / {formatTime(totalWorkoutTime)}</span>
                    </div>
                    <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-white/60 rounded-full" style={{ width: `${totalProgress}%` }}></div>
                    </div>
                 </div>

                <div className="flex justify-between items-center gap-4">
                    <IconButton onClick={onReset} variant="secondary">Reset</IconButton>
                    <div className="flex items-center gap-4">
                        {status === 'running' ? (
                            <IconButton onClick={onPause} variant="warning" className="!w-32 !h-16 !text-2xl">Pause</IconButton>
                        ) : (
                            <IconButton onClick={onStart} variant="success" className="!w-32 !h-16 !text-2xl">Start</IconButton>
                        )}
                    </div>
                    <IconButton onClick={onExit} variant="danger">Exit</IconButton>
                </div>
            </div>
        </div>
    );
};

const ManualRestTimer = ({ sets, restTime, onExit, onComplete, alertTimings, alertVolume, useSpeech, voiceGender, onVolumeChange }: { sets: number, restTime: number, onExit: () => void, onComplete: () => void, alertTimings: number[], alertVolume: number, useSpeech: boolean, voiceGender: 'male' | 'female', onVolumeChange: (v: number) => void }) => {
    const [currentSet, setCurrentSet] = useState(1);
    const [timeLeft, setTimeLeft] = useState(restTime);
    const [status, setStatus] = useState<'idle' | 'running' | 'paused'>('idle');
    const timerRef = useRef<number | null>(null);
    const hiddenAtRef = useRef<number | null>(null);

    const startRest = () => {
        if (currentSet > sets) return;
        audioManager.playSound('extra-long', alertVolume);
        setStatus('running');
    };

    const handlePauseResume = () => {
        if (status === 'running') {
            setStatus('paused');
        } else if (status === 'paused') {
            setStatus('running');
        }
    };
    
    const handleSkip = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        audioManager.playSound('extra-long', alertVolume);
        if (currentSet >= sets) {
            onComplete();
        } else {
            setStatus('idle');
            setCurrentSet(s => s + 1);
            setTimeLeft(restTime);
        }
    };

    useEffect(() => {
        if (status !== 'running' || document.visibilityState === 'hidden') {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        timerRef.current = window.setInterval(() => {
            setTimeLeft(prev => {
                const newValue = prev - 1;

                // Trigger speech/beep immediately for the NEW value before React updates display
                // This ensures audio starts processing at the exact moment of countdown
                if (alertTimings.includes(newValue)) {
                    if (useSpeech) {
                        speechManager.speak(String(newValue), alertVolume, voiceGender);
                    } else {
                        audioManager.playSound('long', alertVolume);
                    }
                }

                if (prev <= 1) {
                    audioManager.playSound('extra-long', alertVolume);
                    if (currentSet >= sets) {
                        if (timerRef.current) clearInterval(timerRef.current);
                        onComplete();
                        return 0;
                    } else {
                        setStatus('idle');
                        setCurrentSet(s => s + 1);
                        return restTime;
                    }
                }
                return newValue;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current) };
    }, [status, restTime, alertTimings, currentSet, sets, onComplete, alertVolume, useSpeech, voiceGender]);
    
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                if (status === 'running') {
                    hiddenAtRef.current = Date.now();
                    if (timerRef.current) clearInterval(timerRef.current);
                }
            } else { // 'visible'
                if (status === 'running' && hiddenAtRef.current) {
                    const elapsedSeconds = Math.floor((Date.now() - hiddenAtRef.current) / 1000);
                    hiddenAtRef.current = null;

                    setTimeLeft(prev => {
                        const newTimeLeft = prev - elapsedSeconds;
                        if (newTimeLeft <= 0) {
                             if (currentSet >= sets) {
                                onComplete();
                                return 0;
                            } else {
                                audioManager.playSound('extra-long', alertVolume);
                                setStatus('idle');
                                setCurrentSet(s => s + 1);
                                return restTime;
                            }
                        }
                        return newTimeLeft;
                    });
                }
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [status, restTime, currentSet, sets, onComplete, alertVolume]);

    const bgClass = status === 'running' ? 'bg-blue-600' : status === 'paused' ? 'bg-amber-600' : 'bg-slate-800';

    return (
        <div className={`fixed inset-0 flex flex-col justify-between p-4 md:p-8 transition-colors duration-500 ${bgClass}`}>
            <div className="flex justify-between items-start text-white">
                <div className="text-left bg-black/30 p-3 rounded-lg">
                    <p className="font-semibold text-lg">Manual Rest Timer</p>
                    <p className="text-3xl font-bold">Set {currentSet} of {sets}</p>
                </div>
                <div className="flex items-start gap-2">
                    <VolumeControl volume={alertVolume} onVolumeChange={onVolumeChange} />
                    <IconButton onClick={onExit} variant="danger">Exit</IconButton>
                </div>
            </div>

            <div className="text-center">
                {status === 'idle' ? (
                    <button onClick={startRest} disabled={currentSet > sets} className="w-64 h-64 bg-green-500 hover:bg-green-600 rounded-full text-white text-4xl font-bold shadow-2xl disabled:bg-slate-500 transition-all transform hover:scale-105">
                        {currentSet > sets ? 'Done!' : 'Start Rest'}
                    </button>
                ) : (
                    <div className="flex flex-col items-center gap-6">
                        <p className="text-white font-mono" style={{ fontSize: 'min(25vw, 200px)', lineHeight: 1 }}>
                            {formatTime(timeLeft)}
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <IconButton
                                onClick={handlePauseResume}
                                variant={status === 'running' ? 'warning' : 'success'}
                                className="!w-40 !h-20 !text-2xl"
                            >
                                {status === 'running' ? 'PAUSE' : 'RESUME'}
                            </IconButton>
                             <IconButton
                                onClick={handleSkip}
                                variant="info"
                                className="!w-40 !h-20 !text-2xl"
                            >
                                Skip
                            </IconButton>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="text-center h-16">
                 {status === 'running' && (
                    <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white/80 rounded-full" style={{ width: `${(timeLeft / restTime) * 100}%` }}></div>
                    </div>
                 )}
            </div>
        </div>
    );
};

const ConfigurationScreen = ({
    timerMode, setTimerMode,
    leadIn, setLeadIn, sets, setSets,
    restTime, setRestTime,
    alertVolume, onVolumeChange,
    useSpeech, setUseSpeech,
    voiceGender, setVoiceGender,
    alert1, setAlert1, alert2, setAlert2, alert3, setAlert3,
    alert4, setAlert4, alert5, setAlert5, alert6, setAlert6,
    savedTimers, loadTimer, saveTimer, onImport,
    loadedTimerId,
    onStart,
    onResetConfig,
}: any) => {
    const [timerNameToSave, setTimerNameToSave] = useState('');
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [timerSetupHelpOpen, setTimerSetupHelpOpen] = useState(false);
    const [alertHelpOpen, setAlertHelpOpen] = useState(false);
    const [manageTimersHelpOpen, setManageTimersHelpOpen] = useState(false);
    const loadedTimerName = loadedTimerId ? savedTimers[loadedTimerId]?.name : null;
    const isMobile = useIsMobile();
    const [openPicker, setOpenPicker] = useState<null | 'leadIn' | 'sets' | 'rest' | 'alert1' | 'alert2' | 'alert3' | 'alert4' | 'alert5' | 'alert6'>(null);

    const handleSaveClick = () => {
        if (!timerNameToSave) return;
        saveTimer(timerNameToSave);
        setIsSaveModalOpen(false);
        setTimerNameToSave('');
    };

    const handleExportTimer = () => {
        if (!loadedTimerId || !savedTimers[loadedTimerId]) {
            alert('Please save or load a timer first before exporting.');
            return;
        }

        const timer = savedTimers[loadedTimerId];
        const jsonString = JSON.stringify(timer, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${timer.name.replace(/[^a-z0-9]/gi, '_')}_timer.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleShareTimer = async () => {
        if (!loadedTimerId || !savedTimers[loadedTimerId]) {
            alert('Please save or load a timer first before sharing.');
            return;
        }

        const timer = savedTimers[loadedTimerId];
        const jsonString = JSON.stringify(timer, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const file = new File([blob], `${timer.name.replace(/[^a-z0-9]/gi, '_')}_timer.json`, { type: 'application/json' });

        if (navigator.share && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    title: `Timer: ${timer.name}`,
                    text: `Workout timer configuration for ${timer.name}`,
                    files: [file]
                });
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    console.error('Error sharing:', error);
                    alert('Could not share timer. Please try exporting instead.');
                }
            }
        } else {
            // Fallback to export if Web Share API not supported
            alert('Sharing not supported on this device. Downloading file instead.');
            handleExportTimer();
        }
    };

    const handleCopyToClipboard = async () => {
        if (!loadedTimerId || !savedTimers[loadedTimerId]) {
            alert('Please save or load a timer first before copying.');
            return;
        }

        const timer = savedTimers[loadedTimerId];
        const jsonString = JSON.stringify(timer, null, 2);

        try {
            await navigator.clipboard.writeText(jsonString);
            alert(`Timer "${timer.name}" copied to clipboard! Share this text to send the timer.`);
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            alert('Failed to copy to clipboard. Please try export instead.');
        }
    };

    const handlePasteFromClipboard = async () => {
        try {
            const text = await navigator.clipboard.readText();
            const importedTimer = JSON.parse(text);

            // Validate the timer object
            if (!importedTimer.name || !importedTimer.mode) {
                alert('Invalid timer data. Please copy valid timer JSON and try again.');
                return;
            }

            // Generate new ID to avoid conflicts
            const newTimer = { ...importedTimer, id: crypto.randomUUID() };

            // Use the onImport callback to handle the import
            onImport(newTimer);

            alert(`Timer "${newTimer.name}" imported successfully!`);
        } catch (error) {
            console.error('Error pasting from clipboard:', error);
            alert('Failed to paste timer. Make sure you have copied valid timer JSON to your clipboard.');
        }
    };

    const handleImportTimer = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json,.json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                const text = await file.text();
                const importedTimer = JSON.parse(text);

                // Validate the timer object
                if (!importedTimer.name || !importedTimer.mode) {
                    alert('Invalid timer file. Please check the file and try again.');
                    return;
                }

                // Generate new ID to avoid conflicts
                const newTimer = { ...importedTimer, id: crypto.randomUUID() };

                // Use the onImport callback to handle the import
                onImport(newTimer);

                alert(`Timer "${newTimer.name}" imported successfully!`);
            } catch (error) {
                console.error('Error importing timer:', error);
                alert('Failed to import timer. Please check the file and try again.');
            }
        };
        input.click();
    };

    const isStartDisabled = useMemo(() => {
        const numSets = parseInt(sets);
        const numRestTime = parseInt(restTime);
        if(timerMode === 'manual') return isNaN(numSets) || numSets <= 0 || isNaN(numRestTime) || numRestTime <= 0;
        if(timerMode === 'rolling') return isNaN(numSets) || numSets < 2 || isNaN(numRestTime) || numRestTime <= 0;
        return true;
    }, [sets, restTime, timerMode]);

    const segmentButtonBase = 'px-4 py-2 text-sm font-semibold rounded-md transition-colors focus:outline-none';
    const segmentButtonActive = 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow';
    const segmentButtonInactive = 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-700/50';

    return (
        <div>
             <Section title="Timer Setup" onHelpClick={() => setTimerSetupHelpOpen(true)} headerAction={<IconButton variant="danger" onClick={onResetConfig}>Reset</IconButton>}>
                <div className="md:col-span-2 lg:col-span-3">
                    <div className="mb-6 flex flex-col items-center">
                        <label className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Timer Mode</label>
                        <div className="bg-slate-200 dark:bg-slate-600 p-1 rounded-lg flex flex-wrap justify-center gap-1">
                            <button onClick={() => setTimerMode('rolling')} className={`${segmentButtonBase} ${timerMode === 'rolling' ? segmentButtonActive : segmentButtonInactive}`}>Rolling Rest</button>
                            <button onClick={() => setTimerMode('manual')} className={`${segmentButtonBase} ${timerMode === 'manual' ? segmentButtonActive : segmentButtonInactive}`}>Manual Rest</button>
                        </div>
                    </div>

                    {timerMode === 'rolling' && (
                        <div className={`p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 animate-fadeIn`}>
                            {isMobile ? (
                                <div className="space-y-4">
                                    <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                                        <div onClick={() => setOpenPicker(openPicker === 'leadIn' ? null : 'leadIn')} className="flex justify-between items-center cursor-pointer">
                                            <label className="text-xl font-bold text-slate-700 dark:text-slate-200">Lead-in Time</label>
                                            <span className="text-lg font-semibold text-slate-500 dark:text-slate-400">{formatTime(parseInt(leadIn) || 0)}</span>
                                        </div>
                                        {openPicker === 'leadIn' && <div className="mt-4 animate-fadeIn"><TumblerTimePicker value={parseInt(leadIn) || 0} onChange={val => setLeadIn(String(val))} /></div>}
                                    </div>
                                    <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                                        <div onClick={() => setOpenPicker(openPicker === 'sets' ? null : 'sets')} className="flex justify-between items-center cursor-pointer">
                                            <label className="text-xl font-bold text-slate-700 dark:text-slate-200">Number of Sets</label>
                                            <span className="text-lg font-semibold text-slate-500 dark:text-slate-400">{sets} sets</span>
                                        </div>
                                        {openPicker === 'sets' && <div className="mt-4 animate-fadeIn"><TumblerSetsPicker value={parseInt(sets) || 1} onChange={val => setSets(String(val))} /></div>}
                                    </div>
                                    <div>
                                        <div onClick={() => setOpenPicker(openPicker === 'rest' ? null : 'rest')} className="flex justify-between items-center cursor-pointer">
                                            <label className="text-xl font-bold text-slate-700 dark:text-slate-200">Rest Between Sets</label>
                                            <span className="text-lg font-semibold text-slate-500 dark:text-slate-400">{formatTime(parseInt(restTime) || 0)}</span>
                                        </div>
                                        {openPicker === 'rest' && <div className="mt-4 animate-fadeIn"><TumblerTimePicker value={parseInt(restTime) || 0} onChange={val => setRestTime(String(val))} /></div>}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="font-semibold text-slate-700 dark:text-slate-200">Lead-in Time</label>
                                        <TimeInput value={parseInt(leadIn) || 0} onChange={val => setLeadIn(String(val))} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="font-semibold text-slate-700 dark:text-slate-200">Number of Sets</label>
                                        <input type="number" value={sets} onChange={e => setSets(e.target.value)} onBlur={e => setSets(String(Math.max(1, parseInt(e.target.value) || 1)))} className="w-20 p-2 border rounded-md text-center bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"/>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="font-semibold text-slate-700 dark:text-slate-200">Rest Between Sets</label>
                                        <TimeInput value={parseInt(restTime) || 0} onChange={val => setRestTime(String(val))} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {timerMode === 'manual' && (
                         <div className={`p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 animate-fadeIn`}>
                            {isMobile ? (
                                <div className="space-y-4">
                                     <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                                        <div onClick={() => setOpenPicker(openPicker === 'sets' ? null : 'sets')} className="flex justify-between items-center cursor-pointer">
                                            <label className="text-xl font-bold text-slate-700 dark:text-slate-200">Number of Sets</label>
                                            <span className="text-lg font-semibold text-slate-500 dark:text-slate-400">{sets} sets</span>
                                        </div>
                                        {openPicker === 'sets' && <div className="mt-4 animate-fadeIn"><TumblerSetsPicker value={parseInt(sets) || 1} onChange={val => setSets(String(val))} /></div>}
                                    </div>
                                    <div>
                                        <div onClick={() => setOpenPicker(openPicker === 'rest' ? null : 'rest')} className="flex justify-between items-center cursor-pointer">
                                            <label className="text-xl font-bold text-slate-700 dark:text-slate-200">Rest Time</label>
                                            <span className="text-lg font-semibold text-slate-500 dark:text-slate-400">{formatTime(parseInt(restTime) || 0)}</span>
                                        </div>
                                        {openPicker === 'rest' && <div className="mt-4 animate-fadeIn"><TumblerTimePicker value={parseInt(restTime) || 0} onChange={val => setRestTime(String(val))} /></div>}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="font-semibold text-slate-700 dark:text-slate-200">Number of Sets</label>
                                        <input type="number" value={sets} onChange={e => setSets(e.target.value)} onBlur={e => setSets(String(Math.max(1, parseInt(e.target.value) || 1)))} className="w-20 p-2 border rounded-md text-center bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"/>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="font-semibold text-slate-700 dark:text-slate-200">Rest Time</label>
                                        <TimeInput value={parseInt(restTime) || 0} onChange={val => setRestTime(String(val))} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                     <details className="mt-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <summary className="p-3 cursor-pointer">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">Alert Settings</span>
                                    <InfoIcon onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAlertHelpOpen(true); }} />
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    Beep intervals: <span className="font-medium text-slate-600 dark:text-slate-300">
                                        {[alert1, alert2, alert3, alert4, alert5, alert6]
                                            .filter(v => v !== null)
                                            .sort((a, b) => (b ?? 0) - (a ?? 0))
                                            .join(', ') || 'None'}
                                    </span>
                                </div>
                            </div>
                        </summary>
                        <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Countdown beeps at (seconds):</label>
                            {isMobile ? (
                                <div className="space-y-2">
                                    <div className="grid grid-cols-3 gap-2">
                                        {/* Alert 6 - top left */}
                                        <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
                                            <div onClick={() => setOpenPicker(openPicker === 'alert6' ? null : 'alert6')} className="flex justify-between items-center cursor-pointer">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Alert 6</label>
                                                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{alert6 ?? '-'}</span>
                                            </div>
                                            {openPicker === 'alert6' && <div className="mt-2 animate-fadeIn"><TumblerAlertPicker value={alert6} onChange={setAlert6} /></div>}
                                        </div>
                                        {/* Alert 5 */}
                                        <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
                                            <div onClick={() => setOpenPicker(openPicker === 'alert5' ? null : 'alert5')} className="flex justify-between items-center cursor-pointer">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Alert 5</label>
                                                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{alert5 ?? '-'}</span>
                                            </div>
                                            {openPicker === 'alert5' && <div className="mt-2 animate-fadeIn"><TumblerAlertPicker value={alert5} onChange={setAlert5} /></div>}
                                        </div>
                                        {/* Alert 4 */}
                                        <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
                                            <div onClick={() => setOpenPicker(openPicker === 'alert4' ? null : 'alert4')} className="flex justify-between items-center cursor-pointer">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Alert 4</label>
                                                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{alert4 ?? '-'}</span>
                                            </div>
                                            {openPicker === 'alert4' && <div className="mt-2 animate-fadeIn"><TumblerAlertPicker value={alert4} onChange={setAlert4} /></div>}
                                        </div>
                                        {/* Alert 3 */}
                                        <div className="pb-2">
                                            <div onClick={() => setOpenPicker(openPicker === 'alert3' ? null : 'alert3')} className="flex justify-between items-center cursor-pointer">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Alert 3</label>
                                                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{alert3 ?? '-'}</span>
                                            </div>
                                            {openPicker === 'alert3' && <div className="mt-2 animate-fadeIn"><TumblerAlertPicker value={alert3} onChange={setAlert3} /></div>}
                                        </div>
                                        {/* Alert 2 */}
                                        <div className="pb-2">
                                            <div onClick={() => setOpenPicker(openPicker === 'alert2' ? null : 'alert2')} className="flex justify-between items-center cursor-pointer">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Alert 2</label>
                                                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{alert2 ?? '-'}</span>
                                            </div>
                                            {openPicker === 'alert2' && <div className="mt-2 animate-fadeIn"><TumblerAlertPicker value={alert2} onChange={setAlert2} /></div>}
                                        </div>
                                        {/* Alert 1 - bottom right */}
                                        <div className="pb-2">
                                            <div onClick={() => setOpenPicker(openPicker === 'alert1' ? null : 'alert1')} className="flex justify-between items-center cursor-pointer">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Alert 1</label>
                                                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{alert1 ?? '-'}</span>
                                            </div>
                                            {openPicker === 'alert1' && <div className="mt-2 animate-fadeIn"><TumblerAlertPicker value={alert1} onChange={setAlert1} /></div>}
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Tap an alert to set its value. Set to 0 to disable.</p>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex gap-2 justify-between">
                                        <div className="flex-1">
                                            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Alert 6</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="60"
                                                value={alert6 ?? ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setAlert6(val === '' ? null : Math.max(0, Math.min(60, parseInt(val) || 0)));
                                                }}
                                                placeholder="-"
                                                className="w-full p-2 border rounded-md text-center bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 text-sm"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Alert 5</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="60"
                                                value={alert5 ?? ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setAlert5(val === '' ? null : Math.max(0, Math.min(60, parseInt(val) || 0)));
                                                }}
                                                placeholder="-"
                                                className="w-full p-2 border rounded-md text-center bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 text-sm"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Alert 4</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="60"
                                                value={alert4 ?? ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setAlert4(val === '' ? null : Math.max(0, Math.min(60, parseInt(val) || 0)));
                                                }}
                                                placeholder="-"
                                                className="w-full p-2 border rounded-md text-center bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 text-sm"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Alert 3</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="60"
                                                value={alert3 ?? ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setAlert3(val === '' ? null : Math.max(0, Math.min(60, parseInt(val) || 0)));
                                                }}
                                                placeholder="-"
                                                className="w-full p-2 border rounded-md text-center bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 text-sm"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Alert 2</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="60"
                                                value={alert2 ?? ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setAlert2(val === '' ? null : Math.max(0, Math.min(60, parseInt(val) || 0)));
                                                }}
                                                placeholder="-"
                                                className="w-full p-2 border rounded-md text-center bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 text-sm"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Alert 1</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="60"
                                                value={alert1 ?? ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setAlert1(val === '' ? null : Math.max(0, Math.min(60, parseInt(val) || 0)));
                                                }}
                                                placeholder="-"
                                                className="w-full p-2 border rounded-md text-center bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 text-sm"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Enter alert times in seconds (0-60). Leave empty or set to 0 to disable an alert.</p>
                                </div>
                            )}
                        </div>
                        <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                            <label htmlFor="alert-volume" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Alert Volume</label>
                            <input
                                id="alert-volume"
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={alertVolume}
                                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                                className="w-full"
                            />
                        </div>
                        <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <label htmlFor="use-speech" className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                    Use Speech
                                </label>
                                <button
                                    id="use-speech"
                                    onClick={() => {
                                        // If turning speech ON, initialize it (important for mobile browsers)
                                        if (!useSpeech) {
                                            speechManager.initialize();
                                            // Pre-cache numbers for instant playback
                                            setTimeout(() => {
                                                speechManager.preCacheNumbers(alertVolume, voiceGender);
                                            }, 100);
                                        }
                                        setUseSpeech(!useSpeech);
                                    }}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 ${
                                        useSpeech ? 'bg-green-600' : 'bg-slate-300 dark:bg-slate-600'
                                    }`}
                                    role="switch"
                                    aria-checked={useSpeech}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            useSpeech ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {useSpeech ? 'Numbers will be spoken instead of beeps' : 'Use beep sounds for alerts'}
                                </p>
                                {useSpeech && (
                                    <button
                                        onClick={() => speechManager.speak('3', alertVolume, voiceGender)}
                                        className="text-xs px-2 py-1 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 rounded transition-colors"
                                    >
                                        Test Speech
                                    </button>
                                )}
                            </div>
                        </div>
                        {useSpeech && (
                            <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Voice Gender</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setVoiceGender('female');
                                            localStorage.setItem('workout_timer_voice_gender', 'female');
                                            // Pre-cache numbers with new voice gender
                                            setTimeout(() => {
                                                speechManager.preCacheNumbers(alertVolume, 'female');
                                            }, 100);
                                        }}
                                        className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                                            voiceGender === 'female'
                                                ? 'bg-green-600 text-white'
                                                : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-500'
                                        }`}
                                    >
                                        Female
                                    </button>
                                    <button
                                        onClick={() => {
                                            setVoiceGender('male');
                                            localStorage.setItem('workout_timer_voice_gender', 'male');
                                            // Pre-cache numbers with new voice gender
                                            setTimeout(() => {
                                                speechManager.preCacheNumbers(alertVolume, 'male');
                                            }, 100);
                                        }}
                                        className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                                            voiceGender === 'male'
                                                ? 'bg-green-600 text-white'
                                                : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-500'
                                        }`}
                                    >
                                        Male
                                    </button>
                                </div>
                            </div>
                        )}
                    </details>
                </div>
            </Section>
            
             <div className="mt-8 flex justify-center">
                <button onClick={onStart} disabled={isStartDisabled} className="w-full max-w-xs py-4 px-8 bg-green-600 hover:bg-green-700 text-white font-bold text-2xl rounded-lg shadow-lg transition-transform transform hover:scale-105 disabled:bg-slate-400 disabled:cursor-not-allowed">
                    START WORKOUT
                </button>
            </div>

            <div className="mt-8">
                <CollapsibleSection title="Manage Timers" onHelpClick={() => setManageTimersHelpOpen(true)}>
                     {loadedTimerName && (
                        <div className="text-center p-3 mb-4 bg-slate-100 dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                Currently editing:
                            </span>
                            <span className="ml-1 font-bold text-slate-800 dark:text-slate-100">
                                {loadedTimerName}
                            </span>
                        </div>
                    )}
                     <div className="flex gap-2 mb-3">
                        <select value={loadedTimerId || ''} onChange={e => loadTimer(e.target.value)} className="flex-grow p-2 border rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 border-slate-300 dark:border-slate-600">
                            <option value="">-- New Timer --</option>
                            {Object.values(savedTimers).map((t: any) => <option key={t.id} value={t.id}>{t.name} ({t.mode})</option>)}
                        </select>
                        <IconButton onClick={() => setIsSaveModalOpen(true)}>Save As...</IconButton>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3">
                        <IconButton onClick={handleExportTimer} variant="secondary">
                            Export
                        </IconButton>
                        <IconButton onClick={handleShareTimer} variant="secondary">
                            Share
                        </IconButton>
                        <IconButton onClick={handleImportTimer} variant="secondary">
                            Import
                        </IconButton>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <IconButton onClick={handleCopyToClipboard} variant="info" className="!text-sm">
                            📋 Copy JSON
                        </IconButton>
                        <IconButton onClick={handlePasteFromClipboard} variant="info" className="!text-sm">
                            📋 Paste JSON
                        </IconButton>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        Export/Share to send timer to clients. Import to load a shared timer.
                        <br />
                        <strong>Safari Mobile:</strong> Use Copy/Paste JSON buttons - copy the timer, share via text/email, then paste to import.
                    </p>
                </CollapsibleSection>
            </div>
        
            {isSaveModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-700 p-6 rounded-lg shadow-xl">
                        <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-100">Save Timer</h3>
                        <input type="text" value={timerNameToSave} onChange={e => setTimerNameToSave(e.target.value)} placeholder="Enter timer name" className="w-full p-2 border rounded mb-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 border-slate-300 dark:border-slate-600" autoFocus/>
                        <div className="flex justify-end gap-2">
                            <IconButton onClick={() => setIsSaveModalOpen(false)} variant="secondary">Cancel</IconButton>
                            <IconButton onClick={handleSaveClick}>Save</IconButton>
                        </div>
                    </div>
                </div>
            )}

            <Popover
                isOpen={timerSetupHelpOpen}
                onClose={() => setTimerSetupHelpOpen(false)}
                title="Timer Setup Help"
            >
                <div className="text-sm space-y-2">
                    <p><strong>Timer Mode:</strong></p>
                    <ul className="list-disc list-inside ml-2 space-y-1">
                        <li><strong>Rolling Rest:</strong> Timer starts automatically after each set. When rest time ends, a new set begins immediately.</li>
                        <li><strong>Manual Rest:</strong> Timer pauses after each set. You must manually start the next set when ready.</li>
                    </ul>
                    <p><strong>Lead In Time:</strong> Preparation time before the first set begins. Use this to get into position.</p>
                    <p><strong>Sets:</strong> Number of work intervals to complete.</p>
                    <p><strong>Rest Between Sets:</strong> Duration of rest/recovery time between each work set.</p>
                </div>
            </Popover>

            <Popover
                isOpen={alertHelpOpen}
                onClose={() => setAlertHelpOpen(false)}
                title="Alert Settings Help"
            >
                <div className="text-sm space-y-2">
                    <p><strong>Alert Intervals:</strong> Configure up to 6 countdown alerts using separate fields. Desktop shows number inputs; mobile uses tumbler-style pickers. Default values are 10, 3, 2, 1 seconds.</p>
                    <p><strong>Alert Volume:</strong> Adjust the volume of beeps or speech from silent to maximum.</p>
                    <p><strong>Use Speech:</strong> Toggle between beep sounds and spoken numbers. When enabled, the timer will speak countdown numbers (e.g., "three", "two", "one") instead of beeping.</p>
                    <p><strong>Voice Gender:</strong> Choose between male and female voice for speech synthesis (only visible when speech is enabled).</p>
                    <p><strong>Test Speech:</strong> Click the test button to hear a sample of your selected voice and volume.</p>
                </div>
            </Popover>

            <Popover
                isOpen={manageTimersHelpOpen}
                onClose={() => setManageTimersHelpOpen(false)}
                title="Manage Timers Help"
            >
                <div className="text-sm space-y-2">
                    <p><strong>Save As...:</strong> Save your current configuration as a new preset with all settings (intervals, alerts, speech preferences).</p>
                    <p><strong>Load Timer:</strong> Use the dropdown to load a saved preset or select "-- New Timer --" to start fresh.</p>
                    <p><strong>Export:</strong> Download the current timer as a JSON file to save to your device.</p>
                    <p><strong>Share:</strong> Share timer directly via WhatsApp, email, or other apps. Perfect for coaches sending programs to clients!</p>
                    <p><strong>Import:</strong> Load a timer file shared by a coach or from another device. The timer will be saved locally with all original settings.</p>
                </div>
            </Popover>
        </div>
    );
};


// --- MAIN WORKOUT TIMER COMPONENT ---

const WorkoutTimer: React.FC = () => {
    const [view, setView] = useState<'config' | 'active-sequence' | 'active-manual' | 'finished'>('config');
    const [timerMode, setTimerMode] = useState<TimerMode>('rolling');
    
    // Legacy state for saving/loading interval timers
    const [intervals, setIntervals] = useState<Interval[]>([]);
    const [rounds, setRounds] = useState(1);

    // State for rolling rest mode
    const [leadIn, setLeadIn] = useState('10');
    const [sets, setSets] = useState('5');

    // State for both modes now
    const [restTime, setRestTime] = useState('120');

    // Shared state
    const [savedTimers, setSavedTimers] = useState<Record<string, SavedTimer>>({});
    const [activeTimerConfig, setActiveTimerConfig] = useState<{intervals: Interval[], rounds: number} | null>(null);
    const [loadedTimerId, setLoadedTimerId] = useState<string | null>(null);
    const [alertTimings, setAlertTimings] = useState<number[]>(DEFAULT_ALERT_TIMINGS);
    const [alertVolume, setAlertVolume] = useState(0.5);
    const [useSpeech, setUseSpeech] = useState(false);
    const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('female');
    // State for 6 separate alert interval fields
    // Grid layout: alert6 (top-left) to alert1 (bottom-right)
    // Default countdown: alert1=1, alert2=2, alert3=3, alert4=10, alert5=empty, alert6=empty
    const [alert1, setAlert1] = useState<number | null>(1);
    const [alert2, setAlert2] = useState<number | null>(2);
    const [alert3, setAlert3] = useState<number | null>(3);
    const [alert4, setAlert4] = useState<number | null>(10);
    const [alert5, setAlert5] = useState<number | null>(null);
    const [alert6, setAlert6] = useState<number | null>(null);

    const { requestWakeLock, releaseWakeLock } = useWakeLock();

    useEffect(() => {
        try {
            const storedTimers = localStorage.getItem('workout_timers');
            if (storedTimers) {
                const parsedTimers = JSON.parse(storedTimers);
                // Basic validation
                if (typeof parsedTimers === 'object' && parsedTimers !== null) {
                    setSavedTimers(parsedTimers);
                }
            }
            const storedVolume = localStorage.getItem('workout_timer_volume');
            if (storedVolume) {
                const parsedVolume = parseFloat(storedVolume);
                if (!isNaN(parsedVolume) && parsedVolume >= 0 && parsedVolume <= 1) {
                    setAlertVolume(parsedVolume);
                }
            }
            const storedVoiceGender = localStorage.getItem('workout_timer_voice_gender');
            if (storedVoiceGender === 'male' || storedVoiceGender === 'female') {
                setVoiceGender(storedVoiceGender);
            }
        } catch (e) {
            console.error("Failed to load timers from localStorage", e);
        }
    }, []);

    // Update alertTimings whenever any of the 6 alert fields change
    useEffect(() => {
        const alerts = [alert1, alert2, alert3, alert4, alert5, alert6]
            .filter((val): val is number => val !== null && val > 0)
            .sort((a, b) => b - a); // Sort descending
        setAlertTimings(alerts);
    }, [alert1, alert2, alert3, alert4, alert5, alert6]);

    // Populate alert fields from alertTimings array
    const populateAlertFields = useCallback((timings: number[]) => {
        // Sort in ascending order: alert1 gets lowest, alert6 gets highest
        const sorted = [...timings].sort((a, b) => a - b);
        setAlert1(sorted[0] ?? null);
        setAlert2(sorted[1] ?? null);
        setAlert3(sorted[2] ?? null);
        setAlert4(sorted[3] ?? null);
        setAlert5(sorted[4] ?? null);
        setAlert6(sorted[5] ?? null);
    }, []);

    // Initialize alert fields with default values on mount
    useEffect(() => {
        populateAlertFields(DEFAULT_ALERT_TIMINGS);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleVolumeChange = (newVolume: number) => {
        setAlertVolume(newVolume);
        audioManager.playSound('long', newVolume);
        localStorage.setItem('workout_timer_volume', String(newVolume));
    };

    const handleIntervalChange = () => {
        // Play beep for manual operations (skip, back) and background tab handling
        audioManager.playSound('extra-long', alertVolume);
    };
    
    const handleComplete = () => {
        setView('finished');
        releaseWakeLock();
    };

    const { status, start, pause, reset, skip, back, ...timerState } = useTimer({
        intervals: activeTimerConfig?.intervals || [],
        rounds: activeTimerConfig?.rounds || 1,
        onComplete: handleComplete,
        onIntervalChange: handleIntervalChange,
        alertTimings,
        alertVolume,
        useSpeech,
        voiceGender,
    });
    
    const saveTimer = (name: string) => {
        const numLeadIn = parseInt(leadIn) || 0;
        const numSets = parseInt(sets) || 1;
        const numRestTime = parseInt(restTime) || 0;

        const newTimer: SavedTimer = {
            id: crypto.randomUUID(), name, mode: timerMode,
            intervals: timerMode === 'interval' ? intervals : [],
            rounds: timerMode === 'interval' ? rounds : 1,
            leadIn: numLeadIn, sets: numSets, roundTime: 0, // roundTime is deprecated
            restTime: numRestTime, alertTimings, alertVolume, useSpeech, voiceGender
        };
        const newSavedTimers = { ...savedTimers, [newTimer.id]: newTimer };
        setSavedTimers(newSavedTimers);
        localStorage.setItem('workout_timers', JSON.stringify(newSavedTimers));
        setLoadedTimerId(newTimer.id);
    };
    
    const handleLoadTimer = (id: string) => {
        if (id === '') { // This is the "-- New Timer --" or "Reset" option
            setTimerMode('rolling');
            setIntervals([]);
            setRounds(1);
            setLeadIn('10');
            setSets('5');
            setRestTime('120');
            setLoadedTimerId(null);
            populateAlertFields(DEFAULT_ALERT_TIMINGS);
            setAlertVolume(0.5);
            setUseSpeech(false);
            setVoiceGender('female');
            return;
        }
        const timerToLoad = savedTimers[id];
        if (timerToLoad) {
            setTimerMode(timerToLoad.mode || 'rolling');
            setIntervals(timerToLoad.intervals || []);
            setRounds(timerToLoad.rounds || 1);
            setLeadIn(String(timerToLoad.leadIn || 10));
            setSets(String(timerToLoad.sets || 5));
            setRestTime(String(timerToLoad.restTime || timerToLoad.roundTime || 120));
            populateAlertFields(timerToLoad.alertTimings || DEFAULT_ALERT_TIMINGS);
            setAlertVolume(timerToLoad.alertVolume ?? 0.5);
            setUseSpeech(timerToLoad.useSpeech ?? false);
            setVoiceGender(timerToLoad.voiceGender ?? 'female');
            setLoadedTimerId(id);
        }
    };

    const handleImportTimer = (newTimer: SavedTimer) => {
        // Save to localStorage
        const newSavedTimers = { ...savedTimers, [newTimer.id]: newTimer };
        setSavedTimers(newSavedTimers);
        localStorage.setItem('workout_timers', JSON.stringify(newSavedTimers));

        // Load the imported timer
        handleLoadTimer(newTimer.id);
    };

    const handleStartWorkout = () => {
        // Pre-cache speech utterances if speech is enabled
        if (useSpeech) {
            speechManager.preCacheNumbers(alertVolume, voiceGender);
        }

        let config: { intervals: Interval[], rounds: number } | null = null;
        if (timerMode === 'rolling') {
            const numLeadIn = parseInt(leadIn) || 0;
            const numSets = parseInt(sets) || 1;
            const numRestTime = parseInt(restTime) || 0;
            const numRests = numSets > 1 ? numSets - 1 : 0;

            const rollingIntervals: Interval[] = [];
            if (numLeadIn > 0) {
                rollingIntervals.push({ id: 'lead-in', name: 'Get Ready', duration: numLeadIn, type: 'prep', color: INTERVAL_COLORS.prep });
            }
            for (let i = 0; i < numRests; i++) {
                const setNumber = i + 1; // The set this rest is AFTER
                rollingIntervals.push({
                    id: `rest-after-set-${setNumber}`,
                    name: `Set ${setNumber} of ${numSets}`,
                    duration: numRestTime,
                    type: 'rest',
                    color: INTERVAL_COLORS.rest
                });
            }
            config = { intervals: rollingIntervals, rounds: 1 };
        } else if (timerMode === 'manual') {
            requestWakeLock();
            setView('active-manual');
            return;
        }

        if (config && config.intervals.length > 0) {
            setActiveTimerConfig(config);
            requestWakeLock();
            setView('active-sequence');
            setTimeout(() => {
                start();
                audioManager.playSound('extra-long', alertVolume);
            }, 100);
        } else {
             // Handle case where rolling timer has 0 or 1 sets, so no intervals are created.
            alert("Rolling Rest timer requires at least 2 sets to create rest intervals.");
        }
    };
    
    const handleExit = () => {
        pause();
        releaseWakeLock();
        setView('config');
    };

    const handleExitFinishedScreen = () => {
        reset();
        setView('config');
    };

    if (view === 'finished') {
        return (
            <div className="fixed inset-0 bg-green-600 text-white flex flex-col items-center justify-center text-center p-4 animate-fadeIn">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h1 className="text-5xl md:text-7xl font-bold mb-4">Workout Finished!</h1>
                <p className="text-xl md:text-2xl mb-8">Great job!</p>
                <IconButton onClick={handleExitFinishedScreen} variant="info" className="!text-2xl !py-4 !px-10">
                    Done
                </IconButton>
            </div>
        );
    }
    
    if (view === 'active-sequence' && activeTimerConfig) {
        const currentInterval = activeTimerConfig.intervals[timerState.currentIntervalIndex];
        
        let nextIntervalForDisplay = null;
        const numSets = parseInt(sets, 10);

        if (currentInterval.name === 'Get Ready') {
            nextIntervalForDisplay = { name: `Set 1 of ${numSets}` };
        } else {
            const currentSetMatch = currentInterval.name.match(/Set (\d+)/);
            if (currentSetMatch) {
                const currentSetNumber = parseInt(currentSetMatch[1], 10);
                if (currentSetNumber < numSets) {
                    nextIntervalForDisplay = { name: `Set ${currentSetNumber + 1} of ${numSets}` };
                }
            }
        }

        return <TimerDisplay 
            status={status}
            currentInterval={currentInterval}
            nextInterval={nextIntervalForDisplay}
            timeLeft={timerState.timeLeft}
            currentRound={timerState.currentRound}
            rounds={activeTimerConfig.rounds}
            timeElapsed={timerState.timeElapsed}
            totalWorkoutTime={timerState.totalWorkoutTime}
            onStart={start}
            onPause={pause}
            onReset={() => { reset(); setTimeout(() => start(), 100); }}
            onSkip={skip}
            onBack={back}
            onExit={handleExit}
            alertVolume={alertVolume}
            onVolumeChange={handleVolumeChange}
        />;
    }

    if (view === 'active-manual') {
        return <ManualRestTimer
            sets={parseInt(sets) || 1}
            restTime={parseInt(restTime) || 0}
            onExit={handleExit}
            onComplete={handleComplete}
            alertTimings={alertTimings}
            alertVolume={alertVolume}
            useSpeech={useSpeech}
            voiceGender={voiceGender}
            onVolumeChange={handleVolumeChange}
        />
    }

    return (
        <ConfigurationScreen
            timerMode={timerMode} setTimerMode={setTimerMode}
            leadIn={leadIn} setLeadIn={setLeadIn}
            sets={sets} setSets={setSets}
            restTime={restTime} setRestTime={setRestTime}
            alertVolume={alertVolume} onVolumeChange={handleVolumeChange}
            useSpeech={useSpeech} setUseSpeech={setUseSpeech}
            voiceGender={voiceGender} setVoiceGender={setVoiceGender}
            alert1={alert1} setAlert1={setAlert1}
            alert2={alert2} setAlert2={setAlert2}
            alert3={alert3} setAlert3={setAlert3}
            alert4={alert4} setAlert4={setAlert4}
            alert5={alert5} setAlert5={setAlert5}
            alert6={alert6} setAlert6={setAlert6}
            savedTimers={savedTimers}
            saveTimer={saveTimer}
            loadTimer={handleLoadTimer}
            onImport={handleImportTimer}
            onStart={handleStartWorkout}
            loadedTimerId={loadedTimerId}
            onResetConfig={() => handleLoadTimer('')}
        />
    );
};

export default WorkoutTimer;