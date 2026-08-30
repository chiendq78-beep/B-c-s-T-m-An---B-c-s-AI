export enum OrganSystemType {
  SKELETAL = 'Skeletal',
  MUSCULAR = 'Muscular',
  NERVOUS = 'Nervous',
  CIRCULATORY = 'Circulatory',
  RESPIRATORY = 'Respiratory',
  DIGESTIVE = 'Digestive',
  URINARY = 'Urinary',
  REPRODUCTIVE = 'Reproductive',
  ENDOCRINE = 'Endocrine',
  IMMUNE = 'Immune',
  SENSORY = 'Sensory',
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  phone?: string;
  is_active: boolean;
  role?: 'admin' | 'user';
  createdAt: string;
}

export interface OrganSystem {
  id: string;
  name_vi: string;
  name_en: string;
  description: string;
  colorCode: string;
}

export interface BodyPart {
  id: string;
  name_vi: string;
  name_latin?: string;
  systemId: string;
  description: string;
  function: string;
  location: string;
  model3dUrl?: string;
  images?: string[];
}

export interface Disease {
  id: string;
  name_vi: string;
  name_en?: string;
  icd10?: string;
  bodyPartId: string;
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  overview: string;
  causes?: string[];
  symptoms?: string[];
  redFlags?: string[];
  diagnosis?: string;
  treatment?: string;
  prevention?: string[];
  relatedHerbs?: string[];
  relatedExercises?: string[];
}

export interface Herb {
  id: string;
  name_vi: string;
  name_scientific?: string;
  family?: string;
  partUsed?: string;
  benefits?: string[];
  usage?: string;
  dosage?: string;
  contraindications?: string[];
  images?: string[];
}

export interface Exercise {
  id: string;
  name: string;
  category: 'yoga' | 'meditation' | 'cardio' | 'therapy';
  level: 'easy' | 'medium' | 'hard';
  duration: number;
  description: string;
  videoUrl?: string;
  targetBodyPart?: string;
}

export interface HealthJournal {
  id: string;
  userId: string;
  date: string;
  mood: number; // 1-5
  energyLevel: number; // 0-100
  sleepHours: number;
  waterIntake: number;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  timestamp: string;
  type: 'user' | 'ai';
  content: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
}
