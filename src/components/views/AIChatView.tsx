import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Send, 
  User as UserIcon, 
  Sparkles, 
  Mic, 
  Image as ImageIcon, 
  History, 
  Clock, 
  Plus, 
  ChevronLeft, 
  Search, 
  Trash2, 
  MessageSquare, 
  Copy, 
  Check, 
  Edit2, 
  Calendar, 
  Cloud, 
  ArrowRight, 
  Stethoscope, 
  X,
  GripHorizontal,
  Maximize2,
  Minimize2,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../hooks/useAuth';
import { chatWithAI } from '../../services/gemini';
import { cn } from '../../lib/utils';
import ReactMarkdown from 'react-markdown';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  Timestamp,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';

interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: Date;
  createdAt?: Date;
}

interface AIChatViewProps {
  onClose?: () => void;
  dragControls?: any;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

export default function AIChatView({ 
  onClose, 
  dragControls, 
  isMaximized = false, 
  onToggleMaximize 
}: AIChatViewProps = {}) {
  const { profile, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [savingStatus, setSavingStatus] = useState<'saved' | 'saving' | 'error' | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior
      });
    }
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, isTyping]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollBottom(!isNearBottom);
  };

  // Voice-to-Text Speech Recognition State
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  // Initialize browser Speech Recognition & Custom Prompt Event listener
  useEffect(() => {
    const handleSetPrompt = (e: any) => {
      if (e.detail && e.detail.prompt) {
        setInput(e.detail.prompt);
      }
    };
    window.addEventListener('app-set-ai-prompt', handleSetPrompt);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'vi-VN'; // Vietnamese language for symptoms description

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(prev => {
            const separator = prev.trim() ? ' ' : '';
            return prev + separator + transcript;
          });
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };

      setRecognition(rec);
    } else {
      setSpeechSupported(false);
    }

    return () => {
      window.removeEventListener('app-set-ai-prompt', handleSetPrompt);
    };
  }, []);

  const handleMicClick = () => {
    if (!speechSupported || !recognition) {
      alert("Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói (Web Speech API). Hãy thử bằng Google Chrome hoặc Microsoft Edge.");
      return;
    }

    if (isRecording) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error("Failed to start Speech Recognition:", err);
      }
    }
  };

  // Helper to parse Firestore date
  const parseFirestoreDate = (val: any): Date => {
    if (!val) return new Date();
    if (typeof val.toDate === 'function') return val.toDate();
    if (val.seconds) return new Date(val.seconds * 1000);
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  // Load chat history from Firestore
  const loadSessions = async () => {
    if (!user) {
      // If user is guest, check localStorage
      try {
        const local = localStorage.getItem('guest_ai_chat_sessions');
        if (local) {
          const parsed = JSON.parse(local);
          const formatted = parsed.map((s: any) => ({
            ...s,
            updatedAt: new Date(s.updatedAt),
            messages: (s.messages || []).map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp)
            }))
          }));
          setSessions(formatted);
          if (formatted.length > 0 && messages.length === 0 && !activeSessionId) {
            selectSession(formatted[0]);
          }
        }
      } catch (e) {
        console.error("Error reading local guest chat sessions:", e);
      }
      return;
    }

    setIsLoadingHistory(true);
    try {
      const q = query(
        collection(db, 'chats'),
        where('userId', '==', user.uid)
      );

      let querySnapshot;
      try {
        querySnapshot = await getDocs(q);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'chats');
        setIsLoadingHistory(false);
        return;
      }

      const loadedSessions: ChatSession[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const sUpdatedAt = parseFirestoreDate(data.updatedAt || data.createdAt);
        const sCreatedAt = parseFirestoreDate(data.createdAt);

        const loadedMessages = (data.messages || []).map((m: any) => ({
          role: m.role || 'user',
          content: m.content || '',
          timestamp: parseFirestoreDate(m.timestamp)
        }));

        loadedSessions.push({
          id: docSnap.id,
          title: data.title || 'Tư vấn y khoa AI',
          updatedAt: sUpdatedAt,
          createdAt: sCreatedAt,
          messages: loadedMessages
        });
      });

      // Sort client-side by most recent first
      loadedSessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      setSessions(loadedSessions);

      // If user has no active session and no messages, initialize default welcome
      if (loadedSessions.length === 0 && messages.length === 0) {
        startNewChat();
      }
    } catch (error) {
      console.error("Error loading chat sessions from Firestore:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load chat history on mount and when user auth state changes
  useEffect(() => {
    loadSessions();
  }, [user]);

  // Set default initial greeting if empty
  useEffect(() => {
    if (messages.length === 0 && !activeSessionId && sessions.length === 0) {
      startNewChat();
    }
  }, [profile]);

  const startNewChat = () => {
    setActiveSessionId(null);
    const userName = profile?.fullName ? profile.fullName.split(' ')[0] : 'bạn';
    setMessages([
      {
        role: 'model',
        content: `Xin chào ${userName}! Tôi là **Bác sĩ Trực tuyến AI**. Bạn đang cảm thấy như thế nào hoặc có triệu chứng nào cần phân tích chuyên sâu hôm nay?`,
        timestamp: new Date()
      }
    ]);
    setSuggestions([
      "Tư vấn giảm đau đầu, mất ngủ",
      "Thảo dược thanh nhiệt, mát gan",
      "Cách cải thiện hệ tiêu hóa đầy hơi",
      "Bài tập dưỡng sinh cho cột sống"
    ]);
    setIsHistoryOpen(false);
  };

  const selectSession = (session: ChatSession) => {
    setActiveSessionId(session.id);
    setMessages(session.messages);
    setSuggestions([]);
    setIsHistoryOpen(false);
  };

  const deleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!window.confirm("Bạn có chắc chắn muốn xóa cuộc hội thoại tư vấn này khỏi lịch sử Firestore?")) {
      return;
    }
    
    try {
      if (user) {
        try {
          await deleteDoc(doc(db, 'chats', sessionId));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `chats/${sessionId}`);
        }
      } else {
        // Guest mode removal
        const updated = sessions.filter(s => s.id !== sessionId);
        localStorage.setItem('guest_ai_chat_sessions', JSON.stringify(updated));
      }

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        startNewChat();
      }
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  };

  const handleStartRename = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const handleSaveRename = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!editingTitle.trim()) {
      setEditingSessionId(null);
      return;
    }

    const newTitle = editingTitle.trim();
    try {
      if (user) {
        const sessionRef = doc(db, 'chats', sessionId);
        try {
          await updateDoc(sessionRef, {
            title: newTitle,
            updatedAt: serverTimestamp()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `chats/${sessionId}`);
        }
      }
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: newTitle } : s));
      setEditingSessionId(null);
    } catch (err) {
      console.error("Error updating session title:", err);
    }
  };

  const handleCopyConsultation = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    const formatted = session.messages.map(m => 
      `${m.role === 'user' ? 'Người bệnh' : 'Bác sĩ AI'} (${m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}):\n${m.content}\n`
    ).join('\n---\n\n');

    navigator.clipboard.writeText(`LỊCH SỬ TƯ VẤN Y KHOA: ${session.title}\nThời gian: ${session.updatedAt.toLocaleString('vi-VN')}\n\n${formatted}`);
    setCopiedSessionId(session.id);
    setTimeout(() => setCopiedSessionId(null), 2000);
  };

  // Filter and group sessions for the history drawer
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const matchTitle = s.title.toLowerCase().includes(historySearch.toLowerCase());
      const matchMessages = s.messages.some(m => m.content.toLowerCase().includes(historySearch.toLowerCase()));
      return matchTitle || matchMessages;
    });
  }, [sessions, historySearch]);

  const groupedSessions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const pastWeek = new Date(today);
    pastWeek.setDate(today.getDate() - 7);

    const groups: { [key: string]: ChatSession[] } = {
      'Hôm nay': [],
      'Hôm qua': [],
      '7 ngày qua': [],
      'Trước đó': []
    };

    filteredSessions.forEach(session => {
      const sDate = new Date(session.updatedAt);
      sDate.setHours(0, 0, 0, 0);

      if (sDate.getTime() === today.getTime()) {
        groups['Hôm nay'].push(session);
      } else if (sDate.getTime() === yesterday.getTime()) {
        groups['Hôm qua'].push(session);
      } else if (sDate.getTime() >= pastWeek.getTime()) {
        groups['7 ngày qua'].push(session);
      } else {
        groups['Trước đó'].push(session);
      }
    });

    return groups;
  }, [filteredSessions]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Persist conversation to Firestore
  const saveMessageToFirestore = async (newMessages: Message[]) => {
    setSavingStatus('saving');

    // Generate meaningful title from first user message
    const firstUserMsg = newMessages.find(m => m.role === 'user')?.content || '';
    let autoTitle = firstUserMsg.replace(/\n+/g, ' ').trim();
    if (autoTitle.length > 45) {
      autoTitle = autoTitle.substring(0, 45) + '...';
    }
    if (!autoTitle) {
      autoTitle = 'Tư vấn sức khỏe AI';
    }

    if (!user) {
      // Save locally for guest users
      try {
        const guestSessionId = activeSessionId || `guest_${Date.now()}`;
        const newSession: ChatSession = {
          id: guestSessionId,
          title: autoTitle,
          messages: newMessages,
          updatedAt: new Date(),
          createdAt: new Date()
        };

        const existing = sessions.filter(s => s.id !== guestSessionId);
        const updated = [newSession, ...existing];
        setSessions(updated);
        localStorage.setItem('guest_ai_chat_sessions', JSON.stringify(updated));
        if (!activeSessionId) {
          setActiveSessionId(guestSessionId);
        }
        setSavingStatus('saved');
        setTimeout(() => setSavingStatus(null), 2500);
      } catch (err) {
        console.error("Local save error:", err);
        setSavingStatus('error');
      }
      return;
    }

    try {
      if (activeSessionId) {
        // Update existing document in Firestore
        const sessionRef = doc(db, 'chats', activeSessionId);
        try {
          await updateDoc(sessionRef, {
            messages: newMessages.map(m => ({
              role: m.role,
              content: m.content,
              timestamp: m.timestamp instanceof Date ? Timestamp.fromDate(m.timestamp) : Timestamp.now()
            })),
            updatedAt: serverTimestamp()
          });
          
          // Update local state list
          setSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
              return {
                ...s,
                messages: newMessages,
                updatedAt: new Date()
              };
            }
            return s;
          }));
          setSavingStatus('saved');
          setTimeout(() => setSavingStatus(null), 2500);
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `chats/${activeSessionId}`);
          setSavingStatus('error');
        }
      } else {
        // Create new document in Firestore
        let docRef;
        try {
          docRef = await addDoc(collection(db, 'chats'), {
            userId: user.uid,
            title: autoTitle,
            messages: newMessages.map(m => ({
              role: m.role,
              content: m.content,
              timestamp: m.timestamp instanceof Date ? Timestamp.fromDate(m.timestamp) : Timestamp.now()
            })),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, 'chats');
          setSavingStatus('error');
          return;
        }

        const newId = docRef.id;
        setActiveSessionId(newId);
        
        // Add to active sessions list
        const createdSession: ChatSession = {
          id: newId,
          title: autoTitle,
          messages: newMessages,
          updatedAt: new Date(),
          createdAt: new Date()
        };
        setSessions(prev => [createdSession, ...prev]);
        setSavingStatus('saved');
        setTimeout(() => setSavingStatus(null), 2500);
      }
    } catch (error) {
      console.error("Error saving chat session to Firestore:", error);
      setSavingStatus('error');
    }
  };

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput || input;
    if (!textToSend.trim() || isTyping) return;

    const userMessage: Message = {
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setSuggestions([]);
    setIsTyping(true);

    try {
      const history = updatedMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const response = await chatWithAI(textToSend, history);
      
      const modelMessage: Message = {
        role: 'model',
        content: response,
        timestamp: new Date()
      };

      const finalMessages = [...updatedMessages, modelMessage];
      setMessages(finalMessages);
      await saveMessageToFirestore(finalMessages);

      // Generate context-aware suggestions
      const newSuggestions: string[] = [];
      const lowerResponse = response.toLowerCase();
      
      if (lowerResponse.includes('đau') || lowerResponse.includes('triệu chứng')) {
        newSuggestions.push('Khi nào cần đi khám cấp bách?', 'Các vị thuốc Nam hỗ trợ', 'Chế độ kiêng kỵ khi đau');
      } else if (lowerResponse.includes('thảo dược') || lowerResponse.includes('cây')) {
        newSuggestions.push('Liều lượng dùng mỗi ngày', 'Cách sắc và hãm trà đúng cách', 'Người huyết áp thấp dùng được không?');
      } else if (lowerResponse.includes('bài tập') || lowerResponse.includes('vận động')) {
        newSuggestions.push('Thời điểm tập tốt nhất', 'Các động tác dưỡng sinh nhẹ nhàng', 'Lưu ý khi có bệnh xương khớp');
      } else {
        newSuggestions.push('Phân tích nguyên nhân gốc rễ', 'Mẹo bồi bổ khí huyết tại nhà', 'Thực đơn dinh dưỡng phù hợp');
      }
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error("AI Chat error:", error);
      const errorMessage: Message = {
        role: 'model',
        content: "Xin lỗi, đã xảy ra lỗi kết nối với máy chủ AI. Bạn vui lòng thử lại câu hỏi sau giây lát.",
        timestamp: new Date()
      };
      const finalWithErr = [...updatedMessages, errorMessage];
      setMessages(finalWithErr);
      await saveMessageToFirestore(finalWithErr);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full w-full max-h-full relative overflow-hidden bg-bg",
      isMaximized ? "rounded-none border-0 shadow-none" : "rounded-none sm:rounded-3xl border-0 sm:border sm:border-border shadow-2xl"
    )}>
      {/* Top Header with History Navigation & Status */}
      <div 
        onPointerDown={(e) => {
          if (dragControls && !isMaximized && !(e.target as HTMLElement).closest('button, input, a')) {
            dragControls.start(e);
          }
        }}
        className={cn(
          "shrink-0 px-3 sm:px-6 pt-[calc(max(env(safe-area-inset-top,0px),34px)+0.5rem)] sm:pt-3.5 pb-2.5 sm:pb-3 bg-panel/95 backdrop-blur-xl border-b border-border flex items-center justify-between z-20 select-none shadow-xs gap-2",
          dragControls && !isMaximized ? "cursor-grab active:cursor-grabbing" : ""
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {dragControls && !isMaximized && (
            <div 
              className="p-1 text-text-dim/60 hover:text-teal-400 transition-colors cursor-grab active:cursor-grabbing hidden sm:flex items-center shrink-0"
              title="Nhấn giữ và kéo để di chuyển cửa sổ"
            >
              <GripHorizontal className="w-4 h-4" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-[11px] sm:text-xs font-normal text-teal-900 uppercase tracking-wider whitespace-nowrap">
                Bác Sĩ Trực Tuyến AI
              </h2>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
            </div>
            <p className="text-[9.5px] sm:text-[10px] text-teal-800 font-normal whitespace-nowrap mt-0.5 tracking-tight">
              Trò chuyện sức khỏe với BS A.I
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Cloud Sync Status Pill */}
          {savingStatus && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-text-dim font-mono"
            >
              <Cloud className={cn("w-3 h-3", savingStatus === 'saving' ? "animate-spin text-primary" : savingStatus === 'saved' ? "text-emerald-400" : "text-rose-400")} />
              <span>{savingStatus === 'saving' ? 'Đang lưu...' : savingStatus === 'saved' ? 'Đã lưu' : 'Lỗi lưu'}</span>
            </motion.div>
          )}

          {/* New Chat Button */}
          <button 
            onClick={startNewChat}
            className="w-8 h-8 sm:w-auto flex items-center justify-center gap-1.5 px-0 sm:px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium transition-all active:scale-95 shadow-sm cursor-pointer shrink-0"
            title="Bắt đầu cuộc tư vấn mới"
          >
            <Plus className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Hội thoại mới</span>
          </button>

          {/* History Drawer Trigger */}
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className={cn(
              "flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl border transition-all active:scale-95 shadow-xs cursor-pointer whitespace-nowrap shrink-0",
              isHistoryOpen 
                ? "bg-teal-600 text-force-white border-teal-600 font-bold shadow-sm" 
                : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-900"
            )}
            title="Xem lại lịch sử các cuộc tư vấn"
          >
            <span className="text-[10.5px] sm:text-xs font-semibold whitespace-nowrap">Lịch sử</span>
            {sessions.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-teal-100 text-teal-800 border border-teal-200 shrink-0">
                {sessions.length}
              </span>
            )}
          </button>

          {/* Maximize / Restore Toggle */}
          {onToggleMaximize && (
            <button
              onClick={onToggleMaximize}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all border border-white/10 cursor-pointer shrink-0"
              title={isMaximized ? "Thu nhỏ cửa sổ" : "Phóng to toàn màn hình"}
            >
              {isMaximized ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-all border border-slate-200 cursor-pointer shrink-0"
              title="Đóng cửa sổ Bác sĩ AI"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* History Sidebar/Overlay Drawer */}
      <AnimatePresence>
        {isHistoryOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="absolute inset-y-0 right-0 w-full sm:w-[420px] bg-panel border-l border-border z-40 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-border flex items-center justify-between bg-bg/50 backdrop-blur-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg italic font-light text-white">Lịch Sử Tư Vấn Firestore</h3>
                    <p className="text-[10px] text-text-dim font-mono">
                      {sessions.length} phiên tư vấn đã lưu trữ
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsHistoryOpen(false)} 
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-text-dim hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Controls: New Chat + Search */}
              <div className="p-4 space-y-3 bg-panel/60 border-b border-border/50">
                <button 
                  onClick={startNewChat}
                  className="w-full flex items-center justify-center gap-2.5 bg-primary text-bg py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(45,212,191,0.2)] hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  Bắt đầu cuộc tư vấn mới
                </button>

                <div className="relative group">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-text-dim group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Tìm theo triệu chứng, lời khuyên..."
                    className="w-full bg-bg/60 border border-border rounded-xl py-2.5 pr-4 pl-10 text-xs text-white placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-primary/40 focus:bg-bg/90 transition-all"
                  />
                  {historySearch && (
                    <button 
                      onClick={() => setHistorySearch('')}
                      className="absolute right-3 top-2.5 text-text-dim hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Sessions List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
                {isLoadingHistory ? (
                  <div className="flex flex-col items-center justify-center py-16 text-text-dim space-y-3">
                    <Cloud className="w-8 h-8 animate-bounce text-primary" />
                    <p className="text-xs">Đang tải lịch sử từ Firestore...</p>
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div className="text-center py-16 px-4 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-text-dim">
                      <MessageSquare className="w-6 h-6 opacity-40" />
                    </div>
                    <p className="text-sm font-medium text-white">Chưa có phiên tư vấn nào</p>
                    <p className="text-xs text-text-dim max-w-xs mx-auto">
                      Mọi câu hỏi và phân tích sức khỏe của bạn với Bác sĩ AI sẽ tự động được lưu trữ tại đây.
                    </p>
                  </div>
                ) : (
                  Object.entries(groupedSessions).map(([group, groupSessions]) => {
                    if (groupSessions.length === 0) return null;
                    return (
                      <div key={group} className="space-y-2.5">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-primary" />
                            {group}
                          </span>
                          <span className="text-[10px] text-text-dim font-mono">
                            {groupSessions.length} cuộc hội thoại
                          </span>
                        </div>

                        <div className="space-y-2">
                          {groupSessions.map((session) => {
                            const isSelected = activeSessionId === session.id;
                            const isEditing = editingSessionId === session.id;
                            const lastAiMsg = session.messages.filter(m => m.role === 'model').slice(-1)[0]?.content || '';
                            const cleanSnippet = lastAiMsg.replace(/[#*`_]/g, '').substring(0, 75);

                            return (
                              <div 
                                key={session.id}
                                className={cn(
                                  "group/item rounded-2xl border transition-all relative overflow-hidden p-3.5 cursor-pointer text-left",
                                  isSelected 
                                    ? "bg-primary/10 border-primary/40 shadow-[0_0_20px_rgba(45,212,191,0.15)] ring-1 ring-primary/30" 
                                    : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
                                )}
                                onClick={() => selectSession(session)}
                              >
                                {isSelected && (
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(45,212,191,0.8)]" />
                                )}

                                {/* Top metadata & Quick Actions */}
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-primary" />
                                    <span className="text-[10px] font-mono font-medium text-text-dim">
                                      {session.updatedAt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} • {session.updatedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                    <button 
                                      onClick={(e) => handleCopyConsultation(e, session)}
                                      className="p-1 rounded-lg hover:bg-white/10 text-text-dim hover:text-white transition-all"
                                      title="Sao chép toàn bộ tư vấn"
                                    >
                                      {copiedSessionId === session.id ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                    <button 
                                      onClick={(e) => handleStartRename(e, session)}
                                      className="p-1 rounded-lg hover:bg-white/10 text-text-dim hover:text-white transition-all"
                                      title="Đổi tên chủ đề"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      onClick={(e) => deleteSession(e, session.id)}
                                      className="p-1 rounded-lg hover:bg-rose-500/20 text-text-dim hover:text-rose-400 transition-all"
                                      title="Xóa khỏi Firestore"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Title with inline editing */}
                                {isEditing ? (
                                  <div className="flex items-center gap-2 my-1" onClick={(e) => e.stopPropagation()}>
                                    <input 
                                      type="text"
                                      value={editingTitle}
                                      onChange={(e) => setEditingTitle(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(e as any, session.id)}
                                      autoFocus
                                      className="flex-1 bg-black/40 border border-primary rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                                    />
                                    <button 
                                      onClick={(e) => handleSaveRename(e, session.id)}
                                      className="px-2 py-1 rounded-lg bg-primary text-bg text-[10px] font-bold"
                                    >
                                      Lưu
                                    </button>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setEditingSessionId(null); }}
                                      className="px-2 py-1 rounded-lg bg-white/10 text-text-dim text-[10px]"
                                    >
                                      Hủy
                                    </button>
                                  </div>
                                ) : (
                                  <h4 className={cn(
                                    "text-xs font-semibold line-clamp-1 mb-1 transition-colors",
                                    isSelected ? "text-primary" : "text-white group-hover/item:text-primary"
                                  )}>
                                    {session.title}
                                  </h4>
                                )}

                                {/* Snippet */}
                                {cleanSnippet && (
                                  <p className="text-[11px] text-text-dim line-clamp-2 leading-relaxed font-light mb-2">
                                    {cleanSnippet}...
                                  </p>
                                )}

                                {/* Footer count & link */}
                                <div className="flex items-center justify-between text-[9px] text-text-dim border-t border-white/5 pt-1.5 mt-1">
                                  <span className="font-mono">
                                    {session.messages.length} tin nhắn ({Math.ceil(session.messages.length / 2)} lượt hỏi đáp)
                                  </span>
                                  <span className="flex items-center gap-1 text-primary group-hover/item:translate-x-0.5 transition-transform">
                                    Xem chi tiết <ArrowRight className="w-2.5 h-2.5" />
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth overscroll-contain relative"
      >
        {/* Active Consultation Banner */}
        {activeSessionId && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3.5 flex items-center justify-between text-xs text-text-dim">
            <div className="flex items-center gap-2 truncate pr-2">
              <MessageSquare className="w-4 h-4 text-primary shrink-0" />
              <span className="font-medium text-white truncate">
                Đang xem: {sessions.find(s => s.id === activeSessionId)?.title || 'Phiên tư vấn'}
              </span>
            </div>
            <button 
              onClick={startNewChat}
              className="text-[11px] font-bold text-primary hover:underline shrink-0 cursor-pointer"
            >
              + Phiên mới
            </button>
          </div>
        )}


        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className={cn(
                "flex items-start gap-3 sm:gap-4",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border border-white/10",
                msg.role === 'model' ? "bg-primary text-bg font-bold shadow-[0_0_15px_rgba(45,212,191,0.3)]" : "bg-panel text-text-dim border-border"
              )}>
                {msg.role === 'model' ? <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-bg" /> : <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </div>

              <div className={cn(
                "max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 shadow-xl text-sm leading-relaxed",
                msg.role === 'model' 
                  ? "bg-panel text-white rounded-tl-none border border-border" 
                  : "bg-primary text-bg font-medium rounded-tr-none shadow-[0_0_20px_rgba(45,212,191,0.15)]"
              )}>
                {msg.role === 'model' && (
                  <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-white/5">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
                      <Stethoscope className="w-3 h-3 text-primary" />
                      Phân tích Bác sĩ AI
                    </span>
                    <span className="text-[9px] font-mono text-text-dim">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}

                <div className={cn(
                  "markdown-body",
                  msg.role === 'model' ? "prose-invert" : "text-bg"
                )}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>

                {msg.role === 'user' && (
                  <p className="text-[9px] mt-2 text-right uppercase tracking-wider font-bold opacity-60 font-mono">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <div className="flex items-start gap-3 sm:gap-4 pb-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-primary text-bg flex items-center justify-center animate-pulse border border-white/10 shadow-lg">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-bg" />
            </div>
            <div className="bg-panel border border-border rounded-2xl rounded-tl-none p-4 shadow-xl flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-duration:0.8s]"></span>
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]"></span>
              <span className="text-xs text-text-dim font-light ml-2">Bác sĩ AI đang phân tích dữ liệu y khoa...</span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Scroll to Bottom Indicator */}
      <AnimatePresence>
        {showScrollBottom && (
          <motion.button
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 8 }}
            onClick={() => scrollToBottom('smooth')}
            className="absolute bottom-28 sm:bottom-32 right-6 z-20 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-lg hover:shadow-teal-500/30 transition-all active:scale-95 border border-teal-400/40 cursor-pointer"
            title="Cuộn xuống tin nhắn mới nhất"
          >
            <span>Tin mới nhất</span>
            <ChevronDown className="w-3.5 h-3.5 stroke-[3] animate-bounce" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="shrink-0 p-3 sm:p-4 bg-panel border-t border-border shadow-[0_-8px_25px_rgba(0,0,0,0.1)] pb-[calc(max(env(safe-area-inset-bottom,0px),8px)+0.75rem)] z-30">
        {/* Quick Suggestion Chips with horizontal scroll */}
        <AnimatePresence>
          {suggestions.length > 0 && !isTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 mb-2 scrollbar-none max-w-full"
            >
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(s)}
                  className="bg-primary/10 border border-primary/25 text-primary hover:bg-primary/20 hover:border-primary/40 px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium transition-all active:scale-95 whitespace-nowrap shadow-xs shrink-0 cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Voice to Text Button */}
          <button 
            type="button"
            onClick={handleMicClick}
            className={cn(
              "w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl transition-all border shrink-0 cursor-pointer",
              !speechSupported 
                ? "bg-slate-100 text-slate-400 cursor-not-allowed border-transparent"
                : isRecording
                ? "bg-rose-500/20 text-rose-500 border-rose-500/40 animate-pulse shadow-md"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
            )}
            title={
              !speechSupported 
                ? "Tính năng giọng nói không khả dụng trên trình duyệt này" 
                : isRecording 
                ? "Đang ghi âm... Nhấn để dừng" 
                : "Nhập bằng giọng nói (Voice-to-Text)"
            }
          >
            <Mic className={cn("w-4 h-4 sm:w-5 sm:h-5", isRecording && "scale-110 text-rose-500 animate-pulse")} />
          </button>

          {/* Text Input */}
          <div className="flex-1 relative min-w-0">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isRecording ? "Đang lắng nghe giọng nói của bạn..." : "Nhập triệu chứng, câu hỏi hoặc thắc mắc y khoa..."}
              className={cn(
                "w-full bg-slate-50 border rounded-xl py-2.5 sm:py-3 pl-3.5 pr-11 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:bg-white transition-all shadow-inner border-slate-200",
                isRecording ? "border-rose-400 ring-2 ring-rose-400/30" : ""
              )}
            />
            <button 
              type="button"
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className={cn(
                "absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer",
                input.trim() && !isTyping 
                  ? "bg-teal-600 hover:bg-teal-700 text-force-white shadow-sm hover:scale-105 active:scale-95" 
                  : "text-slate-400 opacity-40 cursor-not-allowed"
              )}
            >
              <Send className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        </div>

        <p className="text-[9.5px] sm:text-[10px] text-center text-teal-800 mt-2 font-normal tracking-wide">
          Trò chuyện sức khỏe với BS A.I • Thông tin mang tính chất tham khảo chuyên môn
        </p>
      </div>
    </div>
  );
}
