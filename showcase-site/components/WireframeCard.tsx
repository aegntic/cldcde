'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface WireframeCardProps {
  title: string;
  description: string;
  icon?: string;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function WireframeCard({
  title,
  description,
  icon,
  onClick,
  className = '',
  children,
}: WireframeCardProps) {
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
        className={`wireframe-element ${className}`}
      />
    );
  }

  return (
    <motion.div
      className={`wireframe-element p-6 cursor-pointer ${className}`}
      onHoverStart={() => setIsExploded(true)}
      onHoverEnd={() => setIsExploded(false)}
      onClick={handleClick}
      animate={{
        scale: isExploded ? 1.5 : 1,
        y: isExploded ? -20 : 0,
      }}
      transition={{
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Exploded diagram parts */}
      {isExploded && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Core */}
          <motion.div
            className="diagram-part absolute top-4 left-4"
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{ opacity: 1, x: -20, y: -20 }}
            transition={{ delay: 0.1 }}
          >
            <span className="tech-label text-xs">CORE_V2.0</span>
          </motion.div>

          {/* Data Bus */}
          <motion.div
            className="diagram-part absolute top-4 right-4"
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{ opacity: 1, x: 20, y: -20 }}
            transition={{ delay: 0.15 }}
          >
            <span className="tech-label text-xs">DATA_BUS</span>
          </motion.div>

          {/* Quantum Flux */}
          <motion.div
            className="diagram-part absolute bottom-4 left-4"
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{ opacity: 1, x: -20, y: 20 }}
            transition={{ delay: 0.2 }}
          >
            <span className="tech-label text-xs">QUANTUM_FLUX</span>
          </motion.div>

          {/* Magic Smoke */}
          <motion.div
            className="diagram-part absolute bottom-4 right-4"
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{ opacity: 1, x: 20, y: 20 }}
            transition={{ delay: 0.25 }}
          >
            <span className="tech-label text-xs text-gold-base">MAGIC_SMOKE</span>
          </motion.div>

          {/* Pixie Dust Generator */}
          <motion.div
            className="diagram-part absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="tech-label text-xs text-gold-light">
              PIXIE_DUST_GENERATOR
            </span>
          </motion.div>

          {/* ABRACADABRA Circuit */}
          <motion.div
            className="diagram-part absolute top-1/2 right-0"
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: 30 }}
            transition={{ delay: 0.35 }}
          >
            <span className="tech-label text-xs text-gold-dark">
              ABRACADABRA_CIRCUIT
            </span>
          </motion.div>

          <motion.div
            className="diagram-part absolute bottom-0 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: 30 }}
            transition={{ delay: 0.4 }}
          >
            <span className="tech-label text-xs text-gold-base">
              WHERE_THE_MAGIC_HAPPENS
            </span>
          </motion.div>
        </div>
      )}

      {/* Card content */}
      <div className="relative z-10">
        {icon && (
          <div className="diagram-container w-16 h-16 mb-4 mx-auto">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <rect
                x="10"
                y="10"
                width="80"
                height="80"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
              />
              <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="1" fill="none" />
              <text x="50" y="50" textAnchor="middle" className="tech-label">
                {icon}
              </text>
            </svg>
          </div>
        )}

        <h3 className="heading-card text-center">{title}</h3>
        <p className="body-base text-center">{description}</p>

        {children && <div className="mt-4">{children}</div>}
      </div>
    </motion.div>
  );
}
