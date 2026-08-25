import React, { useState } from 'react';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';
import { ImageOff } from 'lucide-react';

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
  fallbackSrc,
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={cn('relative overflow-hidden flex items-center justify-center', containerClassName)}>
      {!loaded && !error && (
        <Skeleton className="absolute inset-0 w-full h-full rounded-inherit z-10" />
      )}
      {error ? (
        fallbackSrc ? (
          <img src={fallbackSrc} alt={alt || ''} className={className} />
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-[#A89F91]">
            <ImageOff size={24} className="mb-1 opacity-60" />
            <span className="text-[10px] uppercase tracking-wider font-semibold opacity-70">Imagem indisponível</span>
          </div>
        )
      ) : (
        <img
          src={src}
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
      )}
    </div>
  );
};
