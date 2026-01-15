export type TransitionType = 'slide' | 'fade' | 'zoom' | 'flip' | 'slideUp';
export type EaseType = 'linear' | 'easeInOut' | 'circOut' | 'backInOut' | 'spring';

export interface SlideImage {
  id: string;
  blob: File | Blob;
  preview: string;
  duration: number;
  caption: string;
  filter: string;
}

export interface Gallery {
  id: string;
  name: string;
  images: SlideImage[];
  settings: {
    globalTransitionType: TransitionType;
    globalEase: EaseType;
    objectFit: 'contain' | 'cover';
    bgBlur: number;
    loop: boolean;
    autoplay: boolean;
  };
}