export type HerbNature = 'Hàn' | 'Lương' | 'Bình' | 'Ôn' | 'Nhiệt';
export type HerbTaste = 'Ngọt' | 'Cay' | 'Đắng' | 'Chua' | 'Mặn' | 'Chát';
export type HerbMeridian = 
  | 'Phế' 
  | 'Tỳ' 
  | 'Vị' 
  | 'Tâm' 
  | 'Can' 
  | 'Thận' 
  | 'Đởm' 
  | 'Bàng quang' 
  | 'Đại tràng' 
  | 'Tiểu tràng' 
  | 'Tam tiêu' 
  | 'Tâm bào' 
  | '12 đường kinh';

export interface HerbClassicFormula {
  name: string;
  indication: string;
  composition: string[];
  usage: string;
}

export interface HerbItem {
  id: string;
  name_vi: string;
  name_en?: string;
  name_scientific: string;
  family: string;
  partUsed: string;
  groupId: 'bo-khi' | 'giai-bieu' | 'an-than' | 'tru-thap' | 'thanh-nhiet' | 'nhuan-phe' | 'hoat-huyet';
  groupName: string;
  nature: HerbNature; // Tính: Hàn, Lương, Bình, Ôn, Nhiệt
  tastes: HerbTaste[]; // Vị: Ngọt, Cay, Đắng, Chua, Mặn, Chát
  meridians: HerbMeridian[]; // Quy kinh
  summaryAction: string; // Tóm tắt tác dụng & chủ trị
  detailedActions: string[]; // Chi tiết công năng
  matchedSymptoms: string[]; // Triệu chứng tương thích
  dosage: string; // Liều lượng thông thường
  preparationTip: string; // Cách chế biến cổ truyền
  contraindications: string[]; // Kiêng kỵ & Chống chỉ định
  classicFormulas: HerbClassicFormula[]; // Bài thuốc phối ngũ kinh điển
  image: string;
}

export interface HerbCategoryGroup {
  id: string;
  name: string;
  shortName: string;
  description: string;
  iconName: string;
  matchedConditions: string;
}

export const HERB_GROUPS: HerbCategoryGroup[] = [
  {
    id: 'all',
    name: 'Tất cả vị thuốc',
    shortName: 'Tất cả',
    description: 'Toàn bộ dược liệu cổ truyền trong kho tàng Đông y',
    iconName: 'Sparkles',
    matchedConditions: 'Đa dạng thể trạng'
  },
  {
    id: 'bo-khi',
    name: 'Nhóm Bổ khí - Bổ dưỡng',
    shortName: 'Bổ khí dưỡng thể',
    description: 'Tăng cường thể lực, bồi bổ nguyên khí, giảm kiệt sức và suy nhược',
    iconName: 'Zap',
    matchedConditions: 'Mệt mỏi / Kiệt sức, Suy nhược cơ thể'
  },
  {
    id: 'giai-bieu',
    name: 'Nhóm Giải biểu - Phát tán',
    shortName: 'Giải biểu phát tán',
    description: 'Phát hãn giải cảm, tán phong hàn hoặc phong nhiệt, thông đường thở',
    iconName: 'Wind',
    matchedConditions: 'Cảm sốt / Ớn lạnh, Ho / Rát họng'
  },
  {
    id: 'an-than',
    name: 'Nhóm An thần - Bổ tâm',
    shortName: 'An thần dưỡng tâm',
    description: 'Dưỡng tâm định chí, giảm lo âu bồn chồn, điều trị mất ngủ',
    iconName: 'Moon',
    matchedConditions: 'Mất ngủ / Lo âu, Hồi hộp giật mình'
  },
  {
    id: 'tru-thap',
    name: 'Nhóm Trừ thấp - Hành khí',
    shortName: 'Trừ thấp hành khí',
    description: 'Kiện tỳ tiêu thực, trừ ẩm thấp kinh lạc, giảm đầy trướng và nhức mỏi',
    iconName: 'Droplets',
    matchedConditions: 'Đầy bụng / Khó tiêu, Đau mỏi cơ khớp'
  },
  {
    id: 'thanh-nhiet',
    name: 'Nhóm Thanh nhiệt - Hạ hỏa',
    shortName: 'Thanh nhiệt hạ hỏa',
    description: 'Làm mát cơ thể, giải độc, thanh phế can thận nhiệt, trị nhiệt miệng',
    iconName: 'Flame',
    matchedConditions: 'Nóng trong / Nhiệt, Táo bón do nhiệt'
  }
];

