"use client"

import React, { useEffect, useRef, useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { Settings, Zap, TrendingUp, Lock, CheckCircle2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

// CSS for shimmer animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    @keyframes shimmer-reverse {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `
  if (!document.head.querySelector('style[data-timeline-shimmer]')) {
    style.setAttribute('data-timeline-shimmer', 'true')
    document.head.appendChild(style)
  }
}

interface TimelinePhase {
  id: string
  title: string
  icon: React.ReactNode
  holderSteps: string[]
  adminSteps: string[]
}

const phases: TimelinePhase[] = [
  {
    id: "setup",
    title: "Setup and Initialization",
    icon: <Settings className="w-5 h-5" />,
    holderSteps: [
      "Discover migration project on main page",
      "Review migration terms (ratio, eligibility lists, window timing)",
      "Check if wallet is eligible (allow, deny, or ratio list)",
      "View exchange ratio and initial LP information",
      "Wait for the migration window to open",
    ],
    adminSteps: [
      "Create or import new token",
      "Define token parameters and authorities",
      "Choose LP commitment (minimum 5 SOL)",
      "Set migration window (start time and duration)",
      "Upload allow, deny, and ratio lists (or provide snapshot)",
      "Submit initialization and pay required fees (2 SOL + rent)",
      "Project appears as Initialized and not yet active",
    ],
  },
  {
    id: "active",
    title: "Active Migration Window",
    icon: <Zap className="w-5 h-5" />,
    holderSteps: [
      "Connect wallet and check eligibility",
      "Enter amount of old tokens to migrate",
      "Sign the migration transaction",
      "Swap executes instantly (old tokens for new tokens)",
      "May repeat migrations while the window is open",
      "View migration progress and personal stats",
      "May trade tokens immediately *** Thin liquidity until migration is completed ***"
    ],
    adminSteps: [
      "Activate migration once the start time arrives",
      "Fund the new LP with the chosen commitment",
      "Monitor vault and LP balances during the window",
      "Pause migration if token supply runs low",
      "Migration window closes at the scheduled end time",
    ],
  },
  {
    id: "settlement",
    title: "Settlement and LP Funding",
    icon: <TrendingUp className="w-5 h-5" />,
    holderSteps: [
      "Migration window is closed",
      "Migration is disabled on the project page",
      "Waiting for settlement jobs to complete",
      "Settlement typically completes in 24 to 48 hours",
      "Final migration stats become visible after processing",
      "Trade with deeper liquidity in new LP",
    ],
    adminSteps: [
      "Review settlement progress as the system processes batches",
      "Confirm old token sales and final SOL amounts",
      "Review updated LP position and treasury distribution",
      "Settlement completes and project status updates accordingly",
    ],
  },
  {
    id: "lockup",
    title: "Lockup and Completion",
    icon: <Lock className="w-5 h-5" />,
    holderSteps: [
      "New tokens freely tradable on DEX",
    ],
    adminSteps: [
      "Wait for lockup period to expire (minimum 30 days)",
      "Claim LP tokens and remaining token balances",
    ],
  },
]

// flatten to cascading order: phase1 admin, phase1 holder, phase2 admin, ...
function buildTimelineItems(phases: TimelinePhase[]) {
  const items: Array<{
    phaseId: string
    phaseTitle: string
    role: "admin" | "holder"
    steps: string[]
    icon: React.ReactNode
  }> = []

  phases.forEach(p => {
    items.push({
      phaseId: p.id,
      phaseTitle: p.title,
      role: "admin",
      steps: p.adminSteps,
      icon: p.icon,
    })
    items.push({
      phaseId: p.id,
      phaseTitle: p.title,
      role: "holder",
      steps: p.holderSteps,
      icon: p.icon,
    })
  })

  return items
}

const timelineItems = buildTimelineItems(phases)

export default function DualPerspectiveTimeline() {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const secureCardRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState(0)
  const [lineEndHeight, setLineEndHeight] = useState(0)
  const [activePhase, setActivePhase] = useState<string>("")
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const phaseRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.getBoundingClientRect().height)
    }
    // Calculate where the vertical lines should end (top of Secure and Transparent card)
    const updateLineEnd = () => {
      if (secureCardRef.current && contentRef.current) {
        // Use getBoundingClientRect to get accurate position relative to contentRef
        const cardRect = secureCardRef.current.getBoundingClientRect()
        const contentRect = contentRef.current.getBoundingClientRect()
        const cardTop = cardRect.top - contentRect.top
        setLineEndHeight(cardTop)
      }
    }
    // Wait for card to be rendered
    const timeoutId = setTimeout(updateLineEnd, 100)
    // Recalculate on resize
    const resizeObserver = new ResizeObserver(updateLineEnd)
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current)
    }
    return () => {
      clearTimeout(timeoutId)
      resizeObserver.disconnect()
    }
  }, [])

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 20%", "end 80%"],
  })

  // Use lineEndHeight if available, otherwise fall back to contentHeight
  const maxLineHeight = lineEndHeight > 0 ? lineEndHeight : contentHeight
  const lineHeight = useTransform(scrollYProgress, [0, 1], [0, maxLineHeight])
  const lineOpacity = useTransform(scrollYProgress, [0, 0.1], [0, 1])

  // Update active phase based on vertical timeline progress
  useEffect(() => {
    if (!contentRef.current || contentHeight === 0) return

    const calculatePhasePositions = () => {
      const positions = new Map<string, number>()
      
      phases.forEach((phase) => {
        const phaseFirstCardIndex = timelineItems.findIndex(
          (item) => item.phaseId === phase.id && item.role === "admin"
        )
        
        if (phaseFirstCardIndex >= 0 && itemRefs.current[phaseFirstCardIndex] && contentRef.current) {
          const cardEl = itemRefs.current[phaseFirstCardIndex]
          const contentEl = contentRef.current
          
          // Get positions relative to content container
          const cardOffsetTop = cardEl.offsetTop
          positions.set(phase.id, cardOffsetTop)
        }
      })
      
      return positions
    }

    // Recalculate positions when content height changes
    const phasePositions = calculatePhasePositions()

    const unsubscribe = lineHeight.on("change", (height) => {
      // Find which phase the timeline has reached
      // If we scroll back up, phases will deactivate as height decreases
      let currentActivePhase = ""
      
      // Check phases in order - the last one reached is the active one
      phases.forEach((phase) => {
        const phaseTop = phasePositions.get(phase.id)
        if (phaseTop !== undefined) {
          // Phase bubble is positioned above the card, so subtract offset to get bubble position
          // For phase 1, require at least reaching the bubble position (card position - bubble offset)
          const bubbleOffset = phase.id === phases[0]?.id ? 80 : 60 // Approximate bubble position above card
          const bubbleTop = Math.max(0, phaseTop - bubbleOffset)
          
          if (height >= bubbleTop && height > 0) {
            currentActivePhase = phase.id
          }
        }
      })
      
      setActivePhase(currentActivePhase)
    })

    return () => unsubscribe()
  }, [lineHeight, phases, contentHeight])

  return (
    <section ref={containerRef} className="py-6 px-4 relative bg-black">
      <motion.div 
        className="max-w-7xl mx-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Section heading - centered */}
        <div className="text-center mb-6 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-white">
            Token Migration Timeline
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            A complete view of every step in a migration. Admin tasks and holder experience shown in one place.
          </p>
        </div>

        {/* Layout with sidebar and timeline */}
        <div className="flex gap-6 lg:gap-8">
          {/* sidebar - sticky to scroll with user */}
          <motion.div 
            className="hidden lg:block w-48 flex-shrink-0 sticky top-20 h-fit z-10 bg-black/80 backdrop-blur-sm border border-slate-800 rounded-lg p-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <p className="text-xs uppercase tracking-wide text-slate-400 mb-4">
              Migration flow
            </p>
            <div className="relative pl-5">
              <div className="absolute left-1 top-0 w-px h-full bg-slate-800" />
              {phases.map((phase, idx) => {
                const isActive = activePhase === phase.id
                return (
                  <button
                    key={phase.id}
                    onClick={() => {
                      const el = phaseRefs.current[phase.id]
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "center" })
                      }
                    }}
                    className="flex items-center gap-3 mb-4 group text-left w-full"
                  >
                    <span
                      className={[
                        "w-3 h-3 rounded-full border transition-all flex-shrink-0",
                        isActive
                          ? "bg-cyan-500 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]"
                          : "bg-slate-900 border-slate-700",
                      ].join(" ")}
                    />
                    <span className={isActive ? "text-white text-sm font-medium" : "text-slate-400 text-sm"}>
                      {idx + 1}. {phase.title}
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>

          {/* main timeline - centered to match title */}
          <motion.div 
            className="flex-1 min-w-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="max-w-3xl mx-auto" style={{ marginLeft: '30px' }}>
              <div ref={contentRef} className="relative px-4 md:px-0 overflow-visible">
            {/* dual spine - cyan for holders (left), purple for admin (right) */}
            {/* Cyan line for Token Holders (left boxes) */}
            <motion.div 
              className="absolute left-1/2 -translate-x-1/2 -translate-x-2 top-0 w-1 pointer-events-none z-10 md:z-10"
              style={{ height: lineEndHeight > 0 ? `${lineEndHeight}px` : '100%' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="absolute inset-x-0 top-0 w-1 h-full bg-gradient-to-b from-slate-800/20 via-slate-700 to-slate-800/20" />
              <motion.div
                style={{ height: lineHeight, opacity: lineOpacity }}
                className="absolute inset-x-0 top-0 w-1 bg-gradient-to-b from-cyan-500/40 via-cyan-400 via-[95%] to-transparent shadow-[0_0_20px_rgba(6,182,212,0.5)]"
              />
            </motion.div>
            {/* Purple line for Project Admin (right boxes) */}
            <motion.div 
              className="absolute left-1/2 -translate-x-1/2 translate-x-2 top-0 w-1 pointer-events-none z-10 md:z-10"
              style={{ height: lineEndHeight > 0 ? `${lineEndHeight}px` : '100%' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="absolute inset-x-0 top-0 w-1 h-full bg-gradient-to-b from-slate-800/20 via-slate-700 to-slate-800/20" />
              <motion.div
                style={{ height: lineHeight, opacity: lineOpacity }}
                className="absolute inset-x-0 top-0 w-1 bg-gradient-to-b from-purple-500/40 via-purple-400 via-[95%] to-transparent shadow-[0_0_20px_rgba(168,85,247,0.5)]"
              />
            </motion.div>

            {timelineItems.map((item, index) => {
              const isRight = index % 2 === 0 // admin first on right
              const phase = phases.find(p => p.id === item.phaseId)!
              const isFirstCardOfPhase = item.role === "admin"

              // Calculate connector position relative to vertical timeline
              const connectorRef = useRef<HTMLDivElement>(null)
              const bubbleRef = useRef<HTMLDivElement>(null)
              const [connectorY, setConnectorY] = useState(0)
              const [hasAnimated, setHasAnimated] = useState(false)

              useEffect(() => {
                // Calculate connector position using same method as phase positions (offsetTop)
                // This ensures we're using the same coordinate system as lineHeight
                const timeoutId = setTimeout(() => {
                  if (itemRefs.current[index] && contentRef.current) {
                    const cardEl = itemRefs.current[index]
                    if (!cardEl) return
                    
                    // Get card position relative to contentRef (same as phase calculation)
                    const cardOffsetTop = cardEl.offsetTop
                    
                    // Connector is positioned lower on the card
                    // Account for pt-2 (8px padding) on first card of phase
                    const paddingOffset = isFirstCardOfPhase ? 8 : 0
                    const connectorY = cardOffsetTop + paddingOffset + 64
                    setConnectorY(connectorY)
                  }
                }, 300)

                return () => clearTimeout(timeoutId)
              }, [contentHeight, index, isFirstCardOfPhase])

              // Track when bubble enters viewport
              useEffect(() => {
                if (!bubbleRef.current || hasAnimated) return

                const observer = new IntersectionObserver(
                  (entries) => {
                    entries.forEach((entry) => {
                      if (entry.isIntersecting) {
                        setHasAnimated(true)
                        observer.disconnect()
                      }
                    })
                  },
                  { threshold: 0.1 }
                )

                observer.observe(bubbleRef.current)

                return () => observer.disconnect()
              }, [hasAnimated])

              // Check if vertical timeline has reached this connector
              // Only energize when the colored line actually reaches the connector
              const hasReached = useTransform(
                lineHeight,
                (height) => {
                  if (connectorY <= 0) return false
                  // Only trigger when line has actually reached the connector (add buffer to ensure visual connection)
                  return height >= connectorY + 4
                }
              )

              return (
                <div
                  key={item.phaseId + item.role}
                  ref={el => {
                    itemRefs.current[index] = el
                    if (isFirstCardOfPhase) {
                      phaseRefs.current[item.phaseId] = el
                    }
                  }}
                  className={`relative mb-10 z-20 md:z-auto ${
                    isFirstCardOfPhase 
                      ? item.role === "admin" 
                        ? item.phaseId === "setup"
                          ? "mt-32 pt-8"
                          : "mt-28 pt-2"
                        : "mt-16 pt-2"
                      : ""
                  }`}
                >
                  {/* phase bubble on first card */}
                  {isFirstCardOfPhase ? (
                    <div 
                      ref={bubbleRef}
                      className={`absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none ${
                        item.phaseId === "setup" ? "z-30" : "z-20"
                      }`}
                      style={{
                        minWidth: "200px",
                        top: item.role === "admin" ? "-7rem" : "-4rem",
                      }}
                    >
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{
                          duration: 0.4,
                          ease: "easeOut",
                        }}
                        className={`w-16 h-16 rounded-full flex items-center justify-center relative transition-all backdrop-blur-sm ${
                          activePhase === item.phaseId 
                            ? "shadow-[0_0_35px_rgba(6,182,212,0.8),0_0_70px_rgba(6,182,212,0.5),0_0_100px_rgba(6,182,212,0.25)]" 
                            : "shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                        }`}
                        style={{
                          background: activePhase === item.phaseId
                            ? "linear-gradient(135deg, rgba(6,182,212,0.4) 0%, rgba(20,184,166,0.4) 50%, rgba(34,211,238,0.35) 100%)"
                            : "linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(20,184,166,0.2) 100%)",
                          border: `2px solid ${activePhase === item.phaseId ? "rgba(6,182,212,0.85)" : "rgba(6,182,212,0.5)"}`,
                          boxShadow: activePhase === item.phaseId
                            ? "0 0 35px rgba(6,182,212,0.8), 0 0 70px rgba(6,182,212,0.5), 0 0 100px rgba(6,182,212,0.25), inset 0 0 25px rgba(6,182,212,0.3), inset 0 0 50px rgba(34,211,238,0.15)"
                            : "0 0 15px rgba(6,182,212,0.4), inset 0 0 10px rgba(6,182,212,0.1)",
                        }}
                      >
                        {/* Glass overlay effect - brighter when active */}
                        <div 
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: activePhase === item.phaseId
                              ? "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, rgba(6,182,212,0.25) 50%, transparent 70%)"
                              : "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)",
                            mixBlendMode: "overlay",
                          }}
                        />
                        {/* Pulsing ring effect when active */}
                        {activePhase === item.phaseId && (
                          <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{
                              border: "2px solid rgba(6,182,212,0.85)",
                              filter: "blur(2px)",
                              boxShadow: "0 0 18px rgba(6,182,212,0.8), 0 0 35px rgba(6,182,212,0.5)",
                            }}
                            animate={{
                              scale: [1, 1.5, 1],
                              opacity: [0.9, 0, 0.9],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          />
                        )}
                        <div 
                          className="text-white relative z-10"
                          style={{
                            filter: activePhase === item.phaseId 
                              ? "drop-shadow(0 0 10px rgba(6,182,212,0.9)) drop-shadow(0 0 20px rgba(34,211,238,0.6))"
                              : "drop-shadow(0 0 8px rgba(6,182,212,0.8))",
                          }}
                        >
                          {item.icon}
                        </div>
                      </motion.div>
                      <motion.div 
                        className="mt-3 mb-6 text-center select-none px-4 py-2 rounded-xl glass-card border border-slate-700/50"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{
                          duration: 0.4,
                          ease: "easeOut",
                        }}
                      >
                        <p className="text-sm font-semibold text-slate-200">
                          {phases.findIndex(p => p.id === item.phaseId) + 1}. {phase.title}
                        </p>
                      </motion.div>
                    </div>
                  ) : null}

                  {/* connector + pulse - only visible when card is in view */}
                  {/* For right boxes (admin): connect to purple line (8px right of center) */}
                  {/* For left boxes (holder): connect to cyan line (8px left of center) */}
                  <motion.div
                    ref={connectorRef}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className={[
                      "absolute z-0",
                      isRight ? "left-1/2 translate-x-2" : "right-1/2 -translate-x-2",
                      "h-0",
                      item.role === "admin" ? "top-16" : "top-12",
                    ].join(" ")}
                  >
                    <ConnectorWithPulse 
                      side={isRight ? "right" : "left"} 
                      hasReached={hasReached}
                      role={item.role}
                    />
                  </motion.div>

                  {/* card */}
                  <motion.div 
                    className={isFirstCardOfPhase ? "mt-8" : ""}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.4 }}
                  >
                    <GlowCard
                      role={item.role}
                      isRight={isRight}
                      steps={item.steps}
                      hasReached={hasReached}
                    />
                  </motion.div>
                </div>
              )
            })}

            {/* bottom CTA */}
            <motion.div
              ref={secureCardRef}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mt-20 text-center relative z-20"
            >
              <Card className="glass-card p-8 inline-block relative z-20 bg-slate-900/95 backdrop-blur-md">
                <CardContent className="p-0">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-500" />
                    <h3 className="font-semibold text-white">Secure and Transparent</h3>
                  </div>
                  <p className="text-sm text-slate-400 max-w-md">
                    Every step is on chain or auditable. Admins and holders can see status in real time, including treasury transfers and LP seeding.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}

