import React, { useState, useEffect } from 'react';

interface AnimeImageProps {
  title: string;
  initialSrc?: string;
  alt: string;
  className?: string;
  fallbackUrl?: string;
}

export default function AnimeImage({
  title,
  initialSrc,
  alt,
  className = '',
  fallbackUrl = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200'
}: AnimeImageProps) {
  const [src, setSrc] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    // Check if initial source is a valid custom URL (not generic unsplash/picsum placeholders)
    const isPlaceholder = !initialSrc || 
                          initialSrc.includes('unsplash.com/photo-1536440136628') || 
                          initialSrc.includes('picsum.photos');

    if (initialSrc && !isPlaceholder) {
      setSrc(initialSrc);
      setLoading(false);
      return;
    }

    // Try to auto-fetch from available Jikan (MyAnimeList) API!
    const fetchAutoImage = async () => {
      setLoading(true);
      try {
        // Clean title for search (remove special chars/season suffixes)
        const cleanTitle = title
          .replace(/\(Movie\)/gi, '')
          .replace(/Season \d+/gi, '')
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .trim();

        const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(cleanTitle)}&limit=1`);
        if (res.ok) {
          const json = await res.json();
          const autoUrl = json.data?.[0]?.images?.jpg?.large_image_url || json.data?.[0]?.images?.jpg?.image_url;
          
          if (autoUrl && isMounted) {
            setSrc(autoUrl);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('AutoImage fetch from Jikan API failed:', err);
      }

      // Fallback to initialSrc or default placeholder if API failed
      if (isMounted) {
        setSrc(initialSrc || fallbackUrl);
        setLoading(false);
      }
    };

    fetchAutoImage();

    return () => {
      isMounted = false;
    };
  }, [title, initialSrc, fallbackUrl]);

  return (
    <div className="relative w-full h-full bg-zinc-950 flex items-center justify-center overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs z-10">
          <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <img
        src={hasError ? fallbackUrl : (src || initialSrc || fallbackUrl)}
        alt={alt}
        className={`${className} transition-all duration-700 ease-out ${loading ? 'opacity-0 scale-95 blur-md' : 'opacity-100 scale-100 blur-0'}`}
        referrerPolicy="no-referrer"
        onError={() => {
          setHasError(true);
        }}
      />
    </div>
  );
}
