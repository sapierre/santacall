"use client";

interface SantaVideoPlayerProps {
  videoUrl: string;
  childName: string;
}

export const SantaVideoPlayer = ({
  videoUrl,
  childName,
}: SantaVideoPlayerProps) => {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      {/* Phone frame container */}
      <div className="relative aspect-[9/16] overflow-hidden rounded-[2.5rem] bg-black shadow-2xl ring-4 ring-gray-800">
        {/* Notch/speaker (aesthetic) */}
        <div className="absolute left-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />

        {/* Video element */}
        <video
          src={videoUrl}
          controls
          playsInline
          className="h-full w-full object-cover"
        />
      </div>

      {/* Label below */}
      <p className="text-muted-foreground mt-4 text-center text-sm">
        A special message for {childName}
      </p>

      {/* Open in new tab link */}
      <div className="mt-2 text-center">
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground text-xs underline"
        >
          Open video in new tab
        </a>
      </div>
    </div>
  );
};