// straight connector + energizing animation
function ConnectorWithPulse({ 
  side, 
  hasReached,
  role
}: { 
  side: "left" | "right"
  hasReached: any // MotionValue<boolean>
  role: "admin" | "holder"
}) {
  // Initialize state from current value to avoid render-phase updates
  const [energized, setEnergized] = React.useState(() => {
    try {
      return hasReached?.get?.() ?? false
    } catch {
      return false
    }
  })
  const connectorColor = role === "admin" ? "#a855f7" : "#06b6d4" // purple for admin, cyan for holder
  const connectorColorRgb = role === "admin" ? "rgba(168,85,247," : "rgba(6,182,212,"

  React.useEffect(() => {
    // Subscribe to changes after component has mounted
    const unsubscribe = hasReached.on("change", (latest: boolean) => {
      // Update energized state reactively - true when reached, false when not
      // Use setTimeout to ensure this happens after the current render cycle
      setTimeout(() => {
        setEnergized(latest)
      }, 0)
    })
    return () => unsubscribe()
  }, [hasReached])

  return (
    <div className="relative w-32 h-10 z-0">
      {/* base line */}
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        whileInView={{ width: "2.75rem", opacity: 1 }}
        transition={{ duration: 0.18 }}
        className={`absolute top-1/2 -translate-y-1/2 h-[2px] bg-slate-700 ${
          side === "right" ? "left-0" : "right-0"
        }`}
      />
      
      {/* energizing line - animated then static */}
      {energized && (
        <>
          {/* Animated traveling line */}
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ 
              width: "2.75rem", 
              opacity: 1,
            }}
            transition={{ 
              duration: 0.8,
              ease: "easeInOut",
            }}
            className={`absolute top-1/2 -translate-y-1/2 h-[3px] z-10 ${
              side === "right" ? "left-0" : "right-0"
            }`}
            style={{
              background: `linear-gradient(${side === "right" ? "90deg" : "270deg"}, transparent, ${connectorColor} 50%, transparent)`,
              backgroundSize: "200% 100%",
              animation: `${side === "right" ? "shimmer" : "shimmer-reverse"} 1.5s linear infinite`,
              boxShadow: `0 0 10px ${connectorColorRgb}0.8)`,
            }}
          />
          {/* Static energized line (appears after animation, but keep animated line visible) */}
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ 
              width: "2.75rem", 
              opacity: 1,
            }}
            transition={{ 
              duration: 0.3,
              delay: 1.8,
              ease: "easeInOut",
            }}
            className={`absolute top-1/2 -translate-y-1/2 h-[2px] z-0 ${
              side === "right" ? "left-0" : "right-0"
            }`}
            style={{
              background: connectorColor,
              boxShadow: `0 0 8px ${connectorColorRgb}0.6)`,
            }}
          />
        </>
      )}

      {/* energy pulse traveling along line (only during animation) */}
      {energized && (
        <>
          {/* Left side animation - keep as is */}
          {side === "left" && (
            <motion.div
              initial={{ 
                x: "2.75rem",
                opacity: 0,
                scale: 0,
              }}
              animate={{
                x: 0,
                opacity: [0, 1, 1, 0],
                scale: [0, 1.5, 1.5, 0],
              }}
              transition={{
                duration: 0.6,
                ease: "easeInOut",
              }}
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full z-0"
              style={{
                background: role === "admin" ? "#c084fc" : "#22d3ee",
                boxShadow: `0 0 20px ${connectorColorRgb}1)`,
              }}
            />
          )}
          {/* Right side animation - moves right */}
          {side === "right" && (
            <motion.div
              initial={{ 
                x: "2.75rem",
                opacity: 0,
                scale: 0,
              }}
              animate={{
                x: "5.5rem",
                opacity: [0, 1, 1, 0],
                scale: [0, 1.5, 1.5, 0],
              }}
              transition={{
                duration: 0.6,
                ease: "easeInOut",
              }}
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full z-0"
              style={{
                background: role === "admin" ? "#c084fc" : "#22d3ee",
                boxShadow: `0 0 20px ${connectorColorRgb}1)`,
              }}
            />
          )}
        </>
      )}
    </div>
  )
}

