import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';

export function Welcome() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // For testing purposes, if we just came from the quiz, we might not have an auth session yet.
        // But following the prompt strictly: "If no session -> Redirect to /login"
        navigate('/login');
        return;
      }

      setUserId(session.user.id);

      // Check if already watched
      const { data: userData } = await supabase
        .from('users')
        .select('watched_welcome_video')
        .eq('id', session.user.id)
        .single();

      if (userData?.watched_welcome_video) {
        navigate('/dashboard');
        return;
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const handleTimeUpdate = () => {
    if (!videoRef.current || isUnlocked) return;

    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration;
    
    if (total > 0) {
      const percent = (current / total) * 100;
      setProgress(percent);

      if (percent >= 90) {
        handleVideoComplete();
      }
    }
  };

  const handleVideoComplete = async () => {
    setIsUnlocked(true);
    
    // 1. Call Edge Function
    if (userId) {
      try {
        await supabase.functions.invoke('set-video-watched', {
          body: { userId }
        });
      } catch (error) {
        console.error('Failed to call edge function:', error);
        // Fallback to direct DB update if edge function fails/doesn't exist
        await supabase
          .from('users')
          .update({ watched_welcome_video: true })
          .eq('id', userId);
      }
    }

    // 2. Show confetti
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ffc702', '#ffffff', '#1f3b3f']
    });

    // 4. Auto-redirect after 3 seconds
    setTimeout(() => {
      navigate('/dashboard');
    }, 3000);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
      
      // If unmuting, ensure video is playing
      if (!videoRef.current.muted) {
        videoRef.current.play().catch(console.error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0c1115] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#ffc702] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c1115] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-4xl mx-auto space-y-8 relative z-10">
        
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
            Welcome to ZTHA Academy
          </h1>
          <p className="text-gray-400 text-lg">
            Please watch this important video to unlock your dashboard.
          </p>
        </div>

        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-2xl border border-gray-800">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" // Placeholder
            autoPlay
            muted
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setProgress(100)}
          />

          <AnimatePresence>
            {isMuted && !isUnlocked && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"
              >
                <button
                  onClick={toggleMute}
                  className="bg-[#ffc702] hover:bg-yellow-400 text-black font-bold py-4 px-8 rounded-full text-lg transition-transform hover:scale-105 flex items-center gap-3 shadow-xl"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                  Click to Unmute
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isUnlocked && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md flex-col space-y-6"
              >
                <div className="w-20 h-20 bg-[#ffc702] rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-4xl font-bold text-white text-center">
                  Dashboard Unlocked! 🎉
                </h2>
                <p className="text-gray-300 text-lg">
                  Redirecting you to your dashboard...
                </p>
                <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden mt-4">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3, ease: "linear" }}
                    className="h-full bg-[#ffc702]"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress Bar Overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-800">
            <div 
              className="h-full bg-[#ffc702] transition-all duration-300 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
