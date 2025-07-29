import { useEffect, useState } from 'react';
import './confetti.css';

interface MiniCelebrationProps {
  isActive: boolean;
  onComplete?: () => void;
  duration?: number;
}

export function MiniCelebration({ isActive, onComplete, duration = 2500 }: MiniCelebrationProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    setIsAnimating(true);

    const cleanup = setTimeout(() => {
      setIsAnimating(false);
      onComplete?.();
    }, duration);

    return () => {
      clearTimeout(cleanup);
    };
  }, [isActive, duration, onComplete]);

  if (!isAnimating) return null;

  // Generate sprinkles emanating from the center
  const sprinkles = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * 45) + Math.random() * 20 - 10; // 8 directions with some randomness
    const distance = 30 + Math.random() * 20; // Distance from center
    const delay = Math.random() * 200;
    const duration = 1200 + Math.random() * 300;

    // Calculate end position based on angle
    const radians = (angle * Math.PI) / 180;
    const endX = Math.cos(radians) * distance;
    const endY = Math.sin(radians) * distance;

    return (
      <div
        key={i}
        className="absolute pointer-events-none"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          animationDelay: `${delay}ms`,
          animationDuration: `${duration}ms`,
          '--end-x': `${endX}px`,
          '--end-y': `${endY}px`,
        } as any}
      >
        <div className="animate-sprinkle-burst text-xs">
          {['✨', '⭐', '💫', '🌟'][Math.floor(Math.random() * 4)]}
        </div>
      </div>
    );
  });

  return (
    <div className="w-12 h-12 bg-emerald-50 border-2 border-emerald-200 rounded-lg flex items-center justify-center relative overflow-visible shadow-sm">
      {/* Central celebration icon */}
      <div className="text-xl animate-celebration-pulse relative z-10">
        🎉
      </div>

      {/* Sprinkles emanating from center */}
      {sprinkles}

      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-emerald-100/50 rounded-lg animate-gentle-pulse" />
    </div>
  );
}
