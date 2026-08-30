import { AnatomyPartData } from './anatomyData';

export const ANATOMY_PARTS_DATABASE: AnatomyPartData[] = [
  // ==========================================
  // 01. 🦴 HỆ XƯƠNG (SKELETAL)
  // ==========================================
  // 1.1 Hộp sọ
  {
    id: 'skele_skull',
    code: 'SKULL',
    name_vi: 'Hộp sọ (Khối sọ & Khối mặt)',
    name_latin: 'Cranium et Ossa Faciei',
    name_en: 'Skull & Craniofacial Bones',
    systemId: 'SKELETAL',
    gender: 'both',
    category: 'head',
    hotspot: { top: '9%', left: '50%' },
    definition: 'Hộp sọ là cấu trúc xương phức tạp gồm 22 xương chính bảo vệ não bộ, tạo hình khuôn mặt, bảo vệ các giác quan và làm chỗ bám cho các cơ vùng đầu mặt.',
    location: 'Nằm ở phần đỉnh cao nhất của trục cơ thể, tiếp khớp với đốt sống cổ C1 (Atlas).',
    illustrationUrl: 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?auto=format&fit=crop&q=80&w=800',
    model3dUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
    structures: [
      { name: 'Xương sọ não', detail: 'Xương trán, xương đỉnh, xương thái dương, xương chẩm, xương bướm, xương sàng.' },
      { name: 'Xương sọ mặt', detail: 'Xương mũi, xương hàm trên, xương hàm dưới, xương gò má, xương khẩu cái, xương lệ.' },
      { name: 'Xương móng (Hyoid)', detail: 'Xương hình móng ngựa ở vùng cổ trước làm điểm tựa cho đáy lưỡi.' }
    ],
    functions: [
      'Bảo vệ bộ não và các dây thần kinh sọ não',
      'Tạo cấu trúc hình thái cho khuôn mặt',
      'Bảo vệ các cơ quan giác quan quan trọng (mắt, tai, mũi, lưỡi)',
      'Là nơi bám của nhiều cơ vùng đầu, cơ nhai và cơ biểu cảm mặt'
    ],
    commonDiseases: ['Chấn thương sọ não', 'Gãy xương sọ', 'Gãy xương hàm', 'Viêm xoang hàm mặt', 'Dị tật hộp sọ', 'U xương vùng sọ'],
    criticalDiseases: ['Chảy máu nội sọ cấp / Xuất huyết dưới màng nhện', 'Gãy lún xương sọ', 'Vỡ nền sọ'],
    commonSymptoms: ['Đau đầu dữ dội sau va đập', 'Chảy dịch trong qua mũi/tai', 'Bầm tím quanh hốc mắt (dấu hiệu mắt kính râm)', 'Đau góc hàm khi nhai'],
    emergencyWarning: 'Đau đầu dữ dội, nôn vọt, mất tri giác hoặc chảy máu tai sau tai nạn cần gọi 115 ngay lập tức!',
    redFlags: ['Hôn mê / lơ mơ', 'Co giật', 'Yếu liệt chi', 'Giãn đồng tử một bên'],
    aiQuestionSuggestions: [
      'Sau khi va đập vùng đầu, những dấu hiệu nào cảnh báo chấn thương sọ não?',
      'Cách phân biệt đau đầu xoang và đau nửa đầu?',
      'Bị trật khớp thái dương hàm có tự nắn lại được không?'
    ],
    relatedHerbs: ['Đinh lăng', 'Hoa tam thất', 'Bạch quả'],
    healthTips: ['Luôn đội mũ bảo hiểm đạt chuẩn khi tham gia giao thông', 'Kiểm tra khớp cắn nếu hay đau khớp thái dương hàm']
  },

  // 1.2 Cột sống
  {
    id: 'skele_spine',
    code: 'SPINE_SYSTEM',
    name_vi: 'Cột sống (33 Đốt sống)',
    name_latin: 'Columna Vertebralis',
    name_en: 'Vertebral Spine Column',
    systemId: 'SKELETAL',
    gender: 'both',
    category: 'spine',
    hotspot: { top: '35%', left: '50%' },
    definition: 'Cột sống là cột trục nâng đỡ cơ thể gồm 33-34 đốt sống xếp chồng lên nhau thành các đoạn uốn cong sinh lý, liên kết qua các đĩa đệm và dây chằng, bảo vệ tủy sống.',
    location: 'Chạy dọc chính giữa lưng từ nền sọ (xương chẩm) xuống đến xương cụt vùng đáy chậu.',
    illustrationUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&q=80&w=800',
    structures: [
      { name: 'Cột sống cổ (C1 - C7)', detail: 'Gồm C1 (Atlas - Đốt đội), C2 (Axis - Đốt trục) và C3-C7 linh hoạt nhất.' },
      { name: 'Cột sống ngực (T1 - T12)', detail: '12 đốt sống ngực gắn với 12 đôi xương sườn bảo vệ tim phổi.' },
      { name: 'Cột sống thắt lưng (L1 - L5)', detail: '5 đốt sống to bản chịu tải trọng nén ép lớn nhất của cơ thể.' },
      { name: 'Xương cùng & Xương cụt', detail: 'Khối xương cùng (S1-S5) và xương cụt neo giữ cơ sàn chậu.' }
    ],
    functions: [
      'Nâng đỡ toàn bộ trọng lượng cơ thể và duy trì tư thế thẳng đứng',
      'Cho phép vận động thân mình linh hoạt (cúi, ngửa, nghiêng, xoay)',
      'Bảo vệ tủy sống và các rễ thần kinh tủy gai'
    ],
    commonDiseases: ['Đau cổ vai gáy', 'Đau thắt lưng', 'Thoái hóa cột sống', 'Thoát vị đĩa đệm', 'Hẹp ống sống', 'Cong vẹo cột sống (Scoliosis)', 'Chèn ép rễ thần kinh / Đau thần kinh tọa'],
    criticalDiseases: ['Gãy vỡ đốt sống chèn ép tủy (Liệt tủy)', 'Lao cột sống (Bệnh Pott)', 'Hội chứng chùm đuôi ngựa'],
    commonSymptoms: ['Đau nhức cột sống lan xuống chân hoặc tay', 'Tê bì, châm chích ngón chân/ngón tay', 'Cứng lưng buổi sáng', 'Gù vẹo cột sống'],
    emergencyWarning: 'Tê bì mất cảm giác vùng đáy chậu quanh hậu môn kèm bí tiểu hoặc mất kiểm soát đại tiểu tiện là cấp cứu ngoại khoa khẩn cấp!',
    redFlags: ['Bí tiểu cấp tính kèm đau lưng', 'Yếu liệt chân đột ngột', 'Đau cột sống kèm sốt cao'],
    aiQuestionSuggestions: [
      'Tôi bị đau thắt lưng lan xuống bắp chân trái, có phải thoát vị đĩa đệm?',
      'Khi nào thoái hóa cột sống cần mổ và khi nào tập vật lý trị liệu?',
      'Tư thế ngồi làm việc đúng cách để tránh cong vẹo cột sống?'
    ],
    relatedHerbs: ['Độc hoạt', 'Đỗ trọng', 'Cốt toái bổ', 'Ngải cứu sao muối'],
    healthTips: ['Bê vác vật nặng bằng cách gập gối, giữ thẳng lưng', 'Tập bơi lội 2-3 buổi mỗi tuần để giảm áp lực đĩa đệm']
  },

  // 1.3 Lồng ngực
  {
    id: 'skele_ribcage',
    code: 'RIBCAGE',
    name_vi: 'Lồng ngực & Xương sườn',
    name_latin: 'Cavea Thoracis',
    name_en: 'Thoracic Cage & Ribs',
    systemId: 'SKELETAL',
    gender: 'both',
    category: 'chest',
    hotspot: { top: '28%', left: '48%' },
    definition: 'Lồng ngực là khung xương hình nón gồm xương ức phía trước, 12 đôi xương sườn hai bên và 12 đốt sống ngực phía sau, có chức năng bảo vệ tim, phổi và các cấu trúc quan trọng.',
    location: 'Nằm ở phần thân trên, ngăn cách với ổ bụng bởi cơ hoành.',
    illustrationUrl: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&q=80&w=800',
    structures: [
      { name: 'Xương ức', detail: 'Cán ức, thân ức và mỏm mũi kiếm nằm ở đường giữa ngực.' },
      { name: 'Xương sườn & Sụn sườn', detail: '12 đôi xương sườn (sườn thật, sườn giả, sườn cụt) và các khớp sườn đàn hồi.' },
      { name: 'Đốt sống ngực', detail: 'T1 - T12 làm trụ tựa phía sau cho các cung sườn.' }
    ],
    functions: [
      'Bảo vệ tim, phổi, phế quản và các đại mạch máu lớn',
      'Đóng vai trò cơ học co giãn thể tích lồng ngực hỗ trợ hô hấp',
      'Làm điểm tựa cho các cơ hoành, cơ ngực và cơ lưng'
    ],
    commonDiseases: ['Viêm sụn sườn (Hội chứng Tietze)', 'Rạn / Gãy xương sườn do chấn thương', 'Đau dây thần kinh liên sườn', 'Dị tật ngực lõm / ngực ức gà'],
    criticalDiseases: ['Mảng sườn di động (Gãy nhiều sườn 2 vị trí)', 'Tràn máu / Tràn khí màng phổi áp lực'],
    commonSymptoms: ['Đau nhói ngực khi hít thở sâu', 'Đau tăng khi ho hoặc xoay mình', 'Ấn đau chói tại vị trí sụn sườn'],
    emergencyWarning: 'Khó thở dồn dập, tím tái môi hoặc ngực phập phồng nghịch thường sau va chạm cần gọi 115 cấp cứu!',
    redFlags: ['Khó thở dữ dội', 'Thở nghịch thường (mảng sườn di động)', 'Ho khạc ra máu tươi'],
    aiQuestionSuggestions: [
      'Tôi bị đau nhói một bên sườn khi hít thở sâu, là đau sụn sườn hay bệnh phổi?',
      'Cách phân biệt đau thần kinh liên sườn và đau tim?'
    ],
    relatedHerbs: ['Lá lốt', 'Kinh giới', 'Ngải cứu'],
    healthTips: ['Tránh mang vác vật nặng tì đè lên lồng ngực', 'Tập các bài hít thở sâu mở rộng lồng ngực']
  },

  // 1.4 Chi trên
  {
    id: 'skele_upper_limb',
    code: 'UPPER_LIMBS_BONES',
    name_vi: 'Xương Chi trên (Tay)',
    name_latin: 'Ossa Membri Superioris',
    name_en: 'Bones of Upper Limb',
    systemId: 'SKELETAL',
    gender: 'both',
    category: 'limbs',
    hotspot: { top: '38%', left: '26%' },
    definition: 'Hệ thống xương chi trên gồm đai vai (xương đòn, xương bả vai) và phần tự do (xương cánh tay, xương quay, xương trụ, xương cổ tay, bàn tay, ngón tay) cho phép biên độ vận động tinh vi.',
    location: 'Hai bên thân mình, nối vào thân qua khớp ức đòn.',
    illustrationUrl: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=800',
    structures: [
      { name: 'Đai vai', detail: 'Xương đòn (xương quai xanh) và xương bả vai.' },
      { name: 'Cánh tay & Cẳng tay', detail: 'Xương cánh tay; Xương quay (bên ngón cái) và Xương trụ (bên ngón út).' },
      { name: 'Cổ tay & Bàn ngón tay', detail: '8 xương cổ tay (thuyền, nguyệt, tháp, đậu, thang, thê, cả, móc), 5 xương bàn tay và 14 đốt ngón tay.' }
    ],
    functions: [
      'Thực hiện các thao tác cầm nắm tinh tế và nâng đỡ',
      'Đảm bảo tầm với và sự linh hoạt tối đa trong không gian 3 chiều'
    ],
    commonDiseases: ['Gãy xương (gãy xương đòn, gãy đầu dưới xương quay)', 'Trật khớp vai / trật khớp khuỷu', 'Viêm khớp / Thoái hóa khớp bàn ngón tay', 'Hội chứng ống cổ tay', 'Viêm gân De Quervain'],
    criticalDiseases: ['Gãy xương hở kèm đứt bó mạch cánh tay / thần kinh quay'],
    commonSymptoms: ['Đau buốt sưng nề sau va chạm', 'Tê bì các đầu ngón tay cái, trỏ, giữa', 'Khó cầm nắm đồ vật'],
    emergencyWarning: 'Cẳng tay/cánh tay bị biến dạng góc gập bất thường, mất mạch quay hoặc lạnh đầu ngón tay cần cố định nẹp và đi cấp cứu ngay!',
    redFlags: ['Mất mạch quay ở cổ tay', 'Bàn tay biến dạng bất thường', 'Mất hoàn toàn cảm giác bàn tay'],
    aiQuestionSuggestions: [
      'Tê bì 3 ngón tay cái, trỏ, giữa về đêm có phải hội chứng ống cổ tay?',
      'Cách sơ cứu khi bị trật khớp vai?'
    ],
    relatedHerbs: ['Thiên niên kiện', 'Dây đau xương', 'Lá lốt'],
    healthTips: ['Nghỉ ngơi cổ tay 5 phút sau mỗi 45 phút gõ bàn phím', 'Tập xoay khớp vai nhẹ nhàng hàng ngày']
  },

  // 1.5 Chi dưới
  {
    id: 'skele_lower_limb',
    code: 'LOWER_LIMBS_BONES',
    name_vi: 'Xương Chi dưới (Chân)',
    name_latin: 'Ossa Membri Inferioris',
    name_en: 'Bones of Lower Limb',
    systemId: 'SKELETAL',
    gender: 'both',
    category: 'limbs',
    hotspot: { top: '74%', left: '44%' },
    definition: 'Xương chi dưới là các khối xương to khỏe chịu lực gồm xương đùi, xương bánh chè, xương chày, xương mác, xương cổ chân, bàn chân và ngón chân.',
    location: 'Nối từ khớp háng xuống đến bàn chân hai bên.',
    illustrationUrl: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=800',
    structures: [
      { name: 'Xương đùi & Xương bánh chè', detail: 'Xương đùi dài và khỏe nhất cơ thể; xương bánh chè bảo vệ mặt trước khớp gối.' },
      { name: 'Cẳng chân', detail: 'Xương chày chịu lực chính phía trong và Xương mác hỗ trợ phía ngoài.' },
      { name: 'Cổ chân & Bàn chân', detail: 'Xương gót, xương sên, xương ghe, các xương hộp, xương chêm, xương bàn và ngón chân.' }
    ],
    functions: [
      'Chịu tải và truyền toàn bộ trọng lượng cơ thể xuống mặt đất',
      'Tạo lực đẩy cho việc đi lại, chạy nhảy và giữ thăng bằng'
    ],
    commonDiseases: ['Gãy xương (gãy cổ xương đùi, gãy thân xương chày)', 'Thoái hóa khớp gối', 'Loãng xương', 'Bong gân cổ chân', 'Viêm gân gót Achilles', 'Đau gót chân (Viêm cân gan chân)'],
    criticalDiseases: ['Gãy cổ xương đùi ở người cao tuổi (nguy cơ nằm liệt, tắc mạch)', 'Hội chứng khoang cẳng chân'],
    commonSymptoms: ['Đau khớp gối khi lên xuống cầu thang', 'Tiếng kêu lạo xạo khớp gối', 'Đau thốn gót chân bước chân đầu tiên buổi sáng', 'Sưng bầm tím mắt cá chân'],
    emergencyWarning: 'Người lớn tuổi ngã không đứng dậy được, chân bên đau ngắn hơn và xoay ngoài là dấu hiệu gãy cổ xương đùi cần đi viện ngay!',
    redFlags: ['Không thể chịu lực bước đi sau ngã', 'Cẳng chân căng cứng đau dữ dội (chèn ép khoang)', 'Tím tái đầu ngón chân'],
    aiQuestionSuggestions: [
      'Thoái hóa khớp gối giai đoạn sớm nên tập luyện và bổ sung chất gì?',
      'Bị đau thốn gót chân mỗi sáng thức dậy là bệnh gì?'
    ],
    relatedHerbs: ['Ngưu tất', 'Cẩu tích', 'Đỗ trọng', 'Dây đau xương'],
    healthTips: ['Duy trì cân nặng hợp lý để giảm tải cho khớp gối', 'Đi giày có đệm êm hỗ trợ vòm bàn chân']
  },

  // 1.6 Khung chậu
  {
    id: 'skele_pelvis',
    code: 'PELVIS',
    name_vi: 'Khung chậu',
    name_latin: 'Pelvis',
    name_en: 'Pelvic Girdle',
    systemId: 'SKELETAL',
    gender: 'both',
    category: 'pelvis',
    hotspot: { top: '55%', left: '50%' },
    definition: 'Khung chậu là vòng xương khép kín gồm hai xương chậu (xương cánh chậu, xương mu, xương ngồi) và xương cùng phía sau, làm cầu nối thân trên với hai chân.',
    location: 'Đáy thân mình, giữa thắt lưng và hai đùi.',
    illustrationUrl: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=800',
    structures: [
      { name: 'Xương cánh chậu', detail: 'Bản xương rộng tạo mào chậu hai bên hông.' },
      { name: 'Xương mu & Khớp mu', detail: 'Nằm ở phía trước, có thể giãn nhẹ khi phụ nữ sinh nở.' },
      { name: 'Xương ngồi & Ổ cối', detail: 'Ụ ngồi chịu lực khi ngồi; ổ cối tiếp khớp với chỏm xương đùi.' },
      { name: 'Xương cùng (Sacrum)', detail: 'Khóa chặt vòm chậu phía sau qua khớp cùng chậu.' }
    ],
    functions: [
      'Nâng đỡ thân mình và truyền trọng lượng xuống hai chân',
      'Bảo vệ các cơ quan vùng chậu (bàng quang, trực tràng, tử cung, tiền liệt tuyến)',
      'Tham gia vận động bước đi và quá trình sinh nở ở nữ giới'
    ],
    commonDiseases: ['Viêm khớp cùng chậu', 'Thoái hóa khớp háng', 'Đau khớp mu sau sinh', 'Hoại tử vô khuẩn chỏm xương đùi'],
    criticalDiseases: ['Vỡ khung chậu do tai nạn giao thông (chảy máu ồ ạt sau phúc mạc)'],
    commonSymptoms: ['Đau vùng mông thắt lưng lan xuống đùi', 'Đau buốt vùng khớp mu khi đi lại', 'Đi khập khiễng'],
    emergencyWarning: 'Đau dữ dội vùng chậu sau tai nạn kèm tụt huyết áp hoặc tiểu ra máu là vỡ xương chậu nguy kịch cần cấp cứu 115!',
    redFlags: ['Sốc mất máu, mạch nhanh huyết áp tụt', 'Tiểu ra máu tươi sau chấn thương hông', 'Mất vững khung chậu'],
    aiQuestionSuggestions: [
      'Phụ nữ sau sinh bị đau buốt vùng khớp mu thì bao lâu hồi phục?',
      'Dấu hiệu nhận biết sớm hoại tử vô khuẩn chỏm xương đùi?'
    ],
    relatedHerbs: ['Cốt toái bổ', 'Đỗ trọng', 'Đinh lăng'],
    healthTips: ['Bổ sung đầy đủ canxi trong thai kỳ và sau sinh', 'Tập bài tập sàn chậu Kegel để bảo vệ đáy chậu']
  },

  // ==========================================
  // 02. 💪 HỆ CƠ (MUSCULAR)
  // ==========================================
  {
    id: 'musc_system_overview',
    code: 'MUSCULAR_SYSTEM',
    name_vi: 'Hệ thống Cơ bắp toàn thân',
    name_latin: 'Systema Musculare',
    name_en: 'Muscular System',
    systemId: 'MUSCULAR',
    gender: 'both',
    category: 'general',
    hotspot: { top: '30%', left: '38%' },
    definition: 'Hệ cơ gồm hơn 600 cơ vân, cơ tim và cơ trơn, chiếm khoảng 40% trọng lượng cơ thể, có khả năng co giãn tạo lực vận động, duy trì tư thế và sản sinh nhiệt.',
    location: 'Phân bố rộng khắp toàn bộ cơ thể từ đầu mặt đến các ngón chân.',
    illustrationUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&q=80&w=800',
    structures: [
      { name: 'Cơ đầu mặt & Cơ cổ', detail: 'Cơ thái dương, cơ cắn, cơ ức đòn chũm, cơ bám da mặt.' },
      { name: 'Cơ thân mình (Ngực, Bụng, Lưng)', detail: 'Cơ ngực lớn, cơ thẳng bụng, cơ chéo bụng, cơ lưng rộng, cơ thang, cơ hoành.' },
      { name: 'Cơ chi trên (Vai & Tay)', detail: 'Cơ delta, cơ nhị đầu cánh tay (chuột tay), cơ tam đầu, cơ cẳng tay, cơ bàn tay.' },
      { name: 'Cơ chi dưới (Mông & Chân)', detail: 'Cơ mông lớn, cơ tứ đầu đùi, cơ gân kheo (hamstrings), cơ bụng chân (bắp chuối).' }
    ],
    functions: [
      'Tạo vận động chủ động và các cử động tinh vi',
      'Duy trì tư thế thăng bằng và ổn định khớp',
      'Tạo nhiệt lượng duy trì thân nhiệt (khoảng 85% nhiệt lượng cơ thể)',
      'Hỗ trợ hô hấp (cơ hoành, cơ liên sườn) và lưu thông máu tĩnh mạch'
    ],
    commonDiseases: ['Căng cơ / Rách cơ do quá tải', 'Viêm cơ', 'Teo cơ do ít vận động', 'Chuột rút (vọp bẻ)', 'Viêm gân (viêm gân gót, viêm gân bánh chè)', 'Đau cơ xơ hóa (Fibromyalgia)'],
    criticalDiseases: ['Loạn dưỡng cơ Duchenne', 'Tiêu cơ vân cấp (Rhabdomyolysis gây suy thận)', 'Đứt hoàn toàn gân cơ lớn'],
    commonSymptoms: ['Đau cơ sau vận động nặng (DOMS)', 'Co rút cơ cứng ngắc đột ngột', 'Yếu cơ không nhấc được tay chân', 'Sưng bầm tím vùng cơ tổn thương'],
    emergencyWarning: 'Đau cơ dữ dội sau tập luyện quá mức kèm nước tiểu màu sẫm như nước ngọt coca-cola là Tiêu cơ vân cấp cần cấp cứu truyền dịch ngay!',
    redFlags: ['Nước tiểu màu đỏ sẫm / nâu đen sau tập nặng', 'Yếu liệt cơ tiến triển lan dần từ chân lên ngực', 'Đau cơ kèm sốt cao'],
    aiQuestionSuggestions: [
      'Làm thế nào để xử lý nhanh cơn chuột rút bắp chân ban đêm?',
      'Cách phân biệt đau mỏi cơ thông thường (DOMS) và rách cơ do tập gym?',
      'Thực phẩm nào giúp phục hồi và phát triển cơ bắp hiệu quả?'
    ],
    relatedHerbs: ['Ngải cứu chườm ấm', 'Gừng tươi ngâm rượu', 'Lá lốt xông bóp'],
    healthTips: ['Khởi động làm nóng kỹ 10 phút trước khi chơi thể thao', 'Uống đủ nước và bổ sung điện giải magie, kali khi tập luyện']
  },

  // ==========================================
  // 03. 🧠 HỆ THẦN KINH (NERVOUS)
  // ==========================================
  {
    id: 'nerv_brain',
    code: 'BRAIN_CORE',
    name_vi: 'Não bộ & Thần kinh trung ương',
    name_latin: 'Encephalon et Medulla Spinalis',
    name_en: 'Brain & Spinal Cord',
    systemId: 'NERVOUS',
    gender: 'both',
    category: 'head',
    hotspot: { top: '8%', left: '50%' },
    definition: 'Hệ thần kinh gồm Thần kinh trung ương (Não bộ, Tủy sống) và Thần kinh ngoại biên (12 đôi dây thần kinh sọ, 31 đôi dây thần kinh tủy), điều khiển toàn bộ suy nghĩ, cảm giác và hành vi cơ thể.',
    location: 'Nằm trong hộp sọ và ống sống cột sống, tỏa các nhánh dây thần kinh đến mọi cơ quan.',
    illustrationUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=800',
    model3dUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
    structures: [
      { name: 'Đại não (4 Thùy)', detail: 'Thùy trán (vận động, tư duy), thùy đỉnh (cảm giác), thùy thái dương (trí nhớ, nghe), thùy chẩm (thị giác).' },
      { name: 'Tiểu não & Thân não', detail: 'Tiểu não phối hợp thăng bằng; thân não điều khiển nhịp tim, nhịp thở tự động.' },
      { name: 'Tủy sống & Thần kinh ngoại biên', detail: 'Đường dẫn truyền xung thần kinh 2 chiều giữa não và các cơ quan.' }
    ],
    functions: [
      'Nhận và xử lý thông tin giác quan từ môi trường',
      'Điều khiển vận động chủ động và phản xạ vô điều kiện',
      'Trung tâm ngôn ngữ, trí nhớ, cảm xúc, tư duy logic',
      'Điều khiển tự động các hoạt động sống (nhịp tim, huyết áp, tiêu hóa)'
    ],
    commonDiseases: ['Đau đầu / Migraine', 'Bệnh thần kinh ngoại biên', 'Động kinh', 'Bệnh Parkinson', 'Sa sút trí tuệ Alzheimer', 'Rối loạn tiền đình'],
    criticalDiseases: ['Đột quỵ não (Nhồi máu não / Xuất huyết não)', 'Viêm màng não mủ', 'Chấn thương sọ não - tủy sống cấp'],
    commonSymptoms: ['Méo miệng, tê yếu nửa người', 'Nói đớ, khó diễn đạt', 'Chóng mặt quay cuồng', 'Đau đầu dữ dội đột ngột', 'Run tay chân lúc nghỉ'],
    emergencyWarning: 'Nhớ dấu hiệu F.A.S.T: Mặt méo (Face), Tay yếu (Arm), Nói khó (Speech), Thời gian vàng 4.5h (Time) để gọi cấp cứu 115 điều trị đột quỵ não!',
    redFlags: ['Méo mặt, yếu tay chân đột ngột', 'Nói ngọng, nhìn mờ một bên', 'Co giật toàn thân', 'Đau đầu sét đánh dữ dội'],
    aiQuestionSuggestions: [
      'Cách phân biệt đau đầu căng thẳng thông thường và dấu hiệu tai biến mạch máu não?',
      'Người nhà bị co giật động kinh thì cần sơ cứu và tránh làm điều gì?',
      'Thực phẩm bổ não và bài tập tăng cường trí nhớ cho người cao tuổi?'
    ],
    relatedHerbs: ['Bạch quả (Ginkgo Biloba)', 'Đinh lăng', 'Hoa tam thất', 'Lạc tiên'],
    healthTips: ['Kiểm soát tốt huyết áp và đường huyết', 'Ngủ đủ 7-8 tiếng mỗi đêm', 'Tập thể dục nhịp điệu kích thích tế bào thần kinh mới']
  },

  // ==========================================
  // 04. ❤️ HỆ TUẦN HOÀN (CARDIOVASCULAR)
  // ==========================================
  {
    id: 'circ_heart',
    code: 'HEART',
    name_vi: 'Trái tim & Hệ Mạch máu',
    name_latin: 'Cor et Systema Cardiovasculare',
    name_en: 'Heart & Blood Vessels',
    systemId: 'CARDIOVASCULAR',
    gender: 'both',
    category: 'chest',
    hotspot: { top: '32%', left: '52%' },
    definition: 'Hệ tuần hoàn gồm quả tim và mạng lưới mạch máu (động mạch, tĩnh mạch, mao mạch) cùng dòng máu lưu thông liên tục, vận chuyển oxy, dưỡng chất đến tế bào và mang chất thải đi đào thải.',
    location: 'Tim nằm trong trung thất giữa lồng ngực hơi lệch sang trái; hệ mạch máu phân nhánh khắp toàn thân.',
    illustrationUrl: 'https://images.unsplash.com/photo-1628595351029-c2bf17511435?auto=format&fit=crop&q=80&w=800',
    structures: [
      { name: '4 Buồng tim', detail: 'Tâm nhĩ phải, tâm thất phải (tuần hoàn phổi); Tâm nhĩ trái, tâm thất trái (tuần hoàn hệ thống).' },
      { name: '4 Van tim sinh học', detail: 'Van 3 lá, van 2 lá, van động mạch chủ, van động mạch phổi đóng mở theo nhịp.' },
      { name: 'Mạch máu & Máu', detail: 'Động mạch chủ, động mạch vành nuôi tim, tĩnh mạch chủ, mao mạch và các tế bào máu.' }
    ],
    functions: [
      'Bơm máu giàu oxy đến nuôi dưỡng toàn bộ cơ quan trong cơ thể',
      'Đưa máu nghèo oxy lên phổi để trao đổi khí',
      'Vận chuyển hormone, kháng thể, chất dinh dưỡng và duy trì huyết áp ổn định'
    ],
    commonDiseases: ['Tăng huyết áp', 'Bệnh mạch vành', 'Suy tim', 'Rối loạn nhịp tim (Rung nhĩ, ngoại tâm thu)', 'Bệnh van tim (hẹp/hở van)', 'Xơ vữa động mạch', 'Giãn tĩnh mạch chi dưới'],
    criticalDiseases: ['Nhồi máu cơ tim cấp', 'Bóc tách động mạch chủ', 'Ngừng tim đột ngột', 'Huyết khối tắc mạch'],
    commonSymptoms: ['Đau thắt ngực hoặc đè nặng sau xương ức', 'Khó thở khi gắng sức hoặc khi nằm phẳng', 'Hồi hộp, tim đập nhanh hoặc bỏ nhịp', 'Phù mu bàn chân'],
    emergencyWarning: 'Đau thắt ngực dữ dội như bóp nghẹt kéo dài > 15 phút lan ra cánh tay trái, cổ, hàm kèm khó thở, vã mồ hôi hột là Nhồi máu cơ tim cần gọi 115 ngay!',
    redFlags: ['Cơn đau thắt ngực đè bẹp ngực', 'Ngất xỉu đột ngột', 'Khó thở dồn dập kèm ho khạc bọt hồng', 'Mạch đập > 150 hoặc < 40 lần/phút'],
    aiQuestionSuggestions: [
      'Chỉ số huyết áp bao nhiêu là cao và khi nào cần uống thuốc?',
      'Cách phân biệt cơn đau thắt ngực do bệnh mạch vành và đau dây thần kinh liên sườn?',
      'Chế độ ăn giảm cholesterol phòng ngừa xơ vữa động mạch?'
    ],
    relatedHerbs: ['Hoa tam thất', 'Đan sâm', 'Giảo cổ lam', 'Nấm linh chi'],
    healthTips: ['Ăn giảm muối (dưới 5g muối/ngày)', 'Kiêng thuốc lá hoàn toàn', 'Đo huyết áp định kỳ tại nhà']
  },

  // ==========================================
  // 05. 🫁 HỆ HÔ HẤP (RESPIRATORY)
  // ==========================================
  {
    id: 'resp_lungs',
    code: 'LUNGS_AIRWAY',
    name_vi: 'Hệ Hô hấp (Đường thở & Hai lá phổi)',
    name_latin: 'Systema Respiratorium',
    name_en: 'Respiratory System',
    systemId: 'RESPIRATORY',
    gender: 'both',
    category: 'chest',
    hotspot: { top: '30%', left: '46%' },
    definition: 'Hệ hô hấp gồm đường dẫn khí (mũi, khoang mũi, hầu, thanh quản, khí quản, phế quản) và cơ quan trao đổi khí (hai lá phổi, phế nang) cùng cơ hoành tham gia động tác thở.',
    location: 'Kéo dài từ mũi, vùng cổ họng xuống trọn trong lồng ngực.',
    illustrationUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&q=80&w=800',
    structures: [
      { name: 'Đường hô hấp trên', detail: 'Mũi, khoang mũi, hầu họng, thanh quản (dây thanh âm).' },
      { name: 'Đường hô hấp dưới', detail: 'Khí quản, phế quản chính, tiểu phế quản dẫn khí.' },
      { name: 'Hai lá phổi & Phế nang', detail: 'Khoảng 300-500 triệu phế nang nơi diễn ra trao đổi khí O2 và CO2.' },
      { name: 'Cơ hoành & Cơ hô hấp', detail: 'Vòm cơ chính ngăn cách ngực - bụng, hạ xuống khi hít vào.' }
    ],
    functions: [
      'Đưa oxy từ không khí vào máu nuôi dưỡng tế bào',
      'Loại bỏ khí carbon dioxide (CO2) ra khỏi cơ thể',
      'Tham gia điều hòa cân bằng acid - base (pH) trong máu',
      'Phát âm thanh tiếng nói tại thanh quản'
    ],
    commonDiseases: ['Viêm mũi', 'Viêm xoang', 'Viêm họng', 'Viêm thanh quản', 'Viêm phế quản', 'Viêm phổi', 'Hen phế quản (Suyễn)', 'COPD (Bệnh phổi tắc nghẽn mạn tính)', 'Lao phổi'],
    criticalDiseases: ['Cơn hen phế quản ác tính', 'Tràn khí màng phổi tự phát', 'Suy hô hấp cấp tính', 'Ung thư phổi'],
    commonSymptoms: ['Ho khan hoặc ho có đờm', 'Khó thở, thở khò khè hoặc rít', 'Đau tức ngực khi thở sâu', 'Sốt, ớn lạnh', 'Mất giọng, khàn tiếng'],
    emergencyWarning: 'Khó thở dữ dội, thở co kéo hõm ức, môi và đầu ngón tay tím tái, nói không trọn câu cần cho thở oxy và gọi cấp cứu 115 khẩn cấp!',
    redFlags: ['Khó thở cấp tính, thở rít thì hít vào', 'Ho khạc ra máu tươi', 'SpO2 tụt dưới 92%', 'Môi tím tái, ý thức lơ mơ'],
    aiQuestionSuggestions: [
      'Người bị hen phế quản cần xử trí thế nào khi lên cơn khó thở cấp tại nhà?',
      'Cách phân biệt viêm phế quản thông thường và viêm phổi?',
      'Tập bài tập thở bụng (thở cơ hoành) thế nào để tăng dung tích phổi?'
    ],
    relatedHerbs: ['Xuyên tâm liên', 'Kinh giới', 'Tía tô', 'Bách bộ', 'Cát cánh'],
    healthTips: ['Tránh xa khói thuốc lá chủ động và thụ động', 'Đeo khẩu trang khi ra đường nhiều khói bụi', 'Tiêm vắc xin cúm và phế cầu định kỳ']
  },

  // ==========================================
  // 06. 🥗 HỆ TIÊU HÓA (DIGESTIVE)
  // ==========================================
  {
    id: 'digest_system',
    code: 'DIGESTIVE_SYSTEM',
    name_vi: 'Hệ Tiêu hóa (Ống tiêu hóa & Gan Mật Tụy)',
    name_latin: 'Systema Digestorium',
    name_en: 'Digestive System',
    systemId: 'DIGESTIVE',
    gender: 'both',
    category: 'abdomen',
    hotspot: { top: '46%', left: '50%' },
    definition: 'Hệ tiêu hóa gồm ống tiêu hóa dài khoảng 9m (miệng, thực quản, dạ dày, ruột non, ruột già, hậu môn) và các cơ quan phụ trợ (gan, túi mật, tụy) đảm nhiệm biến đổi thức ăn thành năng lượng nuôi cơ thể.',
    location: 'Trải dài từ miệng qua lồng ngực xuống toàn bộ ổ bụng đến hậu môn.',
    illustrationUrl: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&q=80&w=800',
    structures: [
      { name: 'Khoang miệng & Thực quản', detail: 'Răng nghiền nát, lưỡi nhào trộn và thực quản đưa thức ăn xuống dạ dày.' },
      { name: 'Dạ dày & Ruột non', detail: 'Dạ dày co bóp tiết axit; ruột non (tá tràng, hỗng tràng, hồi tràng) hấp thu chất dinh dưỡng.' },
      { name: 'Ruột già & Hậu môn', detail: 'Manh tràng, đại tràng (lên, ngang, xuống, sigma), trực tràng và hậu môn hấp thu nước và thải phân.' },
      { name: 'Cơ quan phụ trợ', detail: 'Gan (lọc độc, tiết mật), Túi mật (dự trữ mật), Tuyến tụy (tiết men tiêu hóa đạm, mỡ, đường).' }
    ],
    functions: [
      'Tiếp nhận và nghiền nát thức ăn',
      'Tiêu hóa thức ăn thành các dưỡng chất cơ bản',
      'Hấp thu chất dinh dưỡng và nước vào máu',
      'Tạo và đào thải bã cặn sinh học ra ngoài qua phân'
    ],
    commonDiseases: ['Trào ngược dạ dày thực quản (GERD)', 'Viêm loét dạ dày tá tràng', 'Hội chứng ruột kích thích (IBS)', 'Táo bón / Tiêu chảy', 'Gan nhiễm mỡ', 'Viêm gan virus', 'Sỏi mật', 'Viêm tụy'],
    criticalDiseases: ['Xuất huyết tiêu hóa (Nôn ra máu, đi ngoài phân đen)', 'Thủng dạ dày / Viêm ruột thừa vỡ', 'Ung thư đại trực tràng / Ung thư gan'],
    commonSymptoms: ['Đau bụng thượng vị hoặc hố chậu phải', 'Ợ chua, ợ nóng rát cổ', 'Đầy trướng bụng khó tiêu', 'Vàng da, vàng mắt', 'Rối loạn đại tiện'],
    emergencyWarning: 'Đau bụng dữ dội đột ngột (bụng cứng như gỗ), nôn ra máu tươi hoặc đi ngoài phân đen như bã cà phê cần đi cấp cứu ngay!',
    redFlags: ['Nôn ra máu tươi', 'Đi ngoài phân đen hôi tanh', 'Đau hố chậu phải kèm sốt (viêm ruột thừa)', 'Vàng da sậm kèm sốt rét run'],
    aiQuestionSuggestions: [
      'Tôi bị trào ngược dạ dày ợ chua rát ngực nhiều năm, có cách nào điều trị dứt điểm?',
      'Men gan cao và gan nhiễm mỡ độ 1 cần ăn uống, kiêng cữ gì?',
      'Dấu hiệu nhận biết sớm viêm ruột thừa cấp?'
    ],
    relatedHerbs: ['Nghệ vàng (Curcumin)', 'Chè dây', 'Lá khôi tía', 'Diệp hạ châu (Chó đẻ)', 'Atiso'],
    healthTips: ['Ăn chín uống sôi, chia nhỏ bữa ăn, không ăn quá no sát giờ ngủ', 'Ăn nhiều rau xanh chất xơ và uống đủ 2 lít nước mỗi ngày', 'Hạn chế tối đa rượu bia']
  },

  // ==========================================
  // 07. 💧 HỆ TIẾT NIỆU (URINARY)
  // ==========================================
  {
    id: 'urin_kidneys',
    code: 'URINARY_SYSTEM',
    name_vi: 'Hệ Tiết niệu (Thận & Đường tiết niệu)',
    name_latin: 'Systema Urinarium',
    name_en: 'Urinary System',
    systemId: 'URINARY',
    gender: 'both',
    category: 'abdomen',
    hotspot: { top: '48%', left: '44%' },
    definition: 'Hệ tiết niệu gồm hai quả thận (chứa hàng triệu đơn vị nephron), hai niệu quản, bàng quang và niệu đạo, đảm nhiệm lọc máu liên tục, tạo nước tiểu và duy trì cân bằng nội môi.',
    location: 'Hai quả thận nằm sau phúc mạc hai bên cột sống thắt lưng; bàng quang nằm trong hố chậu bé.',
    illustrationUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800',
    structures: [
      { name: 'Thận phải & Thận trái', detail: 'Hình hạt đậu, chứa khoảng 2 triệu đơn vị lọc máu Nephron.' },
      { name: 'Hai niệu quản', detail: 'Hai ống cơ trơn dẫn nước tiểu từ bể thận xuống bàng quang.' },
      { name: 'Bàng quang', detail: 'Túi cơ rỗng chứa nước tiểu (dung tích khoảng 300 - 500ml).' },
      { name: 'Niệu đạo', detail: 'Ống dẫn nước tiểu ra ngoài (niệu đạo nam dài hơn niệu đạo nữ).' }
    ],
    functions: [
      'Lọc máu liên tục đào thải urê, creatinin và các chất độc hại',
      'Tạo nước tiểu và điều hòa lượng nước, điện giải (Natri, Kali)',
      'Tham gia điều hòa huyết áp qua hệ thống Renin-Angiotensin',
      'Kích thích tủy xương sinh hồng cầu qua hormone Erythropoietin'
    ],
    commonDiseases: ['Sỏi thận / Sỏi niệu quản', 'Nhiễm trùng đường tiết niệu (Viêm bàng quang)', 'Viêm cầu thận', 'Nang thận', 'Tiểu đêm, tiểu buốt, tiểu rắt'],
    criticalDiseases: ['Suy thận cấp / Suy thận mạn tính giai đoạn cuối', 'Ung thư thận / Ung thư bàng quang', 'Cơn đau quặn thận tắc nghẽn'],
    commonSymptoms: ['Đau quặn thắt lưng lan xuống bẹn', 'Tiểu buốt, tiểu rắt, tiểu nhiều lần', 'Nước tiểu đục hoặc có máu', 'Phù mặt, phù mi mắt buổi sáng'],
    emergencyWarning: 'Cơn đau quặn thận dữ dội lăn lộn hoặc đột ngột vô niệu (không có giọt nước tiểu nào suốt 24h) kèm phù to là cấp cứu thận khẩn cấp!',
    redFlags: ['Vô niệu hoàn toàn (không tiểu được)', 'Tiểu ra máu đỏ tươi toàn bãi', 'Sốt cao rét run kèm đau hông lưng'],
    aiQuestionSuggestions: [
      'Tôi bị sỏi thận kích thước 6mm thì uống nước và thuốc nam có tự tan được không?',
      'Cách phân biệt đau thắt lưng do thận và đau lưng do thoái hóa cột sống?',
      'Những xét nghiệm nào giúp đánh giá chính xác chức năng thận?'
    ],
    relatedHerbs: ['Kim tiền thảo', 'Râu ngô', 'Bông mã đề', 'Cỏ tranh'],
    healthTips: ['Uống đủ 2 - 2.5 lít nước mỗi ngày để phòng ngừa sỏi thận', 'Không nhịn tiểu quá lâu', 'Hạn chế ăn quá mặn và lạm dụng thuốc giảm đau NSAIDs']
  },

  // ==========================================
  // 08. 🧬 HỆ NỘI TIẾT (ENDOCRINE)
  // ==========================================
  {
    id: 'endo_glands',
    code: 'ENDOCRINE_SYSTEM',
    name_vi: 'Hệ Nội tiết (Các Tuyến Nội tiết)',
    name_latin: 'Systema Endocrinum',
    name_en: 'Endocrine System',
    systemId: 'ENDOCRINE',
    gender: 'both',
    category: 'general',
    hotspot: { top: '20%', left: '50%' },
    definition: 'Hệ nội tiết gồm các tuyến không ống dẫn tiết hormone trực tiếp vào máu để điều hòa tăng trưởng, chuyển hóa năng lượng, sinh sản và đáp ứng stress.',
    location: 'Phân bố rải rác trong cơ thể: vùng dưới đồi/tuyến yên ở não, tuyến giáp ở cổ, tuyến thượng thận ở bụng, tuyến sinh dục ở chậu.',
    illustrationUrl: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&q=80&w=800',
    structures: [
      { name: 'Tuyến yên & Tuyến tùng', detail: 'Tuyến chỉ huy ở nền não điều hòa các tuyến khác và nhịp sinh học melatonin.' },
      { name: 'Tuyến giáp & Cận giáp', detail: 'Hình cánh bướm ở trước cổ điều hòa chuyển hóa và nồng độ canxi máu.' },
      { name: 'Tuyến ức & Tuyến thượng thận', detail: 'Tuyến thượng thận tiết cortisol chống stress và adrenalin tăng nhịp tim.' },
      { name: 'Tuyến tụy nội tiết', detail: 'Các tiểu đảo Langerhans tiết Insulin hạ đường huyết và Glucagon.' },
      { name: 'Tuyến sinh dục', detail: 'Buồng trứng (nữ tiết estrogen/progesterone) & Tinh hoàn (nam tiết testosterone).' }
    ],
    functions: [
      'Điều hòa tăng trưởng và phát triển cơ thể',
      'Kiểm soát chuyển hóa năng lượng và đường huyết',
      'Duy trì cân bằng nước, muối khoáng và huyết áp',
      'Điều hòa chức năng sinh sản và phản ứng stress'
    ],
    commonDiseases: ['Đái tháo đường (Tiểu đường Type 1 & 2)', 'Suy giáp', 'Cường giáp (Bệnh Basedow)', 'Bướu cổ đơn thuần / Nhân tuyến giáp', 'Rối loạn hormone sinh dục', 'Hội chứng Cushing'],
    criticalDiseases: ['Hôn mê do tăng đường huyết / Hạ đường huyết cấp tính', 'Cơn bão giáp trạng', 'Suy tuyến thượng thận cấp'],
    commonSymptoms: ['Khát nhiều, uống nhiều, tiểu nhiều, sụt cân nhanh', 'Hồi hộp đánh trống ngực, tay run, mắt lồi (cường giáp)', 'Mệt mỏi, sợ lạnh, tăng cân, rụng tóc (suy giáp)', 'Cổ to phình bất thường'],
    emergencyWarning: 'Vã mồ hôi lạnh, run rẩy, lú lẫn do hạ đường huyết hoặc sốt cao mê sảng trong cơn bão giáp cần cấp cứu y tế ngay!',
    redFlags: ['Hạ đường huyết tụt ý thức', 'Sốt cao co giật ở người bệnh bướu Basedow', 'Tụt huyết áp trụy mạch đột ngột'],
    aiQuestionSuggestions: [
      'Chỉ số đường huyết lúc đói và HbA1c bao nhiêu là bị tiểu đường?',
      'Nhân tuyến giáp TIRADS 3 có nguy cơ ung thư không và khi nào cần mổ?',
      'Chế độ ăn cho người bị suy giáp và cường giáp khác nhau thế nào?'
    ],
    relatedHerbs: ['Dây thìa canh', 'Giảo cổ lam', 'Khổ qua rừng', 'Hải tảo'],
    healthTips: ['Hạn chế tinh bột tinh chế và đường ngọt', 'Ăn muối iod vừa đủ', 'Khám kiểm tra chức năng tuyến giáp và đường huyết định kỳ']
  },

  // ==========================================
  // 09. 🛡️ HỆ MIỄN DỊCH – BẠCH HUYẾT (IMMUNE)
  // ==========================================
  {
    id: 'immune_system',
    code: 'IMMUNE_LYMPHATIC',
    name_vi: 'Hệ Miễn dịch – Bạch huyết',
    name_latin: 'Systema Lymphoideum et Immunitatis',
    name_en: 'Immune & Lymphatic System',
    systemId: 'IMMUNE_LYMPHATIC',
    gender: 'both',
    category: 'general',
    hotspot: { top: '36%', left: '56%' },
    definition: 'Hệ thống phòng thủ sinh học gồm các hạch, mạch bạch huyết, lách, tuyến ức, amidan và tủy xương giúp nhận diện, tiêu diệt vi sinh vật gây bệnh và dẫn lưu dịch mô.',
    location: 'Mạng lưới vi mạch và hạch trải rộng toàn thân (cổ, nách, bẹn, trung thất, ổ bụng).',
    illustrationUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=800',
    structures: [
      { name: 'Hạch bạch huyết & Mạch bạch huyết', detail: 'Các trạm lọc vi khuẩn tại cổ, nách, bẹn và mạng lưới thu gom dịch mô.' },
      { name: 'Lách (Spleen)', detail: 'Nằm ở hạ sườn trái, lọc máu tiêu hủy hồng cầu già và dự trữ tế bào miễn dịch.' },
      { name: 'Tuyến ức & Tủy xương', detail: 'Nơi sinh ra và huấn luyện các tế bào lympho T và lympho B.' },
      { name: 'Amidan & V.A', detail: 'Vòng bạch huyết Waldeyer bảo vệ cửa ngõ họng hầu.' }
    ],
    functions: [
      'Bảo vệ cơ thể chống lại vi khuẩn, virus, nấm và ký sinh trùng',
      'Nhận diện và tiêu diệt các tế bào ung thư đột biến bất thường',
      'Vận chuyển tế bào bạch cầu và tuần hoàn dịch bạch huyết',
      'Dẫn lưu dịch kẽ mô ngăn ngừa phù nề'
    ],
    commonDiseases: ['Viêm hạch / Sưng hạch phản ứng', 'Viêm amidan cấp / mạn tính', 'Dị ứng / Viêm mũi dị ứng', 'Bệnh tự miễn (Lupus ban đỏ, Viêm khớp dạng thấp)', 'Suy giảm miễn dịch'],
    criticalDiseases: ['U lympho ác tính (Bệnh Hodgkin / Non-Hodgkin)', 'Sốc phản vệ nguy kịch', 'Nhiễm trùng huyết'],
    commonSymptoms: ['Nổi hạch sưng đau ở cổ, nách, bẹn', 'Sốt kéo dài không rõ nguyên nhân', 'Amidan sưng đỏ có mủ', 'Dị ứng nổi mề đay ngứa ngáy', 'Hay bị nhiễm trùng tái diễn'],
    emergencyWarning: 'Khó thở phù nề thanh quản, tụt huyết áp sau khi tiếp xúc dị nguyên (thuốc, thức ăn, ong đốt) là Sốc phản vệ cần tiêm Adrenalin cấp cứu 115 ngay!',
    redFlags: ['Khó thở nghẹt họng sau dị ứng', 'Hạch to cứng chắc không đau dính chặt', 'Sốt sụt cân đổ mồ hôi trộm ban đêm'],
    aiQuestionSuggestions: [
      'Nổi hạch ở góc hàm sưng đau khi bị viêm họng có nguy hiểm không?',
      'Cách tăng cường hệ miễn dịch tự nhiên cho cơ thể?',
      'Làm thế nào để phân biệt hạch viêm lành tính và hạch ác tính?'
    ],
    relatedHerbs: ['Nấm linh chi', 'Hoàng kỳ', 'Tỏi đen', 'Kim ngân hoa', 'Xạ đen'],
    healthTips: ['Tiêm chủng vắc xin đầy đủ theo khuyến cáo y tế', 'Ngủ đủ giấc và giữ tinh thần lạc quan để hệ miễn dịch hoạt động tối ưu']
  },

  // ==========================================
  // 10. ⚥ HỆ SINH SẢN (REPRODUCTIVE)
  // ==========================================
  // 10.1 Nam
  {
    id: 'repro_male',
    code: 'REPRO_MALE',
    name_vi: 'Hệ Sinh sản Nam',
    name_latin: 'Systema Genitale Masculinum',
    name_en: 'Male Reproductive System',
    systemId: 'REPRODUCTIVE',
    gender: 'male',
    category: 'pelvis',
    hotspot: { top: '58%', left: '50%' },
    definition: 'Hệ sinh sản nam gồm tinh hoàn, mào tinh, ống dẫn tinh, túi tinh, tuyến tiền liệt, dương vật và niệu đạo, đảm nhiệm sản xuất tinh trùng và hormone nam testosterone.',
    location: 'Nằm ở vùng đáy chậu và hố chậu bé nam giới.',
    illustrationUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=800',
    structures: [
      { name: 'Tinh hoàn & Mào tinh', detail: 'Nằm trong bìu, sản xuất tinh trùng và nội tiết tố testosterone.' },
      { name: 'Ống dẫn tinh & Túi tinh', detail: 'Vận chuyển tinh trùng và tiết dịch nuôi dưỡng tinh trùng.' },
      { name: 'Tuyến tiền liệt', detail: 'Ôm quanh đoạn đầu niệu đạo, tiết dịch kiềm hóa tinh dịch.' },
      { name: 'Dương vật & Niệu đạo', detail: 'Cơ quan giao hợp và đường dẫn chung cho nước tiểu và tinh dịch.' }
    ],
    functions: [
      'Sản xuất và lưu trữ tinh trùng phục vụ sinh sản',
      'Sản xuất hormone testosterone duy trì sinh lý và đặc tính phái mạnh',
      'Tham gia hoạt động tình dục và xuất tinh'
    ],
    commonDiseases: ['Viêm tinh hoàn / Mào tinh hoàn', 'Giãn tĩnh mạch thừng tinh', 'Viêm tuyến tiền liệt', 'Phì đại lành tính tuyến tiền liệt (BPH)', 'Rối loạn cương dương', 'Vô sinh nam'],
    criticalDiseases: ['Xoắn tinh hoàn (Cấp cứu tháo xoắn trong 6h)', 'Ung thư tuyến tiền liệt', 'Ung thư tinh hoàn'],
    commonSymptoms: ['Đau sưng tức vùng bìu', 'Tiểu khó, tiểu ngập ngừng, tiểu đêm nhiều lần', 'Đau buốt khi xuất tinh', 'Suy giảm ham muốn'],
    emergencyWarning: 'Đau dữ dội đột ngột một bên tinh hoàn kèm sưng to là Xoắn tinh hoàn cấp cứu ngoại khoa trong 6 giờ đầu để tránh hoại tử phải cắt bỏ!',
    redFlags: ['Đau tinh hoàn cấp tính dữ dội', 'Khối u cục cứng chắc bất thường ở tinh hoàn', 'Bí tiểu cấp bàng quang căng trướng'],
    aiQuestionSuggestions: [
      'Phì đại tuyến tiền liệt ở nam giới lớn tuổi điều trị bằng thuốc hay phẫu thuật?',
      'Giãn tĩnh mạch thừng tinh có ảnh hưởng đến chất lượng tinh trùng không?',
      'Cách cải thiện nồng độ testosterone tự nhiên ở nam giới?'
    ],
    relatedHerbs: ['Dâm dương hoắc', 'Ba kích', 'Nhục thung dung', 'Nấm ngọc cẩu', 'Sâm cau'],
    healthTips: ['Tránh mặc đồ lót quá chật bó sát', 'Khám sàng lọc PSA tiền liệt tuyến cho nam giới trên 50 tuổi']
  },

  // 10.2 Nữ
  {
    id: 'repro_female',
    code: 'REPRO_FEMALE',
    name_vi: 'Hệ Sinh sản Nữ',
    name_latin: 'Systema Genitale Femininum',
    name_en: 'Female Reproductive System',
    systemId: 'REPRODUCTIVE',
    gender: 'female',
    category: 'pelvis',
    hotspot: { top: '58%', left: '50%' },
    definition: 'Hệ sinh sản nữ gồm buồng trứng, vòi trứng, tử cung, cổ tử cung, âm đạo và âm hộ, đảm nhiệm sản xuất trứng, hormone nữ, thụ tinh, mang thai và sinh nở.',
    location: 'Nằm trong hố chậu bé nữ giới giữa bàng quang phía trước và trực tràng phía sau.',
    illustrationUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=800',
    structures: [
      { name: 'Hai buồng trứng', detail: 'Sản xuất noãn (trứng) và hormone estrogen, progesterone.' },
      { name: 'Vòi trứng (Ống dẫn trứng)', detail: 'Nơi diễn ra quá trình thụ tinh giữa tinh trùng và trứng.' },
      { name: 'Tử cung & Nội mạc tử cung', detail: 'Nơi phôi thai làm tổ và phát triển trong 9 tháng thai kỳ.' },
      { name: 'Cổ tử cung, Âm đạo, Âm hộ', detail: 'Đường sinh dục dưới tiếp nhận tinh trùng và đường ra của thai nhi.' }
    ],
    functions: [
      'Sản xuất trứng và điều hòa chu kỳ kinh nguyệt',
      'Tạo môi trường thụ thai, nuôi dưỡng thai nhi và sinh con',
      'Sản xuất hormone sinh dục nữ duy trì nét thanh xuân và vóc dáng'
    ],
    commonDiseases: ['U xơ tử cung', 'Lạc nội mạc tử cung', 'U nang buồng trứng', 'Hội chứng buồng trứng đa nang (PCOS)', 'Viêm vùng chậu (PID)', 'Viêm âm đạo / Viêm cổ tử cung'],
    criticalDiseases: ['Chửa ngoài tử cung vỡ (Chảy máu ồ ạt trong ổ bụng)', 'Ung thư cổ tử cung', 'Ung thư buồng trứng', 'Ung thư nội mạc tử cung'],
    commonSymptoms: ['Rối loạn kinh nguyệt (rong kinh, thưa kinh)', 'Đau bụng dưới quằn quại khi hành kinh', 'Khí hư bất thường có mùi hôi', 'Chảy máu âm đạo bất thường'],
    emergencyWarning: 'Phụ nữ độ tuổi sinh sản trễ kinh bị đau bụng dưới dữ dội đột ngột kèm hoa mắt chóng mặt là Chửa ngoài tử cung vỡ cần cấp cứu 115 lập tức!',
    redFlags: ['Đau bụng dưới dữ dội kèm ngất xỉu', 'Chảy máu âm đạo ồ ạt', 'Chảy máu âm đạo sau mãn kinh'],
    aiQuestionSuggestions: [
      'Kinh nguyệt không đều và buồng trứng đa nang thì có dễ thụ thai không?',
      'U xơ tử cung kích thước bao nhiêu thì cần phẫu thuật bóc tách?',
      'Khi nào nên tiêm phòng vắc xin HPV ngừa ung thư cổ tử cung?'
    ],
    relatedHerbs: ['Ích mẫu', 'Hương phụ (Cỏ gấu)', 'Ngải cứu', 'Đương quy', 'Trinh nữ hoàng cung'],
    healthTips: ['Khám phụ khoa và tầm soát tế bào cổ tử cung (Pap smear / HPV) định kỳ hàng năm', 'Vệ sinh vùng kín đúng cách']
  },

  // ==========================================
  // 11. 🧴 HỆ DA (INTEGUMENTARY)
  // ==========================================
  {
    id: 'skin_system',
    code: 'INTEGUMENTARY_SYSTEM',
    name_vi: 'Hệ Da & Phần phụ (Lông, Móng, Tuyến)',
    name_latin: 'Systema Integumentarium',
    name_en: 'Integumentary System',
    systemId: 'INTEGUMENTARY',
    gender: 'both',
    category: 'general',
    hotspot: { top: '25%', left: '60%' },
    definition: 'Hệ da là cơ quan lớn nhất cơ thể (diện tích ~2m²) gồm 3 lớp: Biểu bì, Trung bì, Hạ bì cùng các cấu trúc phụ (nang lông, móng, tuyến mồ hôi, tuyến bã nhờn) tạo hàng rào bảo vệ vững chắc.',
    location: 'Bao phủ toàn bộ bề mặt bên ngoài cơ thể.',
    illustrationUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=800',
    structures: [
      { name: 'Biểu bì (Epidermis)', detail: 'Lớp sừng bảo vệ ngoài cùng và tế bào hắc tố Melanin quyết định màu da.' },
      { name: 'Trung bì (Dermis)', detail: 'Mạng lưới sợi Collagen và Elastin đàn hồi, mạch máu và đầu mút thần kinh.' },
      { name: 'Hạ bì (Subcutis / Mỡ dưới da)', detail: 'Lớp mô mỡ đệm chống va đập cơ học và cách nhiệt.' },
      { name: 'Phần phụ của da', detail: 'Nang lông, móng tay/chân, tuyến mồ hôi điều nhiệt và tuyến bã nhờn giữ ẩm.' }
    ],
    functions: [
      'Bảo vệ cơ học, chống thấm nước và ngăn vi khuẩn xâm nhập',
      'Điều hòa thân nhiệt qua bài tiết mồ hôi và co giãn mạch máu',
      'Cảm nhận xúc giác (nóng, lạnh, đau, áp lực)',
      'Tổng hợp Vitamin D dưới tác động của ánh nắng mặt trời'
    ],
    commonDiseases: ['Mụn trứng cá', 'Viêm da cơ địa (Chàm / Eczema)', 'Vảy nến', 'Mề đay dị ứng', 'Nhiễm nấm da (hắc lào, lang ben)', 'Viêm nang lông'],
    criticalDiseases: ['Ung thư hắc tố da (Melanoma ác tính)', 'Hội chứng hoại tử thượng bì nhiễm độc (Lyell)', 'Bỏng diện rộng'],
    commonSymptoms: ['Ngứa ngáy, nổi mẩn đỏ', 'Bong tróc vảy da, khô nứt nẻ', 'Mụn mủ sưng đau', 'Nốt ruồi thay đổi màu sắc kích thước'],
    emergencyWarning: 'Nốt ruồi biến đổi nhanh theo quy tắc ABCDE (Bất đối xứng, Bờ nham nhở, Màu sắc loang lổ, Đường kính > 6mm, Tiến triển nhanh) cần khám chuyên khoa u bướu ngay!',
    redFlags: ['Phồng rộp bong tróc da toàn thân sau uống thuốc', 'Nốt ruồi loét chảy máu không lành', 'Mảng đỏ da lan nhanh kèm sốt cao'],
    aiQuestionSuggestions: [
      'Làm thế nào để phân biệt nốt ruồi lành tính và ung thư hắc tố da?',
      'Viêm da cơ địa tái đi tái lại nhiều lần thì chăm sóc da thế nào?',
      'Cách phục hồi hàng rào bảo vệ da bị tổn thương?'
    ],
    relatedHerbs: ['Rau má', 'Lá trầu không', 'Trà xanh', 'Lô hội (Nha đam)', 'Ké đầu ngựa'],
    healthTips: ['Bôi kem chống nắng phổ rộng SPF 30+ hàng ngày', 'Dưỡng ẩm da đầy đủ sau khi tắm', 'Uống đủ nước']
  },

  // ==========================================
  // 12. 👁️ GIÁC QUAN (SPECIAL SENSES)
  // ==========================================
  {
    id: 'senses_all',
    code: 'SPECIAL_SENSES',
    name_vi: 'Hệ Giác quan (Mắt, Tai, Mũi, Lưỡi & Xúc giác)',
    name_latin: 'Organa Sensuum',
    name_en: 'Special Sensory Organs',
    systemId: 'SPECIAL_SENSES',
    gender: 'both',
    category: 'head',
    hotspot: { top: '14%', left: '50%' },
    definition: 'Hệ giác quan gồm 5 giác quan đặc biệt: Thị giác (Mắt), Thính giác & Thăng bằng (Tai), Khứu giác (Mũi), Vị giác (Lưỡi) và Xúc giác (Thụ thể da) giúp tiếp nhận thế giới xung quanh.',
    location: 'Chủ yếu tập trung ở vùng đầu mặt và rải rác trên da toàn thân.',
    illustrationUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=800',
    structures: [
      { name: 'Mắt (Thị giác)', detail: 'Giác mạc, mống mắt, đồng tử, thủy tinh thể, võng mạc, hoàng điểm, dịch kính, dây thần kinh thị giác.' },
      { name: 'Tai (Thính giác & Thăng bằng)', detail: 'Tai ngoài (vành tai, ống tai, màng nhĩ), Tai giữa (chuỗi xương con, vòi nhĩ), Tai trong (ốc tai, tiền đình).' },
      { name: 'Mũi (Khứu giác)', detail: 'Hốc mũi, vách ngăn, cuốn mũi, niêm mạc khứu giác và xoang.' },
      { name: 'Lưỡi (Vị giác)', detail: 'Các nhú lưỡi chứa nụ vị giác cảm nhận ngọt, chua, mặn, đắng, umami.' },
      { name: 'Xúc giác (Thụ thể da)', detail: 'Các thụ thể Meissner, Pacini, thụ thể nhiệt, thụ thể đau truyền về não.' }
    ],
    functions: [
      'Thu nhận hình ảnh, ánh sáng và màu sắc thế giới',
      'Cảm nhận âm thanh và duy trì tư thế thăng bằng cơ thể',
      'Phân biệt mùi hương và hương vị thức ăn',
      'Cảm nhận va chạm, nhiệt độ và phản xạ cảnh báo nguy hiểm'
    ],
    commonDiseases: [
      'Mắt: Cận thị, viễn thị, loạn thị, đục thủy tinh thể, Glôcôm (cườm nước), thoái hóa điểm vàng, viêm kết mạc (đau mắt đỏ)',
      'Tai: Viêm tai giữa, ù tai, giảm thính lực, điếc, rối loạn tiền đình, chóng mặt kịch phát',
      'Mũi: Viêm mũi dị ứng, viêm xoang mạn tính, polyp mũi, mất khứu giác',
      'Lưỡi & Miệng: Viêm lưỡi bản đồ, loét miệng aphthous (nhiệt miệng), nấm miệng, rối loạn vị giác'
    ],
    criticalDiseases: ['Glôcôm góc đóng cấp tính (nguy cơ mù lòa vĩnh viễn trong 24h)', 'Bong võng mạc', 'Mất thính lực đột ngột', 'Viêm tai xương chũm biến chứng nội sọ'],
    commonSymptoms: ['Mắt nhìn mờ đột ngột hoặc thấy ruồi bay chớp sáng', 'Đau nhức mắt dữ dội lan lên nửa đầu', 'Ù tai, nghe kém, chóng mặt quay cuồng nhà cửa', 'Mất mùi, mất vị giác'],
    emergencyWarning: 'Đau nhức mắt dữ dội kèm nhìn mờ, thấy quầng tán sắc cầu vồng quanh bóng đèn hoặc đột ngột mất thị lực cần đi cấp cứu mắt ngay!',
    redFlags: ['Mắt mờ đột ngột không đau hoặc đau nhức dữ dội', 'Thấy màn đen che khuất tầm nhìn (bong võng mạc)', 'Mất thính lực đột ngột trong vài giờ'],
    aiQuestionSuggestions: [
      'Triệu chứng nhìn thấy đốm đen ruồi bay kèm chớp sáng có nguy hiểm không?',
      'Bị chóng mặt quay cuồng khi thay đổi tư thế là do tiền đình hay thiếu máu não?',
      'Cách bảo vệ mắt cho người làm việc máy tính nhiều giờ mỗi ngày?'
    ],
    relatedHerbs: ['Cúc hoa', 'Kỷ tử', 'Bạc hà', 'Hạt muồng (Thảo quyết minh)', 'Gừng'],
    healthTips: ['Áp dụng quy tắc 20-20-20 khi dùng màn hình điện tử', 'Không ngoáy tai bằng vật cứng', 'Khám mắt định kỳ hàng năm']
  }
];
