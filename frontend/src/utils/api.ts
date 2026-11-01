export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // When running on client-side (mobile browser or desktop browser over LAN)
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    return `http://${window.location.hostname}:8080`;
  }
  return 'http://localhost:8080';
}

const API_BASE_URL = getApiBaseUrl();

export interface User {
  id: number;
  name?: string;
  email: string;
  role?: 'admin' | 'pegawai' | string;
  created_at: string;
}

export interface EventItem {
  id: number;
  title: string;
  description: string;
  category: 'nasional' | 'internasional' | 'teknologi' | 'literasi_digital' | 'custom' | 'podcast';
  month: number;
  day: number;
  created_at: string;
}

export interface ReminderItem {
  id: number;
  title: string;
  description: string;
  category: string;
  month: number;
  day: number;
  status: 'today' | 'tomorrow' | 'upcoming';
  days_until: number;
  badge_text: string;
  urgency: 'high' | 'medium' | 'normal';
  date_formatted: string;
}

export interface ReminderSummary {
  today_count: number;
  tomorrow_count: number;
  upcoming_count: number;
  total_reminders: number;
}

export interface ReminderResponse {
  summary: ReminderSummary;
  reminders: ReminderItem[];
}

export interface IdeaItem {
  title: string;
  summary: string;
  format: string;        // "Video Pendek", "Poster Infografis", "Carousel Instagram", etc.
  reference_url: string; // Link to sample content (YouTube, Instagram, etc.)
}

export interface ContentIdea {
  id: number;
  user_id: number;
  date: string; // YYYY-MM-DD
  theme: string;
  ideas: IdeaItem[];
  caption: string;
  created_at: string;
}

export interface VideoScene {
  scene_number: number;
  visual: string;
  narration: string;
  duration: string;
}

export interface VideoContent {
  title: string;
  format: string;
  duration: string;
  hook: string;
  scenes: VideoScene[];
  caption: string;
  hashtags: string[];
  music_suggestion: string;
  cta: string;
}

export interface PodcastSpeaker {
  id: number;
  name: string;
  role: string;
  persona: string;
  avatar_color?: string;
  avatarColor?: string;
}

export interface PodcastDialogueLine {
  speaker_id: number;
  speaker_name: string;
  speaker_role: string;
  cue: string;
  line: string;
}

export interface PodcastSegment {
  segment_number: number;
  title: string;
  duration: string;
  summary: string;
  dialogue: PodcastDialogueLine[];
}

export interface PodcastThemeIdea {
  id: string;
  title: string;
  catchphrase: string;
  description: string;
  category: string;
  angle: string;
  target_audience: string;
  suggested_questions: string[];
  relatability_score: number;
  practical_application?: string;
  discussion_points?: string[];
}

export interface PodcastEpisode {
  id?: number;
  user_id?: number;
  title: string;
  topic: string;
  category?: string;
  vibe?: string;
  duration: string;
  speaker_count: number;
  speakers: PodcastSpeaker[];
  segments: PodcastSegment[];
  key_takeaways: string[];
  social_caption: string;
  created_at?: string;
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('cc_token');
  }
  return null;
}

export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('cc_token', token);
  }
}

export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_user');
  }
}

export function getCurrentUser(): User | null {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('cc_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function setCurrentUser(user: User): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('cc_user', JSON.stringify(user));
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If not a login request and returns 401, redirect to login
    if (!path.includes('/auth/login')) {
      removeToken();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getAbsoluteUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}
