import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'
import * as THREE from 'three'
import gsap from 'gsap'
import { Badge, NeonButton } from './common/marketplace'

interface NeoLandingProps {
  backgroundVideoSrc?: string
  backgroundVideoPoster?: string
  onOpenExtensions: () => void
  onOpenMcp: () => void
  onOpenPacks: () => void
  extensionCount: number
  mcpCount: number
  packCount: number
  totalCount: number
}

const LandingRoot = styled.section`
  position: relative;
  min-height: 100dvh;
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  overflow: hidden;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.primary};
`

const AtmosphereLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    radial-gradient(circle at 50% 16%, rgba(68, 216, 255, 0.18) 0%, rgba(8, 18, 36, 0) 44%),
    radial-gradient(circle at 12% 20%, rgba(63, 247, 202, 0.12) 0%, rgba(5, 12, 24, 0) 40%),
    radial-gradient(circle at 88% 18%, rgba(72, 171, 255, 0.14) 0%, rgba(5, 12, 24, 0) 38%),
    linear-gradient(180deg, rgba(3, 9, 20, 0.96) 0%, rgba(3, 9, 20, 1) 100%);
`

const BackgroundLoopVideo = styled.video`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  object-fit: cover;
  object-position: center center;
  opacity: 1;
  filter: none;
  transform: none;
`

const ThreeCanvas = styled.canvas`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
  pointer-events: none;
`

const GridLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  background:
    linear-gradient(to right, rgba(54, 125, 182, 0.14) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(54, 125, 182, 0.12) 1px, transparent 1px);
  background-size: clamp(20px, 2.4vw, 42px) clamp(20px, 2.4vw, 42px);
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.68) 30%, rgba(0, 0, 0, 1) 100%);
`

const Vignette = styled.div<{ $subtle?: boolean }>`
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  background: ${({ $subtle }) =>
    $subtle
      ? 'transparent'
      : 'radial-gradient(circle at 50% 36%, rgba(20, 58, 90, 0) 0%, rgba(2, 8, 18, 0.44) 70%, rgba(2, 8, 18, 0.8) 100%), linear-gradient(180deg, rgba(2, 8, 18, 0.78) 0%, rgba(2, 8, 18, 0.04) 36%, rgba(2, 8, 18, 0.72) 100%)'};
`

const TopMask = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: clamp(72px, 12dvh, 128px);
  z-index: 6;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(2, 8, 18, 0.92) 0%, rgba(2, 8, 18, 0.18) 74%, transparent 100%);
`

const BottomMask = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: clamp(84px, 19dvh, 196px);
  z-index: 6;
  pointer-events: none;
  background: linear-gradient(180deg, transparent 0%, rgba(2, 8, 18, 0.36) 36%, rgba(2, 8, 18, 0.92) 100%);
`

const Content = styled.div`
  position: relative;
  z-index: 7;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: clamp(0.75rem, 1.9vw, 1.28rem);
  padding: clamp(5.5rem, 11dvh, 7.6rem) clamp(1rem, 3vw, 2.4rem) clamp(2rem, 7dvh, 3.2rem);
  text-align: center;
`

const CtaBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 0.8rem 1rem;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 1px solid ${({ theme }) => `${theme.colors.border.primary}c0`};
  background: linear-gradient(180deg, rgba(3, 9, 20, 0.58) 0%, rgba(3, 9, 20, 0.34) 100%);
  backdrop-filter: blur(8px);
`

const Counters = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs};
`

