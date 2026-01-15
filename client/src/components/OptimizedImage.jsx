/**
 * Composant d'image optimisé pour le SEO et les performances
 * Supporte lazy loading, WebP, dimensions fixes pour éviter CLS, et alt text
 */

import { useState, useEffect, useRef } from 'react';

const CDN_BASE = import.meta.env.VITE_IMAGE_CDN_BASE;

export default function OptimizedImage({
  src,
  alt = '',
  width,
  height,
  className = '',
  loading = 'lazy',
  priority = false, // Si true, charge immédiatement (above the fold)
  placeholder = 'blur', // 'blur' ou 'empty'
  objectFit = 'cover',
  ...props
}) {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    // Si priority, charger immédiatement
    if (priority) {
      setImageSrc(src);
      return;
    }

    // Sinon, utiliser Intersection Observer pour lazy loading
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Commencer à charger 50px avant que l'image soit visible
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [src, priority]);

  // Détecter le support WebP
  const supportsWebP = () => {
    if (typeof window === 'undefined') return false;
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  };

  // Convertir l'URL en WebP si supporté
  const getOptimizedSrc = (originalSrc) => {
    if (!originalSrc) return null;
    const cdnBase = CDN_BASE;

    // Si un CDN est configuré, réécrire les URLs locales d'uploads
    if (cdnBase && typeof originalSrc === 'string') {
      if (originalSrc.startsWith(cdnBase)) {
        return originalSrc;
      }

      // Cas 1: URL relative (ex: /uploads/avatars/...)
      if (originalSrc.startsWith('/uploads/')) {
        return `${cdnBase}${originalSrc}`;
      }

      // Cas 2: URL absolue vers le même chemin uploads
      try {
        const url = new URL(originalSrc);
        if (url.pathname.startsWith('/uploads/')) {
          return `${cdnBase}${url.pathname}`;
        }
      } catch (error) {
        // Ignorer si originalSrc n'est pas une URL absolue valide
      }
    }

    // Si l'image est déjà WebP ou si WebP n'est pas supporté, retourner l'original
    if (!supportsWebP() || originalSrc.includes('.webp')) {
      return originalSrc;
    }
    // Essayer de convertir en WebP (nécessite un service de conversion côté serveur)
    // Pour l'instant, on retourne l'original
    return originalSrc;
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
  };

  // Style pour éviter CLS (Cumulative Layout Shift)
  const imageStyle = {
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : 'auto',
    objectFit: objectFit,
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoaded ? 1 : 0,
  };

  // Placeholder blur (simple gradient)
  const placeholderStyle = {
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : 'auto',
    backgroundColor: 'var(--bg-secondary, #131825)',
    display: isLoaded ? 'none' : 'block',
    position: 'absolute',
    top: 0,
    left: 0,
  };

  if (hasError) {
    return (
      <div
        className={`optimized-image-error ${className}`}
        style={{
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : 'auto',
          backgroundColor: 'var(--bg-secondary, #131825)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary, #9ca3b8)',
          fontSize: '14px',
        }}
        {...props}
      >
        Image non disponible
      </div>
    );
  }

  return (
    <div
      className={`optimized-image-wrapper ${className}`}
      style={{ position: 'relative', width: width ? `${width}px` : '100%', height: height ? `${height}px` : 'auto' }}
      {...props}
    >
      {placeholder === 'blur' && !isLoaded && (
        <div style={placeholderStyle} aria-hidden="true" />
      )}
      {imageSrc && (
        <img
          ref={imgRef}
          src={getOptimizedSrc(imageSrc)}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : loading}
          onLoad={handleLoad}
          onError={handleError}
          style={imageStyle}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
        />
      )}
      {!imageSrc && !priority && (
        <div
          ref={imgRef}
          style={{
            ...placeholderStyle,
            display: 'block',
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

