const SUPABASE_STORAGE_PATTERN = /https:\/\/[^/]+\/storage\/v1\/object\/public\//i;

export function isSupabaseStorageUrl(url: string): boolean {
  return SUPABASE_STORAGE_PATTERN.test(url);
}

export function isUnsplashUrl(url: string): boolean {
  return url.includes('images.unsplash.com');
}

export function optimizeImageUrl(
  url: string,
  options: { width?: number; height?: number; quality?: number; format?: string } = {}
): string {
  if (!url) return url;

  const { width, height, quality = 75, format = 'webp' } = options;

  if (isUnsplashUrl(url)) {
    const separator = url.includes('?') ? '&' : '?';
    const params = new URLSearchParams();
    if (width) params.set('w', String(width));
    if (quality) params.set('q', String(quality));
    params.set('auto', 'format');
    params.set('fm', format);
    if (url.includes('auto=format')) {
      return url;
    }
    return `${url}${separator}${params.toString()}`;
  }

  if (isSupabaseStorageUrl(url)) {
    const separator = url.includes('?') ? '&' : '?';
    const params = new URLSearchParams();
    if (width) params.set('width', String(width));
    if (height) params.set('height', String(height));
    params.set('format', format);
    params.set('resize', 'cover');
    return `${url}${separator}${params.toString()}`;
  }

  return url;
}

export function optimizeImageSrcSet(
  url: string,
  sizes: { width: number; label: string }[]
): string {
  return sizes
    .map(({ width, label }) => `${optimizeImageUrl(url, { width })} ${label}`)
    .join(', ');
}
