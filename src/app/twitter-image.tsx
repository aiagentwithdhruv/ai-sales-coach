import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "QuotaHit — AI Sales Coach | Practice. Coach. Close.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(145deg, #0B0F14 0%, #121821 40%, #0B0F14 100%)",
          fontFamily: "Inter, system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle grid overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "linear-gradient(rgba(42, 47, 54, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(42, 47, 54, 0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            display: "flex",
          }}
        />

        {/* Top-left glow */}
        <div
          style={{
            position: "absolute",
            top: -120,
            left: -120,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,179,255,0.12) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Bottom-right glow */}
        <div
          style={{
            position: "absolute",
            bottom: -120,
            right: -120,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(45,255,142,0.08) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            zIndex: 10,
            gap: 24,
          }}
        >
          {/* Logo / Brand */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "linear-gradient(135deg, #00B3FF, #0077AA)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                fontWeight: 800,
                color: "white",
              }}
            >
              Q
            </div>
            <span
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: "#C7CCD1",
                letterSpacing: "-0.02em",
              }}
            >
              QuotaHit
            </span>
          </div>

          {/* Main headline */}
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: "#C7CCD1",
              lineHeight: 1.1,
              textAlign: "center",
              letterSpacing: "-0.02em",
            }}
          >
            Your AI Sales Coach
          </div>

          {/* Colored words row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 28px",
                borderRadius: 10,
                border: "1px solid rgba(0, 179, 255, 0.3)",
                background: "rgba(0, 179, 255, 0.06)",
              }}
            >
              <span style={{ fontSize: 32, fontWeight: 700, color: "#00B3FF" }}>
                Practice
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 28px",
                borderRadius: 10,
                border: "1px solid rgba(45, 255, 142, 0.3)",
                background: "rgba(45, 255, 142, 0.06)",
              }}
            >
              <span style={{ fontSize: 32, fontWeight: 700, color: "#2DFF8E" }}>
                Coach
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 28px",
                borderRadius: 10,
                border: "1px solid rgba(192, 199, 209, 0.2)",
                background: "rgba(192, 199, 209, 0.04)",
              }}
            >
              <span style={{ fontSize: 32, fontWeight: 700, color: "#C7CCD1" }}>
                Close
              </span>
            </div>
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 20,
              color: "#9AA4AF",
              textAlign: "center",
              maxWidth: 700,
              lineHeight: 1.5,
            }}
          >
            Real-time voice practice, instant objection coaching, and AI call analysis — 10-50x cheaper than Gong.
          </div>

          {/* Bottom badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 8,
              padding: "8px 20px",
              borderRadius: 999,
              background: "rgba(0, 179, 255, 0.1)",
              border: "1px solid rgba(0, 179, 255, 0.2)",
            }}
          >
            <span style={{ fontSize: 15, color: "#00B3FF", fontWeight: 600 }}>
              www.quotahit.com
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
