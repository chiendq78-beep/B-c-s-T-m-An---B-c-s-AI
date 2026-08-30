import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Sparkles, 
  Leaf, 
  Heart, 
  Calendar, 
  Clock, 
  Flame, 
  Droplets, 
  Moon, 
  Zap, 
  Smile, 
  RefreshCw, 
  Copy, 
  Check, 
  Plus, 
  ChevronRight, 
  AlertCircle, 
  BookOpen, 
  Share2, 
  Bookmark, 
  CheckCircle2, 
  MessageSquare,
  Activity,
  ShieldCheck,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { suggestHerbsForSymptoms } from '../services/gemini';
import JournalEntryModal from './JournalEntryModal';

export interface SymptomHerb {
  id: string;
  name_vi: string;
  name_scientific: string;
  family: string;
  image: string;
  nature: string; // Tính vị quy kinh
  matchedSymptoms: string[];
  mechanism: string; // Lý do đề xuất
  remedyTitle: string;
  ingredients: string[];
  preparation: string[];
  dosage: string;
  bestTime: string;
  precautions: string;
  lifestyleTip: string;
}

// Built-in comprehensive Vietnamese traditional medicine remedy registry
const VIETNAMESE_SYMPTOM_HERBS: SymptomHerb[] = [
  {
    id: 'tia-to-cam-sot',
    name_vi: 'Tía tô (Tử tô)',
    name_scientific: 'Perilla frutescens',
    family: 'Hoa môi (Lamiaceae)',
    image: 'https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?auto=format&fit=crop&q=80&w=600',
    nature: 'Vị cay, tính ấm, quy kinh Phế và Tỳ',
    matchedSymptoms: ['Cảm cúm / Sốt nhẹ', 'Ho / Rát họng', 'Ớn lạnh'],
    mechanism: 'Phát tán phong hàn, tuyên thông phế khí, làm ra mồ hôi giải độc và hạ sốt nhẹ nhanh chóng.',
    remedyTitle: 'Cháo hành tía tô giải cảm tán hàn',
    ingredients: ['1 nắm lá tía tô tươi (20g)', '3 nhánh hành hoa cả rễ', '1 củ gừng nhỏ thái sợi', '1 bát cháo trắng nóng'],
    preparation: [
      'Lá tía tô và hành hoa rửa sạch, thái nhỏ mịn.',
      'Múc cháo trắng đang sôi sùng sục ra bát, trộn đều tía tô, hành hoa và gừng tươi.',
      'Ăn khi còn nóng hổi, sau đó nằm đắp chăn mỏng cho toát mồ hôi nhẹ rồi lau khô.'
    ],
    dosage: 'Ăn 1-2 lần/ngày khi mới chớm cảm lạnh.',
    bestTime: 'Buổi sáng sớm hoặc buổi tối trước khi nghỉ ngơi.',
    precautions: 'Người biểu hư tự ra mồ hôi nhiều (không do cảm mạo) nên hạn chế dùng nhiều.',
    lifestyleTip: 'Tránh tắm nước lạnh, giữ ấm cổ ngực và uống nhiều nước ấm.'
  },
  {
    id: 'lac-tien-mat-ngu',
    name_vi: 'Lạc tiên (Cây nhãn lồng)',
    name_scientific: 'Passiflora foetida',
    family: 'Lạc tiên (Passifloraceae)',
    image: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=600',
    nature: 'Vị ngọt nhạt, tính mát, quy kinh Tâm và Can',
    matchedSymptoms: ['Mất ngủ / Khó ngủ', 'Căng thẳng / Lo âu', 'Ngủ chập chờn'],
    mechanism: 'Thanh tâm, an thần, giải nhiệt độc, làm dịu hệ thần kinh trung ương và hỗ trợ đi vào giấc ngủ sâu tự nhiên.',
    remedyTitle: 'Trà thảo mộc Lạc Tiên Tâm Sen an thần',
    ingredients: ['15g ngọn lạc tiên khô (hoặc 30g tươi)', '3g tâm sen sao vàng', '5g lá vông nem (tùy chọn)', '500ml nước sôi'],
    preparation: [
      'Rửa sạch lạc tiên và tâm sen qua nước ấm.',
      'Cho vào ấm trà, tráng qua 1 lượt nước sôi 10 giây.',
      'Hãm với 500ml nước sôi 95°C trong 15-20 phút, uống ấm từng ngụm nhỏ.'
    ],
    dosage: 'Uống 1 ấm trà vào buổi tối.',
    bestTime: 'Uống trước khi đi ngủ khoảng 45-60 phút.',
    precautions: 'Người huyết áp quá thấp nên gia giảm thêm 2 lát gừng mỏng.',
    lifestyleTip: 'Tắt màn hình điện thoại 30 phút trước ngủ, kết hợp ngâm chân nước ấm có chút muối hột.'
  },
  {
    id: 'dinh-lang-met-moi',
    name_vi: 'Đinh lăng (Nam dương sâm)',
    name_scientific: 'Polyscias fruticosa',
    family: 'Ngũ gia bì (Araliaceae)',
    image: 'https://images.unsplash.com/photo-1628156108169-c09e33454652?auto=format&fit=crop&q=80&w=600',
    nature: 'Vị ngọt nhạt, hơi đắng, tính mát, bổ khí huyết',
    matchedSymptoms: ['Mệt mỏi / Kiệt sức', 'Suy nhược / Thiếu năng lượng', 'Chóng mặt'],
    mechanism: 'Chứa saponin giống nhân sâm, giúp tăng sức dẻo dai cơ thể, bổ huyết, kích hoạt lưu thông tuần hoàn và phục hồi thể lực.',
    remedyTitle: 'Nước hãm lá Đinh Lăng bồi bổ sinh lực',
    ingredients: ['20g lá đinh lăng tươi hoặc 10g lá khô', '3 quả táo đỏ cắt lát', '500ml nước lọc'],
    preparation: [
      'Lá đinh lăng rửa sạch, vò nhẹ cho dậy mùi thơm thảo mộc.',
      'Đun sôi nước với táo đỏ trong 5 phút, sau đó thả lá đinh lăng vào hãm nhỏ lửa 10 phút.',
      'Uống thay trà trong ngày khi còn ấm.'
    ],
    dosage: 'Dùng 1 bình nước hãm trong ngày, không uống quá đặc vào ban đêm.',
    bestTime: 'Uống vào buổi sáng hoặc đầu giờ chiều sau ăn 30 phút.',
    precautions: 'Không dùng liều cao kéo dài do saponin có thể gây cảm giác say nhẹ.',
    lifestyleTip: 'Tập bài hít thở sâu dưỡng sinh 10 phút để oxy hóa tế bào và tăng chuyển hóa.'
  },
  {
    id: 'gung-tuoi-tieu-hoa',
    name_vi: 'Gừng tươi (Sinh khương)',
    name_scientific: 'Zingiber officinale',
    family: 'Gừng (Zingiberaceae)',
    image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&q=80&w=600',
    nature: 'Vị cay, tính ấm, quy kinh Phế, Tỳ, Vị',
    matchedSymptoms: ['Đầy bụng / Khó tiêu', 'Lạnh bụng / Buồn nôn', 'Đau bụng âm ỉ'],
    mechanism: 'Ôn trung tán hàn, hồi phục tỳ vị khí trệ, kích thích enzyme tiêu hóa bài tiết và làm dịu co thắt dạ dày ruột.',
    remedyTitle: 'Trà Gừng Tươi Mật Ong & Vỏ Quýt (Trần bì)',
    ingredients: ['1 củ gừng tươi cạo vỏ thái 4-5 lát mỏng đập dập', '2 thìa cà phê mật ong rừng', '3g trần bì (vỏ quýt khô)', '300ml nước sôi'],
    preparation: [
      'Cho gừng đập dập và trần bì vào cốc thủy tinh.',
      'Rót 300ml nước sôi 100°C đậy nắp hãm 10 phút cho thôi chất cay ấm.',
      'Khi nước còn ấm khoảng 45°C thì khuấy đều mật ong và thưởng thức chậm rãi.'
    ],
    dosage: '1-2 cốc mỗi ngày sau bữa ăn no.',
    bestTime: 'Uống ngay sau khi ăn no cảm thấy ậm ạch, hoặc buổi sáng thức dậy.',
    precautions: 'Người nhiệt miệng dữ dội, đau dạ dày cấp loét nặng không nên uống quá cay.',
    lifestyleTip: 'Tránh ăn thức ăn nhiều dầu mỡ chiên xào, xoa bụng nhẹ nhàng theo chiều kim đồng hồ quanh rốn.'
  },
  {
    id: 'ngai-cuu-dau-khop',
    name_vi: 'Ngải cứu (Ngải diệp)',
    name_scientific: 'Artemisia vulgaris',
    family: 'Cúc (Asteraceae)',
    image: 'https://images.unsplash.com/photo-1515589654462-a9881e276b8a?auto=format&fit=crop&q=80&w=600',
    nature: 'Vị đắng cay, tính ấm, quy kinh Can, Tỳ, Thận',
    matchedSymptoms: ['Đau mỏi cơ khớp', 'Đau đầu phong hàn', 'Nhức mỏi vai gáy'],
    mechanism: 'Trừ phong thấp, thông kinh hoạt lạc, ấm kinh chỉ thống (giảm đau), trục ứ huyết ứ trệ do ẩm lạnh.',
    remedyTitle: 'Chườm Ngải Cứu sao muối hột ấm huyệt',
    ingredients: ['1 bó ngải cứu già (100g)', '200g muối hạt to', '1 củ gừng đập dập', '1 khăn vải cotton sạch'],
    preparation: [
      'Ngải cứu rửa sạch, để ráo nước rồi cắt khúc ngắn.',
      'Cho ngải cứu, gừng và muối hạt vào chảo sao nóng đảo đều tay đến khi bốc khói thơm nồng.',
      'Trút hỗn hợp vào khăn cotton buộc chặt, chườm và lăn nhẹ lên vùng đau nhức (vai gáy, thắt lưng, đầu gối).'
    ],
    dosage: 'Chườm 15-20 phút mỗi tối, khi nguội có thể sao nóng lại 1 lần.',
    bestTime: 'Buổi chiều tối sau khi tắm hoặc trước khi đi ngủ.',
    precautions: 'Kiểm tra độ nóng khăn trước khi áp vào da để tránh bị bỏng nhiệt.',
    lifestyleTip: 'Tránh ngồi trước quạt gió thẳng lưng, kết hợp bài tập xoay cổ vai nhẹ nhàng.'
  },
  {
    id: 'hung-chanh-ho-rat-hong',
    name_vi: 'Húng chanh (Tần dày lá)',
    name_scientific: 'Coleus amboinicus',
    family: 'Hoa môi (Lamiaceae)',
    image: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=600',
    nature: 'Vị chua the, tính ấm, mùi thơm hăng dịu',
    matchedSymptoms: ['Ho / Rát họng', 'Đờm nhiều / Khản tiếng', 'Viêm họng nhẹ'],
    mechanism: 'Chứa tinh dầu carvacrol và colein kháng khuẩn mạnh vùng họng hầu, tiêu đờm loãng, giảm kích ứng niêm mạc.',
    remedyTitle: 'Húng chanh chưng đường phèn & quất',
    ingredients: ['15 lá húng chanh tươi rửa sạch', '3 quả quất xanh cắt đôi bỏ hạt', '15g đường phèn (hoặc 2 thìa mật ong)'],
    preparation: [
      'Lá húng chanh thái nhỏ, cho vào chén sứ cùng quất và đường phèn.',
      'Hấp cách thủy trong 15-20 phút đến khi đường tan hết và quất mềm nhừ.',
      'Chắt lấy nước cốt ngậm nuốt từ từ từng ngụm nhỏ, có thể nhai cả bã lá.'
    ],
    dosage: 'Dùng 2-3 thìa cà phê mỗi lần, ngày 3 lần.',
    bestTime: 'Sau ăn 30 phút hoặc khi cơn ho ngứa cổ xuất hiện.',
    precautions: 'Trẻ sơ sinh dưới 1 tuổi dùng đường phèn, không dùng mật ong.',
    lifestyleTip: 'Súc họng nước muối sinh lý ấm ngày 3 lần, tránh ăn đồ lạnh có đá.'
  },
  {
    id: 'san-day-nong-trong',
    name_vi: 'Cát căn (Củ sắn dây)',
    name_scientific: 'Pueraria lobata',
    family: 'Đậu (Fabaceae)',
    image: 'https://images.unsplash.com/photo-1615485925602-4836978a5175?auto=format&fit=crop&q=80&w=600',
    nature: 'Vị ngọt cay, tính mát, quy kinh Tỳ và Vị',
    matchedSymptoms: ['Nóng trong / Nhiệt miệng', 'Khát nước / Khô cổ', 'Táo bón nhẹ'],
    mechanism: 'Thanh nhiệt giải cơ, sinh tân chỉ khát, làm mát huyết giải độc và làm dịu nội nhiệt bốc hỏa.',
    remedyTitle: 'Bột sắn dây quấy chín thanh nhiệt bổ tỳ',
    ingredients: ['2 thìa canh bột sắn dây nguyên chất (20g)', '200ml nước lọc', '1 thìa nhỏ đường phèn hoặc mật ong', 'Nửa quả chanh'],
    preparation: [
      'Hòa tan hoàn toàn bột sắn dây trong nước nguội trước khi đun.',
      'Đặt lên bếp khuấy đều tay lửa nhỏ đến khi bột chuyển sang màu trong suốt sánh mịn.',
      'Tắt bếp, để nguội bớt, vắt vài giọt chanh tươi tăng vị thanh mát.'
    ],
    dosage: 'Ăn 1 bát ấm/ngày.',
    bestTime: 'Bữa phụ buổi chiều từ 14h - 16h.',
    precautions: 'Người đang bị cảm lạnh chân tay lạnh buốt không nên ăn nhiều.',
    lifestyleTip: 'Uống đủ 2L nước mỗi ngày, ăn tăng cường rau xanh có tính mát như mồng tơi, rau má.'
  }
];