function GlowCard({
  role,
  isRight,
  steps,
  hasReached,
}: {
  role: "admin" | "holder"
  isRight: boolean
  steps: string[]
  hasReached: any // MotionValue<boolean>
}) {
  const [energized, setEnergized] = React.useState(false)
  const [glowProgress, setGlowProgress] = React.useState(0)

  React.useEffect(() => {
    let animationFrameId: number | null = null
    
    const unsubscribe = hasReached.on("change", (latest: boolean) => {
      // Update energized state reactively - true when reached, false when not
      setEnergized(latest)
      
      if (latest) {
        // Animate glow around the box when reached
        const duration = 1000 // 1 second
        const startTime = Date.now()
        const animate = () => {
          const elapsed = Date.now() - startTime
          const progress = Math.min(elapsed / duration, 1)
          setGlowProgress(progress)
          if (progress < 1) {
            animationFrameId = requestAnimationFrame(animate)
          }
        }
        animate()
      } else {
        // Reset glow progress when scrolling back up
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId)
        }
        setGlowProgress(0)
      }
    })
    return () => {
      unsubscribe()
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [hasReached])

  const borderColor = role === "admin" ? "rgba(168, 85, 247, 0.8)" : "rgba(6, 182, 212, 0.8)"
  const glowColor = role === "admin" ? "rgba(168, 85, 247, 1)" : "rgba(6, 182, 212, 1)"

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: isRight ? 36 : -36,
        y: 10,
        boxShadow: "0 0 0px rgba(6,182,212,0)",
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
        boxShadow: [
          "0 0 0px rgba(6,182,212,0)",
          "0 0 24px rgba(6,182,212,0.35)",
          "0 0 6px rgba(6,182,212,0.15)",
        ],
      }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.55 }}
            className={[
              "relative w-full md:w-[calc(50%-2.5rem)] rounded-xl border backdrop-blur-sm overflow-hidden",
        role === "admin"
          ? "from-purple-500/10 to-pink-500/10 border-purple-500/20 bg-gradient-to-br"
          : "from-cyan-500/10 to-teal-500/10 border-cyan-500/20 bg-gradient-to-br",
        isRight ? "ml-auto" : "mr-auto",
      ].join(" ")}
    >
      {/* Animated glow outline - travels around box from connection point */}
      {energized && (
        <>
          <svg
            className="absolute inset-0 pointer-events-none w-full h-full"
            style={{ filter: `drop-shadow(0 0 14px ${glowColor})` }}
          >
            <defs>
              <linearGradient id={`glow-gradient-${role}-${isRight}`} gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor={glowColor} stopOpacity="0" />
                <stop offset="15%" stopColor={glowColor} stopOpacity="0.6" />
                <stop offset="50%" stopColor={glowColor} stopOpacity="1" />
                <stop offset="85%" stopColor={glowColor} stopOpacity="0.6" />
                <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
              </linearGradient>
              {/* Glow filter for extra brightness - toned down */}
              <filter id={`glow-filter-${role}-${isRight}`}>
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* First direction - exact mirror of right-side first stroke */}
            {/* Right-side: 875 → 375 (clockwise, goes up then right, ends at right-middle) */}
            {/* Left-side mirror: 375 → 1875 (wraps to 875, counter-clockwise, goes up then left, ends at left-middle) */}
<motion.rect
  x="2"
  y="2"
  width="calc(100% - 4px)"
  height="calc(100% - 4px)"
  rx="12"
  fill="none"
  stroke={glowColor}
  strokeWidth="4"
  strokeDasharray="1000"
  filter={`url(#glow-filter-${role}-${isRight})`}
  initial={{ 
    // right side stays the same
    // left side now starts at right-middle (375)
    strokeDashoffset: isRight ? 875 : 200,
    opacity: 0,
  }}
  animate={{ 
    // right: 875 -> 375 (what you already had)
    // left: 375 -> 875 (mirror)
    strokeDashoffset: isRight ? 375 : 875,
    opacity: [0, 0.8, 0.8, 0.8],
  }}
  transition={{ 
    duration: 1.8, 
    ease: "easeInOut",
    opacity: { duration: 0.3 }
  }}
  style={{
    strokeLinecap: "round",
    strokeLinejoin: "round",
  }}
/>

{/* second pass */}
<motion.rect
  x="2"
  y="2"
  width="calc(100% - 4px)"
  height="calc(100% - 4px)"
  rx="12"
  fill="none"
  stroke={glowColor}
  strokeWidth="4"
  strokeDasharray="1000"
  filter={`url(#glow-filter-${role}-${isRight})`}
  initial={{ 
    // right: same start as before
    // left: same start as first stroke (375) so they sync
    strokeDashoffset: isRight ? 875 : 200,
    opacity: 0,
  }}
  animate={{ 
    // right: 875 -> 1375 (wraps to 375)
    // left: 375 -> -125 (wraps to 875)
    strokeDashoffset: isRight ? 1375 : -125,
    opacity: [0, 0.8, 0.8, 0.8],
  }}
  transition={{ 
    duration: 1.8, 
    ease: "easeInOut",
    opacity: { duration: 0.3 }
  }}
  style={{
    strokeLinecap: "round",
    strokeLinejoin: "round",
  }}
/>
</svg>

{/* Persistent glow outline */}
<motion.div
  className="absolute inset-0 rounded-xl pointer-events-none"
  initial={{ opacity: 0 }}
  animate={{ opacity: glowProgress > 0.9 ? 1 : 0 }}
  transition={{ duration: 0.3 }}
  style={{
    border: `2px solid ${glowColor}`,
    filter: `drop-shadow(0 0 8px ${glowColor})`,
  }}
/>
        </>
      )}
      <div className="p-6 bg-slate-900/50 rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <div
            className={[
              "w-2 h-2 rounded-full",
              role === "admin" ? "bg-purple-400" : "bg-cyan-400",
            ].join(" ")}
          />
          <h4
            className={[
              "text-lg font-semibold",
              role === "admin" ? "text-purple-200" : "text-cyan-200",
            ].join(" ")}
          >
            {role === "admin" ? "Project Admin" : "Token Holder"}
          </h4>
        </div>

        <ul className="space-y-3">
          {steps.map((step, stepIndex) => {
            // Check if step contains emphasized note with *** markers
            const hasEmphasis = step.includes("***")
            let mainText = step
            let warningText = ""
            
            if (hasEmphasis) {
              const parts = step.split("***")
              mainText = parts[0]?.trim() || ""
              warningText = parts[1]?.trim() || ""
            }
            
            return (
              <motion.li
                key={stepIndex}
                initial={{ opacity: 0, x: isRight ? 8 : -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: stepIndex * 0.04 }}
                className={`flex gap-3 text-sm ${hasEmphasis ? "items-start" : ""}`}
              >
                <span
                  className={[
                    "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5",
                    role === "admin"
                      ? "bg-purple-500/20 text-purple-200"
                      : "bg-cyan-500/20 text-cyan-200",
                  ].join(" ")}
                >
                  {stepIndex + 1}
                </span>
                <span className={hasEmphasis ? "flex flex-col gap-1" : ""}>
                  <span className="text-slate-300">{mainText}</span>
                  {warningText && (
                    <span className="text-yellow-400 font-semibold text-xs bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/30">
                      ⚠️ {warningText}
                    </span>
                  )}
                </span>
              </motion.li>
            )
          })}
        </ul>
      </div>
    </motion.div>
  )
}

