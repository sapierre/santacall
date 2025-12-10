"use client";

import { useState } from "react";
import { useMeetingState } from "@daily-co/daily-react";

import { Icons } from "@turbostarter/ui-web/icons";

import { Conversation } from "~/components/cvi/components/conversation";
import { HairCheck } from "~/components/cvi/components/hair-check";

interface SantaCallEmbedProps {
  joinUrl: string;
  onLeave?: () => void;
  onJoined?: () => void;
}

export const SantaCallEmbed = ({
  joinUrl,
  onLeave,
  onJoined,
}: SantaCallEmbedProps) => {
  const [hasJoined, setHasJoined] = useState(false);
  const meetingState = useMeetingState();

  const handleLeave = () => {
    onLeave?.();
  };

  const handleJoin = () => {
    setHasJoined(true);
    onJoined?.();
  };

  // Show HairCheck until user clicks "Join"
  if (!hasJoined) {
    return (
      <div className="relative h-full w-full">
        <HairCheck onJoin={handleJoin} />
      </div>
    );
  }

  // Show connecting state while joining
  if (meetingState === "joining-meeting") {
    return (
      <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900">
        <div className="text-center">
          <Icons.Loader2 className="mx-auto mb-3 size-8 animate-spin text-white/60" />
          <p className="text-sm text-white/80">Connecting to Santa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <Conversation conversationUrl={joinUrl} onLeave={handleLeave} />
      {/* Keep fallback link */}
      <div className="absolute bottom-2 left-1/2 z-20 -translate-x-1/2">
        <a
          href={joinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-black/40 px-3 py-1 text-xs text-white/60 backdrop-blur transition hover:bg-black/60 hover:text-white"
        >
          Having trouble? Open in new tab
        </a>
      </div>
    </div>
  );
};