export const SYMPTOM_FILTER_TAGS = [
  { id: 'all', label: 'Tất cả', count: 20 },
  { id: 'met-moi', label: 'Mệt mỏi / Kiệt sức', symptom: 'Mệt mỏi / Kiệt sức', color: 'from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-300' },
  { id: 'cam-sot', label: 'Cảm sốt / Ớn lạnh', symptom: 'Cảm sốt / Ớn lạnh', color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/40 text-blue-300' },
  { id: 'mat-ngu', label: 'Mất ngủ / Lo âu', symptom: 'Mất ngủ / Lo âu', color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/40 text-purple-300' },
  { id: 'day-bung', label: 'Đầy bụng / Khó tiêu', symptom: 'Đầy bụng / Khó tiêu', color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-300' },
  { id: 'nong-trong', label: 'Nóng trong / Nhiệt miệng', symptom: 'Nóng trong / Nhiệt miệng', color: 'from-rose-500/20 to-red-500/20 border-rose-500/40 text-rose-300' },
  { id: 'dau-khop', label: 'Đau mỏi cơ khớp', symptom: 'Đau mỏi cơ khớp', color: 'from-teal-500/20 to-cyan-500/20 border-teal-500/40 text-teal-300' },
];

export const COMPREHENSIVE_HERBS: HerbItem[] = [
  // ==========================================
  // 1. NHÓM BỔ KHÍ - BỔ DƯỠNG
  // ==========================================
  {
    id: 'nhan-sam',
    name_vi: 'Nhân sâm',
    name_en: 'Asian Ginseng',
    name_scientific: 'Panax ginseng C.A. Mey',
    family: 'Ngũ gia bì (Araliaceae)',
    partUsed: 'Rễ củ phơi hoặc sấy khô',
    groupId: 'bo-khi',
    groupName: 'Bổ khí - Bổ dưỡng',
    nature: 'Ôn',
    tastes: ['Ngọt', 'Đắng'],
    meridians: ['Tỳ', 'Phế', 'Tâm'],
    summaryAction: 'Đại bổ nguyên khí, bổ tỳ ích phế, sinh tân (tạo dịch), an thần định chí.',
    detailedActions: [
      'Đại bổ nguyên khí trong các trường hợp chính khí suy kiệt, đoản khí hụt hơi, mạch vi dục tuyệt.',
      'Bổ tỳ ích phế, tăng cường vận hóa tỳ vị, giảm chứng ăn uống không tiêu, phân lỏng do tỳ hư.',
      'Sinh tân chỉ khát, làm dịu háo khát mất nước do sốt cao hao tổn tân dịch hoặc đái tháo đường.',
      'Dưỡng tâm an thần, cải thiện tình trạng mất ngủ, hay quên, hồi hộp lo âu do tâm khí bất túc.'
    ],
    matchedSymptoms: ['Mệt mỏi / Kiệt sức', 'Suy nhược cơ thể', 'Hụt hơi / Đoản khí', 'Tay chân lạnh', 'Mất ngủ / Lo âu'],
    dosage: '3 - 10g/ngày (sắc riêng, hấp cơm hoặc hãm trà dùng ấm)',
    preparationTip: 'Thái lát mỏng, ngậm tan dần hoặc hầm cách thủy với gà ác, linh chi bồi bổ.',
    contraindications: [
      'Người thực nhiệt, cao huyết áp cơn kịch phát, tai biến đang tiến triển.',
      'Cảm mạo phong nhiệt mới phát, sốt cao có mồ hôi, đau bụng đi ngoài do lạnh hoặc tích trệ.',
      'Phụ nữ mang thai giai đoạn đầu hoặc trẻ nhỏ khỏe mạnh bình thường không nên lạm dụng.',
      'Không dùng chung với Lê lô (thực phản tam thập lục vị) hoặc uống trà đặc ngay sau khi dùng sâm.'
    ],
    classicFormulas: [
      {
        name: 'Tứ quân tử thang (Bổ khí kinh điển)',
        indication: 'Chữa tỳ vị hư nhược, đoản khí hụt hơi, ăn ít phân lỏng, người mệt mỏi rã rời.',
        composition: ['Nhân sâm 10g', 'Bạch truật 10g', 'Phục linh 10g', 'Chích Cam thảo 6g'],
        usage: 'Sắc nước uống ấm chia 2 lần trong ngày.'
      },
      {
        name: 'Độc sâm thang (Cấp cứu cố thoát)',
        indication: 'Cấp cứu nguyên khí suy kiệt, vã mồ hôi lạnh, mạch nhỏ khó bắt.',
        composition: ['Nhân sâm tốt 30 - 40g sắc đặc'],
        usage: 'Sắc lấy nước cốt đậm đặc, uống từng ngụm nhỏ liên tục.'
      }
    ],
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'hoang-ky',
    name_vi: 'Hoàng kỳ',
    name_en: 'Astragalus Root',
    name_scientific: 'Astragalus membranaceus (Fisch.) Bge',
    family: 'Đậu (Fabaceae)',
    partUsed: 'Rễ củ già phơi khô (sống hoặc chích mật)',
    groupId: 'bo-khi',
    groupName: 'Bổ khí - Bổ dưỡng',
    nature: 'Ôn',
    tastes: ['Ngọt'],
    meridians: ['Phế', 'Tỳ'],
    summaryAction: 'Bổ khí thăng dương, cố biểu chỉ hãn (giảm mồ hôi trộm), lợi niệu tiêu thũng, sinh cơ.',
    detailedActions: [
      'Bổ khí thăng dương: chữa trung khí hạ hãm gây sa trực tràng (trĩ), sa dạ dày, sa tử cung.',
      'Cố biểu chỉ hãn: củng cố hàng rào miễn dịch vệ khí, trị chứng tự hãn (tự ra mồ hôi) và đạo hãn (mồ hôi trộm).',
      'Lợi tiểu tiêu thũng: thông thủy đạo, giải quyết tình trạng ứ dịch, phù thũng do tỳ hư.',
      'Thác độc sinh cơ: hỗ trợ làm mau lành vết loét mạn tính khó liền miệng do khí huyết kém.'
    ],
    matchedSymptoms: ['Mệt mỏi / Kiệt sức', 'Đổ mồ hôi trộm', 'Sa trĩ / Sa tạng phủ', 'Phù thũng nhẹ', 'Cảm vặt thường xuyên'],
    dosage: '10 - 30g/ngày (liều cao có thể lên 60g theo chỉ định bác sĩ)',
    preparationTip: 'Chích mật ong sao vàng để tăng cường tác dụng bổ trung kiện tỳ.',
    contraindications: [
      'Người âm hư hỏa vượng (người gầy khô, bốc hỏa chiều, lòng bàn tay chân nóng).',
      'Giai đoạn đầu của cảm mạo, ung nhọt đang sưng đau tấy đỏ có mủ thực hỏa.'
    ],
    classicFormulas: [
      {
        name: 'Bổ trung ích khí thang',
        indication: 'Chủ trị tỳ vị khí hư, sa dạ dày, sa tử cung, sa trực tràng, mệt mỏi sốt nhẹ kéo dài.',
        composition: ['Hoàng kỳ (chích mật) 20g', 'Đảng sâm 12g', 'Bạch truật 10g', 'Đương quy 10g', 'Sài hồ 6g', 'Thăng ma 6g', 'Trần bì 6g', 'Chích Cam thảo 6g'],
        usage: 'Sắc uống ngày 1 thang chia làm 2-3 lần khi thuốc còn ấm.'
      },
      {
        name: 'Ngọc bình phong tán (Lá chắn miễn dịch)',
        indication: 'Trị chứng biểu hư tự hãn, hay bị cảm lạnh, hắt hơi dị ứng thời tiết.',
        composition: ['Hoàng kỳ 24g', 'Bạch truật 12g', 'Phòng phong 8g'],
        usage: 'Tán bột mịn uống mỗi lần 9g hoặc sắc uống ấm hàng ngày.'
      }
    ],
    image: 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'dang-sam',
    name_vi: 'Đảng sâm',
    name_en: 'Codonopsis Root',
    name_scientific: 'Codonopsis pilosula (Franch.) Nannf',
    family: 'Hoa chuông (Campanulaceae)',
    partUsed: 'Rễ củ phơi hoặc sấy khô',
    groupId: 'bo-khi',
    groupName: 'Bổ khí - Bổ dưỡng',
    nature: 'Bình',
    tastes: ['Ngọt'],
    meridians: ['Phế', 'Tỳ'],
    summaryAction: 'Ích khí, bổ trung, dưỡng huyết, sinh tân. Dùng thay thế Nhân sâm rất tốt cho tỳ vị hư.',
    detailedActions: [
      'Bổ trung ích khí: trị tỳ vị hư nhược, ăn uống không ngon miệng, mệt mỏi, phân sống.',
      'Dưỡng huyết sinh tân: hỗ trợ sinh tạo hồng cầu, cải thiện triệu chứng sắc mặt nhợt nhạt, hoa mắt chóng mặt.',
      'Nhuận phế chỉ khái: làm dịu phế khí hư sinh ho khan, thở ngắn hụt hơi.'
    ],
    matchedSymptoms: ['Mệt mỏi / Kiệt sức', 'Ăn uống kém / Chán ăn', 'Thiếu máu / Hoa mắt', 'Hụt hơi nhẹ'],
    dosage: '10 - 20g/ngày (có thể sắc nước, ngâm rượu hoặc nấu cháo)',
    preparationTip: 'Rửa sạch thái lát mỏng, sao vàng với cám gạo hoặc sấy giòn hãm trà.',
    contraindications: [
      'Không dùng chung với vị thuốc Lê lô.',
      'Người thực tà hỏa vượng, đầy bụng do tích tụ thức ăn chưa tiêu.'
    ],
    classicFormulas: [
      {
        name: 'Bát trân thang (Khí huyết song bổ)',
        indication: 'Trị khí huyết lưỡng hư, sau sinh, sau phẫu thuật, mệt mỏi da xanh tái.',
        composition: ['Đảng sâm 12g', 'Bạch truật 12g', 'Bạch linh 12g', 'Cam thảo 6g', 'Đương quy 12g', 'Thục địa 15g', 'Bạch thược 12g', 'Xuyên khung 8g'],
        usage: 'Thêm 3 lát gừng và 2 quả táo sắc uống ấm chia 2 lần.'
      }
    ],
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'cam-thao',
    name_vi: 'Cam thảo',
    name_en: 'Licorice Root',
    name_scientific: 'Glycyrrhiza uralensis Fisch',
    family: 'Đậu (Fabaceae)',
    partUsed: 'Rễ và thân rễ phơi khô (Sinh thảo hoặc Chích thảo)',
    groupId: 'bo-khi',
    groupName: 'Bổ khí - Bổ dưỡng',
    nature: 'Bình',
    tastes: ['Ngọt'],
    meridians: ['12 đường kinh'],
    summaryAction: 'Bổ tỳ ích khí, nhuận phế chỉ ho, hòa hoãn tính dược, thanh nhiệt giải độc.',
    detailedActions: [
      'Điều hòa trăm vị thuốc (Sứ dược), làm dịu độc tính hoặc tính quá hàn quá nhiệt của các vị thuốc khác.',
      'Chỉ khái hóa đờm: làm dịu rát họng, giảm co thắt thanh quản và các cơn ho khan, ho gió.',
      'Bổ tỳ dưỡng vị: dùng chích mật giúp bồi bổ nguyên khí tỳ vị, giảm đau co thắt dạ dày - tá tràng.',
      'Thanh nhiệt giải độc: giải độc phụ tử, ngộ độc thức ăn, làm mát nhiệt miệng.'
    ],
    matchedSymptoms: ['Mệt mỏi / Kiệt sức', 'Ho / Rát họng', 'Đau dạ dày / Co thắt', 'Nóng trong / Nhiệt miệng'],
    dosage: '2 - 10g/ngày (dùng làm vị dẫn hoặc hãm nước uống)',
    preparationTip: 'Chích mật ong (Chích cam thảo) để tăng tác dụng bổ khí tỳ; dùng sống (Sinh cam thảo) để thanh nhiệt giải độc.',
    contraindications: [
      'Không dùng liên tục liều cao kéo dài (>15g/ngày trên 4 tuần) vì có thể giữ nước và natri gây tăng huyết áp phù nề.',
      'Tương phản với Cam toại, Đại kích, Hải tảo, Nguyên hoa (thập bát phản).'
    ],
    classicFormulas: [
      {
        name: 'Cam thảo thang',
        indication: 'Chữa đau rát họng cấp tính, họng sưng đỏ, nuốt đau buốt.',
        composition: ['Cam thảo sống 12g sắc nước đặc'],
        usage: 'Ngậm trong miệng rồi nuốt từ từ từng ngụm nhỏ.'
      },
      {
        name: 'Thược dược cam thảo thang',
        indication: 'Giảm đau co thắt cơ bắp, chuột rút ban đêm, đau quặn bụng do dạ dày.',
        composition: ['Bạch thược 16g', 'Chích Cam thảo 8g'],
        usage: 'Sắc nước uống ấm lúc đang co thắt đau.'
      }
    ],
    image: 'https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?auto=format&fit=crop&q=80&w=600'
  },

  // ==========================================
  // 2. NHÓM GIẢI BIỂU - PHÁT TÁN
  // ==========================================
  {
    id: 'sinh-khuong',
    name_vi: 'Sinh khương (Gừng tươi)',
    name_en: 'Fresh Ginger',
    name_scientific: 'Zingiber officinale Rosc',
    family: 'Gừng (Zingiberaceae)',
    partUsed: 'Thân rễ (củ) tươi',
    groupId: 'giai-bieu',
    groupName: 'Giải biểu - Phát tán',
    nature: 'Ôn',
    tastes: ['Cay'],
    meridians: ['Phế', 'Tỳ', 'Vị'],
    summaryAction: 'Phát tán phong hàn, ôn trung chỉ nôn (thánh dược trị nôn), giải độc cua cá, chỉ khái.',
    detailedActions: [
      'Phát tán phong hàn: làm toát mồ hôi hạ sốt nhẹ, trừ khí lạnh xâm nhập vào phế và cơ biểu.',
      'Ôn trung chỉ ẩu: làm ấm dạ dày, dứt điểm cảm giác buồn nôn, say tàu xe, nôn mửa do lạnh bụng.',
      'Hóa đờm chỉ khái: làm tan đờm loãng bọt trắng, giảm các cơn ho tức ngực do nhiễm sương lạnh.',
      'Giải độc hải sản: trung hòa độc tính tính hàn của cua, ốc, tôm, cá.'
    ],
    matchedSymptoms: ['Cảm sốt / Ớn lạnh', 'Buồn nôn / Lạnh bụng', 'Ho / Rát họng', 'Đầy bụng / Khó tiêu'],
    dosage: '3 - 10g/ngày (thái lát mỏng, hãm trà hoặc giã nhuyễn lấy nước cốt)',
    preparationTip: 'Đập dập hoặc thái sợi mảnh đun sôi nhỏ lửa với nước và mật ong hoặc đường phèn.',
    contraindications: [
      'Người âm hư nội nhiệt, ho khan ra máu, người đang sốt cao vã nhiều mồ hôi.',
      'Người loét dạ dày tá tràng thể nhiệt, trĩ ra máu không nên dùng nhiều gừng đậm đặc.'
    ],
    classicFormulas: [
      {
        name: 'Trà gừng mật ong tán hàn',
        indication: 'Trị cảm lạnh mới nhiễm, người ớn lạnh gai rét, buồn nôn, tiêu chảy lạnh bụng.',
        composition: ['Gừng tươi 15g đập dập', 'Mật ong nguyên chất 2 thìa cà phê', 'Nước sôi 300ml'],
        usage: 'Hãm ấm 10 phút, uống ngay khi còn bốc khói rồi nằm đắp chăn mỏng.'
      },
      {
        name: 'Bán hạ hậu phác sinh khương thang',
        indication: 'Chữa hội chứng nghẹn vướng cổ họng (mai hạch khí), nôn mửa do đờm lạnh ứ trệ.',
        composition: ['Sinh khương 10g', 'Bán hạ chế 10g', 'Hậu phác 8g', 'Phục linh 12g', 'Tô diệp 8g'],
        usage: 'Sắc nước uống chia làm 2 lần ấm trong ngày.'
      }
    ],
    image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'bac-ha',
    name_vi: 'Bạc hà',
    name_en: 'Field Mint',
    name_scientific: 'Mentha arvensis L',
    family: 'Hoa môi (Lamiaceae)',
    partUsed: 'Toàn cây trên mặt đất (lá và ngọn hoa)',
    groupId: 'giai-bieu',
    groupName: 'Giải biểu - Phát tán',
    nature: 'Lương',
    tastes: ['Cay'],
    meridians: ['Phế', 'Can'],
    summaryAction: 'Phát tán phong nhiệt, thanh đầu mục (làm dịu đầu/mắt), tuyên thấu ban chẩn, giải độc.',
    detailedActions: [
      'Tuyên tán phong nhiệt: trị cảm mạo phong nhiệt, sốt nhẹ, đau đầu, nghẹt mũi, không ra được mồ hôi.',
      'Thanh lợi đầu mục: làm sáng mắt, dịu đau đầu vùng thái dương, giảm nhức đỏ mắt do can hỏa.',
      'Lợi yết hầu: giảm sưng đau họng, khản tiếng, cảm giác đau rát khi nuốt nước bọt.',
      'Sơ can giải uất: hỗ trợ điều hòa khí trệ ở can phế, giảm cảm giác bức bối ngực sườn.'
    ],
    matchedSymptoms: ['Cảm sốt / Ớn lạnh', 'Ho / Rát họng', 'Đau đầu / Đỏ mắt', 'Nóng trong / Nhiệt miệng'],
    dosage: '3 - 8g/ngày (sắc sau cùng khi chuẩn bị tắt bếp để tránh bay mất tinh dầu menthol)',
    preparationTip: 'Cho vào nồi sắc sau cùng (sắc hậu hạ) đun sôi nhẹ 3-5 phút là tắt bếp.',
    contraindications: [
      'Trẻ sơ sinh và trẻ nhỏ dưới 2 tuổi (tinh dầu bạc hà liều cao có thể ức chế hô hấp thần kinh).',
      'Người thể trạng biểu hư tự ra nhiều mồ hôi, tiêu chảy mạn tính do tỳ vị hư hàn.'
    ],
    classicFormulas: [
      {
        name: 'Tang cúc ẩm (Thanh phế tán phong nhiệt)',
        indication: 'Trị cảm phong nhiệt, ho khan tiếng vang, đau rát cổ họng, mắt đỏ hơi sốt.',
        composition: ['Bạc hà 4g (cho sau)', 'Tang diệp 10g', 'Cúc hoa 8g', 'Liên kiều 8g', 'Cát cánh 8g', 'Hạnh nhân 8g', 'Cam thảo 4g'],
        usage: 'Sắc nước uống chia làm 2 lần ấm trong ngày.'
      }
    ],
    image: 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'tia-to',
    name_vi: 'Tía tô (Tử tô)',
    name_en: 'Perilla Leaf',
    name_scientific: 'Perilla frutescens (L.) Britt',
    family: 'Hoa môi (Lamiaceae)',
    partUsed: 'Lá (Tô diệp), cành (Tô ngạnh), hạt (Tô tử)',
    groupId: 'giai-bieu',
    groupName: 'Giải biểu - Phát tán',
    nature: 'Ôn',
    tastes: ['Cay'],
    meridians: ['Phế', 'Tỳ'],
    summaryAction: 'Phát hãn giải biểu tán phong hàn, hành khí an thai, khoan hung hóa đờm, giải độc hải sản.',
    detailedActions: [
      'Tán hàn giải cảm: làm ra mồ hôi êm dịu, trị cảm cúm cảm lạnh, nhức đầu đau mỏi khớp.',
      'Hành khí lý tỳ: trị đầy bụng ợ hơi, nôn ói, đau tức vùng ngực sườn do khí trệ.',
      'An thai dưỡng tỳ: dùng cành tía tô (Tô ngạnh) làm êm dịu cơn nôn nghén, giảm co thắt tử cung khi có dấu hiệu động thai nhẹ.',
      'Giải độc cua cá: ức chế histamin và độc tố dị ứng thức ăn hải sản.'
    ],
    matchedSymptoms: ['Cảm sốt / Ớn lạnh', 'Ho / Rát họng', 'Đầy bụng / Khó tiêu', 'Dị ứng hải sản'],
    dosage: '6 - 15g lá khô (hoặc 20 - 40g lá tươi giã lấy nước/nấu cháo)',
    preparationTip: 'Dùng lá tươi thái nhỏ nấu cùng cháo hành ăn nóng hoặc sắc uống ấm.',
    contraindications: [
      'Người biểu hư tự đổ nhiều mồ hôi không do ngoại cảm phong hàn.',
      'Sốt cao do nhiệt độc thực hỏa.'
    ],
    classicFormulas: [
      {
        name: 'Hương tô ẩm',
        indication: 'Chữa ngoại cảm phong hàn kèm nội thương khí trệ đầy bụng khó tiêu.',
        composition: ['Tô diệp 10g', 'Hương phụ 10g', 'Trần bì 8g', 'Cam thảo 4g'],
        usage: 'Thêm 3 lát gừng và 1 cọng hành hoa sắc nước uống ấm.'
      },
      {
        name: 'Cháo hành tía tô giải cảm',
        indication: 'Cảm lạnh mới mắc, ngạt mũi hắt hơi, ớn lạnh không ra được mồ hôi.',
        composition: ['Lá tía tô tươi 30g', 'Hành hoa cả rễ 3 nhánh', 'Gừng tươi 6g thái chỉ', 'Gạo tẻ nấu cháo loãng'],
        usage: 'Múc cháo sôi ra tô trộn đều gia vị, ăn nóng hổi rồi trùm chăn toát mồ hôi.'
      }
    ],
    image: 'https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'kim-ngan-hoa',
    name_vi: 'Kim ngân hoa',
    name_en: 'Honeysuckle Flower',
    name_scientific: 'Lonicera japonica Thunb',
    family: 'Kim ngân (Caprifoliaceae)',
    partUsed: 'Hoa chớm nở phơi hoặc sấy nhẹ',
    groupId: 'giai-bieu',
    groupName: 'Giải biểu - Phát tán',
    nature: 'Hàn',
    tastes: ['Ngọt'],
    meridians: ['Phế', 'Vị', 'Tâm'],
    summaryAction: 'Thanh nhiệt giải độc, tán phong nhiệt, lương huyết chỉ lỵ. Vị thuốc kháng sinh thảo dược hàng đầu.',
    detailedActions: [
      'Tán phong nhiệt giải cảm: trị sốt cao, đau đầu, viêm họng cấp, họng đỏ có mủ.',
      'Thanh nhiệt tiêu độc: làm tiêu tan mụn nhọt, đinh râu, mẩn ngứa dị ứng thời tiết, ban sởi thời kỳ đầu.',
      'Lương huyết thanh trường: trị chứng kiết lỵ, phân có nhầy máu do thấp nhiệt đại tràng.'
    ],
    matchedSymptoms: ['Cảm sốt / Ớn lạnh', 'Ho / Rát họng', 'Nóng trong / Nhiệt miệng', 'Mụn nhọt mẩn ngứa'],
    dosage: '10 - 20g/ngày (hãm trà hoặc sắc uống)',
    preparationTip: 'Dùng hoa khô hãm với nước sôi như trà hoặc phối ngũ sắc thuốc.',
    contraindications: [
      'Người thể trạng tỳ vị hư hàn (hay lạnh bụng, đi cầu phân lỏng nát, sợ lạnh).',
      'Mụn nhọt đã vỡ mủ lâu ngày, thể âm thư không đỏ sưng nóng buốt.'
    ],
    classicFormulas: [
      {
        name: 'Ngân kiều tán (Phương thuốc giải phong nhiệt kinh điển)',
        indication: 'Trị cảm cúm phong nhiệt thời kỳ đầu, sốt cao đau họng, phát ban, khát nước.',
        composition: ['Kim ngân hoa 15g', 'Liên kiều 15g', 'Cát cánh 10g', 'Bạc hà 8g', 'Trúc diệp 8g', 'Kinh giới tuệ 8g', 'Ngưu bàng tử 10g', 'Đạm đậu xị 10g', 'Cam thảo 6g'],
        usage: 'Sắc nước uống chia làm 3 lần uống ấm trong ngày.'
      }
    ],
    image: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&q=80&w=600'
  },

  // ==========================================
  // 3. NHÓM AN THẦN - BỔ TÂM
  // ==========================================
  {
    id: 'tao-nhan',
    name_vi: 'Táo nhân (Toan táo nhân)',
    name_en: 'Sour Jujube Seed',
    name_scientific: 'Ziziphus jujuba Mill. var. spinosa',
    family: 'Táo ta (Rhamnaceae)',
    partUsed: 'Hạt của quả táo chua chín già sao đen/sao vàng',
    groupId: 'an-than',
    groupName: 'An thần - Bổ tâm',
    nature: 'Bình',
    tastes: ['Ngọt', 'Chua'],
    meridians: ['Tâm', 'Can', 'Đởm'],
    summaryAction: 'Dưỡng tâm an thần, liễm hãn (cầm mồ hôi), sinh tân dịch. Vị thuốc an thần dưỡng huyết số 1.',
    detailedActions: [
      'Dưỡng tâm can huyết: trị chứng mất ngủ do tâm can huyết hư, thần không định, hay giật mình mộng mị.',
      'Liễm hãn sinh tân: cầm chứng mồ hôi trộm ban đêm (đạo hãn) và mồ hôi tự chảy ban ngày (tự hãn).',
      'Giải phiền táo: làm dịu trạng thái bứt rứt lo âu, hồi hộp đánh trống ngực ở người suy nhược thần kinh.'
    ],
    matchedSymptoms: ['Mất ngủ / Lo âu', 'Hồi hộp đánh trống ngực', 'Mộng mị / Giật mình', 'Đổ mồ hôi trộm'],
    dosage: '10 - 20g/ngày (sao đen để phát huy tối đa tác dụng an thần)',
    preparationTip: 'Đập dập nát hạt rồi sao vàng sẫm hoặc sao đen trước khi sắc nước.',
    contraindications: [
      'Người có thực hỏa đờm nhiệt (lưỡi rêu vàng dày, miệng đắng, khạc đờm đặc hôi).',
      'Đang bị tiêu chảy cấp hoặc cảm nhiễm cấp tính mới khởi phát.'
    ],
    classicFormulas: [
      {
        name: 'Toan táo nhân thang (Chủ trị mất ngủ kinh điển Đông y)',
        indication: 'Chữa hư lao phiền táo không ngủ được, hồi hộp lo âu, đổ mồ hôi trộm, váng đầu.',
        composition: ['Toan táo nhân (sao đen) 20g', 'Tri mẫu 10g', 'Phục linh 12g', 'Xuyên khung 8g', 'Cam thảo 4g'],
        usage: 'Sắc nước đặc, uống 1 chén ấm trước khi đi ngủ 1 giờ.'
      }
    ],
    image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'lac-tien',
    name_vi: 'Lạc tiên (Cây nhãn lồng)',
    name_en: 'Passion Flower',
    name_scientific: 'Passiflora foetida L',
    family: 'Lạc tiên (Passifloraceae)',
    partUsed: 'Toàn cây trên mặt đất (dây, lá, hoa)',
    groupId: 'an-than',
    groupName: 'An thần - Bổ tâm',
    nature: 'Lương',
    tastes: ['Ngọt', 'Đắng'],
    meridians: ['Tâm', 'Can'],
    summaryAction: 'An thần, thanh tâm giáng hỏa, tiêu viêm giải độc, dưỡng huyết dịu hệ thần kinh.',
    detailedActions: [
      'Làm dịu hệ thần kinh trung ương: giảm căng thẳng mệt mỏi sau ngày làm việc dài, hỗ trợ giấc ngủ tự nhiên.',
      'Thanh tâm trừ phiền: làm giảm cảm giác bồn chồn trong lồng ngực, nóng ran người về đêm.',
      'Điều hòa nhịp tim nhẹ: giảm tình trạng tim đập nhanh do lo âu xúc động.'
    ],
    matchedSymptoms: ['Mất ngủ / Lo âu', 'Căng thẳng thần kinh', 'Ngủ chập chờn', 'Nóng trong / Nhiệt miệng'],
    dosage: '15 - 30g/ngày (khô) hoặc 50g (tươi nấu canh/hãm trà)',
    preparationTip: 'Rửa sạch thái khúc phơi khô hãm với nước sôi hoặc nấu canh cùng thịt nạc ăn bữa tối.',
    contraindications: [
      'Người huyết áp quá thấp nên gia thêm vài lát gừng ấm.',
      'Phụ nữ mang thai giai đoạn đầu nên tham khảo ý kiến bác sĩ chuyên khoa.'
    ],
    classicFormulas: [
      {
        name: 'Trà tam thảo an thần (Lạc tiên - Lá vông - Tâm sen)',
        indication: 'Trị mất ngủ mãn tính, trằn trọc trắng đêm, căng thẳng stress công việc.',
        composition: ['Lạc tiên khô 20g', 'Lá vông nem 10g', 'Tâm sen sao vàng 3g', 'Nước sôi 500ml'],
        usage: 'Hãm nước sôi 15 phút, uống ấm thay nước lọc sau bữa tối.'
      }
    ],
    image: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'vong-nem',
    name_vi: 'Vông nem (Thích đồng bì)',
    name_en: 'Coral Tree Bark',
    name_scientific: 'Erythrina variegata L',
    family: 'Đậu (Fabaceae)',
    partUsed: 'Lá bánh tẻ hoặc vỏ thân cây phơi khô',
    groupId: 'an-than',
    groupName: 'An thần - Bổ tâm',
    nature: 'Bình',
    tastes: ['Đắng', 'Chát'],
    meridians: ['Can', 'Thận'],
    summaryAction: 'Trừ phong thấp, an thần chỉ khái, hạ huyết áp nhẹ, giảm co cứng cơ.',
    detailedActions: [
      'Ức chế hoạt động thần kinh quá kích: giúp trấn tĩnh tinh thần, dễ đi vào giấc ngủ sâu.',
      'Khu phong thông lạc: giảm đau nhức cơ khớp do phong thấp sương ẩm lạnh.',
      'Hạ hỏa bình can: hỗ trợ kiểm soát huyết áp tăng do nóng giận căng thẳng.'
    ],
    matchedSymptoms: ['Mất ngủ / Lo âu', 'Huyết áp cao nhẹ', 'Đau mỏi cơ khớp', 'Trẻ nhỏ giật mình'],
    dosage: '8 - 15g lá khô/ngày (hoặc 15 - 30g lá tươi hấp cơm/luộc ăn)',
    preparationTip: 'Hái lá bánh tẻ rửa sạch, hấp chín trong nồi cơm ăn vào bữa cơm tối.',
    contraindications: [
      'Không dùng liều quá cao kéo dài liên tục nhiều tuần vì có thể gây yếu mỏi cơ tạm thời.',
      'Người nhược cơ, huyết áp quá thấp không nên dùng liều đậm đặc.'
    ],
    classicFormulas: [
      {
        name: 'Bài thuốc dưỡng tâm lá vông',
        indication: 'Chữa mất ngủ hồi hộp, ngủ mơ hoảng hốt, huyết áp cao thể nhẹ.',
        composition: ['Lá vông nem 15g', 'Lạc tiên 15g', 'Cỏ mần trầu 10g'],
        usage: 'Sắc lấy nước uống trước khi ngủ 1 giờ.'
      }
    ],
    image: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=600'
  },

  // ==========================================
  // 4. NHÓM TRỪ THẤP - HÀNH KHÍ
  // ==========================================
  {
    id: 'tran-bi',
    name_vi: 'Trần bì (Vỏ quýt khô)',
    name_en: 'Aged Tangerine Peel',
    name_scientific: 'Citrus reticulata Blanco',
    family: 'Cam (Rutaceae)',
    partUsed: 'Vỏ quả quýt chín thái nhỏ để lâu năm',
    groupId: 'tru-thap',
    groupName: 'Trừ thấp - Hành khí',
    nature: 'Ôn',
    tastes: ['Cay', 'Đắng'],
    meridians: ['Tỳ', 'Phế'],
    summaryAction: 'Lí khí kiện tỳ, táo thấp hóa đờm, giáng khí chỉ ẩu. Để càng lâu năm càng quý.',
    detailedActions: [
      'Hành khí chỉ thống: điều hòa khí trệ tỳ vị, giảm đầy hơi, trướng bụng, ợ hơi, chán ăn.',
      'Táo thấp hóa đờm: trừ đờm ẩm ứ trệ ở phế, trị các cơn ho nhiều đờm bọt trắng loãng, ngực bức bách.',
      'Hòa trung chỉ ẩu: giảm buồn nôn, trào ngược dạ dày thực quản, ợ chua.'
    ],
    matchedSymptoms: ['Đầy bụng / Khó tiêu', 'Ho / Rát họng', 'Buồn nôn / Nôn', 'Trào ngược ợ chua'],
    dosage: '3 - 10g/ngày (hãm trà, sao với gừng hoặc sắc uống)',
    preparationTip: 'Cạo sạch lớp xơ trắng bên trong nếu muốn giảm tính trệ, sao vàng thơm trước khi sắc.',
    contraindications: [
      'Người âm hư ho khan không có đờm, ho ra máu.',
      'Người thực nhiệt bên trong, lưỡi đỏ khô không có rêu.'
    ],
    classicFormulas: [
      {
        name: 'Nhị trần thang (Phương thang trừ đờm số 1)',
        indication: 'Trị chứng đờm thấp ứ trệ, ho nhiều đờm, ngực tức khó thở, đầy bụng buồn nôn.',
        composition: ['Trần bì 10g', 'Bán hạ chế 10g', 'Phục linh 12g', 'Cam thảo 4g'],
        usage: 'Thêm 3 lát gừng tươi sắc nước uống ấm ngày 2 lần.'
      },
      {
        name: 'Bình vị tán',
        indication: 'Chữa tỳ vị thấp trệ, ăn uống không tiêu, bụng dạ óc ách đầy trướng, phân nát.',
        composition: ['Trần bì 8g', 'Thương truật 12g', 'Hậu phác 8g', 'Cam thảo 4g'],
        usage: 'Tán bột mịn uống mỗi lần 6-9g hoặc sắc uống ấm.'
      }
    ],
    image: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'thuong-truat',
    name_vi: 'Thương truật',
    name_en: 'Black Atractylodes',
    name_scientific: 'Atractylodes lancea (Thunb.) DC',
    family: 'Cúc (Asteraceae)',
    partUsed: 'Thân rễ phơi khô (sống hoặc tẩm nước gạo)',
    groupId: 'tru-thap',
    groupName: 'Trừ thấp - Hành khí',
    nature: 'Ôn',
    tastes: ['Cay', 'Đắng'],
    meridians: ['Tỳ', 'Vị'],
    summaryAction: 'Táo thấp kiện tỳ, khu phong tán hàn, minh mục (sáng mắt quáng gà).',
    detailedActions: [
      'Táo thấp vận tỳ: làm khô ẩm thấp tích tụ ở đường ruột, điều trị chứng tiêu chảy mạn, chân tay nặng nề rã rời.',
      'Khu phong trừ thấp: đẩy lùi phong thấp đau nhức các khớp xương, đặc biệt khi thời tiết ẩm ướt giao mùa.',
      'Minh mục: kết hợp với gan lợn điều trị chứng quáng gà, mắt mờ ở trẻ em.'
    ],
    matchedSymptoms: ['Đầy bụng / Khó tiêu', 'Đau mỏi cơ khớp', 'Tiêu chảy mạn', 'Người nặng nề uể oải'],
    dosage: '5 - 10g/ngày (sao cám hoặc chích gừng)',
    preparationTip: 'Ngâm nước vo gạo 1 đêm để bớt chất dầu chát rồi phơi khô thái mỏng sao vàng.',
    contraindications: [
      'Người âm hư nội nhiệt, tân dịch hao tổn, đại tiện táo bón lâu ngày.',
      'Người biểu hư tự đổ nhiều mồ hôi.'
    ],
    classicFormulas: [
      {
        name: 'Nhị diệu hoàn',
        indication: 'Trị thấp nhiệt chi dưới gây sưng đau các khớp ngón chân, khớp gối, khí hư vàng hôi.',
        composition: ['Thương truật 12g', 'Hoàng bá 12g'],
        usage: 'Tán bột mịn viên với nước hoặc sắc uống ấm.'
      }
    ],
    image: 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'doc-hoat',
    name_vi: 'Độc hoạt',
    name_en: 'Pubescent Angelica',
    name_scientific: 'Angelica pubescens Maxim',
    family: 'Hoa tán (Apiaceae)',
    partUsed: 'Rễ củ phơi khô',
    groupId: 'tru-thap',
    groupName: 'Trừ thấp - Hành khí',
    nature: 'Ôn',
    tastes: ['Cay', 'Đắng'],
    meridians: ['Thận', 'Bàng quang'],
    summaryAction: 'Khu phong trừ thấp chỉ thống, thông kinh lạc nửa thân dưới. Trị đau lưng gối, đau thần kinh tọa.',
    detailedActions: [
      'Trừ phong thấp nửa thân dưới: tác dụng tập trung vào thắt lưng, khớp háng, khớp gối và cổ chân.',
      'Chỉ thống giảm đau: cắt cơn đau nhức buốt sâu trong tủy xương do khí lạnh ẩm thẩm thấu.',
      'Thông kinh lạc: cải thiện tình trạng tê bì chân tay, co cứng gân cơ khi trời trở lạnh buốt.'
    ],
    matchedSymptoms: ['Đau mỏi cơ khớp', 'Đau lưng mỏi gối', 'Đau thần kinh tọa', 'Tê bì chi dưới'],
    dosage: '5 - 12g/ngày (sắc thuốc hoặc ngâm rượu xoa bóp/uống)',
    preparationTip: 'Thái lát sao nhẹ với rượu để tăng cường khả năng dẫn thuốc đi khắp kinh lạc.',
    contraindications: [
      'Người âm hư hỏa vượng, đau khớp do phong nhiệt sưng đỏ nóng buốt.',
      'Người huyết hư thiếu máu không có phong hàn thấp tý.'
    ],
    classicFormulas: [
      {
        name: 'Độc hoạt ký sinh thang (Tuyệt phẩm trị thoái hóa khớp & thần kinh tọa)',
        indication: 'Chữa thoái hóa cột sống, đau lưng mỏi gối, đau thần kinh tọa kéo dài, chân tay tê buốt.',
        composition: [
          'Độc hoạt 12g', 'Tang ký sinh 16g', 'Đỗ trọng 12g', 'Ngưu tất 12g', 
          'Tế tân 4g', 'Tần giao 10g', 'Phòng phong 10g', 'Phục linh 12g', 
          'Quế chi 6g', 'Bạch thược 10g', 'Đương quy 10g', 'Xuyên khung 8g', 
          'Địa hoàng 15g', 'Đảng sâm 12g', 'Cam thảo 6g'
        ],
        usage: 'Sắc nước uống ấm chia 2-3 lần trong ngày sau bữa ăn.'
      }
    ],
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600'
  },

  // ==========================================
  // 5. NHÓM THANH NHIỆT - HẠ HỎA
  // ==========================================
  {
    id: 'cuc-hoa',
    name_vi: 'Cúc hoa (Bạch cúc / Hoàng cúc)',
    name_en: 'Chrysanthemum Flower',
    name_scientific: 'Chrysanthemum morifolium Ramat',
    family: 'Cúc (Asteraceae)',
    partUsed: 'Hoa phơi sấy khô',
    groupId: 'thanh-nhiet',
    groupName: 'Thanh nhiệt - Hạ hỏa',
    nature: 'Lương',
    tastes: ['Ngọt', 'Đắng'],
    meridians: ['Phế', 'Can'],
    summaryAction: 'Thanh nhiệt giải độc, bình can sáng mắt, sơ tán phong nhiệt, giáng hỏa hạ áp.',
    detailedActions: [
      'Bình can minh mục: chữa hoa mắt chóng mặt, mắt đỏ sưng đau, khô mắt nhức mỏi do can hỏa vượng.',
      'Thanh nhiệt giải độc: tiêu độc mụn nhọt, đinh nhọt ở vùng đầu mặt, nhiệt miệng rát lưỡi.',
      'Giáng áp thanh thần: hỗ trợ hạ huyết áp, làm thư giãn thần kinh, giảm đau đầu vùng thái dương.'
    ],
    matchedSymptoms: ['Nóng trong / Nhiệt miệng', 'Đau mắt đỏ / Khô mắt', 'Nhức đầu bốc hỏa', 'Huyết áp cao nhẹ'],
    dosage: '6 - 12g/ngày (hãm trà hoa cúc uống hàng ngày hoặc sắc thuốc)',
    preparationTip: 'Hãm hoa khô với nước sôi 90°C cùng chút kỷ tử và mật ong hoặc táo đỏ.',
    contraindications: [
      'Người thể chất hư hàn (sợ lạnh, tiêu chảy, lạnh tay chân, ăn uống khó tiêu).'
    ],
    classicFormulas: [
      {
        name: 'Kỷ cúc địa hoàng hoàn (Dưỡng can thận sáng mắt)',
        indication: 'Chữa can thận âm hư, mắt mờ quáng gà, hoa mắt chóng mặt, ù tai, khô rát mắt.',
        composition: ['Cúc hoa 10g', 'Kỷ tử 10g', 'Thục địa 20g', 'Sơn thù 10g', 'Sơn dược 12g', 'Trạch tả 10g', 'Đan bì 10g', 'Phục linh 10g'],
        usage: 'Tán bột làm hoàn hoặc sắc nước uống ấm hàng ngày.'
      },
      {
        name: 'Trà Cúc hoa Kỷ tử Cam thảo',
        indication: 'Thanh lọc độc tố, làm mát cơ thể, sáng mắt cho người làm việc văn phòng máy tính nhiều.',
        composition: ['Cúc hoa khô 8g', 'Kỷ tử đỏ 10g', 'Cam thảo lát 3g'],
        usage: 'Hãm 350ml nước sôi uống nhâm nhi cả ngày.'
      }
    ],
    image: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'thao-quyet-minh',
    name_vi: 'Thảo quyết minh (Hạt muồng)',
    name_en: 'Cassia Seed',
    name_scientific: 'Senna tora (L.) Roxb',
    family: 'Đậu (Fabaceae)',
    partUsed: 'Hạt của quả chín già sao khô',
    groupId: 'thanh-nhiet',
    groupName: 'Thanh nhiệt - Hạ hỏa',
    nature: 'Lương',
    tastes: ['Ngọt', 'Đắng', 'Mặn'],
    meridians: ['Can', 'Đởm', 'Thận'],
    summaryAction: 'Thanh can sáng mắt, nhuận tràng thông tiện, hạ mỡ máu và huyết áp cao thể can nhiệt.',
    detailedActions: [
      'Nhuận tràng thông tiện: kích thích nhu động đại tràng nhẹ nhàng, trị chứng táo bón do nhiệt táo.',
      'Thanh can minh mục: giải trừ can hỏa, giảm nhức buốt mắt, chảy nước mắt sống khi ra gió.',
      'Giáng áp hạ lipid: giúp ổn định mỡ máu và chỉ số huyết áp ở người trung niên và cao tuổi.'
    ],
    matchedSymptoms: ['Nóng trong / Nhiệt miệng', 'Táo bón nhiệt', 'Mờ mắt / Đỏ mắt', 'Huyết áp cao nhẹ'],
    dosage: '10 - 20g/ngày (sao vàng thơm hoặc sao cháy cạnh)',
    preparationTip: 'Sao vàng thơm (sao nhẹ) để tăng tính nhuận tràng; sao đen cháy cạnh để an thần hạ áp.',
    contraindications: [
      'Người đang bị tiêu chảy, tỳ vị hư hàn hoặc huyết áp tụt quá thấp.'
    ],
    classicFormulas: [
      {
        name: 'Trà Thảo quyết minh hạ áp thông tiện',
        indication: 'Trị chứng huyết áp cao, hoa mắt nhức đầu, đại tiện bí kết ở người lớn tuổi.',
        composition: ['Thảo quyết minh (sao vàng) 15g', 'Hoa cúc 6g', 'Hòe hoa sao 10g'],
        usage: 'Hãm với 500ml nước sôi uống thay nước trà.'
      }
    ],
    image: 'https://images.unsplash.com/photo-1615485925602-4836978a5175?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'sinh-dia',
    name_vi: 'Sinh địa (Địa hoàng tươi / khô)',
    name_en: 'Rehmannia Root',
    name_scientific: 'Rehmannia glutinosa (Gaertn.) Libosch',
    family: 'Hoa mõm chó (Scrophulariaceae)',
    partUsed: 'Củ rễ tươi hoặc sấy khô vừa phải',
    groupId: 'thanh-nhiet',
    groupName: 'Thanh nhiệt - Hạ hỏa',
    nature: 'Hàn',
    tastes: ['Ngọt', 'Đắng'],
    meridians: ['Tâm', 'Can', 'Thận'],
    summaryAction: 'Thanh nhiệt lương huyết, dưỡng âm sinh tân dịch, chỉ huyết tiêu ứ nhiệt.',
    detailedActions: [
      'Thanh nhiệt lương huyết: trị sốt cao nhập vào phần dinh huyết, sốt phát ban, chảy máu cam, nôn ra máu.',
      'Dưỡng âm sinh tân: trị chứng khát nước dữ dội, nhiệt miệng lở loét sâu, da khô héo, háo nước nội nhiệt.',
      'Hạ nhiệt độ nội tạng: làm dịu sốt âm ỉ về chiều ở người mắc các bệnh mạn tính.'
    ],
    matchedSymptoms: ['Nóng trong / Nhiệt miệng', 'Háo nước / Khát dữ dội', 'Chảy máu cam / Huyết nhiệt', 'Sốt hâm hấp về chiều'],
    dosage: '12 - 30g/ngày (có thể dùng liều cao tới 50g khi sốt cao mất nước)',
    preparationTip: 'Thái lát dày sắc nước uống hoặc giã củ tươi lấy nước cốt uống trực tiếp.',
    contraindications: [
      'Người tỳ vị hư hàn, đại tiện phân lỏng nát, tiêu hóa kém, bụng óc ách đờm ẩm.',
      'Không dùng chung với Lê lô, Hải tảo.'
    ],
    classicFormulas: [
      {
        name: 'Tê giác địa hoàng thang (Thanh nhiệt lương huyết)',
        indication: 'Chữa sốt cao co giật, mê sảng, ban chẩn đỏ dày đặc, chảy máu chân răng mũi.',
        composition: ['Sinh địa 30g', 'Xích thược 12g', 'Đan bì 10g', 'Bạch mao căn 15g'],
        usage: 'Sắc nước đặc uống chia nhiều lần nhỏ trong ngày.'
      },
      {
        name: 'Tăng dịch thang',
        indication: 'Chữa âm hư tân dịch hao kiệt, táo bón kinh niên do khô ráo lòng ruột, khát nước.',
        composition: ['Sinh địa 30g', 'Huyền sâm 30g', 'Mạch môn 24g'],
        usage: 'Sắc nước uống chia làm 2 lần ấm.'
      }
    ],
    image: 'https://images.unsplash.com/photo-1515589654462-a9881e276b8a?auto=format&fit=crop&q=80&w=600'
  }
];

export const NATURE_COLOR_MAP: Record<HerbNature, { bg: string; text: string; border: string; label: string }> = {
  'Hàn': { bg: 'bg-blue-500/15', text: 'text-blue-300', border: 'border-blue-500/30', label: 'Tính Hàn (Lạnh)' },
  'Lương': { bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-500/30', label: 'Tính Lương (Mát)' },
  'Bình': { bg: 'bg-slate-400/15', text: 'text-slate-200', border: 'border-slate-400/30', label: 'Tính Bình (Hòa hòa)' },
  'Ôn': { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/30', label: 'Tính Ôn (Ấm)' },
  'Nhiệt': { bg: 'bg-rose-500/15', text: 'text-rose-300', border: 'border-rose-500/30', label: 'Tính Nhiệt (Nóng)' },
};
