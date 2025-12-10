"use client";

import { useEffect, useState } from "react";

import { Icons } from "@turbostarter/ui-web/icons";

const MAX_CALL_SECONDS = 180; // 3 minutes

interface SantaCallShellProps {
  children: React.ReactNode;
  controls?: React.ReactNode;
  showTimer?: boolean;
  timerStarted?: boolean;
  onTimeUp?: () => void;
}

export const SantaCallShell = ({
  children,
  controls,
  showTimer = true,
  timerStarted = true,
  onTimeUp,
}: SantaCallShellProps) => {
  const [remainingSeconds, setRemainingSeconds] = useState(MAX_CALL_SECONDS);

  useEffect(() => {
    if (!timerStarted) return;

    const interval = setInterval(() => {
      setRemainingSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerStarted]);

  // Trigger onTimeUp when time expires
  useEffect(() => {
    if (remainingSeconds === 0 && onTimeUp) {
      onTimeUp();
    }
  }, [remainingSeconds, onTimeUp]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  // Visual warning states
  const isLowTime = remainingSeconds <= 60; // Last minute
  const isCriticalTime = remainingSeconds <= 30; // Last 30 seconds

  return (
    <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-b from-gray-900 to-black shadow-2xl">
      {/* Header */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between p-4">
        <div className="flex items-center gap-2 text-white/80">
          <Icons.Lock className="size-3" />
          <span className="text-xs font-medium">SantaCall</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Network dots */}
          <span className="size-1.5 rounded-full bg-green-400" />
          <span className="size-1.5 rounded-full bg-green-400" />
          <span className="size-1.5 rounded-full bg-green-400" />
        </div>
      </div>

      {/* Timer chip */}
      {showTimer && (
        <div className="absolute left-1/2 top-12 z-10 -translate-x-1/2">
          <span
            className={`rounded-full px-3 py-1 text-xs backdrop-blur transition-colors ${
              isCriticalTime
                ? "animate-pulse bg-red-500/80 text-white font-semibold"
                : isLowTime
                  ? "bg-amber-500/60 text-white font-medium"
                  : "bg-white/10 text-white"
            }`}
          >
            {formattedTime}
          </span>
        </div>
      )}

      {/* Embed area */}
      <div className="aspect-[9/16] w-full">{children}</div>

      {/* Controls bar */}
      {controls && (
        <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2">
          {controls}
        </div>
      )}
    </div>
  );
};
