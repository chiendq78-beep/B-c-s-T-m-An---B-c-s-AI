import { ExerciseStepItem, YOGA_SPINE_CLINICAL_STEPS } from '../components/views/ActiveWorkoutModal';

export interface TherapyExercise {
  id: string;
  title: string;
  title_en?: string;
  category: 'cotsong' | 'timmach' | 'giamstress' | 'dotcalo' | 'thothieng' | 'all';
  categoryLabel: string;
  categoryLabel_en?: string;
  tag: string;
  tag_en?: string;
  duration: number; // minutes
  kcal: number;
  level: 'Nhẹ nhàng' | 'Vừa phải' | 'Nâng cao';
  image: string;
  description: string;
  description_en?: string;
  benefits: string[];
  steps: string[];
  structuredSteps?: ExerciseStepItem[];
  aliases?: string[];
}

export const THERAPY_EXERCISES: TherapyExercise[] = [
  {
    id: 'hero-yoga-spine',
    title: 'YOGA PHỤC HỒI CHUYÊN SÂU (CỘT SỐNG & ĐĨA ĐỆM)',
    title_en: 'Spine & Lumbar Therapeutic Yoga',
    category: 'cotsong',
    categoryLabel: 'Cột sống',
    categoryLabel_en: 'Spine & Back',
    tag: 'Giảm đau lưng & Thoát vị',
    tag_en: 'Spine Recovery',
    duration: 25,
    kcal: 180,
    level: 'Nhẹ nhàng',
    image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&q=80&w=1200',
    description: 'Liệu pháp giải phóng căng thẳng vùng cơ thắt lưng, giảm chèn ép đĩa đệm và tăng tính linh hoạt cột sống.',
    description_en: 'Clinical sequence releasing lumbar tension, decompressing intervertebral discs and enhancing spinal mobility.',
    benefits: [
      'Kéo giãn đốt sống L4-L5 và cột sống thắt lưng',
      'Giảm chèn ép dây thần kinh tọa và đau lan tỏa',
      'Củng cố nhóm cơ lõi và cơ dựng sống'
    ],
    steps: [
      '1. Con Mèo - Con Bò (Cat-Cow): 3 phút (Khởi động & Làm mềm dẻo cột sống)',
      '2. Tư thế Em Bé (Child Pose): 3 phút (Kéo giãn thắt lưng & Mở rộng hông)',
      '3. Dynamic Bridge (Cây Cầu động): 4 phút (Củng cố cơ mông, đùi & Đáy chậu)',
      '4. Baby Cobra (Rắn Hổ Mang nhẹ): 3 phút (Kích hoạt cơ dựng sống & Mở ngực)',
      '5. Thắt lưng gập nhẹ / Lăn lưng (Knees to Chest): 2 phút (Trả lại trạng thái trung tính)',
      '6. Savasana & Thở bụng sâu: 10 phút (Thư giãn sâu, cân bằng thần kinh & Giảm đau)'
    ],
    structuredSteps: YOGA_SPINE_CLINICAL_STEPS,
    aliases: [
      'Tư thế con mèo - con bò (Cat-Cow)',
      'Tư thế cây cầu',
      'Tư thế con mèo - con bò',
      'Cat-Cow',
      'Dynamic Bridge',
      'Tư thế Em Bé (Child Pose)',
      'Yoga tư thế trẻ em',
      'Tư thế Em Bé',
      'Baby Cobra',
      'Tư thế rắn hổ mang',
      'Knees to Chest',
      'Lăn lưng',
      'Thắt lưng gập nhẹ',
      'Savasana & Thở bụng sâu',
      'Thoát vị đĩa đệm',
      'Đau thắt lưng',
      'Đau cột sống'
    ]
  },
  {
    id: 'ex-neck-shoulder',
    title: 'Trị Liệu Đau Cổ Vai Gáy & Đốt Sống Cổ',
    title_en: 'Cervical Spine & Neck-Shoulder Relief',
    category: 'cotsong',
    categoryLabel: 'Cột sống',
    categoryLabel_en: 'Spine & Neck',
    tag: 'Dân văn phòng & Cổ gáy',
    tag_en: 'Neck Relief',
    duration: 18,
    kcal: 110,
    level: 'Nhẹ nhàng',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=600',
    description: 'Tập trung thả lỏng cơ thang, cơ nâng vai và giải phóng chèn ép rễ thần kinh đốt sống cổ C1-C7.',
    description_en: 'Releases trapezius tightness, decompresses cervical roots and restores neck range of motion.',
    benefits: [
      'Giảm căng cứng cổ gáy và bả vai',
      'Phòng ngừa thoái hóa đốt sống cổ',
      'Cắt đứt cơn đau nửa đầu sau và hoa mắt do co cứng cơ'
    ],
    steps: [
      '1. Nghiêng đầu sang hai bên kết hợp ấn huyệt Phong Trì: 4 phút',
      '2. Xoay tròn khớp vai mở ngực và thả lỏng bả vai: 4 phút',
      '3. Động tác luồn kim kéo giãn cơ liên bả vai: 5 phút',
      '4. Tư thế mặt bò (Cow Face) kéo giãn khớp vai cánh tay: 5 phút'
    ],
    aliases: [
      'Trị liệu Đau Cổ Vai Gáy',
      'Đau Cổ Vai Gáy',
      'Massage vùng thái dương gáy',
      'Thoái hóa đốt sống cổ',
      'Xoay tròn khớp vai mở ngực',
      'Động tác luồn kim kéo giãn cơ liên bả vai',
      'Tư thế mặt bò kéo giãn cánh tay',
      'Cổ vai gáy',
      'Đau mỏi vai gáy'
    ]
  },
  {
    id: 'ex-knee-joints',
    title: 'Phục Hồi Khớp Gối & Chi Dưới (Knee Mobility)',
    title_en: 'Knee Joint Rehab & Lower Extremity Mobility',
    category: 'cotsong',
    categoryLabel: 'Cột sống & Khớp',
    categoryLabel_en: 'Joints & Knees',
    tag: 'Khớp gối & Vận động',
    tag_en: 'Knee Mobility',
    duration: 16,
    kcal: 95,
    level: 'Nhẹ nhàng',
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=600',
    description: 'Tăng cường sức mạnh cơ tứ đầu đùi, bôi trơn bao hoạt dịch khớp gối và giảm thoái hóa sụn khớp.',
    description_en: 'Strengthens quadriceps, lubricates knee synovial fluid, and minimizes joint impact.',
    benefits: [
      'Giảm áp lực trực tiếp lên sụn khớp gối',
      'Tăng biên độ gập duỗi gối không gây đau',
      'Cải thiện khả năng đi lại và leo cầu thang'
    ],
    steps: [
      '1. Co duỗi gối trượt gót chân trên thảm (Heel Slides): 3 phút',
      '2. Nâng chân thẳng nằm ngửa kích hoạt cơ tứ đầu đùi (Straight Leg Raise): 4 phút',
      '3. Siết cơ đùi tĩnh với gối kê dưới khoeo chân (Quad Sets): 3 phút',
      '4. Xoay tròn cổ chân và duỗi mũi chân tăng tuần hoàn khớp: 3 phút',
      '5. Thả lỏng bắp chân và xoa bóp ấm vùng bánh chè: 3 phút'
    ],
    aliases: [
      'Tập cơ tứ đầu đùi nâng chân thẳng',
      'Đạp xe tại chỗ',
      'Vận động nhẹ nhàng các khớp khi hết viêm cấp',
      'Đi bộ chịu tải trọng lượng cơ thể',
      'Vận động nhẹ nhàng giữ ấm các khớp',
      'Vận động nhẹ nhàng phù hợp giai đoạn bệnh',
      'Thoái hóa khớp gối',
      'Khớp gối',
      'Viêm khớp dạng thấp'
    ]
  },
  {
    id: 'ex-hand-wrist',
    title: 'Vận Động Linh Hoạt Cổ Tay & Ngón Tay',
    title_en: 'Wrist & Finger Flexibility Therapy',
    category: 'cotsong',
    categoryLabel: 'Cột sống & Khớp',
    categoryLabel_en: 'Hand & Wrist',
    tag: 'Cổ tay & Ống cổ tay',
    tag_en: 'Wrist Therapy',
    duration: 12,
    kcal: 40,
    level: 'Nhẹ nhàng',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=600',
    description: 'Giải phóng chèn ép ống cổ tay, tăng độ dẻo dai gân gấp và các khớp bàn ngón tay.',
    description_en: 'Relieves carpal tunnel compression, stretches flexor tendons and increases digit dexterity.',
    benefits: [
      'Giảm tê bì các đầu ngón tay và cổ tay',
      'Phòng ngừa và hỗ trợ điều trị hội chứng ống cổ tay',
      'Duy trì sự khéo léo và linh hoạt của bàn tay'
    ],
    steps: [
      '1. Nắm mở bàn tay nhịp nhàng kết hợp duỗi căng các ngón: 3 phút',
      '2. Gập duỗi cổ tay nhẹ nhàng kết hợp kéo giãn cơ cẳng tay: 3 phút',
      '3. Xoay tròn khớp cổ tay theo chiều kim đồng hồ và ngược lại: 3 phút',
      '4. Day ấn huyệt Đại Lăng và Nội Quan thư giãn gân gấp: 3 phút'
    ],
    aliases: [
      'Tập vận động linh hoạt ngón tay và cổ tay',
      'Hội chứng ống cổ tay',
      'Cổ tay',
      'Ngón tay',
      'Viêm bao gân cổ tay'
    ]
  },
  {
    id: 'ex-cardio-flow',
    title: 'Dưỡng Sinh Khí Công Tim Mạch',
    title_en: 'Cardiovascular Qi Gong Flow',
    category: 'timmach',
    categoryLabel: 'Tim mạch',
    categoryLabel_en: 'Cardiovascular',
    tag: 'Tăng sức bền tim',
    tag_en: 'Heart Health',
    duration: 20,
    kcal: 155,
    level: 'Vừa phải',
    image: '/qigong_cardio.jpg',
    description: 'Vận động nhịp điệu nhẹ nhàng điều hòa nhịp tim, cải thiện đàn hồi thành mạch máu.',
    description_en: 'Rhythmic gentle motions regulating cardiac output, vascular elasticity and microcirculation.',
    benefits: [
      'Hạ áp tự nhiên và ổn định nhịp tim',
      'Tăng thể tích tống máu cơ tim an toàn',
      'Tăng cường oxy mô và giảm cảm giác hụt hơi'
    ],
    steps: [
      '1. Xoay khớp cổ chân, cổ tay điều hòa khí huyết: 4 phút',
      '2. Động tác Bát Đoạn Cẩm: Lưỡng thủ thác thiên lý tam tiêu: 6 phút',
      '3. Đi bộ nhịp thở 3 bước hít - 3 bước thở: 6 phút',
      '4. Vỗ tay tĩnh mạch thư giãn và thu công: 4 phút'
    ],
    aliases: [
      'Dưỡng Sinh Khí Công Tim Mạch',
      'Khí công dưỡng sinh',
      'Tập phục hồi chức năng tim mạch có giám sát',
      'Đi bộ nhịp nhàng',
      'Bơi lội',
      'Bơi tự do',
      'Bát Đoạn Cẩm',
      'Bệnh tim mạch',
      'Suy tim'
    ]
  },
  {
    id: 'ex-brisk-walking',
    title: 'Đi Bộ Dưỡng Sinh & Điều Hòa Huyết Áp',
    title_en: 'Therapeutic Brisk Walking & Blood Pressure Flow',
    category: 'timmach',
    categoryLabel: 'Tim mạch',
    categoryLabel_en: 'Cardio & Walking',
    tag: 'Hạ áp & Tuần hoàn',
    tag_en: 'Blood Pressure',
    duration: 25,
    kcal: 140,
    level: 'Nhẹ nhàng',
    image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&q=80&w=600',
    description: 'Liệu pháp đi bộ dưỡng sinh kết hợp kiểm soát nhịp thở, kích hoạt bơm cơ bắp và giảm sức cản ngoại vi.',
    description_en: 'Low-impact aerobic walking synchronized with breath to normalize blood pressure and boost stamina.',
    benefits: [
      'Giảm huyết áp tâm thu từ 4-9 mmHg',
      'Tăng mật độ xương và giảm nguy cơ loãng xương',
      'Kích thích giải phóng endorphin tạo tâm trạng thư thái'
    ],
    steps: [
      '1. Khởi động các khớp cổ chân và gối tại chỗ: 3 phút',
      '2. Đi bộ bước vừa, thở nhịp 3 bước hít vào - 3 bước thở ra: 15 phút',
      '3. Giảm dần tốc độ, vung tay thả lỏng lồng ngực: 4 phút',
      '4. Đứng hít thở sâu tĩnh tâm điều hòa huyết áp: 3 phút'
    ],
    aliases: [
      'Đi bộ nhanh',
      'Đi bộ thong thả theo cự ly an toàn',
      'Đi bộ thư giãn sau ăn 30 phút',
      'Đi bộ trong công viên',
      'đi dạo nhẹ nhàng',
      'Đi bộ nhẹ nhàng',
      'Duy trì vận động thể chất 30 phút mỗi ngày',
      'Đi bộ',
      'Huyết áp cao',
      'Tăng huyết áp'
    ]
  },
  {
    id: 'ex-meditation-breathing',
    title: 'Thiền Chánh Niệm & Hơi Thở Sâu (4-7-8)',
    title_en: 'Mindful Meditation & 4-7-8 Deep Breathing',
    category: 'thothieng',
    categoryLabel: 'Thở & Thiền',
    categoryLabel_en: 'Breath & Zen',
    tag: 'An thần & Ngủ ngon',
    tag_en: 'Sleep & Serenity',
    duration: 15,
    kcal: 40,
    level: 'Nhẹ nhàng',
    image: 'https://images.unsplash.com/photo-1591228127791-8e2eaef098d3?auto=format&fit=crop&q=80&w=600',
    description: 'Kỹ thuật thở cơ hoành 4-7-8 giúp kích hoạt hệ phó giao cảm, hạ nồng độ cortisol và đưa cơ thể vào trạng thái thư thái sâu.',
    description_en: 'Diaphragmatic 4-7-8 breathing activating the vagus nerve and restoring parasympathetic calm.',
    benefits: [
      'Cắt đứt suy nghĩ dồn dập, dễ đi vào giấc ngủ',
      'Hạ nhịp tim và bình ổn huyết áp tức thì',
      'Thư giãn cơ hoành và tăng thể tích oxy phổi'
    ],
    steps: [
      '1. Ngồi thẳng lưng thư thái hoặc nằm ngửa, nhắm mắt nhẹ nhàng: 2 phút',
      '2. Hít vào bằng mũi trong 4 giây căng tròn bụng: 3 phút',
      '3. Giữ hơi thở thư thái tĩnh lặng trong 7 giây: 3 phút',
      '4. Thở từ từ qua miệng trong 8 giây làm rỗng phổi: 4 phút',
      '5. Quán chiếu thả lỏng toàn thân và nghỉ ngơi: 3 phút'
    ],
    aliases: [
      'Thiền Chánh Niệm & Hơi Thở Sâu',
      'Thở 4-7-8',
      'Thở sâu cơ hoành',
      'Tập thở bằng cơ hoành',
      'Thiền chánh niệm',
      'Thiền định',
      'Tập thở hộp (Box breathing)',
      'Tập thở sâu tĩnh tâm',
      'Tập thở thư giãn tĩnh tâm tránh vận động nặng',
      'Yoga hơi thở',
      'Ngâm chân nước ấm trước khi đi ngủ',
      'Mất ngủ',
      'Rối loạn giấc ngủ'
    ]
  },
  {
    id: 'ex-respiratory-therapy',
    title: 'Vật Lý Trị Liệu Hô Hấp & Thở Chúm Môi',
    title_en: 'Pulmonary Rehab & Pursed-Lip Breathing',
    category: 'thothieng',
    categoryLabel: 'Hô hấp & Thở',
    categoryLabel_en: 'Respiratory',
    tag: 'Phổi & Hen suyễn & COPD',
    tag_en: 'Lungs & Asthma',
    duration: 15,
    kcal: 50,
    level: 'Nhẹ nhàng',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=600',
    description: 'Kỹ thuật thở chúm môi và tập giãn lồng ngực giúp ngăn xẹp đường dẫn khí nhỏ, hỗ trợ tống xuất đờm.',
    description_en: 'Pursed-lip ventilation and thoracic expansion exercises preventing airway collapse and relieving dyspnea.',
    benefits: [
      'Giảm bẫy khí trong phế nang và bớt khó thở',
      'Tăng dung tích sống của phổi',
      'Giúp người bệnh hen và COPD thở dễ dàng hơn'
    ],
    steps: [
      '1. Kỹ thuật thở chúm môi: Hít bằng mũi 2s, chúm môi thổi ra 4s: 4 phút',
      '2. Vận động mở rộng lồng ngực kết hợp hít vào căng phồng ngực: 4 phút',
      '3. Vận động giãn cơ liên sườn và cơ nâng ngực: 4 phút',
      '4. Kỹ thuật ho khạc có kiểm soát làm sạch đường thở: 3 phút'
    ],
    aliases: [
      'Thở chúm môi',
      'Tập thở chúm môi',
      'Vận động giãn cơ ngực',
      'Vật lý trị liệu hô hấp',
      'Dẫn lưu tư thế',
      'Hen phế quản',
      'COPD',
      'Viêm phế quản mạn'
    ]
  },
  {
    id: 'ex-stress-relief',
    title: 'Yoga Giải Tỏa Căng Thẳng (De-Stress)',
    title_en: 'Anti-Stress & Nervous System Reset Yoga',
    category: 'giamstress',
    categoryLabel: 'Giảm stress',
    categoryLabel_en: 'Stress Relief',
    tag: 'Thư giãn cảm xúc',
    tag_en: 'De-Stress',
    duration: 22,
    kcal: 130,
    level: 'Nhẹ nhàng',
    image: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?auto=format&fit=crop&q=80&w=600',
    description: 'Kết hợp các tư thế gập người về phía trước giải tỏa áp lực tâm lý, kéo giãn cơ hình lê và giảm đau thần kinh tọa.',
    description_en: 'Forward bends, piriformis decompression and restorative postures soothing systemic neural tension.',
    benefits: [
      'Kích thích sóng não Alpha thư thái',
      'Giảm căng đau vùng đầu và cơ thang do stress',
      'Khơi thông khí huyết và giải tỏa áp lực cảm xúc'
    ],
    steps: [
      '1. Tư thế Cánh Bướm gập người (Butterfly Pose): 4 phút',
      '2. Tư thế Chó úp mặt (Downward Dog) kéo giãn cột sống: 5 phút',
      '3. Kéo giãn cơ hình lê nằm ngửa / Tư thế Bồ Câu: 6 phút',
      '4. Tư thế Gác chân lên tường (Viparita Karani) xoa dịu thần kinh: 7 phút'
    ],
    aliases: [
      'Yoga Giải Tỏa Căng Thẳng (De-Stress)',
      'Tập yoga thư giãn',
      'Tư thế bồ câu trong yoga',
      'Kéo giãn cơ hình lê nằm ngửa',
      'Thư giãn kiểm soát căng thẳng tránh gãi theo thói quen',
      'Tập thư giãn cơ sâu',
      'Căng thẳng',
      'Stress',
      'Trầm cảm',
      'Lo âu'
    ]
  },
  {
    id: 'ex-vestibular-balance',
    title: 'Bài Tập Tiền Đình Brandt-Daroff & Thăng Bằng',
    title_en: 'Vestibular Brandt-Daroff & Balance Rehab',
    category: 'giamstress',
    categoryLabel: 'Thần kinh & Tiền đình',
    categoryLabel_en: 'Vestibular & Balance',
    tag: 'Chóng mặt & Tiền đình',
    tag_en: 'Vertigo Relief',
    duration: 14,
    kcal: 45,
    level: 'Nhẹ nhàng',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=600',
    description: 'Phác đồ Brandt-Daroff giúp giải phóng sỏi tai (thạch nhĩ) khỏi ống bán khuyên và huấn luyện bù trừ tiền đình.',
    description_en: 'Evidence-based Brandt-Daroff exercises promoting otolith dispersion and central vestibular compensation.',
    benefits: [
      'Cắt đứt cảm giác nhà cửa quay cuồng',
      'Phục hồi khả năng thăng bằng khi đi lại',
      'Giảm buồn nôn do rối loạn tiền đình kịch phát'
    ],
    steps: [
      '1. Ngồi thẳng mép giường, chuyển nhanh sang nằm nghiêng một bên 30s: 3 phút',
      '2. Trở về tư thế ngồi thẳng 30s: 2 phút',
      '3. Chuyển sang nằm nghiêng phía đối diện 30s: 3 phút',
      '4. Bài tập cố định thị giác: Nhìn tập trung một ngón tay và xoay đầu chậm: 3 phút',
      '5. Thăng bằng đứng gót - mũi chân nhắm mắt nhẹ nhàng: 3 phút'
    ],
    aliases: [
      'Bài tập Brandt-Daroff tiền đình',
      'Nhìn tập trung một điểm khi xoay đầu',
      'Tập Thái Cực Quyền thăng bằng',
      'Tập phục hồi chức năng vận động thần kinh',
      'Tiền đình',
      'Rối loạn tiền đình',
      'Chóng mặt'
    ]
  },
  {
    id: 'ex-pelvic-kegel',
    title: 'Bài Tập Kegel & Phục Hồi Cơ Sàn Chậu',
    title_en: 'Pelvic Floor Kegel Rehabilitation',
    category: 'dotcalo',
    categoryLabel: 'Cơ sàn chậu',
    categoryLabel_en: 'Pelvic Health',
    tag: 'Tiết niệu & Tiền liệt tuyến',
    tag_en: 'Pelvic & Bladder',
    duration: 12,
    kcal: 50,
    level: 'Nhẹ nhàng',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=600',
    description: 'Rèn luyện cơ mu cụt (PC muscle) củng cố đáy chậu, cải thiện kiểm soát bàng quang và sức khỏe sinh sản.',
    description_en: 'Pelvic floor muscle training enhancing bladder sphincter control, core support and pelvic tone.',
    benefits: [
      'Ngăn ngừa và điều trị tiểu không tự chủ, tiểu són',
      'Tăng tuần hoàn máu vùng chậu và tuyến tiền liệt',
      'Nâng đỡ các cơ quan nội tạng vùng chậu'
    ],
    steps: [
      '1. Xác định nhóm cơ mu cụt (siết như khi nhịn tiểu) trong tư thế nằm: 2 phút',
      '2. Siết chặt cơ sàn chậu 5 giây, sau đó thả lỏng hoàn toàn 5 giây (10 nhịp): 4 phút',
      '3. Co thắt nhanh nhịp nhàng (Quick Flicks) 10 lần: 2 phút',
      '4. Nâng hông Bridge Pose kết hợp siết cơ đáy chậu: 4 phút'
    ],
    aliases: [
      'Tập co giãn cơ sàn chậu Kegel',
      'Tập Kegel cho nam giới tăng sức cơ bàng quang',
      'Tập Kegel tăng tuần hoàn vùng chậu',
      'Tập bài tập Kegel cho nam',
      'Yoga nhẹ nhàng thư giãn cơ sàn chậu',
      'Tập tạ Squat tăng testosterone',
      'Kegel',
      'Tiền liệt tuyến',
      'Bàng quang'
    ]
  },
  {
    id: 'ex-diabetes-metabolic',
    title: 'Vận Động Kháng Lực & Đốt Năng Lượng (Tiểu Đường)',
    title_en: 'Metabolic Resistance & Glucose Burning',
    category: 'dotcalo',
    categoryLabel: 'Chuyển hóa & Calo',
    categoryLabel_en: 'Metabolic & Cardio',
    tag: 'Tiểu đường & Hạ đường huyết',
    tag_en: 'Diabetes Care',
    duration: 20,
    kcal: 160,
    level: 'Vừa phải',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=600',
    description: 'Kích hoạt kênh GLUT-4 đưa glucose vào tế bào cơ mà không phụ thuộc nhiều vào insulin, giúp hạ đường huyết.',
    description_en: 'Stimulates non-insulin dependent GLUT-4 translocation into skeletal muscle, optimizing glycemia.',
    benefits: [
      'Hạ đường huyết sau bữa ăn hiệu quả',
      'Cải thiện độ nhạy của thụ thể insulin',
      'Đốt cháy mỡ nội tạng và triglyceride trong máu'
    ],
    steps: [
      '1. Đi bộ nâng cao đùi khởi động làm ấm cơ: 3 phút',
      '2. Bodyweight Squat (Đứng lên ngồi xuống nhịp nhàng kích hoạt cơ đùi lớn): 5 phút',
      '3. Calf Raises (Nhón gót chân tăng hấp thu đường cơ bắp chuối): 4 phút',
      '4. Wall Push-ups (Chống đẩy tường an toàn kích hoạt thân trên): 4 phút',
      '5. Thả lỏng giãn cơ toàn thân và kiểm tra nhịp thở: 4 phút'
    ],
    aliases: [
      'Tập kháng lực rèn luyện cơ bắp tiêu thụ glucose',
      'Đi bộ nhanh sau bữa ăn',
      'Tập Cardio đốt mỡ',
      'Chạy bộ Aerobic đốt năng lượng',
      'Tập thể dục nhịp điệu kích hoạt trao đổi chất',
      'Tiểu đường',
      'Đái tháo đường',
      'Mỡ máu'
    ]
  },
  {
    id: 'ex-digestive-massage',
    title: 'Dưỡng Sinh Tiêu Hóa & Xoa Bụng Nội Tạng',
    title_en: 'Visceral Massage & Digestive Qi Flow',
    category: 'thothieng',
    categoryLabel: 'Tiêu hóa & Dưỡng sinh',
    categoryLabel_en: 'Digestive Health',
    tag: 'Dạ dày & Đại tràng',
    tag_en: 'Digestion',
    duration: 12,
    kcal: 35,
    level: 'Nhẹ nhàng',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=600',
    description: 'Phương pháp xoa bụng dưỡng sinh cổ truyền thúc đẩy nhu động ruột, giải phóng ứ trệ thức ăn và giảm đầy trướng.',
    description_en: 'Gentle abdominal myofascial and reflexology motions stimulating gastrointestinal peristalsis.',
    benefits: [
      'Giảm trào ngược dạ dày, chướng bụng đầy hơi',
      'Kích thích nhu động đại tràng ngừa táo bón',
      'Ấm trung tiêu và tăng cường hấp thu dưỡng chất'
    ],
    steps: [
      '1. Nằm ngửa co gối, làm ấm hai lòng bàn tay: 2 phút',
      '2. Xoa bụng nhẹ nhàng theo chiều kim đồng hồ quanh rốn 36 vòng: 4 phút',
      '3. Day ấn nhẹ huyệt Trung Quản và Khí Hải: 3 phút',
      '4. Tư thế cuộn tròn ép gối vào bụng (Apanasana) đẩy hơi dư thừa: 3 phút'
    ],
    aliases: [
      'Xoa bụng thuận chiều kim đồng hồ',
      'Xoa bụng dưỡng sinh buổi sáng',
      'Yoga kéo giãn vùng bụng',
      'Nghỉ ngơi chườm ấm vùng bụng dưới',
      'Chườm ấm bụng dưới',
      'Dạ dày',
      'Đại tràng',
      'Trào ngược dạ dày'
    ]
  },
  {
    id: 'ex-eye-relaxation',
    title: 'Bài Tập Thư Giãn Mắt & Điều Tiết Cơ Mi',
    title_en: 'Ocular Acuity & Ciliary Muscle Relaxation',
    category: 'giamstress',
    categoryLabel: 'Mắt & Giác quan',
    categoryLabel_en: 'Ocular Health',
    tag: 'Mỏi mắt & Giảm thị lực',
    tag_en: 'Eye Relief',
    duration: 10,
    kcal: 20,
    level: 'Nhẹ nhàng',
    image: 'https://images.unsplash.com/photo-1591228127791-8e2eaef098d3?auto=format&fit=crop&q=80&w=600',
    description: 'Rèn luyện khả năng điều tiết của cơ thể mi, thư giãn thần kinh thị giác và kích thích tuyến lệ tự nhiên.',
    description_en: 'Exercises relaxing the ciliary body, alleviating asthenopia and enhancing ocular microvascular perfusion.',
    benefits: [
      'Xóa tan cảm giác mỏi mắt, khô rát khi nhìn màn hình',
      'Phòng ngừa tăng độ cận thị và loạn thị',
      'Tăng lưu thông máu vùng hốc mắt và thái dương'
    ],
    steps: [
      '1. Đảo mắt chậm theo vòng tròn kim đồng hồ và ngược lại: 2 phút',
      '2. Nhìn ngón tay ở cự ly gần (20cm) rồi phóng tầm mắt nhìn xa (6m): 3 phút',
      '3. Chớp mắt nhanh 10 lần rồi nhắm mắt thả lỏng hoàn toàn: 2 phút',
      '4. Áp hai lòng bàn tay ấm lên hốc mắt (Palming) thư giãn tối: 3 phút'
    ],
    aliases: [
      'Tập các bài tập đảo mắt thư giãn cơ thể mi',
      'Chườm lạnh mi mắt giảm sưng cộm',
      'Mỏi mắt',
      'Mắt',
      'Tật khúc xạ',
      'Cận thị'
    ]
  },
  {
    id: 'ex-sun-salutation',
    title: 'Chào Mặt Trời (Surya Namaskar)',
    title_en: 'Sun Salutation Flow (Surya Namaskar)',
    category: 'dotcalo',
    categoryLabel: 'Đốt calo',
    categoryLabel_en: 'Energy & Cardio',
    tag: 'Khởi động ngày mới',
    tag_en: 'Morning Vitality',
    duration: 15,
    kcal: 120,
    level: 'Nhẹ nhàng',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=600',
    description: 'Chuỗi 12 động tác liên hoàn đánh thức toàn bộ nhóm cơ và kích hoạt năng lượng tích cực.',
    description_en: 'A sequence of 12 fluid postures awakening major muscle chains and boosting metabolism.',
    benefits: [
      'Làm nóng và đánh thức toàn bộ cơ thể',
      'Tăng độ dẻo dai cột sống và các khớp',
      'Cải thiện tuần hoàn máu và trao đổi chất'
    ],
    steps: [
      '1. Tư thế cầu nguyện (Pranamasana): 2 phút',
      '2. Tư thế vươn tay ngả sau (Hastauttanasana): 3 phút',
      '3. Tư thế cúi gập người (Padahastasana): 3 phút',
      '4. Tư thế chiến binh thấp: 3 phút',
      '5. Tư thế tấm ván và rắn hổ mang: 4 phút'
    ],
    aliases: [
      'Chào mặt trời (Surya Namaskar)',
      'Chào mặt trời',
      'Surya Namaskar',
      'Tập thể dục giữ cân nặng chuẩn',
      'Khởi động ngày mới'
    ]
  }
];

