"use client";

import {
  useDaily,
  useDevices,
  DailyVideo,
  useLocalSessionId,
} from "@daily-co/daily-react";
import { useState, useEffect } from "react";

import { Button } from "@turbostarter/ui-web/button";
import { Icons } from "@turbostarter/ui-web/icons";

import { MicSelectBtn, CameraSelectBtn } from "../device-select";

import styles from "./hair-check.module.css";

interface HairCheckProps {
  onJoin: () => void;
}

export const HairCheck = ({ onJoin }: HairCheckProps) => {
  const daily = useDaily();
  const localSessionId = useLocalSessionId();
  const { camState, micState, hasCamError, hasMicError } = useDevices();
  const [isReady, setIsReady] = useState(false);

  // Start camera for preview (without joining the call)
  useEffect(() => {
    if (daily) {
      daily
        .startCamera()
        .then(() => setIsReady(true))
        .catch(() => setIsReady(true));
    }
  }, [daily]);

  const hasPermissionError = hasCamError || hasMicError;
  const isDevicesReady = camState === "granted" && micState === "granted";

  return (
    <div className={styles.container}>
      {/* Video preview */}
      <div className={styles.previewContainer}>
        {isReady && localSessionId ? (
          <DailyVideo
            sessionId={localSessionId}
            type="video"
            className={styles.preview}
            mirror
          />
        ) : (
          <div className={styles.placeholder}>
            <Icons.Loader2 className="size-8 animate-spin text-white/60" />
          </div>
        )}
      </div>

      {/* Device controls */}
      <div className={styles.controls}>
        <MicSelectBtn />
        <CameraSelectBtn />
      </div>

      {/* Status message */}
      <div className={styles.status}>
        {hasPermissionError ? (
          <p className="text-sm text-red-400">
            Please allow camera and microphone access to continue.
          </p>
        ) : !isDevicesReady ? (
          <p className="text-sm text-white/60">
            Setting up your camera and microphone...
          </p>
        ) : (
          <p className="text-sm text-green-400">
            You&apos;re all set! Click below when ready.
          </p>
        )}
      </div>

      {/* Join button */}
      <Button
        size="lg"
        className="w-full gap-2 bg-green-600 hover:bg-green-700"
        onClick={onJoin}
        disabled={!isReady || hasPermissionError}
      >
        <Icons.Phone className="size-5" />
        Join Call with Santa
      </Button>

      <p className="mt-2 text-center text-xs text-white/40">
        Say &quot;Hi Santa!&quot; when you&apos;re ready to start
      </p>
    </div>
  );
};
