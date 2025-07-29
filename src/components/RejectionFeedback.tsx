import { useEffect, useState } from 'react';
import './confetti.css';

interface RejectionFeedbackProps {
  isActive: boolean;
  onComplete?: () => void;
  duration?: number;
}

export function RejectionFeedback({ isActive, onComplete, duration = 2500 }: RejectionFeedbackProps) {
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

  // Generate feedback indicators emanating from the center
  const feedbackIndicators = Array.from({ length: 6 }, (_, i) => {
    const angle = (i * 60) + Math.random() * 15 - 7.5; // 6 directions with some randomness
    const distance = 25 + Math.random() * 15; // Distance from center
    const delay = Math.random() * 150;
    const duration = 1000 + Math.random() * 200;
    
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
        <div className="animate-feedback-burst text-xs">
          {['💭', '📝', '🔍', '💡'][Math.floor(Math.random() * 4)]}
        </div>
      </div>
    );
  });

  return (
    <div className="w-12 h-12 bg-rose-50 border-2 border-rose-200 rounded-lg flex items-center justify-center relative overflow-visible shadow-sm">
      {/* Central feedback icon */}
      <div className="text-xl animate-feedback-pulse relative z-10">
        📋
      </div>
      
      {/* Feedback indicators emanating from center */}
      {feedbackIndicators}
      
      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-rose-100/50 rounded-lg animate-gentle-pulse-red" />
    </div>
  );
}
