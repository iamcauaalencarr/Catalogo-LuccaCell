import React, { useState } from 'react';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  aspectRatio?: string;
  fallbackSrc?: string;
  containerClassName?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className,
  containerClassName,
  fallbackSrc = '/placeholder.png',
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={cn('relative overflow-hidden', containerClassName)}>
      {!loaded && !error && (
        <Skeleton className="absolute inset-0 w-full h-full rounded-inherit z-10" />
      )}
      <img
        src={error ? fallbackSrc : src}
        alt={alt || ''}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={cn(
          'transition-all duration-500 ease-out',
          loaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-95 blur-xs',
          className
        )}
        {...props}
      />
    </div>
  );
};
