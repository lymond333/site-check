import React, { useState } from 'react';
import { CameraOff } from 'lucide-react';
import { PhotoPin } from '../types/punch';

interface PunchImageProps {
  src?: string;
  alt: string;
  pin?: PhotoPin;
  interactivePin?: boolean;
  onPinChange?: (pin: PhotoPin) => void;
  className?: string;
  aspectClassName?: string;
  showPinLabel?: boolean;
}

export const PunchImage: React.FC<PunchImageProps> = ({
  src,
  alt,
  pin,
  interactivePin = false,
  onPinChange,
  className = '',
  aspectClassName = 'aspect-[4/3]',
  showPinLabel = false,
}) => {
  const [hasError, setHasError] = useState(false);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactivePin || !onPinChange) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(4, Math.min(96, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.max(4, Math.min(96, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
    onPinChange({ x, y });
  };

  if (!src || hasError) {
    return (
      <div
        className={`relative w-full ${aspectClassName} bg-slate-100 border border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-500 p-4 text-center ${className}`}
      >
        <CameraOff className="w-6 h-6 text-slate-400" strokeWidth={1.75} />
        <span className="text-xs font-medium text-slate-600 max-w-[22ch] truncate">{alt}</span>
      </div>
    );
  }

  return (
    <div
      onClick={handleImageClick}
      className={`relative w-full ${aspectClassName} overflow-hidden bg-slate-100 select-none ${
        interactivePin ? 'cursor-crosshair' : ''
      } ${className}`}
      role={interactivePin ? 'button' : undefined}
      tabIndex={interactivePin ? 0 : undefined}
      aria-label={interactivePin ? 'Click image to place defect pin' : undefined}
      onKeyDown={(e) => {
        if (interactivePin && onPinChange && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onPinChange({ x: 50, y: 50 });
        }
      }}
    >
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover block"
      />
      {pin && (
        <div
          style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        >
          <div className="relative flex items-center justify-center">
            <span className="w-7 h-7 rounded-full border-2 border-white bg-blue-600/90 shadow-md flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-white" />
            </span>
            {showPinLabel && (
              <span className="ml-2 px-1.5 py-0.5 bg-slate-900/85 text-white text-[11px] font-mono tabular-nums rounded whitespace-nowrap">
                {pin.x}%, {pin.y}%
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
