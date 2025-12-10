export interface TextGenerationRequest {
  prompt: string;
  model: string;
  image?: string;
}

export interface VideoGenerationRequest {
  prompt: string;
  storyType: string;
  duration: number;
  model: string;
}

export interface ImageGenerationRequest {
  prompt: string;
  style: string;
  size: string;
  model: string;
}

export interface GenerationResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export type TabType = 'text' | 'video' | 'image' | 'upload';