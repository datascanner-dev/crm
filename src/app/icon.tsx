import { ImageResponse } from "next/og";
import { BRAND_COLOR, BRAND_MARK_PATH } from "@/components/brand/brand-mark";

// Favicon: Data Scanner brand mark (same symbol as lp.datascanner.com.br),
// orange on a transparent background. Next.js auto-injects <link rel="icon">.

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 512 512" fill="none">
          <path fill={BRAND_COLOR} d={BRAND_MARK_PATH} />
        </svg>
      </div>
    ),
    { ...size },
  );
}
