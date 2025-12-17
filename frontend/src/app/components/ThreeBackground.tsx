"use client"

import { useRef, useEffect, useState, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"

// Optimized StreamingWaves with geometry/material reuse
function StreamingWaves() {
  const groupRef = useRef<THREE.Group>(null)
  const waveRefs = useRef<THREE.Mesh[]>([])

  // Wave configuration
  const waves = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
    radius: 2 + i * 1.5,
    speed: 0.5 + i * 0.1,
    opacity: 0.8 - i * 0.08,
  })), [])

  // Shared geometries - reduced segments from 32 to 16 (visually acceptable, 50% reduction)
  const geometries = useMemo(() =>
    waves.map(wave => new THREE.RingGeometry(wave.radius, wave.radius + 0.1, 16))
  , [waves])

  // Shared materials with proper initialization
  const materials = useMemo(() =>
    waves.map((wave, i) => new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? 0x06b6d4 : 0x8b5cf6,
      transparent: true,
      opacity: wave.opacity,
      side: THREE.DoubleSide,
      depthWrite: false, // Performance optimization for transparent objects
    }))
  , [waves])

  // Pre-allocate temp objects to avoid garbage collection
  const tempScale = useMemo(() => new THREE.Vector3(), [])

  useFrame((state) => {
    const time = state.clock.elapsedTime

    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.1
    }

    // Batch all wave updates
    for (let i = 0; i < waveRefs.current.length; i++) {
      const wave = waveRefs.current[i]
      if (!wave) continue

      const waveSpeed = waves[i].speed
      const sinValue = Math.sin(time * waveSpeed)

      // Update scale using temp vector
      const scale = 1 + sinValue * 0.3
      tempScale.setScalar(scale)
      wave.scale.copy(tempScale)

      // Update opacity
      const material = materials[i]
      material.opacity = waves[i].opacity * (0.5 + sinValue * 0.5)
    }
  })

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      geometries.forEach(geo => geo.dispose())
      materials.forEach(mat => mat.dispose())
    }
  }, [geometries, materials])

  return (
    <group ref={groupRef}>
      {waves.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) waveRefs.current[i] = el
          }}
          geometry={geometries[i]}
          material={materials[i]}
        />
      ))}
    </group>
  )
}

// Optimized DataStreams using InstancedMesh for better performance
function DataStreams() {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null)

  // Stream configuration
  const streams = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    angle: (i / 12) * Math.PI * 2,
    radius: 8 + Math.random() * 4,
    speed: 0.5 + Math.random() * 0.5,
    colorIndex: i % 3,
  })), [])

  // Shared geometry - reduced segments from default (32/16) to 8/6
  const geometry = useMemo(() => new THREE.SphereGeometry(0.05, 8, 6), [])

  // Create 3 materials for the 3 colors
  const materials = useMemo(() => [
    new THREE.MeshBasicMaterial({ color: 0x06b6d4, depthWrite: false }),
    new THREE.MeshBasicMaterial({ color: 0x8b5cf6, depthWrite: false }),
    new THREE.MeshBasicMaterial({ color: 0x10b981, depthWrite: false }),
  ], [])

  // Pre-allocate temp objects
  const tempMatrix = useMemo(() => new THREE.Matrix4(), [])
  const tempPosition = useMemo(() => new THREE.Vector3(), [])

  // Initialize instance matrices
  useEffect(() => {
    if (!instancedMeshRef.current) return

    const mesh = instancedMeshRef.current
    for (let i = 0; i < streams.length; i++) {
      tempMatrix.identity()
      mesh.setMatrixAt(i, tempMatrix)
      mesh.setColorAt(i, materials[streams[i].colorIndex].color)
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [streams, materials, tempMatrix])

  useFrame((state) => {
    if (!instancedMeshRef.current) return

    const time = state.clock.elapsedTime
    const mesh = instancedMeshRef.current

    // Update all instances in a single pass
    for (let i = 0; i < streams.length; i++) {
      const stream = streams[i]
      const angle = stream.angle + time * stream.speed

      tempPosition.set(
        Math.cos(angle) * stream.radius,
        Math.sin(time * 2 + i) * 2,
        Math.sin(angle) * stream.radius
      )

      tempMatrix.setPosition(tempPosition)
      mesh.setMatrixAt(i, tempMatrix)
    }

    mesh.instanceMatrix.needsUpdate = true
  })

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      geometry.dispose()
      materials.forEach(mat => mat.dispose())
    }
  }, [geometry, materials])

  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[geometry, materials[0], streams.length]}
      frustumCulled={true}
    >
      <instancedBufferAttribute attach="instanceColor" args={[new Float32Array(streams.length * 3), 3]} />
    </instancedMesh>
  )
}

