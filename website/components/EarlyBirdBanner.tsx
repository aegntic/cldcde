import React, { useState, useEffect } from 'react';
import { Rocket, Clock, Sparkles } from 'lucide-react';
import { getPricingPhase, PricingPhase } from '../constants';

const EarlyBirdBanner: React.FC = () => {
    const [phase, setPhase] = useState<PricingPhase>(getPricingPhase());

    useEffect(() => {
        const timer = setInterval(() => {
            setPhase(getPricingPhase());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Don't show banner after full prices kick in
    if (phase.phase === 'full_price') return null;

    const getBannerColors = () => {
        switch (phase.phase) {
            case 'early_bird':
                return 'from-purple-900/90 via-violet-800/90 to-purple-900/90 border-purple-500/60';
            case 'phase_2':
                return 'from-blue-900/90 via-indigo-800/90 to-blue-900/90 border-blue-500/60';
            case 'phase_3':
                return 'from-emerald-900/90 via-green-800/90 to-emerald-900/90 border-green-500/60';
            default:
                return 'from-gray-900/90 via-gray-800/90 to-gray-900/90 border-gray-500/60';
        }
    };

    const getAccentColor = () => {
        switch (phase.phase) {
            case 'early_bird': return 'text-violet-400';
            case 'phase_2': return 'text-blue-400';
            case 'phase_3': return 'text-green-400';
            default: return 'text-gray-400';
        }
    };

    const getBadgeColor = () => {
        switch (phase.phase) {
            case 'early_bird': return 'bg-violet-500';
            case 'phase_2': return 'bg-blue-500';
            case 'phase_3': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div
            className="bg-black border-2 border-purple-500 rounded-lg p-4 mb-8 relative overflow-hidden"
            style={{
                boxShadow: 'inset 0 0 30px rgba(168, 85, 247, 0.15), 0 0 20px rgba(168, 85, 247, 0.3)'
            }}
        >
            {/* Animated sparkle overlay */}
            <div className="absolute inset-0 opacity-30 pointer-events-none">
                <div className="absolute top-2 left-[10%] animate-pulse"><Sparkles size={12} className="text-purple-400" /></div>
                <div className="absolute top-4 right-[20%] animate-pulse delay-100"><Sparkles size={10} className="text-purple-400" /></div>
                <div className="absolute bottom-2 left-[30%] animate-pulse delay-200"><Sparkles size={14} className="text-purple-400" /></div>
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-4">
                {/* Left: Label */}
                <div className="flex items-center gap-3">
                    <div className="bg-purple-600 text-white px-3 py-1.5 rounded font-mono font-bold text-sm flex items-center gap-2 shadow-lg shadow-purple-500/30">
                        <Rocket size={16} />
                        {phase.label}
                    </div>
                </div>

                {/* Center: Price Display */}
                <div className="flex items-center gap-4 text-center">
                    <div>
                        <div className="text-gray-500 text-xs font-mono mb-1">EVERYTHING</div>
                        <div className="flex items-center gap-2">
                            <span className="text-4xl font-bold text-green-400 font-mono">${phase.currentPrice}</span>
                            <span className="text-gray-600 line-through text-lg font-mono">$24.99</span>
                        </div>
                    </div>
                </div>

                {/* Right: Countdown */}
                {phase.countdown && (
                    <div className="flex items-center gap-3">
                        <Clock size={18} className="text-purple-400" />
                        <div className="text-right">
                            <div className="text-xs text-gray-500 font-mono">{phase.nextPhaseLabel} in:</div>
                            <div className="flex gap-1 font-mono font-bold text-lg">
                                <span className="bg-purple-900/40 border border-purple-500/30 px-2 py-0.5 rounded text-purple-300">
                                    {String(phase.countdown.hours).padStart(2, '0')}h
                                </span>
                                <span className="bg-purple-900/40 border border-purple-500/30 px-2 py-0.5 rounded text-purple-300">
                                    {String(phase.countdown.minutes).padStart(2, '0')}m
                                </span>
                                <span className="bg-purple-900/40 border border-purple-500/30 px-2 py-0.5 rounded text-purple-300">
                                    {String(phase.countdown.seconds).padStart(2, '0')}s
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EarlyBirdBanner;