const COMMON_SYMPTOM_TAGS = [
  { label: 'Cảm sốt / ớn lạnh', icon: Flame, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { label: 'Ho / Rát họng', icon: Volume2, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  { label: 'Mệt mỏi / Kiệt sức', icon: Zap, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  { label: 'Mất ngủ / Lo âu', icon: Moon, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  { label: 'Đầy bụng / Khó tiêu', icon: Droplets, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { label: 'Đau mỏi cơ khớp', icon: Activity, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { label: 'Nóng trong / Nhiệt', icon: AlertCircle, color: 'text-red-400 bg-red-500/10 border-red-500/20' }
];

export default function DailySymptomHerbSuggestions() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [todayJournal, setTodayJournal] = useState<any | null>(null);
  const [todayVitals, setTodayVitals] = useState<any | null>(null);
  
  // Active selected symptoms (derived from today's journal + user toggles)
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  
  // AI Consultation States
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiCustomSuggestion, setAiCustomSuggestion] = useState<any | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Copy & Bookmark states
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedHerbIds, setSavedHerbIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('savedDailyHerbs');
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Fetch today's health journal and vitals from Firestore
  const fetchTodayData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      // Query today's journals
      const journalsQuery = query(
        collection(db, 'healthJournals'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );

      const journalSnap = await getDocs(journalsQuery);
      const journalList = journalSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Find the entry from today (or the latest entry if created recently)
      const todayEntry: any = journalList.find((item: any) => {
        if (!item.createdAt) return false;
        const date = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
        return date >= startOfToday;
      }) || (journalList.length > 0 ? journalList[0] : null);

      if (todayEntry) {
        setTodayJournal(todayEntry);
        
        // Auto-extract symptoms from notes, mood, energy, sleep
        const detected: string[] = [];
        const noteLower = (todayEntry.notes || '').toLowerCase();
        
        if (noteLower.includes('cảm') || noteLower.includes('sốt') || noteLower.includes('lạnh')) {
          detected.push('Cảm cúm / Sốt nhẹ');
        }
        if (noteLower.includes('ho') || noteLower.includes('họng') || noteLower.includes('đờm')) {
          detected.push('Ho / Rát họng');
        }
        if (noteLower.includes('mệt') || noteLower.includes('suy nhược') || todayEntry.energy === 'Kiệt quệ' || todayEntry.energy === 'Bình thường') {
          detected.push('Mệt mỏi / Kiệt sức');
        }
        if (noteLower.includes('ngủ') || noteLower.includes('thức') || noteLower.includes('lo') || (todayEntry.sleep && todayEntry.sleep < 6)) {
          detected.push('Mất ngủ / Khó ngủ');
        }
        if (noteLower.includes('bụng') || noteLower.includes('tiêu') || noteLower.includes('no') || noteLower.includes('dạ dày')) {
          detected.push('Đầy bụng / Khó tiêu');
        }
        if (noteLower.includes('khớp') || noteLower.includes('đau lưng') || noteLower.includes('mỏi') || noteLower.includes('gáy')) {
          detected.push('Đau mỏi cơ khớp');
        }
        if (noteLower.includes('nóng') || noteLower.includes('nhiệt') || (todayEntry.water && todayEntry.water < 3)) {
          detected.push('Nóng trong / Nhiệt miệng');
        }

        // If no text symptoms matched, infer from mood / energy
        if (detected.length === 0) {
          if (todayEntry.energy === 'Kiệt quệ') detected.push('Mệt mỏi / Kiệt sức');
          if (todayEntry.mood === 'Căng thẳng') detected.push('Mất ngủ / Khó ngủ');
          if (todayEntry.sleep && todayEntry.sleep <= 5) detected.push('Mất ngủ / Khó ngủ');
          if (todayEntry.water && todayEntry.water <= 3) detected.push('Nóng trong / Nhiệt miệng');
        }

        setSelectedSymptoms(detected.length > 0 ? detected : ['Mệt mỏi / Kiệt sức']);
      } else {
        // Default to a friendly starter symptom
        setSelectedSymptoms(['Mệt mỏi / Kiệt sức']);
      }

      // Query latest vitals if available
      try {
        const vitalsQuery = query(
          collection(db, 'vitals'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const vitalsSnap = await getDocs(vitalsQuery);
        if (!vitalsSnap.empty) {
          setTodayVitals(vitalsSnap.docs[0].data());
        }
      } catch (err) {
        console.warn("Could not load vitals:", err);
      }

    } catch (error) {
      console.error("Error loading daily symptoms for herbs:", error);
      // Fallback
      setSelectedSymptoms(['Mệt mỏi / Kiệt sức']);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTodayData();
  }, [fetchTodayData]);

  // Filter matched herbs from our curated repository
  const matchedHerbs = useMemo(() => {
    if (selectedSymptoms.length === 0) {
      return VIETNAMESE_SYMPTOM_HERBS.slice(0, 2);
    }

    const results: SymptomHerb[] = [];
    const matchedSet = new Set<string>();

    // Priority match on selected symptoms
    VIETNAMESE_SYMPTOM_HERBS.forEach(herb => {
      const isMatch = herb.matchedSymptoms.some(s => 
        selectedSymptoms.some(sel => sel.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(sel.toLowerCase()))
      );
      if (isMatch && !matchedSet.has(herb.id)) {
        matchedSet.add(herb.id);
        results.push(herb);
      }
    });

    // If still empty, add default general tonics
    if (results.length === 0) {
      results.push(VIETNAMESE_SYMPTOM_HERBS[0], VIETNAMESE_SYMPTOM_HERBS[2]);
    }

    return results;
  }, [selectedSymptoms]);

  // Toggle symptom tag
  const toggleSymptom = (label: string) => {
    setSelectedSymptoms(prev => {
      if (prev.includes(label)) {
        const updated = prev.filter(s => s !== label);
        return updated.length > 0 ? updated : ['Mệt mỏi / Kiệt sức'];
      } else {
        return [...prev, label];
      }
    });
  };

  // Deep AI Synthesis with Gemini
  const triggerAiConsultation = async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const response = await suggestHerbsForSymptoms({
        symptoms: selectedSymptoms,
        mood: todayJournal?.mood,
        energy: todayJournal?.energy,
        sleep: todayJournal?.sleep,
        notes: todayJournal?.notes,
        vitals: todayVitals
      });

      const parsed = typeof response === 'string' ? JSON.parse(response) : response;
      setAiCustomSuggestion(parsed);
    } catch (err: any) {
      console.error("Failed AI herb suggestion:", err);
      setAiError("Không thể kết nối Trợ lý AI Bác sĩ Tâm An lúc này. Dữ liệu đang hiển thị theo phác đồ Đông Y chuẩn mực.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Copy remedy text to clipboard
  const handleCopyRemedy = (herb: SymptomHerb) => {
    const text = `🌿 BÀI THUỐC ĐÔNG Y DỰA TRÊN TRIỆU CHỨNG HÔM NAY:\n` +
      `• Vị thuốc chính: ${herb.name_vi} (${herb.name_scientific})\n` +
      `• Tính vị quy kinh: ${herb.nature}\n` +
      `• Bài thuốc: ${herb.remedyTitle}\n` +
      `• Thành phần: ${herb.ingredients.join(', ')}\n` +
      `• Chế biến:\n${herb.preparation.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}\n` +
      `• Liều dùng & Thời điểm: ${herb.dosage} (${herb.bestTime})\n` +
      `• Lưu ý: ${herb.precautions}\n` +
      `• Dưỡng sinh: ${herb.lifestyleTip}`;

    navigator.clipboard.writeText(text);
    setCopiedId(herb.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Toggle bookmarking
  const toggleBookmark = (herbId: string) => {
    setSavedHerbIds(prev => {
      let updated: string[];
      if (prev.includes(herbId)) {
        updated = prev.filter(id => id !== herbId);
      } else {
        updated = [...prev, herbId];
      }
      try {
        localStorage.setItem('savedDailyHerbs', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  return (
    <section 
      id="daily-symptom-herb-suggestions-panel"
      className="bg-panel rounded-3xl p-6 border border-border shadow-2xl space-y-6 relative overflow-hidden group"
    >
      {/* Decorative Glow */}
      <div className="absolute -left-20 -top-20 w-52 h-52 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 w-52 h-52 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Status */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-primary/20 text-primary border border-primary/30 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3 h-3 text-primary animate-pulse" />
              Cá nhân hóa theo ngày
            </span>
            <span className="text-[10px] text-text-dim font-mono">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          </div>
          <h3 className="font-serif text-2xl font-bold text-white flex items-center gap-2.5">
            <Leaf className="w-6 h-6 text-primary" />
            Gợi Ý Dược Liệu & Bài Thuốc Hôm Nay
          </h3>
          <p className="text-xs text-text-dim font-light leading-relaxed">
            Dựa trên biểu hiện thể trạng và triệu chứng bạn đã ghi nhận trong ngày.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            id="btn-trigger-journal-modal"
            type="button"
            onClick={() => setIsJournalModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
            title="Ghi nhật ký hoặc cập nhật triệu chứng mới"
          >
            <Plus className="w-3.5 h-3.5 text-primary" />
            <span>{todayJournal ? 'Cập nhật nhật ký' : 'Ghi triệu chứng'}</span>
          </button>
          
          <button
            id="btn-refresh-symptom-data"
            type="button"
            onClick={fetchTodayData}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-dim hover:text-white border border-white/10 transition-all active:scale-95 cursor-pointer"
            title="Làm mới dữ liệu từ nhật ký"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin text-primary")} />
          </button>
        </div>
      </div>

      {/* Today's Log Summary Strip */}
      <div className="relative z-10 bg-bg/50 border border-white/5 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-primary" />
            Dữ liệu thể trạng ghi nhận hôm nay:
          </span>
          {todayJournal ? (
            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Đã ghi nhận lúc {todayJournal.createdAt?.toDate ? todayJournal.createdAt.toDate().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'gần đây'}
            </span>
          ) : (
            <span className="text-[9px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Chưa lưu nhật ký - Đang dùng mẫu chọn nhanh
            </span>
          )}
        </div>

        {/* Status badges from today's journal */}
        {todayJournal && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/5 flex items-center gap-2">
              <Smile className="w-4 h-4 text-emerald-400" />
              <div className="min-w-0">
                <p className="text-[8px] text-text-dim uppercase">Tâm trạng</p>
                <p className="text-xs text-white font-medium truncate">{todayJournal.mood || 'Ổn định'}</p>
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/5 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <div className="min-w-0">
                <p className="text-[8px] text-text-dim uppercase">Năng lượng</p>
                <p className="text-xs text-white font-medium truncate">{todayJournal.energy || 'Khỏe mạnh'}</p>
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/5 flex items-center gap-2">
              <Moon className="w-4 h-4 text-indigo-400" />
              <div className="min-w-0">
                <p className="text-[8px] text-text-dim uppercase">Giấc ngủ</p>
                <p className="text-xs text-white font-medium">{todayJournal.sleep || 7} giờ</p>
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/5 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <div className="min-w-0">
                <p className="text-[8px] text-text-dim uppercase">Lượng nước</p>
                <p className="text-xs text-white font-medium">{todayJournal.water || 4} cốc</p>
              </div>
            </div>
          </div>
        )}

        {todayJournal?.notes && (
          <div className="text-xs text-white/80 bg-white/[0.03] p-3 rounded-xl border border-white/5 italic font-light">
            <span className="font-bold text-primary not-italic text-[10px] uppercase tracking-wider block mb-1">Ghi chú lời kể:</span>
            "{todayJournal.notes}"
          </div>
        )}

        {/* Quick Symptom Switcher Chips */}
        <div className="space-y-1.5 pt-1">
          <p className="text-[9px] font-bold text-text-dim uppercase tracking-wider">
            Chọn nhanh hoặc điều chỉnh triệu chứng cảm nhận được:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_SYMPTOM_TAGS.map((tag) => {
              const active = selectedSymptoms.some(s => s.toLowerCase().includes(tag.label.toLowerCase()) || tag.label.toLowerCase().includes(s.toLowerCase()));
              const Icon = tag.icon;
              return (
                <button
                  key={tag.label}
                  type="button"
                  onClick={() => toggleSymptom(tag.label)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-[11px] font-medium border transition-all flex items-center gap-1.5 cursor-pointer active:scale-95",
                    active 
                      ? "bg-primary text-bg font-bold border-primary shadow-[0_0_15px_rgba(45,212,191,0.3)] scale-[1.02]" 
                      : "bg-white/5 text-text-dim hover:text-white border-white/5 hover:border-white/15"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5", active ? "text-bg" : "")} />
                  <span>{tag.label}</span>
                  {active && <Check className="w-3 h-3 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Deep Analysis Trigger */}
      <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-primary/[0.04] border border-primary/20 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl medical-gradient flex items-center justify-center text-white shadow-md flex-shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Trợ lý AI Bác sĩ Tâm An Biện Chứng</h4>
            <p className="text-[11px] text-text-dim font-light">Tạo phác đồ bài thuốc Đông Y tùy biến chuyên sâu theo từng ghi chép cụ thể.</p>
          </div>
        </div>
        <button
          id="btn-ai-deep-herb-analysis"
          type="button"
          disabled={isAiLoading}
          onClick={triggerAiConsultation}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-bg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex-shrink-0"
        >
          {isAiLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Đang luận trị...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Phân tích AI chuyên sâu</span>
            </>
          )}
        </button>
      </div>

      {/* AI Result Card if generated */}
      <AnimatePresence>
        {aiCustomSuggestion && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-10 bg-slate-900/90 border border-teal-500/40 rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-teal-500/20 pb-3">
              <div className="flex items-center gap-2 text-teal-400">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-bold text-xs uppercase tracking-widest text-primary">Kết quả Biện chứng AI Bác sĩ Tâm An</span>
              </div>
              <button
                onClick={() => setAiCustomSuggestion(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-white/5 rounded-lg border border-white/5"
              >
                Đóng
              </button>
            </div>

            {aiCustomSuggestion.analysis && (
              <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 text-xs text-slate-200 leading-relaxed font-light">
                <span className="text-teal-400 font-bold text-[10px] uppercase tracking-wider block mb-1">Biện chứng luận trị Đông Y:</span>
                {aiCustomSuggestion.analysis}
              </div>
            )}

            {aiCustomSuggestion.recommendedHerbs?.map((herb: any, idx: number) => (
              <div key={idx} className="bg-bg/60 p-4 rounded-2xl border border-primary/20 space-y-3">
                <div className="flex items-baseline justify-between">
                  <h4 className="font-serif text-lg italic text-primary font-medium">{herb.name_vi} ({herb.name_scientific})</h4>
                  <span className="text-[9px] font-mono bg-white/5 px-2 py-0.5 rounded text-slate-300">{herb.nature}</span>
                </div>
                <p className="text-xs text-slate-300 font-light">{herb.mechanism}</p>
                <div className="bg-white/[0.02] p-3 rounded-xl border border-white/5 space-y-1.5 text-xs">
                  <p className="font-bold text-white flex items-center gap-1.5 text-xs">
                    <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                    {herb.remedyTitle}
                  </p>
                  <p className="text-slate-400 text-[11px]"><strong className="text-slate-300">Thành phần:</strong> {Array.isArray(herb.ingredients) ? herb.ingredients.join(', ') : herb.ingredients}</p>
                  <p className="text-slate-300 text-[11px]"><strong className="text-teal-400">Cách chế biến:</strong> {herb.preparation}</p>
                  <p className="text-slate-400 text-[11px]"><strong className="text-slate-300">Thời điểm dùng:</strong> {herb.bestTime} - Liều lượng: {herb.dosage}</p>
                  {herb.precautions && (
                    <p className="text-rose-300 text-[10px]"><strong className="text-rose-400">Lưu ý:</strong> {herb.precautions}</p>
                  )}
                </div>
              </div>
            ))}

            {aiCustomSuggestion.lifestyleTip && (
              <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span><strong>Dưỡng sinh bổ trợ:</strong> {aiCustomSuggestion.lifestyleTip}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {aiError && (
        <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
          {aiError}
        </p>
      )}

      {/* Suggested Herb Cards List */}
      <div className="relative z-10 space-y-5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            Các vị thuốc & Bài thuốc dân gian khuyên dùng:
          </span>
          <span className="text-[10px] text-text-dim font-medium">
            {matchedHerbs.length} vị thuốc phù hợp
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {matchedHerbs.map((herb) => {
            const isSaved = savedHerbIds.includes(herb.id);
            const isCopied = copiedId === herb.id;

            return (
              <div
                key={herb.id}
                className="bg-bg/40 border border-white/10 hover:border-primary/30 rounded-3xl p-5 md:p-6 transition-all space-y-5 shadow-xl relative overflow-hidden"
              >
                {/* Top Herb Banner */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  {/* Herb Image & Badge */}
                  <div className="md:col-span-4 h-48 md:h-auto min-h-[160px] rounded-2xl overflow-hidden relative border border-white/10 group">
                    <img 
                      src={herb.image} 
                      alt={herb.name_vi}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20" />
                    
                    <span className="absolute top-3 left-3 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-primary text-bg shadow-md">
                      Dược liệu tuyển chọn
                    </span>

                    <div className="absolute bottom-3 left-3 right-3 text-left">
                      <p className="text-[8px] font-mono font-bold text-primary uppercase tracking-widest">Họ thực vật</p>
                      <p className="text-xs text-white font-medium truncate">{herb.family}</p>
                    </div>
                  </div>

                  {/* Herb Info & Properties */}
                  <div className="md:col-span-8 flex flex-col justify-between space-y-3.5 text-left">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-baseline gap-2">
                            <h4 className="font-serif text-2xl italic font-light text-white group-hover:text-primary transition-colors">
                              {herb.name_vi}
                            </h4>
                            <span className="text-[10px] text-text-dim font-light font-mono px-2 py-0.5 border border-white/5 bg-white/[0.01] rounded-md">
                              {herb.name_scientific}
                            </span>
                          </div>
                          <p className="text-[11px] text-primary/90 font-medium mt-1">
                            {herb.nature}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleBookmark(herb.id)}
                            className={cn(
                              "p-2 rounded-xl border transition-all cursor-pointer",
                              isSaved 
                                ? "bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-md" 
                                : "bg-white/5 border-white/10 text-text-dim hover:text-white"
                            )}
                            title={isSaved ? "Đã lưu vào danh mục yêu thích" : "Lưu vào yêu thích"}
                          >
                            <Bookmark className="w-4 h-4" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleCopyRemedy(herb)}
                            className={cn(
                              "p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-xs",
                              isCopied 
                                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" 
                                : "bg-white/5 border-white/10 text-text-dim hover:text-white"
                            )}
                            title="Sao chép toàn bộ công thức bài thuốc"
                          >
                            {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Mechanism explanation */}
                      <div className="mt-3 bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 space-y-1">
                        <p className="text-[9px] font-bold text-text-dim uppercase tracking-wider">Cơ chế hỗ trợ theo triệu chứng:</p>
                        <p className="text-xs text-white/90 font-light leading-relaxed">
                          {herb.mechanism}
                        </p>
                      </div>
                    </div>

                    {/* Matched symptoms tags */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[9px] font-bold text-text-dim uppercase tracking-wider mr-1">Khắc phục:</span>
                      {herb.matchedSymptoms.map((sym, idx) => (
                        <span 
                          key={idx}
                          className="text-[9px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-lg"
                        >
                          {sym}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Remedy Details Box */}
                <div className="bg-panel border border-primary/20 rounded-2xl p-4 md:p-5 space-y-4 shadow-inner">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2 text-primary">
                      <Flame className="w-4 h-4 text-primary" />
                      <h5 className="font-serif text-base italic font-medium text-white">{herb.remedyTitle}</h5>
                    </div>
                    <span className="text-[9px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {herb.bestTime}
                    </span>
                  </div>

                  {/* Ingredients */}
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold text-text-dim uppercase tracking-wider">Thành phần phối ngũ:</p>
                    <div className="flex flex-wrap gap-2">
                      {herb.ingredients.map((ing, i) => (
                        <span key={i} className="text-[10px] bg-white/5 border border-white/10 text-white px-2.5 py-1 rounded-lg">
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Preparation steps */}
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold text-text-dim uppercase tracking-wider">Các bước thực hiện:</p>
                    <div className="space-y-1.5">
                      {herb.preparation.map((step, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs text-white/90 font-light">
                          <span className="w-4 h-4 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="leading-relaxed">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dosage & Precautions footer */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-white/5 text-[11px]">
                    <div className="flex items-center gap-2 text-text-dim">
                      <ShieldCheck className="w-4 h-4 text-teal-400 flex-shrink-0" />
                      <span><strong>Liều dùng:</strong> {herb.dosage}</span>
                    </div>
                    <div className="flex items-start gap-2 text-rose-300/90">
                      <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      <span><strong>Thận trọng:</strong> {herb.precautions}</span>
                    </div>
                  </div>
                </div>

                {/* Lifestyle & Wellness Tip */}
                <div className="bg-emerald-500/[0.03] border border-emerald-500/15 rounded-2xl p-3 flex items-start gap-2 text-xs text-emerald-200 font-light">
                  <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Lời khuyên dưỡng sinh hôm nay:</strong> {herb.lifestyleTip}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mount Journal Entry Modal */}
      <JournalEntryModal
        isOpen={isJournalModalOpen}
        onClose={() => setIsJournalModalOpen(false)}
        onSuccess={() => {
          fetchTodayData();
        }}
      />
    </section>
  );
}
