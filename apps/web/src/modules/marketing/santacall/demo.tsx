"use client";

import { useState } from "react";

import { Icons } from "@turbostarter/ui-web/icons";

export const SantaDemo = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section className="relative bg-red-50 py-24">
      <div className="container mx-auto px-6">
        {/* Section header */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="mb-4 inline-block rounded-full bg-yellow-100 px-4 py-1.5 text-sm font-medium text-yellow-700">
            ⭐ See It In Action
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
            Experience the{" "}
            <span className="text-red-600">Magic</span>
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Watch how a Santa call looks. Real-time, interactive, magical!
          </p>
        </div>

        {/* Video demo */}
        <div className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl border-4 border-white bg-white shadow-2xl shadow-red-200/50">
            {/* Video container */}
            <div className="relative aspect-video bg-gradient-to-br from-red-100 to-green-100">
              {isPlaying ? (
                <video
                  autoPlay
                  controls
                  className="h-full w-full object-cover"
                  onEnded={() => setIsPlaying(false)}
                >
                  <source src="/videos/wonderland.mp4" type="video/mp4" />
                </video>
              ) : (
                <>
                  {/* Thumbnail with video playing in background */}
                  <video
                    muted
                    loop
                    autoPlay
                    playsInline
                    className="h-full w-full object-cover"
                  >
                    <source src="/videos/wonderland.mp4" type="video/mp4" />
                  </video>

                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20">
                    <button
                      onClick={() => setIsPlaying(true)}
                      className="group flex size-20 items-center justify-center rounded-full bg-white shadow-xl transition-all hover:scale-110 sm:size-24"
                    >
                      <Icons.Play className="size-8 text-red-600 transition-transform group-hover:scale-110 sm:size-10" />
                    </button>
                    <p className="mt-4 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm">
                      Click to watch with sound
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Info bar */}
            <div className="border-t border-gray-100 bg-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-red-100">
                    <span className="text-xl">🎅</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">SantaCall Demo</p>
                    <p className="text-sm text-gray-500">
                      Live video call preview
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Icons.Clock className="size-4" />
                  <span>~5 min calls</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Caption */}
        <p className="mt-8 text-center text-sm text-gray-500">
          Actual calls are personalized with your child's name, interests, and
          wish list! 🎁
        </p>
      </div>
    </section>
  );
};
