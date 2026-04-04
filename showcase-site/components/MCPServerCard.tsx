'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { MCPServer } from '@/lib/tools';

interface MCPServerCardProps {
  server: MCPServer;
  onClick?: () => void;
}

export function MCPServerCard({ server, onClick }: MCPServerCardProps) {
  const [isExploded, setIsExploded] = useState(false);
  const [isImploding, setIsImploding] = useState(false);

  const handleClick = () => {
    setIsImploding(true);
    setTimeout(() => {
      onClick?.();
      setIsImploding(false);
    }, 300);
  };

  if (isImploding) {
    return (
      <motion.div
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: 0, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeIn' }}
        className="wireframe-element p-6"
      />
    );
  }

  // Generate wireframe path based on category
  const getWireframePath = (category: string): string => {
    const paths: Record<string, string> = {
      Automation: 'M10,50 L30,50 L40,30 L60,30 L70,50 L90,50 M50,30 L50,70',
      'Knowledge Management': 'M50,10 L25,30 L25,70 L50,90 L75,70 L75,30 Z',
      Database: 'M10,50 L90,50 M50,10 L50,90 M25,25 L75,75 M75,25 L25,75',
      'Knowledge Graph': 'M50,20 L20,50 L50,80 L80,50 Z M50,20 L50,80 M20,50 L80,50',
      Utilities: 'M10,30 Q50,10 90,30 Q90,70 50,90 Q10,70 10,30 Z',
      Core: 'M50,10 L10,50 L50,90 L90,50 Z M50,10 L50,90 M10,50 L90,50',
    };
    return paths[category] || 'M10,50 L90,50 M50,10 L50,90';
  };

  // Get language color
  const getLanguageColor = (lang: string): string => {
    const colors: Record<string, string> = {
      TypeScript: 'text-gold-base',
      Python: 'text-blue-400',
      JavaScript: 'text-yellow-400',
    };
    return colors[lang] || 'text-noir-platinum';
  };

  return (
    <motion.div
      className="wireframe-element p-6 cursor-pointer relative overflow-hidden group"
      onHoverStart={() => setIsExploded(true)}
      onHoverEnd={() => setIsExploded(false)}
      onClick={handleClick}
      animate={{
        scale: isExploded ? 1.5 : 1,
        y: isExploded ? -20 : 0,
        zIndex: isExploded ? 50 : 1,
      }}
      transition={{
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Language badge */}
      <div className="absolute top-3 right-3 z-20">
        <span className={`label-wireframe text-xs ${getLanguageColor(server.language)}`}>
          {server.language}
        </span>
      </div>

      {/* Exploded diagram on hover */}
      {isExploded && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Core */}
          <motion.div
            className="diagram-part absolute top-2 left-2"
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{ opacity: 1, x: -15, y: -15 }}
            transition={{ delay: 0.1 }}
          >
            <span className="tech-label text-xs">{server.id}_CORE</span>
          </motion.div>

          {/* Category */}
          <motion.div
            className="diagram-part absolute top-2 right-2"
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{ opacity: 1, x: 15, y: -15 }}
            transition={{ delay: 0.15 }}
          >
            <span className="tech-label text-xs">{server.category.replace(/\s+/g, '_').toUpperCase()}</span>
          </motion.div>

          {/* Source */}
          <motion.div
            className="diagram-part absolute bottom-2 left-2"
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{ opacity: 1, x: -15, y: 15 }}
            transition={{ delay: 0.2 }}
          >
            <span className="tech-label text-xs">MCP_PROTOCOL</span>
          </motion.div>

          {/* Magic */}
          <motion.div
            className="diagram-part absolute bottom-2 right-2"
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{ opacity: 1, x: 15, y: 15 }}
            transition={{ delay: 0.25 }}
          >
            <span className="tech-label text-xs text-gold-base">{server.language.toUpperCase()}_RUNTIME</span>
          </motion.div>

          {/* Center circuit */}
          <motion.div
            className="diagram-part absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1.2 }}
            transition={{ delay: 0.3 }}
          >
            <span className="tech-label text-xs text-gold-light">{server.stars}_STARS</span>
          </motion.div>
        </div>
      )}

      {/* Card content */}
      <div className="relative z-10">
        {/* Wireframe icon */}
        <div className="diagram-container w-full h-32 mb-4 mx-auto">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id={`mcp-gradient-${server.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="currentColor" stopOpacity={0.3} />
                <stop offset="100%" stopColor="currentColor" stopOpacity={0.8} />
              </linearGradient>
            </defs>
            <path
              d={getWireframePath(server.category)}
              stroke="url(#mcp-gradient)"
              strokeWidth="1.5"
              fill="none"
              className="animate-pulse"
            />
            <circle cx="50" cy="50" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <text x="50" y="54" textAnchor="middle" className="tech-label text-xs fill-current">
              MCP
            </text>
          </svg>
        </div>

        <h3 className="heading-card text-center mb-2">{server.name}</h3>
        <p className="body-small text-center mb-4 line-clamp-2">{server.description}</p>

        {/* Stats */}
        <div className="flex justify-between items-center text-xs border-t border-noir-platinum/30 pt-3">
          <span className="label-wireframe">STARS: {server.stars}</span>
          <span className="label-wireframe">FORKS: {server.forks}</span>
        </div>
      </div>
    </motion.div>
  );
}
