import React, { useState } from 'react';
import { optimizeImageUrl } from '../lib/imageTransform';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  decoding?: 'sync' | 'async' | 'auto';
  style?: React.CSSProperties;
  sizes?: string;
  breakpoints?: number[];
  aspectRatio?: string;
  isLCP?: boolean;
}

const DEFAULT_BREAKPOINTS = [320, 480, 640, 768, 1024, 1280, 1536];
const SRCSET_BREAKPOINTS = [320, 640, 960, 1280];

function generateSrcSet(url: string, breakpoints: number[]): string {
  return breakpoints
    .map(w => `${optimizeImageUrl(url, { width: w })} ${w}w`)
    .join(', ');
}

function generateAvifSrcSet(url: string, breakpoints: number[]): string {
  return breakpoints
    .map(w => `${optimizeImageUrl(url, { width: w, format: 'avif' })} ${w}w`)
    .join(', ');
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  loading = 'lazy',
  fetchPriority = 'auto',
  decoding = 'async',
  style,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  breakpoints = SRCSET_BREAKPOINTS,
  aspectRatio,
  isLCP = false,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  if (!src) {
    return (
      <div
        className={`bg-gray-100 ${className}`}
        style={{ width, height, aspectRatio, ...style }}
        aria-hidden="true"
      />
    );
  }

  const webpSrcSet = generateSrcSet(src, breakpoints);
  const avifSrcSet = generateAvifSrcSet(src, breakpoints);

  const actualLoading = isLCP ? 'eager' : loading;
  const actualFetchPriority = isLCP ? 'high' : fetchPriority;
  const actualDecoding = isLCP ? 'sync' : decoding;

  return (
    <picture
      className={className}
      style={{
        display: 'inline-block',
        overflow: 'hidden',
        width: width ? undefined : '100%',
        height: height ? undefined : 'auto',
        aspectRatio: aspectRatio || (width && height ? `${width}/${height}` : undefined),
        ...style,
      }}
    >
      {src.includes('images.unsplash.com') || src.includes('/storage/v1/object/public/') ? (
        <>
          <source srcSet={avifSrcSet} sizes={sizes} type="image/avif" />
          <source srcSet={webpSrcSet} sizes={sizes} type="image/webp" />
        </>
      ) : src.match(/\.(jpg|jpeg|png|webp)$/i) ? (
        <>
          <source srcSet={avifSrcSet} sizes={sizes} type="image/avif" />
          <source srcSet={webpSrcSet} sizes={sizes} type="image/webp" />
        </>
      ) : null}
      <img
        src={optimizeImageUrl(src, { width: width || 800 })}
        alt={alt}
        width={width}
        height={height}
        loading={actualLoading}
        fetchPriority={actualFetchPriority}
        decoding={actualDecoding}
        srcSet={webpSrcSet}
        sizes={sizes}
        onLoad={() => setIsLoaded(true)}
        className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </picture>
  );
};

export default LazyImage;
