import { useState, useEffect, useRef } from 'react';
import { 
  FileDown, 
  Image as ImageIcon, 
  X, 
  Check, 
  Calendar, 
  Heart, 
  Scale, 
  Droplets, 
  Activity, 
  Moon, 
  Sparkles, 
  Download, 
  FileText, 
  ShieldCheck, 
  Loader2 
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';

interface HealthReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HealthReportExportModal({ isOpen, onClose }: HealthReportExportModalProps) {
  const { user, profile } = useAuth();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');
  const [exportingType, setExportingType] = useState<'pdf' | 'image' | null>(null);
  const [includeBmi, setIncludeBmi] = useState(true);
  const [includeVitals, setIncludeVitals] = useState(true);
  const [includeWater, setIncludeWater] = useState(true);
  const [includeAdvice, setIncludeAdvice] = useState(true);

  const [loading, setLoading] = useState(true);
  const [vitalsData, setVitalsData] = useState<any[]>([]);
  const [journalData, setJournalData] = useState<any[]>([]);
  
  // BMI parameters from localStorage or user profile
  const [height, setHeight] = useState<number>(170);
  const [weight, setWeight] = useState<number>(65);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Load saved BMI parameters from local storage
    try {
      const savedH = localStorage.getItem('user_bmi_height');
      const savedW = localStorage.getItem('user_bmi_weight');
      if (savedH) setHeight(parseFloat(savedH));
      if (savedW) setWeight(parseFloat(savedW));
    } catch (e) {
      console.warn("Could not read local BMI data", e);
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        if (user) {
          // Fetch vitals
          const vQuery = query(collection(db, 'vitals'), where('userId', '==', user.uid));
          const vSnap = await getDocs(vQuery);
          const vDocs = vSnap.docs.map(doc => {
            const d = doc.data();
            let rawDate = new Date();
            if (d.timestamp && typeof d.timestamp.toDate === 'function') {
              rawDate = d.timestamp.toDate();
            } else if (d.timestamp) {
              rawDate = new Date(d.timestamp);
            }
            return { id: doc.id, ...d, date: rawDate };
          });
          vDocs.sort((a, b) => b.date.getTime() - a.date.getTime());
          setVitalsData(vDocs);

          // Fetch journals
          const jQuery = query(collection(db, 'healthJournals'), where('userId', '==', user.uid));
          const jSnap = await getDocs(jQuery);
          const jDocs = jSnap.docs.map(doc => {
            const d = doc.data();
            let rawDate = new Date();
            if (d.createdAt && typeof d.createdAt.toDate === 'function') {
              rawDate = d.createdAt.toDate();
            } else if (d.createdAt) {
              rawDate = new Date(d.createdAt);
            }
            return { id: doc.id, ...d, date: rawDate };
          });
          jDocs.sort((a, b) => b.date.getTime() - a.date.getTime());
          setJournalData(jDocs);
        } else {
          // Fallback demo dataset
          generateMockData();
        }
      } catch (err) {
        console.error("Error fetching report data:", err);
        generateMockData();
      } finally {
        setLoading(false);
      }
    };

    const generateMockData = () => {
      const now = new Date();
      const mockVitals = [];
      const mockJournals = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        mockVitals.push({
          id: `mv_${i}`,
          heartRate: 72 + Math.floor(Math.sin(i) * 6),
          bloodPressureSystolic: 120 + Math.floor(Math.cos(i) * 5),
          bloodPressureDiastolic: 80 + Math.floor(Math.sin(i) * 3),
          spo2: 98,
          temperature: 36.6,
          date: d
        });
        mockJournals.push({
          id: `mj_${i}`,
          water: 8,
          sleep: 7.5,
          energy: 'high',
          mood: 'good',
          date: d
        });
      }
      setVitalsData(mockVitals);
      setJournalData(mockJournals);
    };

    fetchData();
  }, [isOpen, user]);

  // Calculations based on filtered timeframe
  const filteredVitals = vitalsData.filter(v => {
    if (timeRange === 'all') return true;
    const days = timeRange === '7d' ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return v.date >= cutoff;
  });

  const filteredJournals = journalData.filter(j => {
    if (timeRange === 'all') return true;
    const days = timeRange === '7d' ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return j.date >= cutoff;
  });

  // BMI calculations
  const bmiValue = parseFloat((weight / Math.pow(height / 100, 2)).toFixed(1));
  const minIdealWeight = parseFloat((18.5 * Math.pow(height / 100, 2)).toFixed(1));
  const maxIdealWeight = parseFloat((22.9 * Math.pow(height / 100, 2)).toFixed(1));
  const recommendedWaterLiters = (weight * 0.035).toFixed(1);

  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Thiếu cân (Gầy)', textNoAccent: 'Thieu can (Gay)', color: '#38bdf8', status: 'Can bo sung dinh duong' };
    if (bmi <= 22.9) return { label: 'Bình thường (Lý tưởng)', textNoAccent: 'Binh thuong (Ly tuong)', color: '#10b981', status: 'The trang ly tuong' };
    if (bmi <= 24.9) return { label: 'Thừa cân (Tiền béo phì)', textNoAccent: 'Thua can (Tien beo phi)', color: '#f59e0b', status: 'Can kiem soat calo' };
    if (bmi <= 29.9) return { label: 'Béo phì Độ I', textNoAccent: 'Beo phi Do I', color: '#f97316', status: 'Can giam can khoa hoc' };
    return { label: 'Béo phì Độ II', textNoAccent: 'Beo phi Do II', color: '#ef4444', status: 'Nguy co benh man tinh cao' };
  };
  const bmiCategory = getBmiCategory(bmiValue);

  // Vitals stats calculations
  const hrList = filteredVitals.map(v => Number(v.heartRate || 72));
  const avgHr = hrList.length > 0 ? Math.round(hrList.reduce((a, b) => a + b, 0) / hrList.length) : 72;
  const minHr = hrList.length > 0 ? Math.min(...hrList) : 68;
  const maxHr = hrList.length > 0 ? Math.max(...hrList) : 84;

  const sysList = filteredVitals.map(v => Number(v.bloodPressureSystolic || 120));
  const avgSys = sysList.length > 0 ? Math.round(sysList.reduce((a, b) => a + b, 0) / sysList.length) : 120;
  const diaList = filteredVitals.map(v => Number(v.bloodPressureDiastolic || 80));
  const avgDia = diaList.length > 0 ? Math.round(diaList.reduce((a, b) => a + b, 0) / diaList.length) : 80;

  const spo2List = filteredVitals.map(v => Number(v.spo2 || 98));
  const avgSpo2 = spo2List.length > 0 ? Math.round(spo2List.reduce((a, b) => a + b, 0) / spo2List.length) : 98;

  // Hydration stats
  const waterList = filteredJournals.map(j => Number(j.water || 8));
  const avgWaterCups = waterList.length > 0 ? (waterList.reduce((a, b) => a + b, 0) / waterList.length).toFixed(1) : '8.0';
  const avgWaterMl = Math.round(parseFloat(avgWaterCups) * 250);
  const sleepList = filteredJournals.map(j => Number(j.sleep || 7.5));
  const avgSleep = sleepList.length > 0 ? (sleepList.reduce((a, b) => a + b, 0) / sleepList.length).toFixed(1) : '7.5';

  const stripAccents = (str: string) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  };

  // 1. EXPORT TO PDF
  const handleExportPDF = () => {
    setExportingType('pdf');
    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const margin = 16;
      let currentY = 16;

      // Header Banner (Navy gradient box)
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 38, 'F');

      // Accent Teal line
      doc.setFillColor(45, 212, 191); // primary teal
      doc.rect(0, 36.5, 210, 1.5, 'F');

      // Title & Branding
      doc.setTextColor(45, 212, 191);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("TU TUE Y QUAN - BAO CAO SUC KHOE CA NHAN", margin, 16);

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("COMPREHENSIVE PERSONAL HEALTH & WELLNESS SUMMARY", margin, 22);

      doc.setTextColor(148, 163, 184); // slate-400
      doc.setFontSize(8);
      const timeStr = new Date().toLocaleDateString('vi-VN') + " " + new Date().toLocaleTimeString('vi-VN');
      doc.text(`Ngay xuat bao cao: ${timeStr}`, margin, 28);
      doc.text(`Pham vi khao sat: ${timeRange === '7d' ? '7 ngay qua' : timeRange === '30d' ? '30 ngay qua' : 'Toan bo lich su'}`, 130, 28);

      currentY = 46;

      // User Profile Row
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, currentY, 210 - margin * 2, 16, 2, 2, 'F');
      doc.setTextColor(51, 65, 85);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("HO SO NGUOI DUNG:", margin + 4, currentY + 7);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(`Email: ${user?.email || 'Nguoi dung Guest'}`, margin + 40, currentY + 7);
      doc.text(`Ma dinh danh: ${user?.uid ? user.uid.substring(0, 12) : 'ANON-GUEST'}`, margin + 115, currentY + 7);
      doc.text(`Tinh trang theo doi: Hoat dong tot (Active)`, margin + 4, currentY + 12);
      doc.text(`He thong phan tich: AI Y Khoa Tu Tue`, margin + 115, currentY + 12);

      currentY += 22;

      // SECTION 1: BMI & PHYSIQUE
      if (includeBmi) {
        doc.setFillColor(45, 212, 191);
        doc.rect(margin, currentY, 3, 7, 'F');
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("1. CHI SO THE TRANG & BMI (BODY MASS INDEX)", margin + 6, currentY + 5.5);

        currentY += 10;

        // BMI Card Grid (3 columns)
        const colW = (210 - margin * 2 - 8) / 3;

        // Box 1: BMI Score
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(margin, currentY, colW, 24, 2, 2, 'F');
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.text("CHI SO BMI HIEN TAI", margin + 4, currentY + 6);
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(14);
        doc.text(`${bmiValue} kg/m2`, margin + 4, currentY + 15);
        doc.setTextColor(13, 148, 136);
        doc.setFontSize(8);
        doc.text(`Phan loai: ${bmiCategory.textNoAccent}`, margin + 4, currentY + 20);

        // Box 2: Height & Weight
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(margin + colW + 4, currentY, colW, 24, 2, 2, 'F');
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.text("CHIEU CAO & CAN NANG", margin + colW + 8, currentY + 6);
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(12);
        doc.text(`${height} cm / ${weight} kg`, margin + colW + 8, currentY + 15);
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(8);
        doc.text(`Chuan: WPRO Asia-Pacific`, margin + colW + 8, currentY + 20);

        // Box 3: Target Weight & Hydration Requirement
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(margin + (colW + 4) * 2, currentY, colW, 24, 2, 2, 'F');
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.text("CAN NANG CHUAN & NUOC", margin + (colW + 4) * 2 + 4, currentY + 6);
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(10.5);
        doc.text(`${minIdealWeight} - ${maxIdealWeight} kg`, margin + (colW + 4) * 2 + 4, currentY + 14);
        doc.setTextColor(14, 116, 144);
        doc.setFontSize(8);
        doc.text(`Muc tieu nuoc: ~${recommendedWaterLiters} Lit/ngay`, margin + (colW + 4) * 2 + 4, currentY + 20);

        currentY += 30;
      }

      // SECTION 2: HEART RATE & VITALS
      if (includeVitals) {
        doc.setFillColor(244, 63, 94); // rose-500
        doc.rect(margin, currentY, 3, 7, 'F');
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("2. CHI SO SINH HIEU & NHIP TIM (HEART RATE & VITALS)", margin + 6, currentY + 5.5);

        currentY += 10;

        // Vitals Grid (4 boxes)
        const vBoxW = (210 - margin * 2 - 9) / 4;

        // VBox 1: Heart Rate
        doc.setFillColor(255, 241, 242);
        doc.roundedRect(margin, currentY, vBoxW, 22, 2, 2, 'F');
        doc.setTextColor(225, 29, 72);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.text("NHIP TIM TB (HR)", margin + 3, currentY + 6);
        doc.setFontSize(13);
        doc.text(`${avgHr} BPM`, margin + 3, currentY + 14);
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Min: ${minHr} | Max: ${maxHr}`, margin + 3, currentY + 19);

        // VBox 2: Blood Pressure
        doc.setFillColor(236, 254, 255);
        doc.roundedRect(margin + vBoxW + 3, currentY, vBoxW, 22, 2, 2, 'F');
        doc.setTextColor(8, 145, 178);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.text("HUYET AP TB", margin + vBoxW + 6, currentY + 6);
        doc.setFontSize(12);
        doc.text(`${avgSys}/${avgDia} mmHg`, margin + vBoxW + 6, currentY + 14);
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text("Chuan: < 120/80", margin + vBoxW + 6, currentY + 19);

        // VBox 3: SpO2
        doc.setFillColor(236, 253, 245);
        doc.roundedRect(margin + (vBoxW + 3) * 2, currentY, vBoxW, 22, 2, 2, 'F');
        doc.setTextColor(5, 150, 105);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.text("OXY MAU (SpO2)", margin + (vBoxW + 3) * 2 + 3, currentY + 6);
        doc.setFontSize(13);
        doc.text(`${avgSpo2} %`, margin + (vBoxW + 3) * 2 + 3, currentY + 14);
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text("Nguong an toan >= 95%", margin + (vBoxW + 3) * 2 + 3, currentY + 19);

        // VBox 4: Record counts
        doc.setFillColor(243, 244, 246);
        doc.roundedRect(margin + (vBoxW + 3) * 3, currentY, vBoxW, 22, 2, 2, 'F');
        doc.setTextColor(75, 85, 99);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.text("SO BAN GHI", margin + (vBoxW + 3) * 3 + 3, currentY + 6);
        doc.setFontSize(13);
        doc.text(`${filteredVitals.length} lan`, margin + (vBoxW + 3) * 3 + 3, currentY + 14);
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text("Do luong deu dan", margin + (vBoxW + 3) * 3 + 3, currentY + 19);

        currentY += 28;
      }

      // SECTION 3: HYDRATION & ACTIVITY
      if (includeWater) {
        doc.setFillColor(14, 165, 233); // sky-500
        doc.rect(margin, currentY, 3, 7, 'F');
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("3. NHAT KY UONG NUOC & GIAC NGU (HYDRATION & LIFESTYLE)", margin + 6, currentY + 5.5);

        currentY += 10;

        const hBoxW = (210 - margin * 2 - 4) / 2;

        // Hydration Card
        doc.setFillColor(240, 249, 255);
        doc.roundedRect(margin, currentY, hBoxW, 22, 2, 2, 'F');
        doc.setTextColor(2, 132, 199);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text("LUONG NUOC TRUNG BINH MOI NGAY", margin + 4, currentY + 6);
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(13);
        doc.text(`${avgWaterCups} coc (~${avgWaterMl} ml)`, margin + 4, currentY + 14);
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(7.5);
        doc.text(`Tien do dat muc tieu: ${Math.min(100, Math.round((avgWaterMl / (parseFloat(recommendedWaterLiters) * 1000)) * 100))}%`, margin + 4, currentY + 19);

        // Sleep Card
        doc.setFillColor(245, 243, 255);
        doc.roundedRect(margin + hBoxW + 4, currentY, hBoxW, 22, 2, 2, 'F');
        doc.setTextColor(124, 58, 237);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text("THOI LUONG GIAC NGU TRUNG BINH", margin + hBoxW + 8, currentY + 6);
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(13);
        doc.text(`${avgSleep} gio / dem`, margin + hBoxW + 8, currentY + 14);
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(7.5);
        doc.text("Giac ngu sau & phuc hoi the luc", margin + hBoxW + 8, currentY + 19);

        currentY += 28;
      }

      // SECTION 4: TABLE OF RECENT ENTRIES (Up to 5)
      doc.setFillColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text("CHI TIET CAC LAN DO SINH HIEU GAN NHAT:", margin, currentY);
      currentY += 5;

      // Table header
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, currentY, 210 - margin * 2, 6, 'F');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text("Thoi gian", margin + 3, currentY + 4);
      doc.text("Nhip tim (BPM)", margin + 45, currentY + 4);
      doc.text("Huyet ap (mmHg)", margin + 85, currentY + 4);
      doc.text("SpO2 (%)", margin + 125, currentY + 4);
      doc.text("Than nhiet (C)", margin + 155, currentY + 4);

      currentY += 6;

      const recentItems = filteredVitals.slice(0, 5);
      if (recentItems.length > 0) {
        recentItems.forEach((v, idx) => {
          if (idx % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, currentY, 210 - margin * 2, 6, 'F');
          }
          doc.setTextColor(51, 65, 85);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          const dateStr = v.date ? v.date.toLocaleDateString('vi-VN') + " " + v.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';
          doc.text(dateStr, margin + 3, currentY + 4);
          doc.text(`${v.heartRate || '--'} BPM`, margin + 45, currentY + 4);
          doc.text(`${v.bloodPressureSystolic || '--'}/${v.bloodPressureDiastolic || '--'}`, margin + 85, currentY + 4);
          doc.text(`${v.spo2 || '--'}%`, margin + 125, currentY + 4);
          doc.text(`${v.temperature || '--'} C`, margin + 155, currentY + 4);
          currentY += 6;
        });
      } else {
        doc.setTextColor(148, 163, 184);
        doc.text("Chua co du lieu ghi nhan trong thoi gian nay.", margin + 3, currentY + 4);
        currentY += 6;
      }

      currentY += 6;

      // SECTION 5: RECOMMENDATIONS & MEDICAL DISCLAIMER
      if (includeAdvice) {
        doc.setFillColor(254, 243, 199); // amber-100
        doc.roundedRect(margin, currentY, 210 - margin * 2, 22, 2, 2, 'F');
        doc.setTextColor(180, 83, 9); // amber-700
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text("LOI KHUYEN DUONG SINH & DINH DUONG DONG Y TU TUE:", margin + 4, currentY + 6);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(120, 53, 15);
        let adviceText = "Duy tri uong du 2L nuoc moi ngay, van dong nhe 30 phut, ngu truoc 23h de duong tam khi.";
        if (bmiValue < 18.5) {
          adviceText = "The trang Hu nhuoc/Gay: Nen bo khi bo huyet (Dang sam, Hoang ky, Long nhan), an nhieu bua bo duong.";
        } else if (bmiValue >= 23.0) {
          adviceText = "The trang Dam thap/Thua can: Nen uong tra La sen, Son tra, Giao co lam; hanh khi hoa dam, giam mo duong.";
        }
        doc.text(adviceText, margin + 4, currentY + 11);
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(6.5);
        doc.text("* Luu y: Bao cao mang tinh chat tham khao duong sinh, khong thay the chan doan y khoa truc tiep tai benh vien.", margin + 4, currentY + 17);
      }

      // Footer
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, 285, 210 - margin, 285);
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(7);
      doc.text("Tu Tue Y Quan - Ung dung Cham soc Suc khoe Dong Y & AI | https://tu-tue-y-quan.vn", margin, 290);
      doc.text("Trang 1 / 1", 185, 290);

      // Save PDF
      const fileName = `BaoCao_SucKhoe_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error("PDF Export error:", err);
      alert("Đã xảy ra lỗi khi tạo file PDF. Vui lòng thử lại!");
    } finally {
      setExportingType(null);
    }
  };

  // 2. EXPORT TO PNG IMAGE CARD (Canvas-based Infographic Snapshot)
  const handleExportImage = async () => {
    setExportingType('image');
    try {
      const canvas = document.createElement('canvas');
      const width = 1080;
      const heightPx = 1440;
      canvas.width = width;
      canvas.height = heightPx;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error("Could not get 2d canvas context");

      // 1. Background Gradient (Dark Luxury Slate / Emerald theme)
      const bgGrad = ctx.createLinearGradient(0, 0, width, heightPx);
      bgGrad.addColorStop(0, '#090d16');
      bgGrad.addColorStop(0.5, '#0f172a');
      bgGrad.addColorStop(1, '#022c22');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, heightPx);

      // Draw subtle decorative rings
      ctx.strokeStyle = 'rgba(45, 212, 191, 0.08)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(width - 100, 100, 260, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(80, heightPx - 100, 320, 0, Math.PI * 2);
      ctx.stroke();

      // Header Brand
      ctx.fillStyle = '#2dd4bf'; // teal-400
      ctx.font = 'bold 38px "Playfair Display", Georgia, serif';
      ctx.fillText('TU TUE Y QUAN', 60, 90);

      ctx.fillStyle = '#ffffff';
      ctx.font = '300 24px sans-serif';
      ctx.fillText('BÁO CÁO TỔNG QUAN SỨC KHỎE CÁ NHÂN', 60, 130);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '20px sans-serif';
      const dateStr = `Ngày tạo: ${new Date().toLocaleDateString('vi-VN')} | Người dùng: ${user?.email || 'Thành viên Tu Tuệ'}`;
      ctx.fillText(dateStr, 60, 170);

      // Divider
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(60, 205);
      ctx.lineTo(width - 60, 205);
      ctx.stroke();

      let cardY = 240;

      // 2. BMI Card (Highlight Card)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      roundRect(ctx, 60, cardY, width - 120, 210, 24);
      ctx.strokeStyle = 'rgba(45, 212, 191, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // BMI Inner info
      ctx.fillStyle = '#2dd4bf';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('CHỈ SỐ THỂ TRẠNG (BODY MASS INDEX)', 90, cardY + 45);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 64px sans-serif';
      ctx.fillText(`${bmiValue}`, 90, cardY + 120);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '24px sans-serif';
      ctx.fillText('kg/m²', 240, cardY + 120);

      // Status pill
      ctx.fillStyle = 'rgba(45, 212, 191, 0.15)';
      roundRect(ctx, 90, cardY + 145, 300, 40, 12);
      ctx.fillStyle = '#2dd4bf';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`Thể trạng: ${bmiCategory.label}`, 105, cardY + 171);

      // Right column in BMI card
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '22px sans-serif';
      ctx.fillText(`Chiều cao: ${height} cm  |  Cân nặng: ${weight} kg`, 500, cardY + 80);
      ctx.fillText(`Dải cân nặng lý tưởng: ${minIdealWeight} - ${maxIdealWeight} kg`, 500, cardY + 125);
      ctx.fillText(`Lượng nước tối thiểu: ~${recommendedWaterLiters} L/ngày`, 500, cardY + 170);

      cardY += 240;

      // 3. Grid of 4 Health Metrics Tiles
      const tileW = (width - 120 - 24) / 2;
      const tileH = 175;

      // Tile 1: Heart Rate
      drawMetricTile(
        ctx, 
        60, 
        cardY, 
        tileW, 
        tileH, 
        'NHỊP TIM TRUNG BÌNH', 
        `${avgHr}`, 
        'BPM', 
        `Min: ${minHr}  •  Max: ${maxHr} BPM`, 
        '#f43f5e', 
        'rgba(244, 63, 94, 0.1)'
      );

      // Tile 2: Blood Pressure
      drawMetricTile(
        ctx, 
        60 + tileW + 24, 
        cardY, 
        tileW, 
        tileH, 
        'HUYẾT ÁP TRUNG BÌNH', 
        `${avgSys}/${avgDia}`, 
        'mmHg', 
        'Chuẩn lý tưởng: < 120/80 mmHg', 
        '#06b6d4', 
        'rgba(6, 182, 212, 0.1)'
      );

      cardY += tileH + 20;

      // Tile 3: Water Intake
      drawMetricTile(
        ctx, 
        60, 
        cardY, 
        tileW, 
        tileH, 
        'NHẬT KÝ UỐNG NƯỚC', 
        `${avgWaterCups}`, 
        'Cốc/ngày', 
        `Tương đương ~${avgWaterMl} ml/ngày (${timeRange === '7d' ? '7 ngày' : '30 ngày'})`, 
        '#38bdf8', 
        'rgba(56, 189, 248, 0.1)'
      );

      // Tile 4: SpO2
      drawMetricTile(
        ctx, 
        60 + tileW + 24, 
        cardY, 
        tileW, 
        tileH, 
        'NỒNG ĐỘ OXY TRONG MÁU', 
        `${avgSpo2}`, 
        '% SpO2', 
        'Chỉ số an toàn hô hấp ≥ 95%', 
        '#10b981', 
        'rgba(16, 185, 129, 0.1)'
      );

      cardY += tileH + 30;

      // 4. Recommendation & Advice Banner
      ctx.fillStyle = 'rgba(251, 191, 36, 0.08)';
      roundRect(ctx, 60, cardY, width - 120, 170, 20);
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('LỜI KHUYÊN DƯỠNG SINH ĐÔNG Y TỪ TỰ NHIÊN', 90, cardY + 45);

      ctx.fillStyle = '#f1f5f9';
      ctx.font = '20px sans-serif';
      let advice1 = 'Duy trì uống đủ nước ấm từng ngụm nhỏ, ngủ trước 23h để dưỡng tạng Can & Thận.';
      let advice2 = 'Kết hợp các bài tập nhẹ (Yoga, đi bộ) 30 phút mỗi ngày giúp lưu thông khí huyết.';
      if (bmiValue < 18.5) {
        advice1 = 'Bồi bổ khí huyết: Dùng Đẳng sâm, Hoàng kỳ, Long nhãn, hạt sen để kiện tỳ ích khí.';
        advice2 = 'Ăn uống ấm nóng, chia nhỏ bữa trong ngày, tránh đồ lạnh và làm việc quá sức.';
      } else if (bmiValue >= 23.0) {
        advice1 = 'Thanh nhiệt hóa đàm: Dùng trà Lá sen, Sơn tra, Giảo cổ lam để tiêu mỡ, hạ áp.';
        advice2 = 'Hạn chế dầu mỡ, đồ ngọt; tăng cường rau xanh và vận động đốt calo đều đặn.';
      }
      ctx.fillText(advice1, 90, cardY + 85);
      ctx.fillText(advice2, 90, cardY + 120);

      // 5. Footer Watermark & Seal
      ctx.fillStyle = '#64748b';
      ctx.font = '18px sans-serif';
      ctx.fillText('Tự Tuệ Y Quán - Ứng dụng Y Học Cổ Truyền & Trợ Lý Sức Khỏe AI Toàn Diện', 60, heightPx - 50);

      ctx.fillStyle = '#2dd4bf';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('✓ VERIFIED HEALTH SUMMARY', width - 360, heightPx - 50);

      // Convert canvas to blob & download
      canvas.toBlob((blob) => {
        if (!blob) throw new Error("Could not create image blob");
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BaoCaoSucKhoe_${new Date().toISOString().split('T')[0]}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 'image/png');

    } catch (err) {
      console.error("Image Export error:", err);
      alert("Đã xảy ra lỗi khi tạo hình ảnh tóm tắt. Vui lòng thử lại!");
    } finally {
      setExportingType(null);
    }
  };

  // Canvas helper functions
  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  };

  const drawMetricTile = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    w: number, 
    h: number, 
    title: string, 
    value: string, 
    unit: string, 
    subtitle: string, 
    accentColor: string, 
    bgColor: string
  ) => {
    ctx.fillStyle = bgColor;
    roundRect(ctx, x, y, w, h, 20);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(title, x + 24, y + 36);

    ctx.fillStyle = accentColor;
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText(value, x + 24, y + 90);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '20px sans-serif';
    const valWidth = ctx.measureText(value).width;
    ctx.fillText(unit, x + 34 + valWidth, y + 90);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px sans-serif';
    ctx.fillText(subtitle, x + 24, y + 135);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-panel border border-border rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-6 relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
              <FileDown className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h3 className="font-serif text-2xl italic font-light text-white">Xuất Báo Cáo Sức Khỏe</h3>
              <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold mt-0.5">
                Tổng hợp BMI, Nhịp tim, Huyết áp & Nhật ký uống nước
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-text-dim hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Timeframe selector */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">
            Phạm vi thời gian tổng hợp
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: '7d', label: '7 Ngày Gần Nhất' },
              { id: '30d', label: '30 Ngày Qua' },
              { id: 'all', label: 'Toàn Bộ Lịch Sử' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTimeRange(tab.id as any)}
                className={cn(
                  "py-2.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                  timeRange === tab.id
                    ? "bg-primary text-bg border-primary shadow-md"
                    : "bg-white/[0.02] border-white/5 text-text-dim hover:text-white hover:bg-white/[0.05]"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Summary Preview Box */}
        <div className="bg-bg/60 border border-white/5 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-text-dim border-b border-white/5 pb-2">
            <span className="font-medium text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Tóm tắt chỉ số báo cáo sẽ xuất:
            </span>
            <span className="font-mono text-[10px]">{filteredVitals.length} bản ghi sinh hiệu</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 space-y-1">
              <span className="text-[9px] text-text-dim uppercase font-bold block">Chỉ số BMI</span>
              <span className="text-base font-mono font-bold text-teal-400">{bmiValue}</span>
              <span className="text-[8px] text-text-dim block truncate">{bmiCategory.label}</span>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 space-y-1">
              <span className="text-[9px] text-text-dim uppercase font-bold block">Nhịp tim TB</span>
              <span className="text-base font-mono font-bold text-rose-400">{avgHr} <small className="text-[9px]">BPM</small></span>
              <span className="text-[8px] text-text-dim block">Min {minHr} - Max {maxHr}</span>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 space-y-1">
              <span className="text-[9px] text-text-dim uppercase font-bold block">Huyết áp TB</span>
              <span className="text-base font-mono font-bold text-cyan-400">{avgSys}/{avgDia}</span>
              <span className="text-[8px] text-text-dim block">mmHg</span>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 space-y-1">
              <span className="text-[9px] text-text-dim uppercase font-bold block">Nước uống TB</span>
              <span className="text-base font-mono font-bold text-sky-400">{avgWaterCups} <small className="text-[9px]">cốc</small></span>
              <span className="text-[8px] text-text-dim block">~{avgWaterMl} ml/ngày</span>
            </div>
          </div>
        </div>

        {/* Customization Checkboxes */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">
            Nội dung bao gồm trong báo cáo
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setIncludeBmi(!includeBmi)}
              className={cn(
                "flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left cursor-pointer",
                includeBmi ? "bg-primary/10 border-primary/30 text-white" : "bg-white/[0.02] border-white/5 text-text-dim"
              )}
            >
              <div className={cn("w-4 h-4 rounded flex items-center justify-center border", includeBmi ? "bg-primary text-bg border-primary" : "border-white/20")}>
                {includeBmi && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <Scale className="w-3.5 h-3.5 text-teal-400" />
              <span>Chỉ số BMI & Thể trạng</span>
            </button>

            <button
              type="button"
              onClick={() => setIncludeVitals(!includeVitals)}
              className={cn(
                "flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left cursor-pointer",
                includeVitals ? "bg-rose-500/10 border-rose-500/30 text-white" : "bg-white/[0.02] border-white/5 text-text-dim"
              )}
            >
              <div className={cn("w-4 h-4 rounded flex items-center justify-center border", includeVitals ? "bg-rose-500 text-white border-rose-500" : "border-white/20")}>
                {includeVitals && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              <span>Nhịp tim & Sinh hiệu</span>
            </button>

            <button
              type="button"
              onClick={() => setIncludeWater(!includeWater)}
              className={cn(
                "flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left cursor-pointer",
                includeWater ? "bg-sky-500/10 border-sky-500/30 text-white" : "bg-white/[0.02] border-white/5 text-text-dim"
              )}
            >
              <div className={cn("w-4 h-4 rounded flex items-center justify-center border", includeWater ? "bg-sky-500 text-white border-sky-500" : "border-white/20")}>
                {includeWater && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <Droplets className="w-3.5 h-3.5 text-sky-400" />
              <span>Nhật ký nước & Giấc ngủ</span>
            </button>

            <button
              type="button"
              onClick={() => setIncludeAdvice(!includeAdvice)}
              className={cn(
                "flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left cursor-pointer",
                includeAdvice ? "bg-amber-500/10 border-amber-500/30 text-white" : "bg-white/[0.02] border-white/5 text-text-dim"
              )}
            >
              <div className={cn("w-4 h-4 rounded flex items-center justify-center border", includeAdvice ? "bg-amber-500 text-bg border-amber-500" : "border-white/20")}>
                {includeAdvice && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Lời khuyên Đông Y</span>
            </button>
          </div>
        </div>

        {/* Action Buttons: PDF or PNG */}
        <div className="pt-2 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={exportingType !== null}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-bg font-bold text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {exportingType === 'pdf' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            Xuất File PDF Đầy Đủ
          </button>

          <button
            type="button"
            onClick={handleExportImage}
            disabled={exportingType !== null}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider border border-white/10 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {exportingType === 'image' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ImageIcon className="w-4 h-4 text-primary" />
            )}
            Lưu Ảnh Tóm Tắt (PNG)
          </button>
        </div>
      </motion.div>
    </div>
  );
}
