import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Postdiff — turn finished work into posts that sound like you";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0f0f0f",
          color: "#ffffff",
          display: "flex",
          height: "100%",
          overflow: "hidden",
          padding: "58px 64px",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            backgroundImage:
              "linear-gradient(rgba(200,249,2,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(200,249,2,0.07) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            height: "760px",
            opacity: 0.55,
            position: "absolute",
            right: "-42px",
            top: "-62px",
            transform: "rotate(-12deg)",
            width: "620px",
          }}
        />
        <div
          style={{
            background: "#c8f902",
            height: "8px",
            left: 0,
            position: "absolute",
            top: 0,
            width: "100%",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", width: "690px" }}>
          <div style={{ alignItems: "center", display: "flex", gap: "18px" }}>
            <div
              aria-label="Postdiff mark"
              style={{
                alignItems: "center",
                display: "flex",
                height: "54px",
                justifyContent: "center",
                position: "relative",
                width: "54px",
              }}
            >
              {[0, 72, 144, 216, 288].map((rotation) => (
                <div
                  key={rotation}
                  style={{
                    background: "#c8f902",
                    borderRadius: "999px",
                    height: "22px",
                    position: "absolute",
                    transform: `rotate(${rotation}deg) translateY(-12px)`,
                    width: "9px",
                  }}
                />
              ))}
              <div style={{ background: "#0f0f0f", borderRadius: "999px", height: "10px", width: "10px" }} />
            </div>
            <span
              style={{
                color: "#c8f902",
                fontSize: "24px",
                fontWeight: 700,
                letterSpacing: "0.18em",
              }}
            >
              POSTDIFF
            </span>
          </div>

          <div
            style={{
              color: "#a6d609",
              fontFamily: "monospace",
              fontSize: "16px",
              letterSpacing: "0.18em",
              marginTop: "76px",
            }}
          >
            BUILD IN PUBLIC / LOCAL-FIRST
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: "64px",
              fontWeight: 400,
              letterSpacing: "-0.055em",
              lineHeight: 1.02,
              marginTop: "20px",
            }}
          >
            Turn commits into posts
            <br />
            that sound like you wrote them
          </div>
          <div
            style={{
              color: "#a1a1aa",
              fontSize: "22px",
              lineHeight: 1.35,
              marginTop: "30px",
            }}
          >
            The work worth sharing, drafted in your voice.
          </div>
        </div>

        <div
          style={{
            alignSelf: "flex-end",
            background: "rgba(15,15,15,0.9)",
            border: "1px solid #292929",
            display: "flex",
            flexDirection: "column",
            height: "296px",
            justifyContent: "space-between",
            marginBottom: "6px",
            marginLeft: "40px",
            padding: "26px 28px",
            width: "330px",
          }}
        >
          <div style={{ color: "#686868", display: "flex", fontFamily: "monospace", fontSize: "15px", gap: "9px" }}>
            <span style={{ color: "#ff5f57" }}>●</span>
            <span style={{ color: "#febc2e" }}>●</span>
            <span style={{ color: "#28c840" }}>●</span>
            <span style={{ marginLeft: "12px" }}>postdiff / latest</span>
          </div>
          <div
            style={{
              color: "#a6d609",
              display: "flex",
              flexDirection: "column",
              fontFamily: "monospace",
              fontSize: "19px",
              lineHeight: 1.7,
            }}
          >
            <div style={{ display: "flex" }}>
              <span style={{ color: "#686868", marginRight: "12px" }}>&gt;</span>
              <span>git diff</span>
            </div>
            <div style={{ display: "flex" }}>
              <span style={{ color: "#686868", marginRight: "12px" }}>&gt;</span>
              <span>draft in your voice</span>
            </div>
            <div style={{ display: "flex" }}>
              <span style={{ color: "#686868", marginRight: "12px" }}>&gt;</span>
              <span>review before publish</span>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #292929", color: "#ffffff", display: "flex", fontFamily: "monospace", fontSize: "14px", paddingTop: "17px" }}>
            <span style={{ color: "#c8f902", marginRight: "10px" }}>●</span>
            COPY ONLY / YOU APPROVE EVERY WORD
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
