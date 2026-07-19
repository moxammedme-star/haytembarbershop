export enum ServiceCategory {
  HAIRCUT = "Haircut",
  BEARD = "Beard",
  STYLING = "Styling",
  COLORING = "Coloring",
  SPECIAL = "Special",
  OTHER = "Other"
}

export interface BusinessInfo {
  name: string;
  phone: string;
  email: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  googleMaps: string;
  biography: { [key: string]: string };
  story: { [key: string]: string };
  mission: { [key: string]: string };
  vision: { [key: string]: string };
  logoUrl: string;
  promoBanner: { [key: string]: string };
  policies: { [key: string]: string };
}

export interface WorkingHourDay {
  day: string; // e.g. "Monday", "Lundi"
  dayKey: 'monday' | 'tuesday' | 'wednesday' | 'thuesday' | 'friday' | 'saturday' | 'sunday';
  open: string; // e.g. "09:00"
  close: string; // e.g. "19:00"
  isClosed: boolean;
}

export interface Service {
  id: string;
  title: { [key: string]: string };
  description: { [key: string]: string };
  price: number | null; // Nullable as per requirements
  duration: number; // In minutes
  category: string;
  availability: boolean;
}

export interface Hairstyle {
  id: string;
  name: { [key: string]: string };
  description: { [key: string]: string };
  image: string; // url or base64
  video: string; // url
  price: number | null; // Nullable
  duration: number; // In minutes
  difficulty: number; // 1 to 5 stars
  category: string;
}

export interface GalleryItem {
  id: string;
  url: string;
  type: "image" | "video";
  category: string;
  description: { [key: string]: string };
}

export interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
}

export interface VisitLog {
  timestamp: string;
  ipHash?: string;
}

export interface Stats {
  totalVisits: number;
  totalBookings: number;
  totalRevenue: number;
  visitsHistory: { date: string; count: number }[];
  bookingsHistory: { date: string; count: number }[];
  popularServices: { serviceId: string; title: string; count: number }[];
}

export type Language = "fr" | "ar" | "en";

export interface TranslationDictionary {
  [key: string]: {
    fr: string;
    ar: string;
    en: string;
  };
}
