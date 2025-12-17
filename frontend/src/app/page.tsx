"use client"

import { Suspense, lazy } from "react"
import W3swapHero from "@/components/w3swap/W3swapHero"
import WhyMigrateSection from "@/components/w3swap/WhyMigrateSection"
import BenefitsSection from "@/components/w3swap/BenefitsSection"
import CTASection from "@/components/w3swap/CTASection"
import Breadcrumbs from "@/components/w3swap/Breadcrumbs"
import SectionSkeleton from "@/components/w3swap/SectionSkeleton"

// Lazy load heavy components for better performance
const DualPerspectiveTimeline = lazy(() => import("@/components/w3swap/DualPerspectiveTimeline"))

export default function W3SwapPage() {
  return (
    <main id="main-content">
        <Breadcrumbs />
      <W3swapHero />
        <Suspense fallback={<SectionSkeleton />}>
      <WhyMigrateSection />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
      <BenefitsSection />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
      <DualPerspectiveTimeline />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
      <CTASection />
        </Suspense>
    </main>
  )
}
