import React, { useEffect, useMemo, useRef } from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { NeonButton } from './common/marketplace'
import { BOOT_POSTER, BOOT_VIDEO, BOOT_VIDEO_WEBM, prefersReducedMotion } from '../lib/brandMedia'

interface PreloaderProps {
  video?: string
  webm?: string
  poster?: string
  muted?: boolean
  onToggleMute?: () => void
  onComplete: () => void
}

const Overlay = styled(motion.div)<{ $poster: string }>`
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: ${({ theme }) => theme.colors.background.primary};
  background-image: url(${({ $poster }) => $poster});
  background-size: cover;
  background-position: center center;
  overflow: hidden;
`

const Video = styled.video`
  position: absolute;
  inset: 0;
  width: 100vw;
  height: 100dvh;
  object-fit: cover;
  object-position: center center;
`

const EmberPulse = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 50% 38%, rgba(255, 59, 31, 0.18) 0%, rgba(5, 5, 5, 0.08) 42%, rgba(5, 5, 5, 0.72) 100%);
  animation: emberPulse 4.8s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  @keyframes emberPulse {
    0%, 100% { opacity: 0.72; }
    50% { opacity: 1; }
  }
`

const Controls = styled.div`
  position: absolute;
  right: clamp(0.7rem, 2vw, 1.2rem);
  bottom: clamp(0.7rem, 2vw, 1.2rem);
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 0.5rem;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => `${theme.colors.border.primary}aa`};
  background: rgba(5, 5, 5, 0.48);
  backdrop-filter: blur(5px);

  @media (max-width: 700px) {
    left: 0.5rem;
    right: 0.5rem;
    justify-content: center;
  }
`

export const Preloader: React.FC<PreloaderProps> = ({
  video = BOOT_VIDEO,
  webm = BOOT_VIDEO_WEBM,
  poster = BOOT_POSTER,
  muted = true,
  onToggleMute,
  onComplete
}) => {
  const reduced = useMemo(() => prefersReducedMotion(), [])
  const skipped = useRef(false)

  useEffect(() => {
    if (!reduced || skipped.current) return
    skipped.current = true
    onComplete()
  }, [reduced, onComplete])

  if (reduced) {
    return (
      <Overlay $poster={poster} initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <EmberPulse />
        <Controls>
          <NeonButton onClick={onComplete} whileTap={{ scale: 0.98 }}>
            Enter
          </NeonButton>
        </Controls>
      </Overlay>
    )
  }

  return (
    <Overlay $poster={poster} initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <Video
        key={video}
        autoPlay
        muted={muted}
        playsInline
        preload="auto"
        poster={poster}
        onEnded={onComplete}
        onError={onComplete}
      >
        <source src={webm} type="video/webm" />
        <source src={video} type="video/mp4" />
      </Video>
      <Controls>
        <NeonButton onClick={onComplete} whileTap={{ scale: 0.98 }}>
          Enter
        </NeonButton>
        {onToggleMute && (
          <NeonButton $tone="secondary" onClick={onToggleMute} whileTap={{ scale: 0.98 }}>
            {muted ? 'Unmute' : 'Mute'}
          </NeonButton>
        )}
        <NeonButton $tone="ghost" onClick={onComplete} whileTap={{ scale: 0.98 }}>
          Skip
        </NeonButton>
      </Controls>
    </Overlay>
  )
}