// Optimized AudioWaveform using InstancedMesh
function AudioWaveform() {
  const groupRef = useRef<THREE.Group>(null)
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null)

  const bars = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    x: (i - 10) * 0.3,
    baseHeight: 0.2 + Math.random() * 0.3,
    frequency: 1 + Math.random() * 2,
  })), [])

  // Shared geometry
  const geometry = useMemo(() => new THREE.BoxGeometry(0.1, 1, 0.1), [])

  // Shared material
  const material = useMemo(() => new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
  }), [])

  // Pre-allocate temp objects
  const tempMatrix = useMemo(() => new THREE.Matrix4(), [])
  const tempPosition = useMemo(() => new THREE.Vector3(), [])
  const tempScale = useMemo(() => new THREE.Vector3(1, 1, 1), [])
  const tempColor = useMemo(() => new THREE.Color(0x06b6d4), [])

  // Initialize instance matrices
  useEffect(() => {
    if (!instancedMeshRef.current) return

    const mesh = instancedMeshRef.current
    for (let i = 0; i < bars.length; i++) {
      tempPosition.set(bars[i].x, 0, 0)
      tempMatrix.compose(tempPosition, new THREE.Quaternion(), tempScale)
      mesh.setMatrixAt(i, tempMatrix)
      mesh.setColorAt(i, tempColor)
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [bars, tempMatrix, tempPosition, tempScale, tempColor])

  useFrame((state) => {
    const time = state.clock.elapsedTime

    if (groupRef.current) {
      groupRef.current.position.x = Math.sin(time * 0.3) * 2
    }

    if (!instancedMeshRef.current) return

    const mesh = instancedMeshRef.current

    // Update all bar instances
    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i]
      const height = bar.baseHeight + Math.sin(time * bar.frequency * 3) * 0.4
      const scaleY = Math.max(0.1, height)

      tempPosition.set(bar.x, 0, 0)
      tempScale.set(1, scaleY, 1)
      tempMatrix.compose(tempPosition, new THREE.Quaternion(), tempScale)
      mesh.setMatrixAt(i, tempMatrix)

      // Update color opacity via color intensity
      const opacity = 0.3 + height * 0.4
      tempColor.setRGB(
        0x06 / 0xff * opacity,
        0xb6 / 0xff * opacity,
        0xd4 / 0xff * opacity
      )
      mesh.setColorAt(i, tempColor)
    }

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  return (
    <group ref={groupRef} position={[0, -3, -8]}>
      <instancedMesh
        ref={instancedMeshRef}
        args={[geometry, material, bars.length]}
        frustumCulled={true}
      >
        <instancedBufferAttribute attach="instanceColor" args={[new Float32Array(bars.length * 3), 3]} />
      </instancedMesh>
    </group>
  )
}

// Optimized BroadcastSignals with shared geometry/materials
function BroadcastSignals() {
  const signalRefs = useRef<THREE.Mesh[]>([])

  const signals = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    rotation: (i / 6) * Math.PI * 2,
    colorIndex: i % 2,
  })), [])

  // Shared geometry
  const geometry = useMemo(() => new THREE.PlaneGeometry(0.02, 8), [])

  // Shared materials
  const materials = useMemo(() => [
    new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  ], [])

  useFrame((state) => {
    const time = state.clock.elapsedTime

    // Update all signal meshes
    for (let i = 0; i < signalRefs.current.length; i++) {
      const mesh = signalRefs.current[i]
      if (!mesh) continue

      // Continuous radial rotation
      mesh.rotation.z = time * 0.2 + signals[i].rotation

      // Subtle pulsing opacity
      const material = materials[signals[i].colorIndex]
      material.opacity = 0.1 + Math.sin(time * 2 + i) * 0.05
    }
  })

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      geometry.dispose()
      materials.forEach(mat => mat.dispose())
    }
  }, [geometry, materials])

  return (
    <group position={[0, 0, -10]}>
      {signals.map((signal, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) signalRefs.current[i] = el
          }}
          rotation={[0, 0, signal.rotation]}
          geometry={geometry}
          material={materials[signal.colorIndex]}
        />
      ))}
    </group>
  )
}

function StreamingBackground() {
  return (
    <>
      <ambientLight intensity={0.1} />
      <StreamingWaves />
      <DataStreams />
      <AudioWaveform />
      <BroadcastSignals />
    </>
  )
}

export function ThreeBackground() {
  const [isClient, setIsClient] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [hasWebGL, setHasWebGL] = useState(true)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Check for WebGL support first
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      if (!gl) {
        setHasWebGL(false)
        return
      }
    } catch (e) {
      setHasWebGL(false)
      return
    }

    // Wait for DOM to be ready
    const initDimensions = () => {
      if (typeof window !== 'undefined' && window.innerWidth > 0 && window.innerHeight > 0) {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight
        })
        setIsClient(true)
        // Add a small delay to ensure everything is ready
        setTimeout(() => setIsReady(true), 100)
      }
    }

    // Try immediately
    initDimensions()

    // Fallback: try on next frame if not ready
    if (!isClient) {
      requestAnimationFrame(initDimensions)
    }

    // Handle window resize
    const handleResize = () => {
      if (window.innerWidth > 0 && window.innerHeight > 0) {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight
        })
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isClient])

  // Don't render until we have valid dimensions, WebGL support, and everything is ready
  if (!isClient || !hasWebGL || !isReady || dimensions.width === 0 || dimensions.height === 0) {
    return null
  }

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ width: '100vw', height: '100vh', zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 1], fov: 75 }}
        gl={{
          alpha: true,
          antialias: false,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false,
          failIfMajorPerformanceCaveat: false,
          // Additional performance optimizations
          stencil: false,
          depth: true,
        }}
        dpr={[1, 1.5]}
        frameloop="always"
        style={{ width: '100%', height: '100%' }}
        onCreated={({ gl, size }) => {
          // Only set size if valid
          if (size.width > 0 && size.height > 0) {
            gl.setSize(size.width, size.height, false)
          }

          // Performance optimizations
          gl.setClearColor(0x000000, 0)

          // Add WebGL context lost/restored handlers
          const canvas = gl.domElement
          canvas.addEventListener('webglcontextlost', (e) => {
            e.preventDefault()
            console.warn('WebGL context lost')
          }, false)

          canvas.addEventListener('webglcontextrestored', () => {
            console.log('WebGL context restored')
          }, false)
        }}
      >
        <StreamingBackground />
      </Canvas>
    </div>
  )
}

