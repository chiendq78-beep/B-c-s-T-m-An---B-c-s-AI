import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'vi' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  vi: {
    // Nav & General
    'nav.home': 'Tổng quan',
    'nav.anatomy': 'Cơ thể',
    'nav.disease': 'Bệnh lý',
    'nav.herb': 'Dược liệu',
    'nav.health': 'Luyện tập',
    'nav.ask_ai': 'Hỏi Bác Sĩ AI',
    'nav.emergency': 'Cấp cứu 115',

    // Titles
    'title.home': 'Tổng quan Sức khỏe',
    'title.anatomy': 'Bản đồ Giải phẫu & Sinh hiệu 3D',
    'title.disease': 'Tra cứu Bệnh lý & Phác đồ',
    'title.herb': 'Cẩm nang Dược liệu & Bài thuốc',
    'title.health': 'Luyện tập Trị liệu & Phục hồi',

    // Drawer & Navigation Details
    'drawer.menu': 'Menu Điều hướng',
    'drawer.settings': 'CÀI ĐẶT HỆ THỐNG',
    'drawer.settings_subtitle': 'Bác sĩ Tâm An • Tùy chỉnh Y tế & Cá nhân hóa',
    'drawer.home': 'Tổng quan Sức khỏe',
    'drawer.anatomy': 'Cơ thể & Sinh hiệu 3D',
    'drawer.disease': 'Tra cứu Bệnh lý & Đông y',
    'drawer.herb': 'Dược liệu Cổ truyền Việt',
    'drawer.health': 'Luyện tập & Phục hồi',
    'drawer.support_section': 'Hỗ trợ & Y tế AI',
    'drawer.emergency_115': 'Cấp cứu Y tế (115)',
    'drawer.chat_ai': 'Trò chuyện Bác sĩ AI',
    'drawer.settings_section': 'Cài đặt',
    'drawer.system_settings': 'Cài đặt Hệ thống',
    'drawer.notification_settings': 'Cài đặt Nhắc nhở & Báo giờ',
    'drawer.support_center': 'Trung tâm Hỗ trợ & Góp ý',
    'drawer.back_to_menu': 'Quay lại Menu Điều hướng',
    'drawer.account_sec': 'Quản lý tài khoản & Bảo mật',
    'drawer.account_sec_desc': 'Mật khẩu, xác thực 2 lớp, chuẩn HIPAA',
    'drawer.profile': 'Hồ sơ bệnh án & Thể trạng',
    'drawer.profile_desc': 'Nhóm máu, dị ứng, chiều cao, cân nặng',
    'drawer.devices': 'Liên kết thiết bị đo (Smartwatch/SPO2)',
    'drawer.devices_desc': 'Đồng bộ nhịp tim, giấc ngủ, huyết áp',
    'drawer.auth_login': 'Đăng nhập / Đăng ký',
    'drawer.auth_logout': 'Đăng xuất',
    'drawer.guest': 'Khách',
    'drawer.member': 'Thành viên',
    'header.ask_ai': 'Bác sĩ AI',
    'header.ai_system': 'Hệ thống Chuyên gia Y tế AI',
    'header.banner_text': 'Bật thông báo chạy ngầm trên điện thoại/tablet để không bỏ lỡ lịch uống thuốc, đo chỉ số & uống nước!',
    'header.banner_enable': 'Bật thông báo',
    'header.banner_later': 'Để sau',
    
    // Notifications & Reminders
    'section.notifications': 'Thông báo & Lịch nhắc',
    'notify.app': 'Thông báo ứng dụng',
    'notify.app_desc': 'Bật chuông & tin báo trên thiết bị',
    'notify.medication': 'Lịch nhắc uống thuốc / Đo sinh hiệu',
    'notify.medication_desc': 'Giờ uống thuốc và đo huyết áp, đường huyết',
    'notify.workout': 'Nhắc nhở tập luyện & Uống nước',
    'notify.workout_desc': 'Mục tiêu 2.000ml nước & bài tập phục hồi',
    'notify.dnd': 'Chế độ Không làm phiền (DND)',
    'notify.dnd_desc': 'Tắt chuông đêm',

    // Preferences
    'section.preferences': 'Tùy chọn ứng dụng',
    'pref.language': 'Ngôn ngữ (Language)',
    'pref.theme': 'Giao diện (Theme)',
    'pref.theme_light': 'Sáng',
    'pref.theme_dark': 'Tối',
    'pref.theme_auto': 'Tự động',
    'pref.fontsize': 'Cỡ chữ & Trợ năng',
    'pref.fontsize_desc': 'Hỗ trợ người cao tuổi đọc rõ ràng',
    'pref.fontsize_normal': 'Bình thường',
    'pref.fontsize_large': 'Cỡ chữ Lớn (+15%)',
    'pref.fontsize_xlarge': 'Rất lớn (+30%)',

    // Support
    'section.support': 'Trợ giúp & Liên hệ',
    'support.hotline': 'Liên hệ Bác sĩ / Tổng đài hỗ trợ',
    'support.hotline_desc': 'Tư vấn trực tiếp 24/7 qua hotline 1900 6868',
    'support.feedback': 'Gửi phản hồi / Báo lỗi AI',
    'support.disclaimer': 'Điều khoản dịch vụ & Tuyên bố miễn trừ',
    'support.disclaimer_desc': 'Miễn trừ trách nhiệm chẩn đoán y khoa của AI',

    // Sub tabs
    'tab.today': 'Hôm nay',
    'tab.programs': 'Giáo trình',
    'tab.history': 'Lịch sử',
    'tab.anatomy_map': 'Giải phẫu 3D',
    'tab.vitals_sensor': 'Sinh hiệu',

    // Home View
    'home.greeting_morning': 'Chào buổi sáng',
    'home.greeting_afternoon': 'Chào buổi chiều',
    'home.greeting_evening': 'Chào buổi tối',
    'home.subtitle_morning': 'Chúc bạn một ngày mới an lành, tràn đầy năng lượng.',
    'home.subtitle_afternoon': 'Duy trì năng lượng và chăm sóc sức khỏe thật tốt nhé.',
    'home.subtitle_evening': 'Thư giãn tinh thần và dưỡng sinh giấc ngủ an lành.',
    'home.current_health': 'Sức khỏe hiện tại',
    'home.heart_rate': 'Nhịp tim',
    'home.hydration': 'Cấp nước',
    'home.water_goal': 'Mục tiêu cấp nước hàng ngày',
    'home.quick_log': 'Ghi nhận nhanh:',
    'home.cups': 'cốc',
    'home.details': 'Xuất báo cáo',
    'home.log_vitals': 'Ghi sinh hiệu',
    'home.water_success': '🎉 Thật xuất sắc! Bạn đã đạt mục tiêu cấp nước lý tưởng cho hôm nay!',
    'home.water_empty': '💡 Chưa ghi nhận cốc nước nào hôm nay. Hãy nạp nhanh cốc nước đầu tiên dưới đây!',
    'home.water_reminder_title': 'Nhắc nhở uống nước định kỳ',
    'home.water_reminder_subtitle': 'Bảo vệ sức khỏe & Đào thải độc tố',
    'home.reminder_interval': 'Khoảng thời gian nhắc nhở',
    'home.countdown': 'Tiến trình đếm ngược',
    'home.inactive': 'Chưa kích hoạt',
    'home.med_title': 'Lịch nhắc uống thuốc & Đo chỉ số hôm nay',
    'home.active_count': 'Đang bật',
    'home.customize': 'Hiệu chỉnh',
    'home.no_reminders': 'Chưa có lịch nhắc nhở nào',
    'home.no_reminders_desc': 'Thiết lập lịch nhắc đo chỉ số tiểu đường, huyết áp, nhịp tim hoặc uống thuốc để bảo vệ sức khỏe đúng giờ mỗi ngày.',
    'home.set_new_reminder': '+ Cài đặt lịch nhắc mới',
    'home.log_metric': 'Ghi số đo',
    'home.reminder_on': 'Đang bật',
    'home.reminder_off': 'Đã tắt',

    // BMI Card
    'bmi.title': 'Chỉ số Thể trạng & BMI',
    'bmi.subtitle': 'Phân tích thể trạng chuẩn Nhân trắc học Y tế & Đông Y',
    'bmi.asian_standard': 'Chuẩn Châu Á (WPRO)',
    'bmi.who_standard': 'Chuẩn WHO Quốc Tế',
    'bmi.your_params': 'Thông số nhân trắc của bạn',
    'bmi.height': 'Chiều cao',
    'bmi.weight': 'Cân nặng',
    'bmi.reset': 'Đặt lại',
    'bmi.result_title': 'Kết quả phân tích thể trạng',
    'bmi.ideal_weight': 'Khoảng cân nặng lý tưởng:',
    'bmi.advice': 'Lời khuyên điều hòa Đông y:',
    'bmi.save': 'Lưu vào hồ sơ',
    'bmi.saved': 'Đã lưu!',
    'bmi.underweight': 'Thiếu cân (Underweight)',
    'bmi.normal': 'Bình thường (Normal)',
    'bmi.overweight': 'Tiền béo phì / Thừa cân',
    'bmi.obese': 'Béo phì (Obesity)',
    
    // Exercise
    'exercise.title': 'Luyện tập Trị liệu & Phục hồi',
    'exercise.today_advice': 'LỜI KHUYÊN CHO HÔM NAY:',
    'exercise.search': 'Tìm bài tập, động tác yoga, khí công...',
    'exercise.all': 'Tất cả',
    'exercise.yoga': 'Yoga Trị liệu',
    'exercise.qigong': 'Khí công & Dưỡng sinh',
    'exercise.cardio': 'Cardio Tim mạch',
    'exercise.rehab': 'Vật lý Trị liệu',
    'exercise.start': 'Bắt đầu tập',
    'exercise.complete': 'Hoàn thành',
    'exercise.duration': 'Thời lượng',
    'exercise.intensity': 'Cường độ',
    'exercise.calories': 'Calo tiêu thụ',

    // Trends Chart
    'trends.title': 'Biểu đồ Diễn tiến & Xu hướng Sinh hiệu',
    'trends.subtitle': 'Theo dõi liên tục nhịp tim, huyết áp & mức độ hoạt động',
    'trends.hr': 'Nhịp tim',
    'trends.bp': 'Huyết áp',
    'trends.spo2': 'SPO2',
    'trends.activity': 'Hoạt động',

    // Common
    'common.you': 'Bạn',
    'common.confirm': 'Xác nhận',
    'common.close': 'Đóng',
    'common.search': 'Tìm kiếm...',
    'common.view_details': 'Xem chi tiết',
  },
  en: {
    // Nav & General
    'nav.home': 'Overview',
    'nav.anatomy': 'Body 3D',
    'nav.disease': 'Diseases',
    'nav.herb': 'Herbs',
    'nav.health': 'Exercise',
    'nav.ask_ai': 'Ask AI Doctor',
    'nav.emergency': 'Emergency 115',

    // Titles
    'title.home': 'Health Overview',
    'title.anatomy': '3D Anatomy & Sensory Vitals',
    'title.disease': 'Disease Lookup & Protocol',
    'title.herb': 'Medicinal Herbs & Remedies',
    'title.health': 'Therapeutic & Recovery Exercises',

    // Drawer & Navigation Details
    'drawer.menu': 'Navigation Menu',
    'drawer.settings': 'SYSTEM SETTINGS',
    'drawer.settings_subtitle': 'Tam An AI • Medical Customization & Care',
    'drawer.home': 'Health Overview',
    'drawer.anatomy': '3D Body & Sensory Vitals',
    'drawer.disease': 'Disease Lookup & Protocol',
    'drawer.herb': 'Traditional Herbal Remedies',
    'drawer.health': 'Exercise & Physical Therapy',
    'drawer.support_section': 'AI Medical & Support',
    'drawer.emergency_115': 'Medical Emergency (115)',
    'drawer.chat_ai': 'Chat with AI Doctor',
    'drawer.settings_section': 'Settings',
    'drawer.system_settings': 'System Settings',
    'drawer.notification_settings': 'Reminders & Notifications',
    'drawer.support_center': 'Support & Feedback Center',
    'drawer.back_to_menu': 'Back to Navigation Menu',
    'drawer.account_sec': 'Account & Security',
    'drawer.account_sec_desc': 'Password, 2-Factor Auth, HIPAA compliant',
    'drawer.profile': 'Medical Records & Body Vitals',
    'drawer.profile_desc': 'Blood type, allergies, height, weight',
    'drawer.devices': 'Connected Devices (Smartwatch/SPO2)',
    'drawer.devices_desc': 'Sync heart rate, sleep, blood pressure',
    'drawer.auth_login': 'Login / Sign Up',
    'drawer.auth_logout': 'Log Out',
    'drawer.guest': 'Guest',
    'drawer.member': 'Member',
    'header.ask_ai': 'AI Doctor',
    'header.ai_system': 'Expert AI Medical System',
    'header.banner_text': 'Enable background notifications on your phone/tablet to stay on top of meds, vitals & hydration!',
    'header.banner_enable': 'Enable Alerts',
    'header.banner_later': 'Later',

    // Notifications & Reminders
    'section.notifications': 'Notifications & Reminders',
    'notify.app': 'App Notifications',
    'notify.app_desc': 'Sound and push notifications on device',
    'notify.medication': 'Medication & Vital Measurement Alerts',
    'notify.medication_desc': 'Medication schedule, blood pressure, glucose',
    'notify.workout': 'Workout & Hydration Reminder',
    'notify.workout_desc': '2,000ml water goal & recovery routines',
    'notify.dnd': 'Do Not Disturb (DND)',
    'notify.dnd_desc': 'Quiet hours overnight',

    // Preferences
    'section.preferences': 'App Preferences',
    'pref.language': 'Language',
    'pref.theme': 'Theme',
    'pref.theme_light': 'Light',
    'pref.theme_dark': 'Dark',
    'pref.theme_auto': 'Auto',
    'pref.fontsize': 'Font Size & Accessibility',
    'pref.fontsize_desc': 'Enhanced clarity for seniors & vision care',
    'pref.fontsize_normal': 'Standard',
    'pref.fontsize_large': 'Large (+15%)',
    'pref.fontsize_xlarge': 'Extra Large (+30%)',

    // Support
    'section.support': 'Help & Support',
    'support.hotline': 'Call Doctor / Support Center',
    'support.hotline_desc': '24/7 direct consultation hotline 1900 6868',
    'support.feedback': 'Send Feedback / AI Bug Report',
    'support.disclaimer': 'Terms of Service & Medical Disclaimer',
    'support.disclaimer_desc': 'AI medical advice disclaimer & emergency protocol',

    // Sub tabs
    'tab.today': 'Today',
    'tab.programs': 'Programs',
    'tab.history': 'History',
    'tab.anatomy_map': '3D Anatomy',
    'tab.vitals_sensor': 'Vitals',

    // Home View
    'home.greeting_morning': 'Good morning',
    'home.greeting_afternoon': 'Good afternoon',
    'home.greeting_evening': 'Good evening',
    'home.subtitle_morning': 'Wishing you a peaceful and energetic new day.',
    'home.subtitle_afternoon': 'Keep your energy up and take great care of your health.',
    'home.subtitle_evening': 'Relax your mind and enjoy a restorative, peaceful sleep.',
    'home.current_health': 'Current Health',
    'home.heart_rate': 'Heart Rate',
    'home.hydration': 'Hydration',
    'home.water_goal': 'Daily Hydration Goal',
    'home.quick_log': 'Quick Log:',
    'home.cups': 'cups',
    'home.details': 'Export Report',
    'home.log_vitals': 'Log Vitals',
    'home.water_success': '🎉 Outstanding! You have reached your ideal hydration goal today!',
    'home.water_empty': '💡 No water logged yet today. Quickly log your first cup below!',
    'home.water_reminder_title': 'Periodic Hydration Reminder',
    'home.water_reminder_subtitle': 'Cellular Hydration & Body Detoxification',
    'home.reminder_interval': 'Reminder Interval',
    'home.countdown': 'Countdown Progress',
    'home.inactive': 'Inactive',
    'home.med_title': 'Today’s Medication & Vitals Schedule',
    'home.active_count': 'Active',
    'home.customize': 'Customize',
    'home.no_reminders': 'No reminders scheduled yet',
    'home.no_reminders_desc': 'Set up reminders for blood glucose, blood pressure, heart rate, or medications to stay on schedule every day.',
    'home.set_new_reminder': '+ Set New Reminder',
    'home.log_metric': 'Log Metric',
    'home.reminder_on': 'Active',
    'home.reminder_off': 'Off',

    // BMI Card
    'bmi.title': 'Body Metrics & BMI',
    'bmi.subtitle': 'Medical Anthropometric & Holistic Body Analysis',
    'bmi.asian_standard': 'Asian Standard (WPRO)',
    'bmi.who_standard': 'WHO Global Standard',
    'bmi.your_params': 'Your Body Parameters',
    'bmi.height': 'Height',
    'bmi.weight': 'Weight',
    'bmi.reset': 'Reset',
    'bmi.result_title': 'Body Composition Results',
    'bmi.ideal_weight': 'Ideal weight range:',
    'bmi.advice': 'Holistic Wellness Guidance:',
    'bmi.save': 'Save to Profile',
    'bmi.saved': 'Saved!',
    'bmi.underweight': 'Underweight',
    'bmi.normal': 'Normal Weight',
    'bmi.overweight': 'Overweight / Pre-obesity',
    'bmi.obese': 'Obesity',
    
    // Exercise
    'exercise.title': 'Therapeutic Exercise & Recovery',
    'exercise.today_advice': 'TODAY’S RECOMMENDATION:',
    'exercise.search': 'Search exercises, yoga poses, qigong...',
    'exercise.all': 'All',
    'exercise.yoga': 'Therapeutic Yoga',
    'exercise.qigong': 'Qigong & Vitality',
    'exercise.cardio': 'Cardio & Stamina',
    'exercise.rehab': 'Physical Therapy',
    'exercise.start': 'Start Routine',
    'exercise.complete': 'Complete',
    'exercise.duration': 'Duration',
    'exercise.intensity': 'Intensity',
    'exercise.calories': 'Calories Burned',

    // Trends Chart
    'trends.title': 'Vital Signs & Health Trends',
    'trends.subtitle': 'Continuous monitoring for heart rate, blood pressure & daily activity',
    'trends.hr': 'Heart Rate',
    'trends.bp': 'Blood Pressure',
    'trends.spo2': 'SPO2',
    'trends.activity': 'Activity',

    // Common
    'common.you': 'You',
    'common.confirm': 'Confirm',
    'common.close': 'Close',
    'common.search': 'Search...',
    'common.view_details': 'View Details',
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'vi',
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('tam_an_language') as Language) || 'vi';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('tam_an_language', lang);
  };

  const t = (key: string, fallback?: string): string => {
    if (translations[language]?.[key]) {
      return translations[language][key];
    }
    if (language === 'en') {
      return translations['en']?.[key] || fallback || translations['vi']?.[key] || key;
    }
    return translations['vi']?.[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
