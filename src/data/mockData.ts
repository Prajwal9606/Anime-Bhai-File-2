import { Video } from '../types';

export const MOCK_VIDEOS: Video[] = [
  {
    id: 'mock-demon-slayer',
    title: 'Demon Slayer: Kimetsu no Yaiba',
    description: 'A family is attacked by demons and only two members survive - Tanjiro and his sister Nezuko, who is turning into a demon. Tanjiro sets out to become a demon slayer to avenge his family and cure his sister.',
    thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1200&auto=format&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    category: 'anime',
    rating: '4.9',
    year: '2024',
    duration: '24m',
    genres: ['Action', 'Fantasy', 'Adventure', 'Historical'],
    createdAt: '2026-01-01T00:00:00.000Z',
    episodes: [
      {
        id: 'ds-ep1',
        number: 1,
        title: 'Cruelty',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: '24:10',
        description: 'Tanjiro Kamado lives a peaceful life in the mountains selling charcoal. Everything changes when he returns home to find his family slaughtered.'
      },
      {
        id: 'ds-ep2',
        number: 2,
        title: 'Trainer Sakonji Urokodaki',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        duration: '23:55',
        description: 'Guided by Giyu Tomioka, Tanjiro and Nezuko head toward Mt. Sagiri to find a mysterious instructor named Sakonji Urokodaki.'
      },
      {
        id: 'ds-ep3',
        number: 3,
        title: 'Sabito and Makomo',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        duration: '24:05',
        description: 'Tanjiro trains relentlessly for two years under Urokodaki, but he faces a final, seemingly impossible test to split a massive boulder.'
      },
      {
        id: 'ds-ep4',
        number: 4,
        title: 'Final Selection',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        duration: '23:58',
        description: 'The day of Final Selection arrives. Tanjiro travels to Mt. Fujikasane, where seven days of survival on a demon-infested mountain await him.'
      }
    ]
  },
  {
    id: 'mock-jujutsu-kaisen',
    title: 'Jujutsu Kaisen',
    description: 'Yuji Itadori, a high school student, swallows a cursed finger to save his friends and becomes host to Ryomen Sukuna, the King of Curses. He joins the Tokyo Metropolitan Jujutsu Technical High School to fight supernatural threats.',
    thumbnail: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=600&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1200&auto=format&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    category: 'anime',
    rating: '4.8',
    year: '2023',
    duration: '24m',
    genres: ['Action', 'Supernatural', 'Dark Fantasy', 'School'],
    createdAt: '2026-01-02T00:00:00.000Z',
    episodes: [
      {
        id: 'jk-ep1',
        number: 1,
        title: 'Ryomen Sukuna',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        duration: '24:00',
        description: 'Yuji Itadori is an ordinary high schooler whose life is upended when a powerful cursed talisman at his school is unsealed.'
      },
      {
        id: 'jk-ep2',
        number: 2,
        title: 'For Myself',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: '23:45',
        description: 'Now sharing his body with the ancient curse Sukuna, Yuji is taken to Jujutsu High by the powerful sorcerer Satoru Gojo.'
      },
      {
        id: 'jk-ep3',
        number: 3,
        title: 'Girl of Steel',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        duration: '24:12',
        description: 'Yuji and Megumi head to the city to meet Nobara Kugisaki, the third student in their first-year jujutsu sorcery class.'
      }
    ]
  },
  {
    id: 'mock-your-name',
    title: 'Your Name (Kimi no Na wa)',
    description: 'Two strangers find themselves linked in a bizarre way. When a connection forms, will distance be the only thing to keep them apart? A stellar anime masterpiece about destiny, connection, and time.',
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1496715976403-7e36dc43f17b?q=80&w=1200&auto=format&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    category: 'movie',
    rating: '4.9',
    year: '2016',
    duration: '1h 46m',
    genres: ['Romance', 'Drama', 'Fantasy', 'Sci-Fi'],
    createdAt: '2026-01-03T00:00:00.000Z'
  },
  {
    id: 'mock-attack-on-titan',
    title: 'Attack on Titan',
    description: 'After his hometown is destroyed and his mother is killed, young Eren Jaeger vows to cleanse the earth of the giant humanoid Titans that have brought humanity to the brink of extinction.',
    thumbnail: 'https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?q=80&w=600&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    category: 'anime',
    rating: '4.9',
    year: '2023',
    duration: '24m',
    genres: ['Action', 'Drama', 'Military', 'Mystery', 'Post-Apocalyptic'],
    createdAt: '2026-01-04T00:00:00.000Z',
    episodes: [
      {
        id: 'aot-ep1',
        number: 1,
        title: 'To You, 2000 Years in the Future',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        duration: '24:15',
        description: 'For over a century, humanity lived inside massive concentric walls in peace. Today, a colossal Titan breaches the outermost gate.'
      },
      {
        id: 'aot-ep2',
        number: 2,
        title: 'That Day: The Fall of Shiganshina',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: '23:50',
        description: 'As refugees pour into Wall Rose, Eren, Mikasa, and Armin experience the cruelty of survival and vow to join the Scout Regiment.'
      }
    ]
  },
  {
    id: 'mock-spirited-away',
    title: 'Spirited Away',
    description: 'During her family\'s move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits, and where humans are changed into beasts. An absolute Hayao Miyazaki masterpiece.',
    thumbnail: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=600&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=1200&auto=format&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    category: 'movie',
    rating: '4.8',
    year: '2001',
    duration: '2h 5m',
    genres: ['Fantasy', 'Adventure', 'Family', 'Drama'],
    createdAt: '2026-01-05T00:00:00.000Z'
  },
  {
    id: 'mock-suzume',
    title: 'Suzume (Suzume no Tojimari)',
    description: 'A modern action-adventure road story where a 17-year-old girl named Suzume helps a mysterious young man close mystical doors that are unleashing disasters all across Japan.',
    thumbnail: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?q=80&w=600&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200&auto=format&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    category: 'movie',
    rating: '4.7',
    year: '2022',
    duration: '2h 2m',
    genres: ['Adventure', 'Fantasy', 'Drama', 'Romance'],
    createdAt: '2026-01-06T00:00:00.000Z'
  }
];
