"use client"

import { useEffect, useState } from "react"
import Lottie from "lottie-react"

// Start fetching immediately when module loads
const hologramPromise = fetch("/animations/3D Hologram.json")
  .then((res) => res.json())
  .catch((err) => {
    console.error("Failed to load hologram animation:", err)
    return null
  })

// Function to modify colors in Lottie animation data
function modifyLottieColors(animationData: any, targetColor: [number, number, number], intensity: number = 0.7): any {
  if (!animationData) return animationData
  
  const modified = JSON.parse(JSON.stringify(animationData))
  const [targetR, targetG, targetB] = targetColor
  
  function traverseAndModify(obj: any): void {
    if (!obj || typeof obj !== 'object') return
    
    if (Array.isArray(obj)) {
      if (obj.length >= 3 && obj.length <= 4) {
        const [r, g, b, a = 1] = obj
        if (r >= 0 && r <= 1 && g >= 0 && g <= 1 && b >= 0 && b <= 1 && 
            typeof r === 'number' && typeof g === 'number' && typeof b === 'number') {
          const originalBrightness = (r + g + b) / 3
          const targetBrightness = (targetR + targetG + targetB) / 3 / 255
          
          const blendR = (r * (1 - intensity) + (targetR / 255) * intensity)
          const blendG = (g * (1 - intensity) + (targetG / 255) * intensity)
          const blendB = (b * (1 - intensity) + (targetB / 255) * intensity)
          
          const currentBrightness = (blendR + blendG + blendB) / 3
          const brightnessFactor = originalBrightness / (currentBrightness || 0.001)
          
          obj[0] = Math.max(0, Math.min(1, blendR * brightnessFactor))
          obj[1] = Math.max(0, Math.min(1, blendG * brightnessFactor))
          obj[2] = Math.max(0, Math.min(1, blendB * brightnessFactor))
          if (obj.length === 4) obj[3] = a
        }
      } else {
        obj.forEach((item: any) => {
          if (typeof item === 'object') {
            traverseAndModify(item)
          }
        })
      }
    }
    
    for (const key in obj) {
      if (Array.isArray(obj[key])) {
        traverseAndModify(obj[key])
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        traverseAndModify(obj[key])
      }
    }
  }
  
  traverseAndModify(modified)
  return modified
}

