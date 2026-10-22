import { Buffer } from "node:buffer";
import { ImageResponse } from "next/og";
import { OG_APP_TILE_B64, OG_GEIST_MONO_WOFF_B64, OG_MOVATIF_WOFF_B64 } from "./og-assets";

export const runtime = "nodejs";
export const alt = "Postdiff — turn finished work into posts that sound like you";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const movatif = Buffer.from(OG_MOVATIF_WOFF_B64, "base64");
const geistMono = Buffer.from(OG_GEIST_MONO_WOFF_B64, "base64");
const tileSrc = `data:image/png;base64,${OG_APP_TILE_B64}`;

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
          padding: "64px 64px 60px",
          position: "relative",
          width: "100%",
        }}
      >
        {/* faint lime grid, bleeding off the top-right edge */}
        <div
          style={{
            backgroundImage:
              "linear-gradient(rgba(200,249,2,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(200,249,2,0.06) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
            height: "760px",
            position: "absolute",
            right: "-80px",
            top: "-90px",
            transform: "rotate(-12deg)",
            width: "640px",
          }}
        />
        {/* lime top edge */}
        <div style={{ background: "#c8f902", height: "8px", left: 0, position: "absolute", top: 0, width: "100%" }} />

        <div style={{ display: "flex", flexDirection: "column", width: "680px" }}>
          {/* header: logo tile + wordmark */}
          <div style={{ alignItems: "center", display: "flex", gap: "16px" }}>
            <div
              style={{
                borderRadius: "15px",
                display: "flex",
                height: "62px",
                width: "62px",
              }}
            >
              <img src={tileSrc} style={{ height: "62px", width: "62px" }} />
            </div>
            <span
              style={{
                color: "#c8f902",
                fontFamily: "GeistMono",
                fontSize: "22px",
                letterSpacing: "0.22em",
              }}
            >
              POSTDIFF
            </span>
          </div>

          <div
            style={{
              color: "#9d9d9d",
              fontFamily: "GeistMono",
              fontSize: "15px",
              letterSpacing: "0.2em",
              marginTop: "66px",
            }}
          >
            BUILD IN PUBLIC / LOCAL-FIRST / COPY-ONLY
          </div>

          <div
            style={{
              color: "#ffffff",
              display: "flex",
              flexDirection: "column",
              fontFamily: "Movatif",
              fontSize: "58px",
              fontWeight: 300,
              letterSpacing: "-0.02em",
              lineHeight: 1.12,
              marginTop: "22px",
            }}
          >
            <span>Turn commits into posts</span>
            <span>that sound like</span>
            <span style={{ color: "#c8f902" }}>you wrote them.</span>
          </div>

          <div
            style={{
              color: "#a1a1aa",
              display: "flex",
              fontSize: "21px",
              lineHeight: 1.4,
              marginTop: "26px",
            }}
          >
            The work worth sharing, drafted in your voice. Nothing posts itself.
          </div>
        </div>

        {/* right column: terminal card + floating logo tile */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            justifyContent: "flex-end",
            marginLeft: "20px",
            width: "360px",
          }}
        >
          <div
            style={{
              alignSelf: "center",
              display: "flex",
              height: "150px",
              marginBottom: "6px",
              transform: "rotate(8deg)",
              width: "150px",
            }}
          >
            <img src={tileSrc} style={{ height: "150px", width: "150px" }} />
          </div>

          <div
            style={{
              background: "#0d0d0d",
              border: "1px solid #292929",
              borderRadius: "10px",
              display: "flex",
              flexDirection: "column",
              height: "252px",
              justifyContent: "space-between",
              padding: "22px 24px",
            }}
          >
            <div
              style={{
                alignItems: "center",
                display: "flex",
                fontFamily: "GeistMono",
                fontSize: "13px",
                gap: "8px",
              }}
            >
              {["#ff5f57", "#febc2e", "#28c840"].map((color) => (
                <div
                  key={color}
                  style={{ background: color, borderRadius: "999px", height: "11px", width: "11px" }}
                />
              ))}
              <span style={{ color: "#686868", marginLeft: "6px" }}>postdiff / latest</span>
            </div>
            <div
              style={{
                color: "#ffffff",
                display: "flex",
                flexDirection: "column",
                fontFamily: "GeistMono",
                fontSize: "16px",
                lineHeight: 1.75,
              }}
            >
              <div style={{ display: "flex" }}>
                <span style={{ color: "#c8f902", marginRight: "10px" }}>&gt;</span>
                <span>postdiff generate</span>
              </div>
              <div style={{ display: "flex" }}>
                <span style={{ color: "#686868", marginRight: "10px" }}>&gt;</span>
                <span style={{ color: "#9d9d9d" }}>drafting in your voice…</span>
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ color: "#c8f902", marginRight: "10px" }}>&gt;</span>
                <span style={{ color: "#c8f902" }}>accept</span>
                <span style={{ color: "#686868", marginLeft: "10px" }}>· your voice, your call</span>
              </div>
            </div>
            <div
              style={{
                borderTop: "1px solid #292929",
                color: "#686868",
                display: "flex",
                fontFamily: "GeistMono",
                fontSize: "12px",
                letterSpacing: "0.14em",
                paddingTop: "14px",
              }}
            >
              YOU APPROVE EVERY WORD
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Movatif", data: movatif, weight: 300, style: "normal" },
        { name: "GeistMono", data: geistMono, weight: 500, style: "normal" },
      ],
    },
  );
}
