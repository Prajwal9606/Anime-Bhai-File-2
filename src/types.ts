export interface Episode {
  id: string;
  number: number;
  index?: number;
  title: string;
  videoUrl: string;
  duration: string;
  description?: string;
  audioSources?: { lang: 'Hindi' | 'Japanese' | 'English'; url: string; embedHtml?: string }[];
  embedHtml?: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  category: 'anime' | 'movie';
  createdAt: any;
  rating?: string;
  status?: string;
  year?: string;
  genres?: string[];
  duration?: string;
  backdrop?: string;
  gallery?: string[];
  episodes?: Episode[];
  embedHtml?: string;
}
