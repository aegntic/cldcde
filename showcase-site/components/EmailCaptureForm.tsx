'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export function EmailCaptureForm() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // TODO: Integrate with actual email service
    console.log('Email submitted:', email);

    setStatus('success');
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <motion.div
        className="wireframe-element p-8"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        <label className="label-wireframe" htmlFor="email">
          EMAIL_ADDRESS
        </label>

        <div className="space-y-4">
          <input
            type="email"
            id="email"
            name="email"
            placeholder="your@email.com"
            className="input-noir"
            required
            disabled={status !== 'idle'}
          />

          <motion.button
            type="submit"
            className="button-noir w-full relative overflow-hidden"
            disabled={status !== 'idle'}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {status === 'idle' && 'SUBSCRIBE'}
            {status === 'submitting' && (
              <span className="flex items-center justify-center">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="inline-block mr-2"
                >
                  ◌
                </motion.span>
                PROCESSING
              </span>
            )}
            {status === 'success' && 'SUBSCRIBED'}
          </motion.button>
        </div>

        {status === 'success' && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="body-small mt-4 text-gold-base text-center"
          >
            Check your inbox to confirm subscription.
          </motion.p>
        )}

        {/* Exploded parts on hover */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
        >
          <motion.div
            className="diagram-part absolute top-2 left-2"
            whileHover={{ x: -5, y: -5 }}
          >
            <span className="tech-label text-xs">SMTP_PORT_587</span>
          </motion.div>

          <motion.div
            className="diagram-part absolute top-2 right-2"
            whileHover={{ x: 5, y: -5 }}
          >
            <span className="tech-label text-xs">TLS_V1.3</span>
          </motion.div>

          <motion.div
            className="diagram-part absolute bottom-2 left-2"
            whileHover={{ x: -5, y: 5 }}
          >
            <span className="tech-label text-xs text-gold-base">PIXIE_DUST_QUEUE</span>
          </motion.div>
        </motion.div>
      </motion.div>
    </form>
  );
}
