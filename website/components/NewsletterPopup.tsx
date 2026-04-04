import React, { useState, useEffect } from 'react';
import { X, Mail, Gift, Check, Sparkles } from 'lucide-react';

interface NewsletterPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

const NewsletterPopup: React.FC<NewsletterPopupProps> = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    // Check if user already subscribed
    useEffect(() => {
        const subscribed = localStorage.getItem('cldcde_newsletter_subscribed');
        if (subscribed) {
            setIsSuccess(true);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim() || !email.includes('@')) {
            setError('Please enter a valid email');
            return;
        }

        setIsSubmitting(true);
        setError('');

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Save to localStorage
        localStorage.setItem('cldcde_newsletter_subscribed', 'true');
        localStorage.setItem('cldcde_newsletter_email', email);
        localStorage.setItem('cldcde_early_bird_unlocked', 'true');

        setIsSubmitting(false);
        setIsSuccess(true);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Radial blur background - 85% coverage from center */}
            <div
                className="absolute inset-0 backdrop-blur-md"
                style={{
                    background: 'radial-gradient(circle at center, transparent 15%, rgba(0,0,0,0.85) 15%)',
                }}
                onClick={onClose}
            />

            {/* Popup container */}
            <div className="relative w-full max-w-2xl mx-4 animate-scale-in">
                {/* Liquid glass panel */}
                <div className="liquid-glass rounded-xl overflow-hidden border border-neutral-700/50">
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 p-2 text-gray-500 hover:text-white transition rounded-full hover:bg-white/10"
                    >
                        <X size={20} />
                    </button>

                    {/* Content */}
                    <div className="p-6 md:p-10">
                        {/* ANSI Shadow ASCII Logo with electric blue glow - One line banner */}
                        <div className="text-center mb-6">
                            <div
                                className="inline-flex items-end gap-1 animate-pulse-slow"
                                style={{
                                    filter: 'drop-shadow(0 0 8px rgba(0, 243, 255, 0.4)) drop-shadow(0 0 20px rgba(0, 243, 255, 0.2))',
                                }}
                            >
                                {/* CLDCDE */}
                                <pre
                                    className="font-mono text-[10px] md:text-[12px] leading-none select-none whitespace-pre"
                                    style={{
                                        background: 'linear-gradient(180deg, #FFFFFF 0%, #E0E0E0 30%, #B0B0B0 60%, #808080 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                    }}
                                >{` 
                                      ██████╗██╗     ██████╗  ██████╗██████╗ ███████╗
                                     ██╔════╝██║     ██╔══██╗██╔════╝██╔══██╗██╔════╝
                                     ██║     ██║     ██║  ██║██║     ██║  ██║█████╗
                                     ██║     ██║     ██║  ██║██║     ██║  ██║██╔══╝
                                     ╚██████╗███████╗██████╔╝╚██████╗██████╔╝███████╗
                                      ╚═════╝╚══════╝╚═════╝  ╚═════╝╚═════╝ ╚══════╝`}</pre>
                                {/* .CC in smaller ANSI Shadow - inline */}
                                <pre
                                    className="font-mono text-[6px] md:text-[7px] leading-none select-none whitespace-pre"
                                    style={{
                                        background: 'linear-gradient(180deg, #FFFFFF 0%, #C0C0C0 50%, #909090 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                    }}
                                >{`
                                         ██████╗ ██████╗
                                        ██╔════╝██╔════╝
                                        ██║     ██║
                                        ██║     ██║
                                      ▄▄╚██████╗╚██████╗
                                      ▀▀ ╚═════╝ ╚═════╝`}</pre>
                            </div>
                        </div>

                        {!isSuccess ? (
                            <>
                                {/* Pre-signup content */}
                                <div className="text-center mb-6">
                                    <h2 className="text-xl md:text-2xl font-bold text-white mb-2 font-mono uppercase tracking-wider">
                                        Join the Inner Circle
                                    </h2>
                                    <p className="text-gray-400 text-sm">
                                        Get exclusive updates, early access, and unlock the{' '}
                                        <span
                                            className="font-mono font-semibold uppercase animate-glow-breathe"
                                            style={{
                                                background: 'linear-gradient(180deg, #FFFFFF 0%, #C0C0C0 50%, #A0A0A0 100%)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                backgroundClip: 'text',
                                                textShadow: '0 0 10px rgba(0, 243, 255, 0.5), 0 0 20px rgba(0, 243, 255, 0.3)',
                                                filter: 'drop-shadow(0 0 6px rgba(0, 243, 255, 0.4))',
                                            }}
                                        >
                                            Early Bird Special
                                        </span>
                                    </p>
                                </div>


                                {/* Email form */}
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="your@email.com"
                                            className="w-full bg-black/50 border border-neutral-700 rounded-lg py-4 px-12 text-white font-mono text-sm focus:outline-none focus:border-gray-500 transition placeholder:text-gray-600"
                                        />
                                    </div>

                                    {error && (
                                        <p className="text-red-400 text-xs font-mono text-center">{error}</p>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full btn-polished btn-polished-lg btn-polished-primary flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
                                                <span className="btn-text">SUBSCRIBING...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={16} />
                                                <span className="btn-text">UNLOCK EARLY BIRD</span>
                                            </>
                                        )}
                                    </button>
                                </form>

                                <p className="text-center text-gray-600 text-xs font-mono mt-4">
                                    No spam. Unsubscribe anytime.
                                </p>
                            </>
                        ) : (
                            <>
                                {/* Success / Early Bird Reward */}
                                <div className="text-center">
                                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center">
                                        <Gift className="text-amber-400" size={28} />
                                    </div>

                                    <h2 className="text-2xl font-bold text-white mb-2 font-mono uppercase tracking-wider">
                                        🎉 You're In!
                                    </h2>

                                    <p className="text-gray-400 text-sm mb-6">
                                        Welcome to the inner circle. Here's your reward:
                                    </p>

                                    {/* Early Bird Reward Card */}
                                    <div className="bg-gradient-to-br from-amber-900/30 to-amber-800/10 border border-amber-500/30 rounded-lg p-6 mb-6">
                                        <div className="flex items-center justify-center gap-2 mb-3">
                                            <Sparkles className="text-amber-400" size={20} />
                                            <span className="text-amber-400 font-mono font-bold text-lg uppercase">Early Bird Special</span>
                                        </div>

                                        <div className="text-4xl font-mono font-bold text-white mb-2">
                                            25% OFF
                                        </div>

                                        <p className="text-gray-400 text-sm mb-4">
                                            On your first purchase. Valid for 7 days.
                                        </p>

                                        <div className="bg-black/50 border border-amber-500/20 rounded py-3 px-4 flex items-center justify-between">
                                            <code className="font-mono text-amber-400 text-sm tracking-wider">EARLYBIRD25</code>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText('EARLYBIRD25');
                                                }}
                                                className="text-gray-500 hover:text-amber-400 transition text-xs font-mono"
                                            >
                                                COPY
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-center gap-2 text-green-500 text-sm font-mono">
                                        <Check size={16} />
                                        <span>Code saved to your account</span>
                                    </div>

                                    <button
                                        onClick={onClose}
                                        className="mt-6 btn-polished btn-polished-sm"
                                    >
                                        <span className="btn-text">START SHOPPING</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewsletterPopup;
