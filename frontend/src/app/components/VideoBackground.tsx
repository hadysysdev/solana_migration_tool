"use client"

import { useEffect, useRef, useState } from "react"

export default function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) return

    // Use Intersection Observer to only load when in viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoaded) {
            // Use requestIdleCallback for non-blocking load
            if ('requestIdleCallback' in window) {
              requestIdleCallback(() => {
                loadVideo()
              }, { timeout: 2000 })
            } else {
              // Fallback for browsers without requestIdleCallback
              setTimeout(() => {
                loadVideo()
              }, 100)
            }
          }
        })
      },
      {
        rootMargin: "50px", // Start loading slightly before it comes into view
        threshold: 0.1,
      }
    )

    observer.observe(videoElement)

    return () => {
      observer.disconnect()
    }
  }, [isLoaded])

  const loadVideo = () => {
    const videoElement = videoRef.current
    if (!videoElement || isLoaded) return

    // Set the source and load the video
    const source = document.createElement('source')
    source.src = '/videos/background.mp4'
    source.type = 'video/mp4'
    videoElement.appendChild(source)

    videoElement.load()
    setIsLoaded(true)

    // Auto-play once loaded
    videoElement.addEventListener('loadeddata', () => {
      videoElement.play().catch(err => {
        console.log('Video autoplay prevented:', err)
      })
    }, { once: true })
  }

  return (
    <div className="video-background">
      <video
        ref={videoRef}
        loop
        muted
        playsInline
        preload="none"
        className="video-element"
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out'
        }}
      >
        {/* Source will be added dynamically when in viewport */}
        Your browser does not support the video tag.
      </video>
      <div className="video-overlay" />
    </div>
  )
}

