'use client';

import { motion } from 'framer-motion';

interface SkoolCommunityLinkProps {
  href: string;
  className?: string;
}

export function SkoolCommunityLink({ href, className = '' }: SkoolCommunityLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`wireframe-element inline-block p-8 ${className}`}
    >
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="relative"
      >
        {/* Neural Network Diagram */}
        <div className="diagram-container w-32 h-32 mx-auto mb-4">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Outer circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
              className="animate-pulse"
            />

            {/* Middle circle */}
            <circle
              cx="50"
              cy="50"
              r="25"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
              opacity="0.7"
            />

            {/* Inner circle with gold */}
            <circle
              cx="50"
              cy="50"
              r="10"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
              className="text-gold-base"
            />

            {/* Connection lines */}
            <line x1="50" y1="10" x2="50" y2="25" stroke="currentColor" strokeWidth="0.5" />
            <line x1="90" y1="50" x2="75" y2="50" stroke="currentColor" strokeWidth="0.5" />
            <line x1="50" y1="90" x2="50" y2="75" stroke="currentColor" strokeWidth="0.5" />
            <line x1="10" y1="50" x2="25" y2="50" stroke="currentColor" strokeWidth="0.5" />

            {/* Diagonal connections */}
            <line
              x1="22"
              y1="22"
              x2="32"
              y2="32"
              stroke="currentColor"
              strokeWidth="0.5"
              opacity="0.5"
            />
            <line
              x1="78"
              y1="22"
              x2="68"
              y2="32"
              stroke="currentColor"
              strokeWidth="0.5"
              opacity="0.5"
            />
            <line
              x1="78"
              y1="78"
              x2="68"
              y2="68"
              stroke="currentColor"
              strokeWidth="0.5"
              opacity="0.5"
            />
            <line
              x1="22"
              y1="78"
              x2="32"
              y2="68"
              stroke="currentColor"
              strokeWidth="0.5"
              opacity="0.5"
            />

            {/* Central label */}
            <text x="50" y="54" textAnchor="middle" className="tech-label text-xs">
              NEURAL_NET_V9
            </text>
          </svg>
        </div>

        <motion.span
          className="heading-card block text-center"
          whileHover={{ scale: 1.05 }}
        >
          Join Community
        </motion.span>
        <span className="body-small block text-center">Exclusive access</span>

        {/* Exploded parts on hover */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
        >
          <motion.div
            className="diagram-part absolute top-0 left-1/2 -translate-x-1/2"
            animate={{ y: -10 }}
          >
            <span className="tech-label text-xs">SYNAPSE_HANDLER</span>
          </motion.div>

          <motion.div
            className="diagram-part absolute bottom-0 left-1/2 -translate-x-1/2"
            animate={{ y: 10 }}
          >
            <span className="tech-label text-xs text-gold-base">
              COLLECTIVE_CONSCIOUSNESS
            </span>
          </motion.div>

          <motion.div
            className="diagram-part absolute left-0 top-1/2 -translate-y-1/2"
            animate={{ x: -10 }}
          >
            <span className="tech-label text-xs">NEURAL_BRIDGE</span>
          </motion.div>

          <motion.div
            className="diagram-part absolute right-0 top-1/2 -translate-y-1/2"
            animate={{ x: 10 }}
          >
            <span className="tech-label text-xs text-gold-light">HIVE_MIND_V2</span>
          </motion.div>

          <motion.div
            className="diagram-part absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            animate={{ scale: 1.2 }}
          >
            <span className="tech-label text-xs text-gold-base">
              WHERE_THE_MAGIC_HAPPENS
            </span>
          </motion.div>
        </motion.div>
      </motion.div>
    </a>
  );
}
