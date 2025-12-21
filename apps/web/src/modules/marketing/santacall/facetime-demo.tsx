"use client";

import { useState, useRef, useEffect } from "react";

import { cn } from "@turbostarter/ui";
import { Icons } from "@turbostarter/ui-web/icons";

export const SantaFacetimeDemo = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const videoRef = useRef<HTMLVideoElement>(null);

  // Get current time display (clock)
  const [clockTime, setClockTime] = useState("");
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClockTime(
        now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(formatTime(videoRef.current.currentTime));
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(formatTime(videoRef.current.duration));
    }
  };

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-20 sm:py-28">
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-red-500/20 blur-[120px]" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-green-500/20 blur-[120px]" />
      </div>

      {/* Snow particles */}
      <div className="pointer-events-none absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="animate-snow-fall absolute rounded-full bg-white/60"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 3 + 5}s`,
            }}
          />
        ))}
      </div>

      <div className="relative container mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-sm font-medium text-green-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            Watch a Demo Call
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            See the <span className="text-red-400">Magic</span> in Action
          </h2>
          <p className="mt-4 text-base text-slate-400 sm:text-lg">
            Watch an example of what a live Santa video call looks like.
            <br className="hidden sm:block" />
            Real-time, interactive, and truly magical!
          </p>
        </div>

        {/* iPhone Frame */}
        <div className="mx-auto max-w-sm sm:max-w-md">
          <div
            className="relative mx-auto overflow-hidden rounded-[2.5rem] border-[8px] border-slate-700 bg-black shadow-2xl shadow-black/50 sm:rounded-[3rem] sm:border-[12px]"
            style={{
              aspectRatio: "9/19.5",
            }}
          >
            {/* Dynamic Island */}
            <div className="absolute top-2 left-1/2 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-black sm:top-3 sm:h-8 sm:w-28" />

            {/* Status bar */}
            <div className="absolute top-0 right-0 left-0 z-10 flex items-center justify-between px-6 pt-1 sm:px-8 sm:pt-2">
              <span className="text-xs font-semibold text-white sm:text-sm">
                {clockTime}
              </span>
              <div className="flex items-center gap-1">
                <Icons.Signal className="h-3 w-3 text-white sm:h-4 sm:w-4" />
                <Icons.Wifi className="h-3 w-3 text-white sm:h-4 sm:w-4" />
                <Icons.BatteryFull className="h-4 w-4 text-white sm:h-5 sm:w-5" />
              </div>
            </div>

            {/* Video container */}
            <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                playsInline
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                <source src="/videos/santa-call-demo.mp4" type="video/mp4" />
              </video>

              {/* Play button overlay - shown when not playing */}
              {!isPlaying && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                  <button
                    onClick={handlePlay}
                    className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-xl transition-all duration-300 hover:scale-110 hover:bg-white sm:h-20 sm:w-20"
                  >
                    {/* Pulse ring */}
                    <span className="absolute inset-0 animate-ping rounded-full bg-white/30" />
                    <Icons.Play className="relative ml-1 h-6 w-6 text-red-600 sm:h-8 sm:w-8" />
                  </button>
                  <p className="mt-4 rounded-full bg-black/60 px-4 py-2 text-xs font-medium text-white backdrop-blur-sm sm:text-sm">
                    Tap to watch demo
                  </p>
                </div>
              )}

              {/* FaceTime-style overlay when playing */}
              {isPlaying && (
                <>
                  {/* Top gradient for readability */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent sm:h-32" />

                  {/* Caller info - top */}
                  <div className="absolute top-12 right-0 left-0 z-10 text-center sm:top-14">
                    <p className="text-lg font-semibold text-white drop-shadow-lg sm:text-xl">
                      Santa Claus
                    </p>
                    <p className="text-xs text-white/80 sm:text-sm">
                      {currentTime} / {duration}
                    </p>
                  </div>

                  {/* Bottom gradient */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent sm:h-40" />

                  {/* Call controls - bottom */}
                  <div className="absolute inset-x-0 bottom-6 z-10 flex items-center justify-center gap-4 sm:bottom-10 sm:gap-6">
                    {/* Mute button */}
                    <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md transition-colors hover:bg-white/30 sm:h-12 sm:w-12">
                      <Icons.MicOff className="h-4 w-4 text-white sm:h-5 sm:w-5" />
                    </button>

                    {/* End call button */}
                    <button
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.pause();
                          videoRef.current.currentTime = 0;
                        }
                        setIsPlaying(false);
                      }}
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-500/50 transition-all hover:scale-105 hover:bg-red-600 sm:h-14 sm:w-14"
                    >
                      <Icons.Phone className="h-5 w-5 rotate-[135deg] text-white sm:h-6 sm:w-6" />
                    </button>

                    {/* Camera flip button */}
                    <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md transition-colors hover:bg-white/30 sm:h-12 sm:w-12">
                      <Icons.SwitchCamera className="h-4 w-4 text-white sm:h-5 sm:w-5" />
                    </button>
                  </div>

                  {/* Live indicator */}
                  <div className="absolute top-12 right-3 z-10 flex items-center gap-1.5 rounded-full bg-red-500/90 px-2 py-1 sm:top-14 sm:right-4 sm:px-3">
                    <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white sm:h-2 sm:w-2" />
                    </span>
                    <span className="text-[10px] font-bold text-white sm:text-xs">
                      DEMO
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Home indicator */}
            <div className="absolute inset-x-0 bottom-1 flex justify-center sm:bottom-2">
              <div className="h-1 w-24 rounded-full bg-white/50 sm:w-32" />
            </div>
          </div>
        </div>

        {/* Caption below phone */}
        <p className="mx-auto mt-6 max-w-md text-center text-xs text-slate-500 sm:mt-8 sm:text-sm">
          This is a sample call. Your child&apos;s call will be personalized
          with their name, interests, and Christmas wishes!
        </p>
      </div>

      {/* Custom animation for snow */}
      <style jsx>{`
        @keyframes snow-fall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-snow-fall {
          animation: snow-fall linear infinite;
        }
      `}</style>
    </section>
  );
};
