import React, { useState, useEffect } from 'react';
import { Zap, Clock, ArrowRight } from 'lucide-react';
import { MOCK_PRODUCTS, getFlashSaleProductId, getFlashSaleTimeRemaining } from '../constants';

interface FlashSaleBannerProps {
    onAddToCart: (product: any) => void;
}

const FlashSaleBanner: React.FC<FlashSaleBannerProps> = ({ onAddToCart }) => {
    const [timeRemaining, setTimeRemaining] = useState(getFlashSaleTimeRemaining());
    const flashSaleProductId = getFlashSaleProductId();
    const flashProduct = MOCK_PRODUCTS.find(p => p.id === flashSaleProductId);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeRemaining(getFlashSaleTimeRemaining());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    if (!flashProduct) return null;

    const originalPrice = flashProduct.price;
    const salePrice = 1;
    const discount = Math.round((1 - salePrice / originalPrice) * 100);

    return (
        <div className="bg-gradient-to-r from-purple-900/80 via-violet-900/80 to-purple-900/80 border border-purple-500/50 rounded-lg p-4 mb-8 relative overflow-hidden">
            {/* Animated background pulse */}
            <div className="absolute inset-0 bg-purple-500/10 animate-pulse-neon pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Left: Flash Sale Label */}
                <div className="flex items-center gap-3">
                    <div className="bg-purple-500 text-white px-3 py-1 rounded font-mono font-bold text-sm flex items-center gap-2 animate-pulse">
                        <Zap size={16} />
                        FLASH SALE
                    </div>
                    <div className="text-white font-bold font-term text-lg md:text-xl">
                        {flashProduct.name}
                    </div>
                </div>

                {/* Center: Countdown */}
                <div className="flex items-center gap-2 text-white">
                    <Clock size={16} className="text-violet-400" />
                    <span className="font-mono text-sm text-gray-300">Ends in:</span>
                    <div className="flex gap-1 font-mono font-bold">
                        <span className="bg-black/50 px-2 py-1 rounded text-violet-400">
                            {String(timeRemaining.hours).padStart(2, '0')}h
                        </span>
                        <span className="bg-black/50 px-2 py-1 rounded text-violet-400">
                            {String(timeRemaining.minutes).padStart(2, '0')}m
                        </span>
                        <span className="bg-black/50 px-2 py-1 rounded text-violet-400">
                            {String(timeRemaining.seconds).padStart(2, '0')}s
                        </span>
                    </div>
                </div>

                {/* Right: Price & CTA */}
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-gray-400 line-through text-sm font-mono">${originalPrice}</div>
                        <div className="text-3xl font-bold text-green-400 font-mono">$1</div>
                    </div>
                    <div className="bg-violet-500/20 text-violet-400 px-2 py-1 rounded text-xs font-bold font-mono">
                        {discount}% OFF
                    </div>
                    <button
                        onClick={() => onAddToCart({ ...flashProduct, price: salePrice })}
                        className="bg-green-500 hover:bg-green-400 text-black font-bold font-mono px-4 py-2 rounded flex items-center gap-2 transition whitespace-nowrap"
                    >
                        GRAB FOR $1 <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FlashSaleBanner;
