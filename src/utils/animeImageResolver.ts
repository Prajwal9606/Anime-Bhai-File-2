import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Video } from '../types';

/**
 * Checks if a video's thumbnail is a placeholder image from Unsplash or is empty.
 */
export function isPlaceholderImage(url?: string): boolean {
  if (!url) return true;
  return (
    url.includes('unsplash.com') ||
    url.includes('placeholder') ||
    url.includes('images.unsplash.com') ||
    url.trim() === ''
  );
}

/**
 * Normalizes an anime title to get better Jikan search results.
 */
function cleanAnimeTitleForSearch(title: string): string {
  return title
    .replace(/:\s*Season\s*\d+/gi, '')
    .replace(/\s*Season\s*\d+/gi, '')
    .replace(/\s*Part\s*\d+/gi, '')
    .replace(/(\s*Movie\s*)/gi, '')
    .replace(/\s+-\s+\d+/g, '') // Remove episode numbers if present in title
    .trim();
}

/**
 * Fetches anime image details from Jikan API by title and caches them in localStorage.
 */
export async function fetchAnimePosterFromAPI(title: string): Promise<{ thumbnail: string; backdrop: string } | null> {
  const cleanTitle = cleanAnimeTitleForSearch(title);
  if (!cleanTitle) return null;

  const cacheKey = `anime_img_cache_${cleanTitle.toLowerCase().replace(/\s+/g, '_')}`;
  const cached = localStorage.getItem(cacheKey);
  
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      // Ignore JSON parsing errors and refetch
    }
  }

  // To prevent spamming Jikan API and hitting rate limits, wait a bit
  await new Promise((resolve) => setTimeout(resolve, 800));

  try {
    const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(cleanTitle)}&limit=1`);
    if (!response.ok) {
      if (response.status === 429) {
        console.warn('Jikan API is rate limited. Retrying on next tick.');
      }
      return null;
    }

    const json = await response.json();
    const anime = json.data?.[0];
    if (anime) {
      const thumbnail = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || '';
      // Jikan pictures are great for backdrops, or we can use the main large image
      const backdrop = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || '';

      if (thumbnail) {
        const result = { thumbnail, backdrop };
        localStorage.setItem(cacheKey, JSON.stringify(result));
        return result;
      }
    }
  } catch (error) {
    console.error(`Error resolving image for anime "${title}":`, error);
  }

  return null;
}

/**
 * Automatically update a list of videos with high-quality images from Jikan API,
 * caching results and persisting changes back to Firestore.
 */
export async function syncAndAutoUpdateVideos(
  videos: Video[],
  updateLocalVideo: (id: string, thumbnail: string, backdrop: string) => void,
  onProgress?: (msg: string) => void
) {
  // Filter for videos that actually need updating
  const targetVideos = videos.filter((v) => isPlaceholderImage(v.thumbnail));

  if (targetVideos.length === 0) {
    return;
  }

  onProgress?.(`Auto-updating ${targetVideos.length} placeholder cover images...`);

  for (const video of targetVideos) {
    const cleanTitle = cleanAnimeTitleForSearch(video.title);
    
    // Check localStorage cache first for an instant, non-blocking UI update
    const cacheKey = `anime_img_cache_${cleanTitle.toLowerCase().replace(/\s+/g, '_')}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      try {
        const { thumbnail, backdrop } = JSON.parse(cached);
        if (thumbnail) {
          updateLocalVideo(video.id, thumbnail, backdrop);
          
          // Also persist back to Firestore if it's a real Firestore database entry
          if (video.id && !video.id.startsWith('mock-')) {
            try {
              await updateDoc(doc(db, 'videos', video.id), {
                thumbnail: thumbnail,
                backdrop: backdrop || thumbnail
              });
              console.log(`Updated Firestore document ${video.id} (${video.title}) from local image cache.`);
            } catch (fsErr) {
              // Ignore if we lack permission, but log it
              console.warn(`Firestore update permission skipped for cached document:`, fsErr);
            }
          }
          continue;
        }
      } catch (e) {
        // Fall back to API call if cache parsing fails
      }
    }

    // Call Jikan API sequentially
    onProgress?.(`Fetching real poster for: ${video.title}`);
    const apiResult = await fetchAnimePosterFromAPI(video.title);
    
    if (apiResult) {
      const { thumbnail, backdrop } = apiResult;
      updateLocalVideo(video.id, thumbnail, backdrop);

      // Persist to Firestore if real database entry
      if (video.id && !video.id.startsWith('mock-')) {
        try {
          await updateDoc(doc(db, 'videos', video.id), {
            thumbnail: thumbnail,
            backdrop: backdrop || thumbnail
          });
          console.log(`Successfully updated Firestore document ${video.id} with high-res cover.`);
        } catch (fsErr) {
          console.warn(`Firestore write skipped or failed for ${video.title}:`, fsErr);
        }
      }
    }
  }

  onProgress?.('All cover images resolved successfully!');
}
