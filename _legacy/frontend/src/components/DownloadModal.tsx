import React, { useState } from 'react'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { config } from '../config'

interface DownloadModalProps {
  resource: {
    id: string
    name: string
    github_url?: string
    download_url?: string
    type: 'extension' | 'mcp_server'
  }
  onClose: () => void
  isAuthenticated: boolean
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

const ConsentBox = styled.div`
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const ConsentTitle = styled.h3`
  font-size: 1.1rem;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.primary};
`

const ConsentList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`

const ConsentItem = styled.li`
  display: flex;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.9rem;
  
  &:before {
    content: '✓';
    color: ${({ theme }) => theme.colors.status.success};
    margin-right: ${({ theme }) => theme.spacing.sm};
    font-weight: bold;
  }
`

const FinePrint = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.text.muted};
  margin-top: ${({ theme }) => theme.spacing.md};
  line-height: 1.4;
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.background.tertiary};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  
  a {
    color: ${({ theme }) => theme.colors.interactive.primary};
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`

const CheckboxLabel = styled.label`
  display: flex;
  align-items: flex-start;
  cursor: pointer;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  
  input[type="checkbox"] {
    margin-right: ${({ theme }) => theme.spacing.sm};
    margin-top: 2px;
    cursor: pointer;
    
    &:checked {
      accent-color: ${({ theme }) => theme.colors.interactive.primary};
    }
  }
  
  span {
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.text.primary};
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  justify-content: flex-end;
`

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background: ${({ variant, theme }) => 
    variant === 'secondary' ? 'transparent' : theme.colors.interactive.primary
  };
  color: ${({ variant, theme }) => 
    variant === 'secondary' ? theme.colors.text.primary : 'white'
  };
  border: 1px solid ${({ variant, theme }) => 
    variant === 'secondary' ? theme.colors.border.primary : theme.colors.interactive.primary
  };
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: 600;
  cursor: pointer;
  transition: all ${({ theme }) => theme.animations.duration.fast} ${({ theme }) => theme.animations.easing.default};
  
  &:hover {
    background: ${({ variant, theme }) => 
      variant === 'secondary' ? theme.colors.background.secondary : theme.colors.interactive.primaryHover
    };
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
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
  margin-right: ${({ theme }) => theme.spacing.sm};

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

export const DownloadModal: React.FC<DownloadModalProps> = ({ 
  resource, 
  onClose, 
  isAuthenticated 
}) => {
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    if (!consent) return
    
    setLoading(true)
    
    try {
      // Track download attempt
      await fetch(`${config.api.baseUrl}/analytics/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(isAuthenticated && { 
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
          })
        },
        body: JSON.stringify({
          resource_id: resource.id,
          resource_type: resource.type,
          consent_given: true
        })
      })
      
      // Initiate GitHub OAuth flow
      const downloadUrl = resource.download_url || resource.github_url
      const githubOAuthUrl = `${config.api.baseUrl}/github/auth?download_target=${encodeURIComponent(downloadUrl)}&resource_id=${resource.id}`
      
      // Redirect to GitHub OAuth
      window.location.href = githubOAuthUrl
      
    } catch (error) {
      console.error('Download error:', error)
      // Fallback to direct download
      window.open(resource.download_url || resource.github_url, '_blank')
    }
  }

  const handleDirectDownload = () => {
    // Skip GitHub flow and download directly
    window.open(resource.download_url || resource.github_url, '_blank')
    onClose()
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
        
        <Title>Download {resource.name}</Title>
        
        <Description>
          To provide the best experience and support the community, we'd like to connect 
          your GitHub account before downloading.
        </Description>
        
        <ConsentBox>
          <ConsentTitle>By proceeding, you agree to:</ConsentTitle>
          <ConsentList>
            <ConsentItem>
              Sign in with your GitHub account (one-time authorization)
            </ConsentItem>
            <ConsentItem>
              Automatically follow @aegntic on GitHub to stay updated
            </ConsentItem>
            <ConsentItem>
              Star this repository to show your support
            </ConsentItem>
            <ConsentItem>
              Proceed to download the selected resource
            </ConsentItem>
          </ConsentList>
          
          <FinePrint>
            This helps us understand usage patterns and build a stronger community. 
            Your GitHub data is never stored or shared with third parties. This is a 
            one-time process per session. You can unfollow or unstar at any time.
            {' '}<a href="/privacy" target="_blank">Privacy Policy</a>
          </FinePrint>
        </ConsentBox>
        
        <CheckboxLabel>
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>
            I understand and agree to the GitHub integration for downloads
          </span>
        </CheckboxLabel>
        
        <ButtonGroup>
          <Button variant="secondary" onClick={handleDirectDownload}>
            Skip & Download Directly
          </Button>
          <Button 
            onClick={handleDownload} 
            disabled={!consent || loading}
          >
            {loading && <LoadingSpinner />}
            Proceed with GitHub
          </Button>
        </ButtonGroup>
      </Modal>
    </Overlay>
  )
}