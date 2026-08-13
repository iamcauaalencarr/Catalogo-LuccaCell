import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress?: number; // 0 to 100, or undefined for indeterminate
  className?: string;
  barClassName?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className,
  barClassName,
}) => {
  const isIndeterminate = progress === undefined;

  return (
    <div
      className={cn(
        'w-full h-1 bg-primary/20 overflow-hidden rounded-full relative',
        className
      )}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          'h-full bg-primary transition-all duration-300 ease-out rounded-full',
          isIndeterminate && 'progress-bar-animated w-full',
          barClassName
        )}
        style={!isIndeterminate ? { width: `${Math.min(100, Math.max(0, progress))}%` } : undefined}
      />
    </div>
  );
};
