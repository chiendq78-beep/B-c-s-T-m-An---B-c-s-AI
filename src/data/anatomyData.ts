// Comprehensive Clinical Anatomy Database covering 12 Systems, Spine & Senses
import { 
  Bone, 
  Dumbbell, 
  Zap, 
  Heart, 
  Wind, 
  Utensils, 
  Droplets, 
  Activity, 
  ShieldCheck, 
  Users, 
  Sparkles, 
  Eye, 
  GitCommit
} from 'lucide-react';

export interface OrganSystemMeta {
  id: string;
  code: string;
  name: string;
  name_en: string;
  description: string;
  color: string;
  bgLight: string;
  borderColor: string;
  iconName: string;
  Icon: any;
}

export interface AnatomyStructureItem {
  name: string;
  detail: string;
}

export interface AnatomyPartData {
  id: string;
  code: string;
  name_vi: string;
  name_latin?: string;
  name_en?: string;
  systemId: string;
  gender?: 'male' | 'female' | 'both';
  category?: 'head' | 'chest' | 'abdomen' | 'spine' | 'limbs' | 'pelvis' | 'general';
  
  // ① Definition
  definition: string;
  
  // ② Location
  location: string;
  
  // ③ Visuals
  illustrationUrl: string;
  model3dUrl?: string;
  
  // ④ Basic Structure
  structures: AnatomyStructureItem[];
  
  // ⑤ Biological Function
  functions: string[];
  
  // ⑥ Related Pathologies (Common & Critical)
  commonDiseases: string[];
  criticalDiseases: string[];
  
  // ⑦ Common Symptoms
  commonSymptoms: string[];
  
  // ⑧ Emergency Red Flags (When to see a doctor / 115 emergency)
  emergencyWarning: string;
  redFlags: string[];
  
  // ⑨ AI Prompt suggestions
  aiQuestionSuggestions: string[];
  
  // ⑩ Supporting Vietnamese Herbs & Lifestyle
  relatedHerbs: string[];
  healthTips: string[];
  
  // Coordinates on body diagram (% top, % left)
  hotspot?: { top: string; left: string };
  
  // For spine vertebrae specific details
  spineRegion?: 'cervical' | 'thoracic' | 'lumbar' | 'sacral_coccygeal';
  vertebraCode?: string;
  innervations?: string;
}

