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
    </div>
  );
};
