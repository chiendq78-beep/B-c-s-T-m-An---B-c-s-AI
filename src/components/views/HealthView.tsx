import { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Smile, 
  Zap, 
  Droplets, 
  Moon, 
  ChevronRight, 
  Plus, 
  LineChart, 
  Dumbbell, 
  Play,
  Clock,
  Flame,
  Heart,
  Thermometer,
  Activity,
  Pill,
  Trash2,
  Volume2,
  Filter,
  ArrowRight,
  FileDown
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';
import { 
  LineChart as ReLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import MedicationReminderModal from '../MedicationReminderModal';
import JournalEntryModal from '../JournalEntryModal';
import VitalsEntryModal from '../VitalsEntryModal';
import HealthReportExportModal from '../HealthReportExportModal';

interface VitalsData {
  id: string;
  heartRate: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  temperature: number;
  spo2: number;
  timestamp: any;
  rawTimestamp: Date;
  dateLabel?: string;
}

const EXERCISES = [
  { title: 'Chào mặt trời', duration: 15, level: 'Dễ', kcal: 120, type: 'Yoga', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400' },
  { title: 'Thiền Chánh niệm', duration: 10, level: 'Dễ', kcal: 30, type: 'Thiền', image: 'https://images.unsplash.com/photo-1591228127791-8e2eaef098d3?auto=format&fit=crop&q=80&w=400' },
  { title: 'Trị liệu đau lưng', duration: 20, level: 'Trung bình', kcal: 150, type: 'Trị liệu', image: 'https://images.unsplash.com/photo-1510894347713-fc3ad6cb0d4d?auto=format&fit=crop&q=80&w=400' },
];

export default function HealthView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'journal' | 'exercise'>('journal');
  const [vitals, setVitals] = useState<VitalsData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [medications, setMedications] = useState<any[]>([]);
  const [loadingMedications, setLoadingMedications] = useState(false);
  const [isMedicationModalOpen, setIsMedicationModalOpen] = useState(false);
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);

  // Health Journal States
  const [journals, setJournals] = useState<any[]>([]);
  const [loadingJournals, setLoadingJournals] = useState(false);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Filter states
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month' | 'custom'>('all');
  const [startDateStr, setStartDateStr] = useState<string>('');
  const [endDateStr, setEndDateStr] = useState<string>('');

  // Filtered lists based on choice
  const filteredVitals = useMemo(() => {
    let result = [...vitals];
    if (timeFilter === 'all') {
      result = result.slice(-20);
    } else if (timeFilter === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      result = result.filter(v => v.rawTimestamp && v.rawTimestamp >= oneWeekAgo);
    } else if (timeFilter === 'month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      result = result.filter(v => v.rawTimestamp && v.rawTimestamp >= oneMonthAgo);
    } else if (timeFilter === 'custom') {
      const start = startDateStr ? new Date(startDateStr + 'T00:00:00') : null;
      const end = endDateStr ? new Date(endDateStr + 'T23:59:59') : null;
      result = result.filter(v => {
        if (!v.rawTimestamp) return false;
        if (start && v.rawTimestamp < start) return false;
        if (end && v.rawTimestamp > end) return false;
        return true;
      });
    }
    return result;
  }, [vitals, timeFilter, startDateStr, endDateStr]);

  const filteredJournals = useMemo(() => {
    let result = [...journals];
    if (timeFilter === 'all') {
      result = result.slice(0, 10);
    } else if (timeFilter === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      result = result.filter(j => j.rawDate && j.rawDate >= oneWeekAgo);
    } else if (timeFilter === 'month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      result = result.filter(j => j.rawDate && j.rawDate >= oneMonthAgo);
    } else if (timeFilter === 'custom') {
      const start = startDateStr ? new Date(startDateStr + 'T00:00:00') : null;
      const end = endDateStr ? new Date(endDateStr + 'T23:59:59') : null;
      result = result.filter(j => {
        if (!j.rawDate) return false;
        if (start && j.rawDate < start) return false;
        if (end && j.rawDate > end) return false;
        return true;
      });
    }
    return result;
  }, [journals, timeFilter, startDateStr, endDateStr]);

  useEffect(() => {
    if (user) {
      fetchVitals();
      fetchMedicationReminders();
      fetchJournals();
    }
  }, [user]);

  // Listen for back gesture when sub-modals in HealthView are active
  useEffect(() => {
    const hasAnyModalOpen = isMedicationModalOpen || isJournalModalOpen || isVitalsModalOpen || isReportModalOpen;
    if (!hasAnyModalOpen) return;

    const handleBackGesture = (e: Event) => {
      e.preventDefault();
      if (isMedicationModalOpen) handleCloseMedicationModal();
      else if (isJournalModalOpen) setIsJournalModalOpen(false);
      else if (isVitalsModalOpen) setIsVitalsModalOpen(false);
      else if (isReportModalOpen) setIsReportModalOpen(false);
    };

    window.addEventListener('app-back-press', handleBackGesture);
    return () => window.removeEventListener('app-back-press', handleBackGesture);
  }, [isMedicationModalOpen, isJournalModalOpen, isVitalsModalOpen, isReportModalOpen]);

  const fetchJournals = async () => {
    if (!user) return;
    setLoadingJournals(true);
    try {
      const q = query(
        collection(db, 'healthJournals'),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      const docsData = snapshot.docs.map(doc => {
        const item = doc.data();
        let rawDate = new Date();
        if (item.createdAt && typeof item.createdAt.toDate === 'function') {
          rawDate = item.createdAt.toDate();
        } else if (item.createdAt) {
          rawDate = new Date(item.createdAt);
        }
        return {
          id: doc.id,
          ...item,
          rawDate
        };
      });

      // Sort client-side by rawDate desc
      docsData.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());

      const data = docsData.map(item => {
        let formattedDate = item.rawDate.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        return {
          ...item,
          formattedDate
        };
      });
      setJournals(data);
    } catch (error) {
      console.error("Error fetching health journals:", error);
    } finally {
      setLoadingJournals(false);
    }
  };

  const handleDeleteJournal = async (journalId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bản ghi nhật ký này?")) return;
    try {
      await deleteDoc(doc(db, 'healthJournals', journalId));
      setJournals(prev => prev.filter(j => j.id !== journalId));
    } catch (error) {
      console.error("Error deleting health journal:", error);
      alert("Không thể xóa bản ghi nhật ký. Vui lòng thử lại!");
    }
  };

  const fetchMedicationReminders = async () => {
    if (!user) return;
    setLoadingMedications(true);
    try {
      const q = query(
        collection(db, 'medicationReminders'),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by time
      data.sort((a: any, b: any) => a.time.localeCompare(b.time));
      setMedications(data);
    } catch (error) {
      console.error("Error fetching medication reminders:", error);
    } finally {
      setLoadingMedications(false);
    }
  };

  const handleCloseMedicationModal = () => {
    setIsMedicationModalOpen(false);
    fetchMedicationReminders(); // Refresh list on close
  };

  const fetchVitals = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const q = query(
        collection(db, 'vitals'),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      const docsData = snapshot.docs.map(doc => {
        const item = doc.data();
        let rawTimestamp = new Date();
        if (item.timestamp && typeof item.timestamp.toDate === 'function') {
          rawTimestamp = item.timestamp.toDate();
        } else if (item.timestamp) {
          rawTimestamp = new Date(item.timestamp);
        }
        return {
          id: doc.id,
          ...item,
          rawTimestamp
        };
      });

      // Sort client-side by rawTimestamp asc
      docsData.sort((a, b) => a.rawTimestamp.getTime() - b.rawTimestamp.getTime());

      const data = docsData.map(item => ({
        ...item,
        // Format for Recharts
        dateLabel: item.rawTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
      })) as any[];
      setVitals(data);
    } catch (error) {
      console.error("Error fetching vitals:", error);
    } finally {
      setLoading(false);
    }
  };

  const stripAccents = (str: string) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  };

  const exportPDFReport = () => {
    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const margin = 20;
      let currentY = 20;

      // Header solid block
      doc.setFillColor(15, 23, 42); // slate-900 background
      doc.rect(0, 0, 210, 42, 'F');

      // Title & Subtitle
      doc.setTextColor(45, 212, 191); // primary teal
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("BAO CAO SUC KHOE CA NHAN", margin, 18);
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("PERSONAL HEALTH SUMMARY REPORT", margin, 24);

      // Sidebar System details
      doc.setTextColor(148, 163, 184); // slate-400
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.text("CLINICAL OVERVIEW SYSTEM", 145, 15);
      doc.text(`Exported: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}`, 145, 20);
      
      const filterLabel = timeFilter === 'all' ? "Tat ca thoi gian" :
                          timeFilter === 'week' ? "7 ngay qua" :
                          timeFilter === 'month' ? "30 ngay qua" : "Khoang thoi gian khao sat";
      doc.text(`Timeframe: ${filterLabel}`, 145, 25);

      // Section: User details
      currentY = 52;
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.2);
      doc.line(margin, currentY, 210 - margin, currentY);

      currentY += 8;
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("THONG TIN NGUOI DUNG / USER PROFILE", margin, currentY);

      currentY += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(`Email: ${user?.email || 'Nguoi dung Guest'}`, margin, currentY);
      doc.text(`Ma so dang ky (ID): ${user?.uid?.substring(0, 10) || 'N/A'}`, margin + 90, currentY);

      currentY += 8;
      doc.line(margin, currentY, 210 - margin, currentY);

      // Metrics Summary section
      currentY += 8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("CHI SO SINH HIEU TRUNG BINH / AVERAGE VITALS", margin, currentY);

      currentY += 6;
      
      // Calculate averages defensively
      const totalEntries = filteredVitals.length;
      let avgHeartRate = 0;
      let avgSpo2 = 0;
      let avgTemp = 0;
      let avgSystolic = 0;
      let avgDiastolic = 0;

      if (totalEntries > 0) {
        let hrSum = 0, spo2Sum = 0, tempSum = 0, sysSum = 0, diaSum = 0;
        let countHr = 0, countSpo2 = 0, countTemp = 0, countBp = 0;

        filteredVitals.forEach(v => {
          if (v.heartRate !== undefined && v.heartRate !== null) { hrSum += Number(v.heartRate); countHr++; }
          if (v.spo2 !== undefined && v.spo2 !== null) { spo2Sum += Number(v.spo2); countSpo2++; }
          if (v.temperature !== undefined && v.temperature !== null) { tempSum += Number(v.temperature); countTemp++; }
          if (v.bloodPressureSystolic !== undefined && v.bloodPressureSystolic !== null && 
              v.bloodPressureDiastolic !== undefined && v.bloodPressureDiastolic !== null) {
            sysSum += Number(v.bloodPressureSystolic);
            diaSum += Number(v.bloodPressureDiastolic);
            countBp++;
          }
        });

        avgHeartRate = countHr > 0 ? Math.round(hrSum / countHr) : 0;
        avgSpo2 = countSpo2 > 0 ? Math.round(spo2Sum / countSpo2) : 0;
        avgTemp = countTemp > 0 ? Number((tempSum / countTemp).toFixed(1)) : 0;
        avgSystolic = countBp > 0 ? Math.round(sysSum / countBp) : 0;
        avgDiastolic = countBp > 0 ? Math.round(diaSum / countBp) : 0;
      }

      // Draw grids / boxes for averages
      doc.setFillColor(248, 250, 252); // slate-50
      
      // Box 1: Heart Rate
      doc.rect(margin, currentY, 40, 18, 'F');
      doc.setTextColor(244, 63, 94); // rose-500
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(totalEntries > 0 && avgHeartRate > 0 ? `${avgHeartRate} bpm` : "N/A", margin + 5, currentY + 11);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFontSize(7.5);
      doc.text("NHIP TIM (HR)", margin + 5, currentY + 5);

      // Box 2: SpO2
      doc.rect(margin + 43, currentY, 40, 18, 'F');
      doc.setTextColor(13, 148, 136); // teal-600
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(totalEntries > 0 && avgSpo2 > 0 ? `${avgSpo2} %` : "N/A", margin + 43 + 5, currentY + 11);
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7.5);
      doc.text("OXY TRONG MAU (SpO2)", margin + 43 + 5, currentY + 5);

      // Box 3: Huyết áp
      doc.rect(margin + 86, currentY, 41, 18, 'F');
      doc.setTextColor(79, 70, 229); // indigo-600
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(totalEntries > 0 && avgSystolic > 0 ? `${avgSystolic}/${avgDiastolic}` : "N/A", margin + 86 + 3, currentY + 11);
      doc.setFontSize(7.5);
      doc.text(" mmHg", margin + 86 + 25, currentY + 11);
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7.5);
      doc.text("HUYET AP (BP)", margin + 86 + 5, currentY + 5);

      // Box 4: Nhiệt độ
      doc.rect(margin + 130, currentY, 40, 18, 'F');
      doc.setTextColor(217, 119, 6); // amber-600
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(totalEntries > 0 && avgTemp > 0 ? `${avgTemp} C` : "N/A", margin + 130 + 5, currentY + 11);
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7.5);
      doc.text("NHIET DO (TEMP)", margin + 130 + 5, currentY + 5);

      currentY += 24;

      // Chart Section (Biểu đồ véc-tơ đơn giản)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("BIEU DO TIEN TRINH SINH HIEU / VITALS TREND LINE GRAPH", margin, currentY);
      
      currentY += 5;
      
      const chartX = margin;
      const chartWidth = 170;
      const chartY = currentY;
      const chartHeight = 42;

      doc.setFillColor(255, 255, 255);
      doc.rect(chartX, chartY, chartWidth, chartHeight, 'F');
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.rect(chartX, chartY, chartWidth, chartHeight, 'S');

      // Draw legend
      doc.setFontSize(7);
      doc.setTextColor(244, 63, 94);
      doc.rect(125, chartY + 3, 3, 3, 'F');
      doc.text("Nhip tim (HR - bpm)", 130, chartY + 5.5);
      
      doc.setTextColor(13, 148, 136);
      doc.rect(155, chartY + 3, 3, 3, 'F');
      doc.text("SpO2 (%)", 160, chartY + 5.5);

      if (totalEntries >= 2) {
        // Draw grid lines
        doc.setDrawColor(241, 245, 249); // slate-100
        doc.setLineWidth(0.2);
        for (let j = 1; j <= 4; j++) {
          const gridY = chartY + (chartHeight / 5) * j;
          doc.line(chartX, gridY, chartX + chartWidth, gridY);
        }

        const numToDraw = Math.min(totalEntries, 10);
        const drawVitals = filteredVitals.slice(-numToDraw);
        const segments = drawVitals.length;

        const getXCoord = (index: number) => {
          if (segments <= 1) return chartX + chartWidth / 2;
          return chartX + 15 + (index / (segments - 1)) * (chartWidth - 30);
        };

        const getHrYCoord = (hrValue: number) => {
          const val = Number(hrValue) || 75;
          const clamped = Math.max(50, Math.min(150, val));
          return chartY + chartHeight - 6 - ((clamped - 50) / 100) * (chartHeight - 12);
        };

        const getSpo2YCoord = (spo2Value: number) => {
          const val = Number(spo2Value) || 98;
          const clamped = Math.max(80, Math.min(100, val));
          return chartY + chartHeight - 6 - ((clamped - 80) / 20) * (chartHeight - 12);
        };

        doc.setFontSize(6);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text("150 bpm / 100%", chartX + 2, chartY + 5);
        doc.text("100 bpm / 90%", chartX + 2, chartY + chartHeight / 2 + 1.5);
        doc.text("50 bpm / 80%", chartX + 2, chartY + chartHeight - 3);

        // Draw dates & ticks
        drawVitals.forEach((v, i) => {
          const xPos = getXCoord(i);
          doc.setDrawColor(203, 213, 225);
          doc.line(xPos, chartY + chartHeight, xPos, chartY + chartHeight - 1.5);
          
          if (v.rawTimestamp) {
            const dayLabel = v.rawTimestamp.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            doc.setFontSize(6.5);
            doc.setTextColor(100, 116, 139);
            doc.text(dayLabel, xPos - 3, chartY + chartHeight + 3.5);
          }
        });

        // 1. Draw Heart Rate Line
        doc.setLineWidth(0.5);
        doc.setDrawColor(244, 63, 94);
        for (let i = 0; i < segments - 1; i++) {
          const x1 = getXCoord(i);
          const y1 = getHrYCoord(drawVitals[i].heartRate);
          const x2 = getXCoord(i + 1);
          const y2 = getHrYCoord(drawVitals[i + 1].heartRate);
          doc.line(x1, y1, x2, y2);
        }

        // Draw circles for Heart Rate
        doc.setFillColor(244, 63, 94);
        drawVitals.forEach((v, i) => {
          const x = getXCoord(i);
          const y = getHrYCoord(v.heartRate);
          doc.circle(x, y, 0.8, 'F');
          
          if (segments <= 5 || i === 0 || i === segments - 1) {
            doc.setFontSize(6);
            doc.setTextColor(225, 29, 72);
            doc.text(`${v.heartRate}`, x - 2, y - 1.5);
          }
        });

        // 2. Draw SpO2 Line
        doc.setLineWidth(0.5);
        doc.setDrawColor(13, 148, 136);
        for (let i = 0; i < segments - 1; i++) {
          const x1 = getXCoord(i);
          const y1 = getSpo2YCoord(drawVitals[i].spo2);
          const x2 = getXCoord(i + 1);
          const y2 = getSpo2YCoord(drawVitals[i + 1].spo2);
          doc.line(x1, y1, x2, y2);
        }

        // Draw circles for SpO2
        doc.setFillColor(13, 148, 136);
        drawVitals.forEach((v, i) => {
          const x = getXCoord(i);
          const y = getSpo2YCoord(v.spo2);
          doc.circle(x, y, 0.8, 'F');
          
          if (segments <= 5 || i === 0 || i === segments - 1) {
            doc.setFontSize(6);
            doc.setTextColor(13, 148, 136);
            doc.text(`${v.spo2}%`, x - 2.5, y + 2.5);
          }
        });

      } else {
        doc.setFontSize(8.5);
        doc.setTextColor(148, 163, 184);
        doc.setFont("helvetica", "italic");
        doc.text("Yeu cau toi thieu 2 ban ghi sinh hieu de tai lap bieu do tien trinh.", chartX + 35, chartY + chartHeight / 2 + 1);
      }

      currentY += chartHeight + 11;

      // Section: Health Journal Logs
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("NHAT KY TRANG THAI GAN NHAT / RECENT HEALTH JOURNAL", margin, currentY);
      
      currentY += 4;
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, currentY, 210 - margin, currentY);
      
      currentY += 5;

      const itemsToPrint = filteredJournals.slice(0, 3);
      
      if (itemsToPrint.length > 0) {
        itemsToPrint.forEach((j) => {
          if (currentY > 255) {
            doc.addPage();
            currentY = 20;
          }

          // Card block format
          doc.setFillColor(248, 250, 252); // slate-50
          doc.setDrawColor(241, 245, 249); // slate-100
          doc.rect(margin, currentY, 170, 22, 'FD');

          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(51, 65, 85); // slate-700
          
          const moodClean = j.mood ? stripAccents(j.mood) : 'Normal';
          const energyClean = j.energy ? stripAccents(j.energy) : 'Medium';
          const formattedDateClean = j.formattedDate || '';
          
          doc.text(`Ngay/Date: ${formattedDateClean}  |  Tam trang/Mood: ${moodClean}  |  Nang luong/Energy: ${energyClean}`, margin + 5, currentY + 6);
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.text(`Giac ngu/Sleep: ${j.sleep || 0} gio  |  Nuoc/Water: ${j.water || 0} coc`, margin + 5, currentY + 11);
          
          const notesUnaccented = j.notes ? stripAccents(j.notes) : '- No notes available -';
          const trimmedNotes = notesUnaccented.length > 95
            ? notesUnaccented.substring(0, 92) + "..." 
            : notesUnaccented;
          doc.text(`Ghi chu/Notes: ${trimmedNotes}`, margin + 5, currentY + 16);

          currentY += 25;
        });
      } else {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(148, 163, 184);
        doc.text("Chua co nhat ky nao duoc ghi nhan trong khoang thoi gian khao sat.", margin, currentY);
        currentY += 8;
      }

      // Section: Medications
      if (currentY > 245) {
        doc.addPage();
        currentY = 20;
      }

      currentY += 3;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("LICH TRINH UONG THUOC / ACTIVE MEDICATIONS", margin, currentY);
      
      currentY += 4;
      doc.line(margin, currentY, 210 - margin, currentY);
      currentY += 5;

      const activeMedications = medications.filter(m => m.enabled);
      if (activeMedications.length > 0) {
        activeMedications.forEach((med) => {
          if (currentY > 265) {
            doc.addPage();
            currentY = 20;
          }
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(30, 41, 59); // slate-800
          const medNameClean = med.medName ? stripAccents(med.medName) : 'N/A';
          doc.text(`- ${medNameClean}`, margin + 2, currentY);
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(100, 116, 139);
          doc.text(`Gio/Time: ${med.time} | Lieu dung/Dosage: ${med.dosage ? stripAccents(med.dosage) : 'N/A'}`, margin + 75, currentY);

          currentY += 5.5;
        });
      } else {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(148, 163, 184);
        doc.text("Khong co lich trinh thuoc uong nao sap xep trong thoi gian nay.", margin, currentY);
        currentY += 7;
      }

      // Page-bottom disclaimer
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.setFont("helvetica", "italic");
      doc.text("Luu y: Day la bao cao du lieu khao sat ca nhan tu nguoi dung, khong co muc dich thay the huong dan y khoa, chan doan hoac phat do dieu tri.", margin, 280);

      // Save document
      doc.save(`HealthReport_${timeFilter}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Gap loi bat cap khi xuat PDF. Vui long kiem tra bang dieu khien console.");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] bg-bg pb-20">
      {/* Tabs */}
      <div className="p-6 bg-panel/50 backdrop-blur-xl border-b border-border flex items-center justify-center gap-8">
        <button 
          onClick={() => setActiveTab('journal')}
          className={cn(
            "text-[11px] font-bold uppercase tracking-[0.2em] transition-all relative py-2",
            activeTab === 'journal' ? "text-primary" : "text-text-dim hover:text-white"
          )}
        >
          Số liệu nhật ký
          {activeTab === 'journal' && (
            <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_rgba(45,212,191,0.5)]" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('exercise')}
          className={cn(
            "text-[11px] font-bold uppercase tracking-[0.2em] transition-all relative py-2",
            activeTab === 'exercise' ? "text-primary" : "text-text-dim hover:text-white"
          )}
        >
          Luyện tập trị liệu
          {activeTab === 'exercise' && (
            <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_rgba(45,212,191,0.5)]" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
        {activeTab === 'journal' ? (
          <>
            {/* Bộ lọc khoảng thời gian */}
            <div id="vitals-time-filter-bar" className="bg-panel p-5 rounded-3xl border border-border flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <Filter className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Lọc khoảng thời gian</h4>
                  <p className="text-[10px] text-text-dim uppercase tracking-wider mt-0.5 font-bold">Xem số liệu & Nhật ký lịch sử</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'week', label: 'Tuần này (7 ngày)' },
                  { id: 'month', label: 'Tháng này (30 ngày)' },
                  { id: 'custom', label: 'Tùy chọn khoảng' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setTimeFilter(item.id as any)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95",
                      timeFilter === item.id 
                        ? "bg-primary text-bg shadow-md font-black" 
                        : "bg-white/5 text-text-dim hover:text-white border border-white/5"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {timeFilter === 'custom' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5"
                >
                  <input 
                    type="date" 
                    value={startDateStr}
                    onChange={(e) => setStartDateStr(e.target.value)}
                    className="bg-transparent text-xs text-white border-none outline-none cursor-pointer placeholder:text-text-dim select-none"
                  />
                  <span className="text-[10px] uppercase font-bold text-text-dim">Đến</span>
                  <input 
                    type="date" 
                    value={endDateStr}
                    onChange={(e) => setEndDateStr(e.target.value)}
                    className="bg-transparent text-xs text-white border-none outline-none cursor-pointer placeholder:text-text-dim select-none"
                  />
                </motion.div>
              )}

              {/* PDF & Image Report Export Button */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  id="btn-export-health-report-modal-trigger"
                  onClick={() => setIsReportModalOpen(true)}
                  type="button"
                  className="bg-primary hover:bg-primary/95 text-bg font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer shadow-lg shadow-primary/20 flex items-center gap-2"
                  title="Xuất báo cáo sức khỏe PDF & Hình ảnh"
                >
                  <FileDown className="w-4 h-4" />
                  Xuất Báo Cáo
                </button>
              </div>
            </div>

            {/* Vitals Summary Charts */}
            <section className="space-y-6">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-serif text-xl font-bold text-white flex items-center gap-3">
                  <Activity className="w-6 h-6 text-primary" />
                  Tiến trình Sinh hiệu
                </h3>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsVitalsModalOpen(true)}
                    className="bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all uppercase tracking-wider flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Ghi sinh hiệu
                  </button>
                  <button 
                    onClick={fetchVitals}
                    className="text-[10px] font-bold text-primary uppercase tracking-widest hover:brightness-125 transition-all cursor-pointer"
                  >
                    Làm mới
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="bg-panel p-20 rounded-3xl border border-border flex flex-col items-center gap-4">
                  <Activity className="w-8 h-8 text-primary animate-pulse" />
                  <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Đang tải dữ liệu...</p>
                </div>
              ) : filteredVitals.length > 0 ? (
                <div className="space-y-6">
                  {/* Heart Rate & SpO2 Chart */}
                  <div className="bg-panel p-6 rounded-3xl border border-border shadow-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Nhịp tim & SpO2</p>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2 text-[9px] font-bold text-rose-400 uppercase">
                          <Heart className="w-3 h-3 text-rose-500" />
                          Heart Rate
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-primary uppercase">
                          <Droplets className="w-3 h-3 text-primary" />
                          SpO2
                        </div>
                      </div>
                    </div>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={filteredVitals}>
                          <defs>
                            <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorSpo2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="dateLabel" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.3)' }} />
                          <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1c1c1e', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px' }}
                          />
                          <Area type="monotone" dataKey="heartRate" stroke="#f43f5e" fillOpacity={1} fill="url(#colorHr)" strokeWidth={2} dot={{ r: 3, fill: '#f43f5e', strokeWidth: 0 }} />
                          <Area type="monotone" dataKey="spo2" stroke="#2dd4bf" fillOpacity={1} fill="url(#colorSpo2)" strokeWidth={2} dot={{ r: 3, fill: '#2dd4bf', strokeWidth: 0 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Blood Pressure Chart */}
                  <div className="bg-panel p-6 rounded-3xl border border-border shadow-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Huyết áp (mmHg)</p>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2 text-[9px] font-bold text-indigo-400 uppercase">
                          <Activity className="w-3 h-3 text-indigo-500" />
                          Tâm thu
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-blue-400 uppercase">
                          <Activity className="w-3 h-3 text-blue-500" />
                          Tâm trương
                        </div>
                      </div>
                    </div>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <ReLineChart data={filteredVitals}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="dateLabel" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.3)' }} />
                          <YAxis hide domain={[40, 200]} />
                          <Tooltip 
                             contentStyle={{ backgroundColor: '#1c1c1e', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px' }}
                          />
                          <Line type="monotone" dataKey="bloodPressureSystolic" stroke="#6366f1" strokeWidth={2} dot={{ r: 0 }} activeDot={{ r: 4 }} />
                          <Line type="monotone" dataKey="bloodPressureDiastolic" stroke="#3b82f6" strokeWidth={2} dot={{ r: 0 }} activeDot={{ r: 4 }} />
                        </ReLineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Temperature Chart */}
                  <div className="bg-panel p-6 rounded-3xl border border-border shadow-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Nhiệt độ (°C)</p>
                      <div className="flex items-center gap-2 text-[9px] font-bold text-amber-400 uppercase">
                        <Thermometer className="w-3 h-3 text-amber-500" />
                        Nhiệt độ
                      </div>
                    </div>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <ReLineChart data={filteredVitals}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="dateLabel" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.3)' }} />
                          <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                          <Tooltip 
                             contentStyle={{ backgroundColor: '#1c1c1e', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px' }}
                          />
                          <Line type="monotone" dataKey="temperature" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }} />
                        </ReLineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-panel p-16 rounded-3xl border border-dashed border-border flex flex-col items-center gap-5 text-center">
                  <Activity className="w-10 h-10 text-primary animate-pulse" />
                  <div className="space-y-1">
                    <p className="text-sm text-white font-medium">Chưa có dữ liệu sinh hiệu</p>
                    <p className="text-[10px] text-text-dim uppercase tracking-widest leading-relaxed">Nhấp nút dưới đây để nhập chỉ số đầu tiên</p>
                  </div>
                  <button
                    onClick={() => setIsVitalsModalOpen(true)}
                    className="bg-primary hover:bg-primary/95 text-bg font-bold text-xs px-5 py-2.5 rounded-xl uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-lg"
                  >
                    Nhập dữ liệu sinh hiệu
                  </button>
                </div>
              )}
            </section>

            {/* Quick Logging */}
            <section className="bg-panel p-6 rounded-3xl border border-border shadow-2xl space-y-8 relative overflow-hidden group">
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <h3 className="font-serif text-xl italic font-light text-white">Nhật ký cảm quan</h3>
                  <p className="text-[10px] text-text-dim uppercase tracking-widest mt-1">Sức khỏe tổng quát</p>
                </div>
                <div className="w-10 h-10 bg-white/5 rounded-xl border border-white/5 flex items-center justify-center text-primary">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              
              <div id="journal-quick-triggers" className="grid grid-cols-4 gap-3 relative z-10">
                <JournalIconButton 
                  icon={Smile} 
                  label="Tâm trạng" 
                  color="text-amber-400" 
                  onClick={() => setIsJournalModalOpen(true)}
                />
                <JournalIconButton 
                  icon={Zap} 
                  label="Năng lượng" 
                  color="text-yellow-400" 
                  onClick={() => setIsJournalModalOpen(true)}
                />
                <JournalIconButton 
                  icon={Moon} 
                  label="Giấc ngủ" 
                  color="text-indigo-400" 
                  onClick={() => setIsJournalModalOpen(true)}
                />
                <JournalIconButton 
                  icon={Droplets} 
                  label="Nước uống" 
                  color="text-cyan-400" 
                  onClick={() => setIsJournalModalOpen(true)}
                />
              </div>

              <button 
                id="deep-journal-btn-trigger"
                onClick={() => setIsJournalModalOpen(true)}
                className="w-full bg-primary/10 border border-primary/20 text-primary font-bold py-4 rounded-xl flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-[11px] hover:bg-primary/20 transition-all relative z-10"
              >
                <Plus className="w-4 h-4" />
                <span>Ghi chú chuyên sâu & Giọng nói</span>
              </button>
              
              <div className="absolute -left-20 -top-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>
            </section>

            {/* Health Journal History Logs list */}
            <section id="health-journals-history-section" className="space-y-6">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="font-serif text-xl italic font-light text-white">Lịch sử Nhật ký & Giọng nói</h3>
                  <p className="text-[10px] text-text-dim uppercase tracking-widest mt-1 font-bold">Các ghi chép chi tiết hàng ngày của bạn</p>
                </div>
                <button 
                  onClick={fetchJournals}
                  className="text-[10px] font-bold text-primary uppercase tracking-widest hover:brightness-125 transition-all"
                >
                  Làm mới nhật ký
                </button>
              </div>

              {loadingJournals ? (
                <div className="bg-panel p-10 rounded-3xl border border-border flex flex-col items-center gap-4">
                  <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Đang tải nhật ký...</p>
                </div>
              ) : filteredJournals.length > 0 ? (
                <div id="health-journals-list-container" className="space-y-4">
                  {filteredJournals.map((journal) => {
                    let moodEmoji = '😊';
                    if (journal.mood === 'Tốt') moodEmoji = '🙂';
                    else if (journal.mood === 'Bình thường') moodEmoji = '😐';
                    else if (journal.mood === 'Mệt mỏi') moodEmoji = '😴';
                    else if (journal.mood === 'Căng thẳng') moodEmoji = '😫';

                    const startSpeechPlay = () => {
                      if ('speechSynthesis' in window) {
                        const utterance = new SpeechSynthesisUtterance(journal.notes);
                        utterance.lang = 'vi-VN';
                        window.speechSynthesis.cancel();
                        window.speechSynthesis.speak(utterance);
                      } else {
                        alert("Tính năng đọc văn bản không nhận được hỗ trợ từ trình duyệt của bạn.");
                      }
                    };

                    return (
                      <div 
                        id={`journal-row-${journal.id}`}
                        key={journal.id}
                        className="bg-panel p-5 rounded-3xl border border-border flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-all duration-300 relative group overflow-hidden hover:border-primary/20"
                      >
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start gap-3.5">
                            <span className="text-3xl bg-white/5 w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5 flex-shrink-0">
                              {moodEmoji}
                            </span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-white uppercase tracking-wide">
                                  {journal.mood} • {journal.energy}
                                </span>
                                <span className="text-[9px] font-mono text-text-dim px-2 py-0.5 bg-white/5 rounded border border-white/5">
                                  {journal.formattedDate}
                                </span>
                              </div>
                              <div className="flex gap-4 mt-2 text-[10px] text-text-dim font-bold uppercase tracking-wider">
                                <span className="flex items-center gap-1">
                                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                                  {journal.sleep} giờ ngủ
                                </span>
                                <span className="flex items-center gap-1">
                                  <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                                  {journal.water} cốc nước
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="p-3.5 rounded-2xl bg-white/[0.01] border border-white/5">
                            <p className="text-stone-300 font-light text-xs leading-relaxed whitespace-pre-wrap">{journal.notes}</p>
                          </div>
                        </div>

                        <div className="flex items-center sm:flex-col gap-2 justify-end sm:self-start">
                          <button
                            id={`read-aloud-journal-${journal.id}`}
                            onClick={startSpeechPlay}
                            className="p-2 sm:p-2.5 bg-white/5 hover:bg-primary/20 hover:text-primary rounded-xl text-text-gray border border-white/5 transition-all text-text-dim hover:border-primary/20"
                            title="Nghe đọc ghi chép"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          
                          <button
                            id={`delete-journal-btn-${journal.id}`}
                            onClick={() => handleDeleteJournal(journal.id)}
                            className="p-2 sm:p-2.5 bg-white/5 hover:bg-rose-500/15 hover:text-rose-400 rounded-xl text-text-dim border border-white/5 hover:border-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                            title="Xóa bản ghi nhật ký"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div id="empty-history-placeholder" className="bg-panel p-12 border border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-center p-6 gap-3">
                  <Calendar className="w-8 h-8 text-white/10 animate-pulse" />
                  <div>
                    <p className="text-sm text-white font-medium">Chưa có bản ghi nhật ký giọng nói nào</p>
                    <p className="text-[10px] text-text-dim mt-1 uppercase tracking-widest leading-relaxed">Hãy chạm vào bất kỳ biểu tượng hoặc chọn nút ghi chú để bắt đầu!</p>
                  </div>
                </div>
              )}
            </section>

            {/* Daily Medication Reminders */}
            <section className="bg-panel p-6 rounded-3xl border border-border shadow-2xl space-y-6 relative overflow-hidden group">
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <h3 className="font-serif text-xl italic font-light text-white flex items-center gap-3">
                    <Pill className="w-6 h-6 text-primary" />
                    Lịch uống thuốc hôm nay
                  </h3>
                  <p className="text-[10px] text-text-dim uppercase tracking-widest mt-1">Quản lý và cập nhật đúng giờ</p>
                </div>
                <button 
                  onClick={() => setIsMedicationModalOpen(true)}
                  className="text-primary text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 hover:brightness-125 transition-all"
                >
                  Thiết lập <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {loadingMedications ? (
                <div className="py-8 flex flex-col items-center gap-2">
                  <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : medications.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                  {medications.map(med => (
                    <div key={med.id} className={cn(
                      "p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all bg-white/[0.01]",
                      med.enabled ? "border-white/5" : "border-white/5 opacity-50"
                    )}>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center transition-colors border",
                          med.enabled ? "bg-primary/10 border-primary/10 text-primary" : "bg-white/5 border-white/5 text-text-dim"
                        )}>
                          <Pill className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{med.medName}</span>
                            <span className="text-[9px] font-bold text-text-dim uppercase bg-white/5 px-2 py-0.5 rounded border border-white/5 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" /> {med.time}
                            </span>
                          </div>
                          {med.dosage && (
                            <p className="text-xs text-text-dim mt-0.5 font-light">{med.dosage}</p>
                          )}
                        </div>
                      </div>
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border",
                        med.enabled ? "bg-primary/10 text-primary border-primary/20" : "bg-white/10 text-text-dim border-white/10"
                      )}>
                        {med.enabled ? "Bật" : "Tắt"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center p-6 gap-3">
                  <Pill className="w-8 h-8 text-white/10 animate-pulse" />
                  <div>
                    <p className="text-sm text-white font-medium">Chưa lên lịch uống thuốc</p>
                    <p className="text-[10px] text-text-dim mt-1 uppercase tracking-widest leading-relaxed">Nhấn nút "Thiết lập" ở góc phải để thêm thuốc uống hàng ngày</p>
                  </div>
                </div>
              )}
              
              <div className="absolute -right-20 -top-20 w-40 h-40 bg-teal-500/5 rounded-full blur-3xl"></div>
            </section>
          </>
        ) : (
          <>
            {/* Exercise Hero */}
            <section className="bg-panel rounded-3xl p-7 text-white shadow-2xl border border-border space-y-6 relative overflow-hidden group panel-gradient">
              <div className="relative z-10 space-y-4">
                <div className="inline-block bg-primary/10 px-3 py-1 rounded-lg border border-primary/20">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Khuyên dùng hôm nay</span>
                </div>
                <h3 className="font-serif text-3xl italic font-light">Yoga Phục hồi Chuyên sâu</h3>
                <p className="text-sm text-text-dim max-w-[240px] font-light leading-relaxed">Liệu pháp giải phóng căng thẳng vùng cơ và cột sống.</p>
                <div className="flex items-center gap-6 pt-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-text-dim uppercase tracking-widest">
                    <Clock className="w-4 h-4 text-primary" /> 25 Phút
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-text-dim uppercase tracking-widest">
                    <Flame className="w-4 h-4 text-primary" /> 180 Kcal
                  </div>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 w-40 h-40 bg-primary/5 rounded-full -mr-10 -mb-10 blur-3xl"></div>
              <Dumbbell className="absolute right-8 top-8 w-24 h-24 text-white opacity-[0.03] rotate-12 transition-transform group-hover:rotate-45 duration-700" />
            </section>

            {/* Exercise Categories */}
            <section className="space-y-6">
              <h3 className="font-serif text-xl italic font-light text-white px-1">Giáo trình Trị liệu</h3>
              <div className="grid gap-5">
                {EXERCISES.map((ex, i) => (
                  <div key={i} className="bg-panel p-4 rounded-2xl border border-border shadow-xl flex items-center gap-5 group hover:border-primary/20 transition-all active:scale-[0.98]">
                    <div className="w-28 h-24 rounded-xl overflow-hidden relative flex-shrink-0 border border-white/5 shadow-lg">
                      <img src={ex.image} alt={ex.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                      <div className="absolute inset-0 bg-bg/20 flex items-center justify-center backdrop-blur-[1px]">
                        <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 shadow-2xl group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 fill-white shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-primary uppercase tracking-widest">{ex.type}</span>
                        <span className="text-[9px] font-bold text-text-dim uppercase tracking-widest px-2 py-0.5 bg-white/5 rounded border border-white/5">{ex.level}</span>
                      </div>
                      <h4 className="font-serif text-lg italic font-light text-white group-hover:text-primary transition-colors">{ex.title}</h4>
                      <div className="flex items-center gap-4 text-[10px] font-medium text-text-dim uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {ex.duration}m</span>
                        <span className="flex items-center gap-1.5"><Flame className="w-3.5 h-3.5" /> {ex.kcal} kcal</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
      <MedicationReminderModal 
        isOpen={isMedicationModalOpen} 
        onClose={handleCloseMedicationModal} 
      />
      <JournalEntryModal
        isOpen={isJournalModalOpen}
        onClose={() => setIsJournalModalOpen(false)}
        onSuccess={fetchJournals}
      />
      <VitalsEntryModal
        isOpen={isVitalsModalOpen}
        onClose={() => setIsVitalsModalOpen(false)}
        onSuccess={fetchVitals}
      />
      <HealthReportExportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
}

function JournalIconButton({ icon: Icon, label, color, onClick }: { icon: any, label: string, color: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-3 group w-full">
      <div className={cn(
        "w-full aspect-square bg-white/5 rounded-2xl flex items-center justify-center shadow-inner group-active:scale-90 transition-all border border-white/5 group-hover:border-primary/20",
        color
      )}>
        <Icon className="w-7 h-7 filter drop-shadow-[0_0_10px_currentColor]" />
      </div>
      <span className="text-[9px] font-bold text-text-dim uppercase tracking-[0.15em] group-hover:text-white transition-colors">{label}</span>
    </button>
  );
}