export default function MigrationAnimationDemo() {
  const [hologramAnimationData, setHologramAnimationData] = useState<any>(null)
  const [oldTokenAnimationData, setOldTokenAnimationData] = useState<any>(null)
  const [newTokenAnimationData, setNewTokenAnimationData] = useState<any>(null)

  useEffect(() => {
    hologramPromise.then((data) => {
      if (data) {
        setHologramAnimationData(data)
        const purpleVersion = modifyLottieColors(data, [147, 51, 234], 0.85)
        setOldTokenAnimationData(purpleVersion)
        const cyanVersion = modifyLottieColors(data, [34, 211, 238], 0.85)
        setNewTokenAnimationData(cyanVersion)
      }
    })
  }, [])

  if (!oldTokenAnimationData || !newTokenAnimationData) {
    return <div className="p-8 text-center">Loading animations...</div>
  }

  const animationOptions = [
    {
      id: "option-1",
      name: "Option 1: Animated Particles",
      component: (
        <div className="relative w-full h-full overflow-visible">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500/40 via-cyan-500/60 to-teal-500/40" />
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 w-2 h-2 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50"
              style={{
                left: '0%',
                animation: `flowParticle 2.5s ease-in-out infinite`,
                animationDelay: `${i * 0.33}s`,
                transform: 'translateY(-50%)',
              }}
            />
          ))}
        </div>
      )
    },
    {
      id: "option-2",
      name: "Option 2: Flowing Gradient Wave",
      component: (
        <div className="relative w-full h-full overflow-visible">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-purple-500/30 via-cyan-500/50 to-teal-500/30 rounded-full" />
          <div 
            className="absolute top-1/2 h-2 bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent rounded-full"
            style={{
              left: '0%',
              width: '40%',
              animation: 'flowWave 2s ease-in-out infinite',
              transform: 'translateY(-50%)',
            }}
          />
        </div>
      )
    },
    {
      id: "option-3",
      name: "Option 3: Dots Along Curved Path",
      component: (
        <div className="relative w-full h-full overflow-visible">
          <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="migrationGradient-3" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9333ea" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="tokenGradient-3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
              <filter id="blur-3">
                <feGaussianBlur in="SourceGraphic" stdDeviation="1" />
              </filter>
              <filter id="glow-3">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* Path for the line */}
            <path
              id="path-curve-3"
              d="M 0 50 Q 50 20 100 50"
              fill="none"
              stroke="url(#migrationGradient-3)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {/* Animated dots following the path - styled like Option 4 tokens */}
            {[...Array(4)].map((_, i) => (
              <g key={i}>
                {/* Blur effect layer - matches Option 4's blur-sm */}
                <circle r="3" fill="#22d3ee" opacity="0.3" filter="url(#blur-3)">
                  <animateMotion
                    dur="2.5s"
                    repeatCount="indefinite"
                    begin={`${i * 0.5}s`}
                    calcMode="linear"
                  >
                    <mpath href="#path-curve-3" />
                  </animateMotion>
                </circle>
                {/* Main circle with gradient - matches Option 4's w-3 h-3 size */}
                <circle r="3" fill="url(#tokenGradient-3)" filter="url(#glow-3)">
                  <animateMotion
                    dur="2.5s"
                    repeatCount="indefinite"
                    begin={`${i * 0.5}s`}
                    calcMode="linear"
                  >
                    <mpath href="#path-curve-3" />
                  </animateMotion>
                </circle>
              </g>
            ))}
          </svg>
        </div>
      )
    },
    {
      id: "option-4",
      name: "Option 4: Token Icons with Motion Blur",
      component: (
        <div className="relative w-full h-full overflow-visible">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500/40 via-cyan-500/60 to-teal-500/40" />
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 flex items-center justify-center"
              style={{
                left: '0%',
                animation: `flowToken 3s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
                transform: 'translateY(-50%)',
              }}
            >
              <div className="w-3 h-3 bg-gradient-to-br from-cyan-400 to-teal-400 rounded-full shadow-lg shadow-cyan-400/50" />
              <div className="absolute inset-0 bg-cyan-400/30 blur-sm" />
            </div>
          ))}
        </div>
      )
    },
    {
      id: "option-5",
      name: "Option 5: Energy Wave/Beam",
      component: (
        <div className="relative w-full h-full overflow-visible">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-purple-500/20 via-cyan-500/40 to-teal-500/20 rounded-full blur-sm" />
          <div 
            className="absolute top-1/2 h-3 bg-gradient-to-r from-purple-400/60 via-cyan-400/80 to-teal-400/60 rounded-full blur-md"
            style={{
              left: '0%',
              width: '60%',
              animation: 'energyPulse 1.6s ease-in-out infinite',
              transform: 'translateY(-50%)',
            }}
          />
          <div 
            className="absolute top-1/2 left-1/2 w-2 h-2 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/80"
            style={{
              animation: 'pulseCenter 1.6s ease-in-out infinite',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      )
    },
    {
      id: "option-6",
      name: "Option 6: Simple Flowing Line",
      component: (
        <div className="relative w-full h-full overflow-visible">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500/50 via-cyan-500/70 to-teal-500/50 rounded-full" />
          <div 
            className="absolute top-1/2 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full"
            style={{
              left: '0%',
              width: '30%',
              animation: 'flowHighlight 2.3s ease-in-out infinite',
              transform: 'translateY(-50%)',
            }}
          />
        </div>
      )
    },
    {
      id: "option-7",
      name: "Option 7: Stacked Coins",
      component: (
        <div className="relative w-full h-full overflow-visible">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500/40 via-cyan-500/60 to-teal-500/40" />
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 flex gap-0.5"
              style={{
                left: '0%',
                animation: `flowStack 2.5s ease-in-out infinite`,
                animationDelay: `${i * 0.7}s`,
                transform: 'translateY(-50%)',
              }}
            >
              {[...Array(3)].map((_, j) => (
                <div
                  key={j}
                  className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-md shadow-cyan-400/50"
                  style={{
                    transform: `translateY(${j * -2}px)`,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      )
    },
    {
      id: "option-combo",
      name: "Combo: Curved Arc + Pulse Wave + Enlarging Circles",
      component: (
        <div className="relative w-full h-full overflow-visible">
          {/* Curved arc path background - extends full width to overlap holograms */}
          <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ zIndex: 1, overflow: 'visible' }}>
            <path
              d="M 0 50 Q 50 20 100 50"
              fill="none"
              stroke="url(#migrationGradient-combo)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <defs>
              <linearGradient id="migrationGradient-combo" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9333ea" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.4" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Pulsing gradient wave following curved path - starts from left hologram */}
          <div 
            className="absolute top-1/2 h-2 bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent rounded-full"
            style={{
              left: '0%',
              width: '40%',
              animation: 'flowWaveCurved 2s ease-in-out infinite',
              zIndex: 2,
            }}
          />
          
          {/* Enlarging circles following curved path - start from left hologram */}
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 flex items-center justify-center"
              style={{
                left: '0%',
                top: '50%',
                animation: `moveDot 2.5s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
                zIndex: 3,
              }}
            >
              <div 
                className="w-3 h-3 bg-gradient-to-br from-cyan-400 to-teal-400 rounded-full shadow-lg shadow-cyan-400/50"
                style={{
                  animation: `flowToken 2.5s ease-in-out infinite`,
                  animationDelay: `${i * 0.5}s`,
                }}
              />
              <div className="absolute inset-0 bg-cyan-400/30 blur-sm rounded-full" />
            </div>
          ))}
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
        Migration Animation Options
      </h1>
      
      <div className="max-w-7xl mx-auto space-y-16">
        {animationOptions.map((option, index) => (
          <div key={index} className="bg-slate-900/50 rounded-lg p-8 border border-slate-700">
            <h2 className="text-xl font-semibold mb-6 text-cyan-400">{option.name}</h2>
            
            {/* Demo with holograms */}
            <div className="relative flex items-center justify-center gap-4 md:gap-8 py-8 bg-slate-950/50 rounded-lg overflow-visible">
              {/* Old Token LP */}
              <div className="relative flex-1 flex flex-col items-center max-w-[150px] z-10" id={`old-hologram-${index}`}>
                <div className="relative w-full aspect-square">
                  <div className="absolute inset-0 bg-purple-600/20 rounded-full blur-2xl" />
                  <Lottie
                    animationData={oldTokenAnimationData}
                    loop={true}
                    autoplay={true}
                    className="w-full h-full relative z-10"
                    style={{ 
                      filter: "drop-shadow(0 0 30px rgba(147, 51, 234, 0.6)) brightness(0.85) contrast(1.1) saturate(0.9)",
                    }}
                  />
                </div>
                <div className="mt-2 px-2 py-1 rounded-full bg-purple-600/30 border border-purple-500/50">
                  <span className="text-xs font-semibold text-purple-300">OLD LP</span>
                </div>
              </div>

              {/* Migration Animation - spans from center of left hologram to center of right hologram */}
              <div 
                className="absolute h-16 md:h-20 pointer-events-none"
                style={{ 
                  top: '35%',
                  left: 'calc((100% - 300px - 1rem) / 2 + 75px)',
                  right: 'calc((100% - 300px - 1rem) / 2 + 75px)',
                  transform: 'translateY(-50%)',
                  zIndex: 5,
                }}
              >
                {option.component}
              </div>

              {/* New Token LP */}
              <div className="relative flex-1 flex flex-col items-center max-w-[150px] z-10" id={`new-hologram-${index}`}>
                <div className="relative w-full aspect-square">
                  <div className="absolute inset-0 bg-cyan-400/30 rounded-full blur-2xl animate-pulse" />
                  <Lottie
                    animationData={newTokenAnimationData}
                    loop={true}
                    autoplay={true}
                    className="w-full h-full relative z-10"
                    style={{ 
                      filter: "drop-shadow(0 0 35px rgba(34, 211, 238, 0.7)) brightness(1.2) contrast(1.15) saturate(1.3)",
                    }}
                  />
                </div>
                <div className="mt-2 px-2 py-1 rounded-full bg-cyan-400/30 border border-cyan-400/60 shadow-lg shadow-cyan-400/20">
                  <span className="text-xs font-semibold text-cyan-300">NEW LP</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

