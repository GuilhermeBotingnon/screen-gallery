"use client";

import { useEffect, useState } from "react";
import { SCREENS } from "../../src/gallery/catalog";
import { Gallery } from "../../src/gallery/Gallery";
import { mountScreen } from "../../src/gallery/stage";

/**
 * Dev-only Next.js App Router entry (/gallery).
 * Renders nothing in production builds.
 */
export default function GalleryPage() {
  const [mode, setMode] = useState<"loading" | "gallery" | "screen">("loading");

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const params = new URLSearchParams(window.location.search);
    const screenId = params.get("screen");
    if (screenId) {
      setMode("screen");
      void mountScreen(
        SCREENS.find((s) => s.id === screenId),
        params.get("theme") === "dark",
      );
    } else {
      setMode("gallery");
    }
  }, []);

  if (process.env.NODE_ENV === "production") return null;
  if (mode === "gallery") return <Gallery />;
  return <div id="root" />;
}
