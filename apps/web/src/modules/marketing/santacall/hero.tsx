"use client";

import { useState, useRef, useEffect } from "react";

import { cn } from "@turbostarter/ui";
import { buttonVariants } from "@turbostarter/ui-web/button";
import { Icons } from "@turbostarter/ui-web/icons";

export const SantaHero = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const videoRef = useRef<HTMLVideoElement>(null);

  const [clockTime, setClockTime] = useState("");
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClockTime(
        now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
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
    <section className="relative overflow-hidden bg-gradient-to-b from-red-50 via-white to-green-50 pb-16 pt-24">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Snowflakes pattern */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23dc2626' fill-opacity='0.1'%3E%3Cpath d='M30 30l-4-4 4-4 4 4-4 4zm0 0l4 4-4 4-4-4 4-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        {/* Decorative circles */}
        <div className="absolute -left-20 top-20 size-96 rounded-full bg-red-100/50 blur-3xl" />
        <div className="absolute -right-20 top-40 size-96 rounded-full bg-green-100/50 blur-3xl" />
      </div>

      <div className="container relative mx-auto flex flex-col items-center justify-center px-6">
        {/* Badge */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-5 py-2.5 shadow-sm">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-green-500" />
            </span>
            <span className="text-sm font-medium text-gray-700">
              🎄 Create magical Christmas memories!
            </span>
          </div>
        </div>

        {/* Main headline */}
        <h1 className="max-w-4xl text-center text-5xl font-bold leading-[1.1] tracking-tight text-gray-900 sm:text-6xl md:text-7xl">
          Talk to{" "}
          <span className="bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
            Santa
          </span>{" "}
          <span className="inline-block">🎅</span>
        </h1>

        {/* Subheadline */}
        <p className="mt-6 max-w-2xl text-center text-lg text-gray-600 sm:text-xl">
          Book a magical live video call or get a personalized video message from AI Santa.
          <br className="hidden sm:block" />
          Create unforgettable Christmas memories for your child!
        </p>

        {/* Quick action */}
        <div className="mt-8 flex items-center gap-4">
          <a
            href="#book"
            className={cn(
              buttonVariants({ size: "lg" }),
              "rounded-full bg-red-600 px-8 py-6 text-lg font-semibold text-white shadow-lg shadow-red-200 transition-all hover:scale-105 hover:bg-red-700 hover:shadow-xl hover:shadow-red-200",
            )}
          >
            <Icons.Gift className="mr-2 size-5" />
            Book Now
          </a>
        </div>

        {/* Trust badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
            <Icons.ShieldCheck className="size-4 text-green-600" />
            <span>Secure checkout</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
            <Icons.Clock className="size-4 text-red-600" />
            <span>Calls 4-8pm</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
            <Icons.Video className="size-4 text-blue-600" />
            <span>Videos in 24hrs</span>
          </div>
        </div>

        {/* Pricing preview */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-red-100">
                <Icons.Phone className="size-5 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Live Call</p>
                <p className="text-sm text-gray-500">3 min · $6.99</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-green-100">
                <Icons.Video className="size-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Video Message</p>
                <p className="text-sm text-gray-500">Personalized · $4.99</p>
              </div>
            </div>
          </div>
        </div>

        {/* Giving back callout */}
        <div className="mt-6 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-red-50 to-green-50 border border-red-100 px-5 py-2.5 shadow-sm">
          <Icons.Heart className="size-4 text-red-500" />
          <span className="text-sm font-medium text-gray-700">
            Every purchase donates a toy to a child in need
          </span>
          <Icons.Gift className="size-4 text-green-600" />
        </div>

        {/* iPhone Demo - Compact */}
        <div className="mt-8">
          <div className="mx-auto w-44 sm:w-52">
            <div
              className="relative mx-auto overflow-hidden rounded-xl border-4 border-slate-800 bg-black shadow-lg"
              style={{ aspectRatio: "9/19.5" }}
            >
              {/* Dynamic Island */}
              <div className="absolute left-1/2 top-1 z-20 h-2 w-8 -translate-x-1/2 rounded-full bg-black" />

              {/* Video container */}
              <div className="relative h-full w-full overflow-hidden bg-slate-900">
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

                {/* Play button overlay */}
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <button
                      onClick={handlePlay}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md transition-transform hover:scale-110"
                    >
                      <Icons.Play className="ml-0.5 h-3 w-3 text-red-600" />
                    </button>
                  </div>
                )}

                {/* Minimal overlay when playing */}
                {isPlaying && (
                  <>
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/60 to-transparent" />
                    <button
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.pause();
                          videoRef.current.currentTime = 0;
                        }
                        setIsPlaying(false);
                      }}
                      className="absolute bottom-2 left-1/2 z-10 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full bg-red-500"
                    >
                      <Icons.Phone className="h-2.5 w-2.5 rotate-[135deg] text-white" />
                    </button>
                  </>
                )}
              </div>

              {/* Home indicator */}
              <div className="absolute inset-x-0 bottom-0.5 flex justify-center">
                <div className="h-0.5 w-6 rounded-full bg-white/50" />
              </div>
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-gray-400">
            Watch demo ☝️
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="mt-10">
          <a href="#book" className="flex flex-col items-center gap-2 text-gray-400 transition-colors hover:text-gray-600">
            <span className="text-sm">Book below</span>
            <div className="animate-bounce">
              <Icons.ChevronDown className="size-6" />
            </div>
          </a>
        </div>
      </div>
    </section>
  );
};
