import type { ReactNode } from "react";

/**
 * Lightweight route switcher for Next.js apps inside the gallery iframe.
 * Map your real Next.js page components to their paths here.
 */
export function NextGalleryApp(): ReactNode {
  const path = typeof window !== "undefined" ? window.location.pathname : "/";

  // Example: replace with dynamic or static imports of your real Next.js pages
  // if (path === "/dashboard") return <DashboardPage />;
  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 18, margin: "0 0 8px" }}>Next.js Gallery Route: {path}</h1>
      <p style={{ fontSize: 14, color: "#57534e", margin: 0 }}>
        Map your Next.js pages in <code>NextGalleryApp.tsx</code> to preview them here.
      </p>
    </div>
  );
}

export default NextGalleryApp;
