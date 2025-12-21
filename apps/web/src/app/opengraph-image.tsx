import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "SantaCall - Live Video Calls with Santa";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #1a472a 0%, #0f2d1a 50%, #1a472a 100%)",
          position: "relative",
        }}
      >
        {/* Snow decoration */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "100%",
            display: "flex",
            opacity: 0.1,
          }}
        >
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "white",
                left: `${(i * 5) % 100}%`,
                top: `${(i * 7) % 100}%`,
              }}
            />
          ))}
        </div>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
          }}
        >
          {/* Santa emoji */}
          <div style={{ fontSize: 120 }}>🎅</div>

          {/* Title */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: "white",
              textAlign: "center",
              textShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            SantaCall
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 32,
              color: "#fbbf24",
              textAlign: "center",
              maxWidth: 800,
            }}
          >
            Live Video Calls with Santa Claus
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: 24,
              color: "rgba(255,255,255,0.8)",
              textAlign: "center",
              maxWidth: 700,
              marginTop: 16,
            }}
          >
            Create magical Christmas memories for your child
          </div>
        </div>

        {/* Bottom decoration */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            gap: 16,
            fontSize: 40,
          }}
        >
          <span>🎄</span>
          <span>⭐</span>
          <span>🎁</span>
          <span>❄️</span>
          <span>🎄</span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
