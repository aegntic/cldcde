'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface PPPConfig {
  country: string;
  currency: string;
  multiplier: number;
}

interface PricingTierProps {
  name: string;
  basePrice: number;
  ppp?: PPPConfig;
  interval?: 'month' | 'year' | 'onetime';
  features: string[];
  cta: string;
  variant: 'free' | 'pro' | 'enterprise';
}

function getPppPrice(baseUSD: number, ppp?: PPPConfig) {
  if (!ppp) return { price: 0, currency: 'USD', display: 'Free' };

  const adjusted = Math.round(baseUSD * ppp.multiplier);
  return {
    price: adjusted,
    currency: ppp.currency,
    display: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: ppp.currency,
      maximumFractionDigits: 0,
    }).format(adjusted),
  };
}

export function PricingTier({
  name,
  basePrice,
  ppp,
  interval = 'onetime',
  features,
  cta,
  variant,
}: PricingTierProps) {
  const price = ppp ? getPppPrice(basePrice, ppp) : getPppPrice(basePrice);

  return (
    <motion.div
      className={`wireframe-element p-8 ${
        variant === 'pro' ? 'border-gold-base glow-gold' : ''
      }`}
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center mb-6">
        <h3 className="heading-card mb-2">{name}</h3>
        {ppp && (
          <span className="label-wireframe text-xs">
            {ppp.country} DETECTED
          </span>
        )}
      </div>

      <div className="text-center mb-6">
        <span className="text-4xl font-display text-gold-base">
          {price.display}
        </span>
        {interval !== 'onetime' && (
          <span className="text-lg text-noir-platinum/70">
            /{interval === 'month' ? 'mo' : 'yr'}
          </span>
        )}
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <motion.li
            key={index}
            className="body-small flex items-center"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <span
              className={`mr-2 ${
                variant === 'pro' ? 'text-gold-base' : 'text-noir-platinum'
              }`}
            >
              →
            </span>
            {feature}
          </motion.li>
        ))}
      </ul>

      <motion.button
        className="button-noir w-full"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {cta}
      </motion.button>

      {/* Exploded pricing details on hover */}
      <motion.div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
      >
        <motion.div
          className="diagram-part absolute top-2 left-2"
          animate={{ x: -5, y: -5 }}
        >
          <span className="tech-label text-xs">PPP_MULTIPLIER: {ppp?.multiplier || '1.0'}x</span>
        </motion.div>

        {variant === 'pro' && (
          <motion.div
            className="diagram-part absolute top-2 right-2"
            animate={{ x: 5, y: -5 }}
          >
            <span className="tech-label text-xs text-gold-base">BEST_VALUE</span>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

export function PricingSection() {
  const [ppp, setPPP] = useState<PPPConfig | null>(null);

  useEffect(() => {
    // Simulate PPP detection
    // In production, this would call an IP geolocation API
    const mockPPP: PPPConfig = {
      country: 'US',
      currency: 'USD',
      multiplier: 1.0,
    };
    setPPP(mockPPP);
  }, []);

  return (
    <section id="pricing" className="section-full">
      <div className="container mx-auto px-6">
        <h2 className="heading-section text-center mb-12">PRICING</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Tier */}
          <PricingTier
            name="STARTER"
            basePrice={0}
            ppp={ppp || undefined}
            features={[
              'Open source tools',
              'Community access',
              'Basic documentation',
            ]}
            cta="GET STARTED"
            variant="free"
          />

          {/* Pro Tier */}
          {ppp && (
            <PricingTier
              name="PROFESSIONAL"
              basePrice={49}
              ppp={ppp}
              interval="onetime"
              features={[
                'All premium tools',
                'Priority support',
                'Advanced tutorials',
                'License keys included',
              ]}
              cta="ACQUIRE LICENSE"
              variant="pro"
            />
          )}

          {/* Enterprise Tier */}
          {ppp && (
            <PricingTier
              name="ENTERPRISE"
              basePrice={99}
              ppp={ppp}
              interval="month"
              features={[
                'Complete tool access',
                'Dedicated support',
                'Custom integrations',
                'SLA guarantee',
              ]}
              cta="SUBSCRIBE"
              variant="enterprise"
            />
          )}
        </div>

        {/* PPP Info */}
        <motion.p
          className="body-small text-center mt-8 text-noir-platinum/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Prices adjusted based on your location using Purchasing Power Parity (PPP)
        </motion.p>
      </div>
    </section>
  );
}