/**
 * Intelligent matcher that links any query string (e.g. from disease related exercises)
 * to the exact therapy workout routine.
 */
export function findTherapyExercise(query?: string | null): TherapyExercise {
  if (!query || typeof query !== 'string') {
    return THERAPY_EXERCISES[0];
  }

  const q = query.trim().toLowerCase();

  // 1. Direct ID match
  const byId = THERAPY_EXERCISES.find(e => e.id.toLowerCase() === q);
  if (byId) return byId;

  // 2. Exact Title match
  const byTitle = THERAPY_EXERCISES.find(e => e.title.toLowerCase() === q);
  if (byTitle) return byTitle;

  // 3. Exact Alias match
  const byExactAlias = THERAPY_EXERCISES.find(e =>
    e.aliases?.some(a => a.toLowerCase() === q)
  );
  if (byExactAlias) return byExactAlias;

  // 4. Substring Alias match (e.g. query contains alias or alias contains query)
  const bySubAlias = THERAPY_EXERCISES.find(e =>
    e.aliases?.some(a => {
      const al = a.toLowerCase();
      return q.includes(al) || al.includes(q);
    })
  );
  if (bySubAlias) return bySubAlias;

  // 5. Steps content match
  const byStep = THERAPY_EXERCISES.find(e =>
    e.steps.some(st => st.toLowerCase().includes(q))
  );
  if (byStep) return byStep;

  // 6. Keywords mapping
  if (q.includes('mèo') || q.includes('bò') || q.includes('cat') || q.includes('cầu') || q.includes('đĩa đệm') || q.includes('lưng') || q.includes('cột sống') || q.includes('cobra') || q.includes('em bé')) {
    return THERAPY_EXERCISES.find(e => e.id === 'hero-yoga-spine') || THERAPY_EXERCISES[0];
  }

  if (q.includes('cổ') || q.includes('vai') || q.includes('gáy') || q.includes('thái dương')) {
    return THERAPY_EXERCISES.find(e => e.id === 'ex-neck-shoulder') || THERAPY_EXERCISES[0];
  }

  if (q.includes('gối') || q.includes('tứ đầu') || q.includes('khớp') || q.includes('chân') || q.includes('đạp xe')) {
    return THERAPY_EXERCISES.find(e => e.id === 'ex-knee-joints') || THERAPY_EXERCISES[0];
  }

  if (q.includes('ngón') || q.includes('cổ tay') || q.includes('bàn tay') || q.includes('ống cổ tay')) {
    return THERAPY_EXERCISES.find(e => e.id === 'ex-hand-wrist') || THERAPY_EXERCISES[0];
  }

  if (q.includes('thở') || q.includes('thiền') || q.includes('4-7-8') || q.includes('ngủ') || q.includes('cơ hoành')) {
    return THERAPY_EXERCISES.find(e => e.id === 'ex-meditation-breathing') || THERAPY_EXERCISES[0];
  }

  if (q.includes('hô hấp') || q.includes('phổi') || q.includes('chúm môi') || q.includes('hen') || q.includes('copd')) {
    return THERAPY_EXERCISES.find(e => e.id === 'ex-respiratory-therapy') || THERAPY_EXERCISES[0];
  }

  if (q.includes('kegel') || q.includes('sàn chậu') || q.includes('tiền liệt') || q.includes('bàng quang') || q.includes('squat')) {
    return THERAPY_EXERCISES.find(e => e.id === 'ex-pelvic-kegel') || THERAPY_EXERCISES[0];
  }

  if (q.includes('tiền đình') || q.includes('thăng bằng') || q.includes('chóng mặt') || q.includes('brandt')) {
    return THERAPY_EXERCISES.find(e => e.id === 'ex-vestibular-balance') || THERAPY_EXERCISES[0];
  }

  if (q.includes('đường') || q.includes('kháng lực') || q.includes('glucose') || q.includes('calo') || q.includes('cardio') || q.includes('béo phì')) {
    return THERAPY_EXERCISES.find(e => e.id === 'ex-diabetes-metabolic') || THERAPY_EXERCISES[0];
  }

  if (q.includes('bụng') || q.includes('tiêu hóa') || q.includes('dạ dày') || q.includes('đại tràng')) {
    return THERAPY_EXERCISES.find(e => e.id === 'ex-digestive-massage') || THERAPY_EXERCISES[0];
  }

  if (q.includes('mắt') || q.includes('thị giác') || q.includes('mi')) {
    return THERAPY_EXERCISES.find(e => e.id === 'ex-eye-relaxation') || THERAPY_EXERCISES[0];
  }

  if (q.includes('đi bộ') || q.includes('dạo')) {
    return THERAPY_EXERCISES.find(e => e.id === 'ex-brisk-walking') || THERAPY_EXERCISES[0];
  }

  if (q.includes('tim') || q.includes('huyết áp') || q.includes('mạch') || q.includes('khí công') || q.includes('bơi')) {
    return THERAPY_EXERCISES.find(e => e.id === 'ex-cardio-flow') || THERAPY_EXERCISES[0];
  }

  if (q.includes('stress') || q.includes('lo âu') || q.includes('thư giãn') || q.includes('bồ câu')) {
    return THERAPY_EXERCISES.find(e => e.id === 'ex-stress-relief') || THERAPY_EXERCISES[0];
  }

  return THERAPY_EXERCISES[0];
}
