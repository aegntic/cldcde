import React, { useState } from 'react'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { config } from '../config'

interface ShareModalProps {
  news: {
    id: string
    title: string
    slug: string
    summary: string
  }
  onClose: () => void
}

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${({ theme }) => theme.spacing.md};
`

const Modal = styled(motion.div)`
  background: ${({ theme }) => theme.colors.background.modal};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  max-width: 500px;
  width: 100%;
  position: relative;
  backdrop-filter: blur(10px);
`

const CloseButton = styled.button`
  position: absolute;
  top: ${({ theme }) => theme.spacing.md};
  right: ${({ theme }) => theme.spacing.md};
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: 1.5rem;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  transition: all ${({ theme }) => theme.animations.duration.fast} ${({ theme }) => theme.animations.easing.default};

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.background.secondary};
  }
`

const Title = styled.h2`
  font-size: 1.5rem;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.text.primary};
`

const Description = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  line-height: 1.6;
`

const ShareOptions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const ShareButton = styled.button<{ $platform: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background.secondary};
  color: ${({ theme }) => theme.colors.text.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: 500;
  cursor: pointer;
  transition: all ${({ theme }) => theme.animations.duration.fast} ${({ theme }) => theme.animations.easing.default};
  
  &:hover {
    background: ${({ $platform, theme }) => {
      switch ($platform) {
        case 'x': return '#1DA1F2'
        case 'linkedin': return '#0A66C2'
        case 'email': return theme.colors.interactive.primary
        default: return theme.colors.background.tertiary
      }
    }};
    color: white;
    transform: translateY(-2px);
  }
`

const Icon = styled.span`
  font-size: 1.2rem;
`

const FinePrint = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.text.muted};
  line-height: 1.4;
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.background.tertiary};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  
  strong {
    color: ${({ theme }) => theme.colors.text.secondary};
  }
`

const CopySection = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`

const CopyInput = styled.input`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background.secondary};
  color: ${({ theme }) => theme.colors.text.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.border.focus};
  }
`

const CopyButton = styled.button`
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.interactive.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: 600;
  cursor: pointer;
  transition: all ${({ theme }) => theme.animations.duration.fast} ${({ theme }) => theme.animations.easing.default};
  
  &:hover {
    background: ${({ theme }) => theme.colors.interactive.primaryHover};
  }
`

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

export const ShareModal: React.FC<ShareModalProps> = ({ news, onClose }) => {
  const [loading, setLoading] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  const shareUrl = `${window.location.origin}/news/${news.slug}`

  const handleShare = async (platform: string) => {
    setLoading(platform)
    
    try {
      // Track the share
      const response = await fetch(`${config.api.baseUrl}/social/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') && {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          })
        },
        body: JSON.stringify({
          news_id: news.id,
          platform,
          consent_given: true
        })
      })
      
      const data = await response.json()
      
      // Handle platform-specific sharing
      switch (platform) {
        case 'x':
          if (data.share_id) {
            // Redirect to X OAuth flow
            window.location.href = `${config.api.baseUrl}/social/x/auth?share_id=${data.share_id}&news_id=${news.id}`
          } else {
            // Fallback to direct share
            window.open(data.share_url, '_blank')
          }
          break
          
        case 'linkedin':
          if (data.share_id) {
            // Redirect to LinkedIn OAuth flow
            window.location.href = `${config.api.baseUrl}/social/linkedin/auth?share_id=${data.share_id}&news_id=${news.id}`
          } else {
            // Fallback to direct share
            window.open(data.share_url, '_blank')
          }
          break
          
        case 'email':
          window.location.href = data.share_url
          break
      }
      
    } catch (error) {
      console.error('Share error:', error)
      // Fallback to direct sharing
      handleDirectShare(platform)
    } finally {
      setLoading(null)
    }
  }

  const handleDirectShare = (platform: string) => {
    const text = `${news.title} - ${news.summary}`
    
    switch (platform) {
      case 'x':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank')
        break
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank')
        break
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(news.title)}&body=${encodeURIComponent(`${text}\n\n${shareUrl}`)}`
        break
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      
      // Track the copy
      await fetch(`${config.api.baseUrl}/social/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          news_id: news.id,
          platform: 'copy',
          consent_given: true
        })
      })
      
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Copy error:', error)
    }
  }

  return (
    <Overlay
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <Modal
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <CloseButton onClick={onClose}>×</CloseButton>
        
        <Title>Share This Article</Title>
        
        <Description>
          Share "{news.title}" with your network
        </Description>
        
        <FinePrint>
          <strong>Enhanced sharing:</strong> When sharing to X, you'll automatically follow 
          <strong> @aegnt_catface</strong> for updates. LinkedIn shares will connect you with 
          <strong> Mattae Cooper</strong>. This helps build our community while sharing great content!
        </FinePrint>
        
        <ShareOptions>
          <ShareButton 
            $platform="x"
            onClick={() => handleShare('x')}
            disabled={loading === 'x'}
          >
            {loading === 'x' ? <LoadingSpinner /> : <Icon>𝕏</Icon>}
            Share on X
          </ShareButton>
          
          <ShareButton 
            $platform="linkedin"
            onClick={() => handleShare('linkedin')}
            disabled={loading === 'linkedin'}
          >
            {loading === 'linkedin' ? <LoadingSpinner /> : <Icon>in</Icon>}
            Share on LinkedIn
          </ShareButton>
          
          <ShareButton 
            $platform="email"
            onClick={() => handleShare('email')}
            disabled={loading === 'email'}
          >
            {loading === 'email' ? <LoadingSpinner /> : <Icon>✉️</Icon>}
            Email
          </ShareButton>
          
          <ShareButton 
            $platform="copy"
            onClick={handleCopyLink}
          >
            <Icon>🔗</Icon>
            {copied ? 'Copied!' : 'Copy Link'}
          </ShareButton>
        </ShareOptions>
        
        <CopySection>
          <CopyInput 
            value={shareUrl} 
            readOnly 
            onClick={(e) => e.currentTarget.select()}
          />
          <CopyButton onClick={handleCopyLink}>
            {copied ? '✓ Copied' : 'Copy'}
          </CopyButton>
        </CopySection>
      </Modal>
    </Overlay>
  )
}