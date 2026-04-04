import React, { useEffect, useState } from 'react';

interface PreloaderProps {
  onLoaded: () => void;
  minDuration?: number;
}

const Preloader: React.FC<PreloaderProps> = ({ onLoaded, minDuration = 2000 }) => {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFading(true);
      // Wait for fade animation to complete before calling onLoaded
      setTimeout(onLoaded, 500);
    }, minDuration);

    return () => clearTimeout(timer);
  }, [onLoaded, minDuration]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black transition-opacity duration-500 ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-contain"
      >
        <source src="/preloader.mp4" type="video/mp4" />
      </video>
    </div>
  );
};

export default Preloader;