export const ORGAN_SYSTEMS_LIST: OrganSystemMeta[] = [
  {
    id: 'SKELETAL',
    code: 'SKELETAL',
    name: '01. Hệ xương',
    name_en: 'Skeletal System',
    description: 'Hộp sọ, cột sống, lồng ngực, chi trên, chi dưới và khung chậu.',
    color: 'text-stone-700 dark:text-stone-300',
    bgLight: 'bg-stone-100 text-stone-800 border-stone-300',
    borderColor: 'border-stone-400',
    iconName: 'Bone',
    Icon: Bone
  },
  {
    id: 'MUSCULAR',
    code: 'MUSCULAR',
    name: '02. Hệ cơ',
    name_en: 'Muscular System',
    description: 'Hệ cơ đầu mặt, cơ cổ, ngực, bụng, lưng, vai, cánh tay, đùi, bắp chân.',
    color: 'text-rose-700 dark:text-rose-400',
    bgLight: 'bg-rose-50 text-rose-800 border-rose-200',
    borderColor: 'border-rose-400',
    iconName: 'Dumbbell',
    Icon: Dumbbell
  },
  {
    id: 'NERVOUS',
    code: 'NERVOUS',
    name: '03. Hệ thần kinh',
    name_en: 'Nervous System',
    description: 'Thần kinh trung ương (Não bộ, tủy sống) & Thần kinh ngoại biên.',
    color: 'text-amber-700 dark:text-amber-400',
    bgLight: 'bg-amber-50 text-amber-800 border-amber-200',
    borderColor: 'border-amber-400',
    iconName: 'Zap',
    Icon: Zap
  },
  {
    id: 'CARDIOVASCULAR',
    code: 'CARDIOVASCULAR',
    name: '04. Hệ tuần hoàn',
    name_en: 'Cardiovascular System',
    description: 'Trái tim, 4 buồng tim, hệ thống van tim, động mạch, tĩnh mạch, mao mạch.',
    color: 'text-red-700 dark:text-red-400',
    bgLight: 'bg-red-50 text-red-800 border-red-200',
    borderColor: 'border-red-400',
    iconName: 'Heart',
    Icon: Heart
  },
  {
    id: 'RESPIRATORY',
    code: 'RESPIRATORY',
    name: '05. Hệ hô hấp',
    name_en: 'Respiratory System',
    description: 'Mũi, hầu, thanh quản, khí quản, phế quản, phổi, phế nang và cơ hoành.',
    color: 'text-sky-700 dark:text-sky-400',
    bgLight: 'bg-sky-50 text-sky-800 border-sky-200',
    borderColor: 'border-sky-400',
    iconName: 'Wind',
    Icon: Wind
  },
  {
    id: 'DIGESTIVE',
    code: 'DIGESTIVE',
    name: '06. Hệ tiêu hóa',
    name_en: 'Digestive System',
    description: 'Miệng, thực quản, dạ dày, ruột non, ruột già, gan, túi mật và tuyến tụy.',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgLight: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    borderColor: 'border-emerald-400',
    iconName: 'Utensils',
    Icon: Utensils
  },
  {
    id: 'URINARY',
    code: 'URINARY',
    name: '07. Hệ tiết niệu',
    name_en: 'Urinary System',
    description: 'Thận phải, thận trái, niệu quản, bàng quang, niệu đạo và nephron.',
    color: 'text-cyan-700 dark:text-cyan-400',
    bgLight: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    borderColor: 'border-cyan-400',
    iconName: 'Droplets',
    Icon: Droplets
  },
  {
    id: 'ENDOCRINE',
    code: 'ENDOCRINE',
    name: '08. Hệ nội tiết',
    name_en: 'Endocrine System',
    description: 'Tuyến yên, tuyến tùng, tuyến giáp, tuyến thượng thận, tuyến tụy nội tiết.',
    color: 'text-purple-700 dark:text-purple-400',
    bgLight: 'bg-purple-50 text-purple-800 border-purple-200',
    borderColor: 'border-purple-400',
    iconName: 'Activity',
    Icon: Activity
  },
  {
    id: 'IMMUNE_LYMPHATIC',
    code: 'IMMUNE_LYMPHATIC',
    name: '09. Hệ miễn dịch',
    name_en: 'Immune & Lymphatic System',
    description: 'Hạch bạch huyết, mạch bạch huyết, lách, tuyến ức, amidan và tủy xương.',
    color: 'text-teal-700 dark:text-teal-400',
    bgLight: 'bg-teal-50 text-teal-800 border-teal-200',
    borderColor: 'border-teal-400',
    iconName: 'ShieldCheck',
    Icon: ShieldCheck
  },
  {
    id: 'REPRODUCTIVE',
    code: 'REPRODUCTIVE',
    name: '10. Hệ sinh sản (Nam & Nữ)',
    name_en: 'Reproductive System',
    description: 'Sinh sản nam (tinh hoàn, tuyến tiền liệt...) & Nữ (tử cung, buồng trứng...).',
    color: 'text-pink-700 dark:text-pink-400',
    bgLight: 'bg-pink-50 text-pink-800 border-pink-200',
    borderColor: 'border-pink-400',
    iconName: 'Users',
    Icon: Users
  },
  {
    id: 'INTEGUMENTARY',
    code: 'INTEGUMENTARY',
    name: '11. Hệ da',
    name_en: 'Integumentary System',
    description: 'Biểu bì, trung bì, hạ bì, nang lông, móng, tuyến mồ hôi và tuyến bã nhờn.',
    color: 'text-orange-700 dark:text-orange-400',
    bgLight: 'bg-orange-50 text-orange-800 border-orange-200',
    borderColor: 'border-orange-400',
    iconName: 'Sparkles',
    Icon: Sparkles
  },
  {
    id: 'SPECIAL_SENSES',
    code: 'SPECIAL_SENSES',
    name: '12. Giác quan',
    name_en: 'Sensory Organs',
    description: 'Thị giác (Mắt), Thính giác (Tai), Khứu giác (Mũi), Vị giác (Lưỡi) & Xúc giác.',
    color: 'text-indigo-700 dark:text-indigo-400',
    bgLight: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    borderColor: 'border-indigo-400',
    iconName: 'Eye',
    Icon: Eye
  }
];

export { ANATOMY_PARTS_DATABASE as ALL_ANATOMY_PARTS } from './anatomyPartsDB';