const NeoLanding: React.FC<NeoLandingProps> = ({
  backgroundVideoSrc,
  backgroundVideoPoster,
  onOpenExtensions,
  onOpenMcp,
  onOpenPacks,
  extensionCount,
  mcpCount,
  packCount,
  totalCount
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rootRef = useRef<HTMLElement | null>(null)
  const backgroundVideoRef = useRef<HTMLVideoElement | null>(null)
  const ctaRef = useRef<HTMLDivElement | null>(null)
  const hasBackgroundVideo = Boolean(backgroundVideoSrc)

  useEffect(() => {
    const node = backgroundVideoRef.current
    if (!node || !backgroundVideoSrc) return

    const startPlayback = () => {
      node.muted = true
      void node.play().catch(() => {
        // Leave the poster in place if muted autoplay is blocked by the client.
      })
    }

    node.addEventListener('loadeddata', startPlayback)
    node.addEventListener('canplay', startPlayback)

    if (node.readyState >= 2) {
      startPlayback()
    }

    return () => {
      node.removeEventListener('loadeddata', startPlayback)
      node.removeEventListener('canplay', startPlayback)
    }
  }, [backgroundVideoSrc])

  useEffect(() => {
    const node = canvasRef.current
    if (!node) return

    const styles = getComputedStyle(document.documentElement)
    const primary = styles.getPropertyValue('--interactive-primary').trim() || '#44d8ff'
    const accent = styles.getPropertyValue('--interactive-accent').trim() || '#52f1cc'
    const border = styles.getPropertyValue('--border-secondary').trim() || '#224462'

    const renderer = new THREE.WebGLRenderer({ canvas: node, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5))
    renderer.outputColorSpace = THREE.SRGBColorSpace

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 120)
    camera.position.set(0, 1.08, 5.2)

    const motionTarget = { x: 0, y: 0 }
    const pointer = { x: 0, y: 0 }

    const wirePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 16, 44, 30),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(border),
        wireframe: true,
        transparent: true,
        opacity: 0.18
      })
    )
    wirePlane.rotation.x = -Math.PI * 0.58
    wirePlane.position.set(0, -1.9, -1.4)
    scene.add(wirePlane)

    const ringGroup = new THREE.Group()
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.46, 0.028, 16, 120),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(primary),
        transparent: true,
        opacity: 0.36
      })
    )
    ring.position.set(0, 0.64, -1.2)
    ring.rotation.x = 1.15

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.88, 0.02, 16, 140),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(accent),
        transparent: true,
        opacity: 0.22
      })
    )
    ring2.position.set(0, 0.64, -1.28)
    ring2.rotation.x = 1.12
    ringGroup.add(ring)
    ringGroup.add(ring2)
    scene.add(ringGroup)

    const starsCount = 950
    const starsPos = new Float32Array(starsCount * 3)
    for (let i = 0; i < starsCount; i += 1) {
      const i3 = i * 3
      starsPos[i3] = (Math.random() - 0.5) * 16
      starsPos[i3 + 1] = (Math.random() - 0.5) * 9 + 1.1
      starsPos[i3 + 2] = (Math.random() - 0.5) * 10 - 1.8
    }
    const starsGeometry = new THREE.BufferGeometry()
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPos, 3))
    const stars = new THREE.Points(
      starsGeometry,
      new THREE.PointsMaterial({
        color: new THREE.Color(accent),
        size: 0.026,
        transparent: true,
        opacity: 0.58,
        depthWrite: false
      })
    )
    scene.add(stars)

    const columns = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.14, 0.14, 0.14),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(primary),
        transparent: true,
        opacity: 0.44
      }),
      30
    )

    const matrix = new THREE.Matrix4()
    for (let i = 0; i < 30; i += 1) {
      const x = (i % 10) - 4.5
      const z = Math.floor(i / 10) * -0.7
      const y = Math.random() * 0.35 + 0.06
      matrix.compose(
        new THREE.Vector3(x * 0.56, y - 1.12, z - 1.48),
        new THREE.Quaternion(),
        new THREE.Vector3(1, Math.random() * 2.4 + 0.9, 1)
      )
      columns.setMatrixAt(i, matrix)
    }
    scene.add(columns)

    const resize = () => {
      const width = node.clientWidth
      const height = node.clientHeight
      renderer.setSize(width, height, false)
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
    }

    resize()
    window.addEventListener('resize', resize)
    const onMove = (event: MouseEvent) => {
      const width = window.innerWidth || 1
      const height = window.innerHeight || 1
      pointer.x = (event.clientX / width - 0.5) * 2
      pointer.y = (event.clientY / height - 0.5) * 2
    }
    window.addEventListener('mousemove', onMove)

    const clock = new THREE.Clock()
    let raf = 0
    const loop = () => {
      const t = clock.getElapsedTime()
      motionTarget.x += (pointer.x - motionTarget.x) * 0.04
      motionTarget.y += (pointer.y - motionTarget.y) * 0.04

      ring.rotation.z = t * 0.28
      ring2.rotation.z = -t * 0.22
      ringGroup.position.y = 0.04 + Math.sin(t * 0.72) * 0.08
      ringGroup.position.x = motionTarget.x * 0.22

      stars.rotation.y = t * 0.02 + motionTarget.x * 0.1
      stars.rotation.x = motionTarget.y * 0.04
      wirePlane.material.opacity = 0.17 + Math.sin(t * 0.6) * 0.024
      wirePlane.position.x = motionTarget.x * 0.3

      camera.position.x = motionTarget.x * 0.18
      camera.position.y = 1.08 - motionTarget.y * 0.12
      camera.lookAt(0, 0.05, -1.2)

      renderer.render(scene, camera)
      raf = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      wirePlane.geometry.dispose()
      ;(wirePlane.material as THREE.Material).dispose()
      ring.geometry.dispose()
      ;(ring.material as THREE.Material).dispose()
      ring2.geometry.dispose()
      ;(ring2.material as THREE.Material).dispose()
      columns.geometry.dispose()
      ;(columns.material as THREE.Material).dispose()
      starsGeometry.dispose()
      ;(stars.material as THREE.Material).dispose()
      renderer.dispose()
    }
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (ctaRef.current) {
        gsap.fromTo(
          ctaRef.current,
          { opacity: 0, y: 56, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 1.05, ease: 'power4.out', delay: 0.28 }
        )
      }
    }, rootRef)

    return () => ctx.revert()
  }, [])

  return (
    <LandingRoot ref={rootRef}>
      {!hasBackgroundVideo && <AtmosphereLayer />}
      {backgroundVideoSrc && (
        <BackgroundLoopVideo
          ref={backgroundVideoRef}
          autoPlay
          muted
          playsInline
          preload="auto"
          poster={backgroundVideoPoster}
          loop
        >
          <source src={backgroundVideoSrc} type="video/mp4" />
        </BackgroundLoopVideo>
      )}
      {!hasBackgroundVideo && <ThreeCanvas ref={canvasRef} />}
      {!hasBackgroundVideo && <GridLayer />}
      <Vignette $subtle={hasBackgroundVideo} />
      {!hasBackgroundVideo && <TopMask />}
      {!hasBackgroundVideo && <BottomMask />}

      <Content>
        <CtaBar ref={ctaRef}>
          <NeonButton $tone="primary" onClick={onOpenExtensions} whileTap={{ scale: 0.98 }}>
            Start Creating
          </NeonButton>
          <NeonButton $tone="secondary" onClick={onOpenMcp} whileTap={{ scale: 0.98 }}>
            Explore MCP
          </NeonButton>
          <NeonButton $tone="ghost" onClick={onOpenPacks} whileTap={{ scale: 0.98 }}>
            View Packs
          </NeonButton>
        </CtaBar>

        <Counters>
          <Badge>{extensionCount} plugins</Badge>
          <Badge>{mcpCount} mcp</Badge>
          <Badge>{packCount} packs</Badge>
          <Badge>{totalCount} total assets</Badge>
        </Counters>
      </Content>
    </LandingRoot>
  )
}

export { NeoLanding }
