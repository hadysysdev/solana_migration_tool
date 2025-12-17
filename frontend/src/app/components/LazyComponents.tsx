"use client"

/**
 * Lazy-loaded component wrappers for client-side only rendering
 *
 * This file handles dynamic imports with ssr: false for heavy components.
 * Next.js 15+ requires client components to use ssr: false option.
 */

import dynamic from "next/dynamic"
import {
  ThreeBackgroundFallback,
  VideoBackgroundFallback,
} from "./LoadingFallbacks"

// Layout-level lazy components
export const LazyThreeBackground = dynamic(
  () => import("./ThreeBackground").then((mod) => ({ default: mod.ThreeBackground })),
  {
    ssr: false,
    loading: () => <ThreeBackgroundFallback />,
  }
);

export const LazyVideoBackground = dynamic(
  () => import("./VideoBackground"),
  {
    ssr: false,
    loading: () => <VideoBackgroundFallback />,
  }
);

