import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Save, 
  Mic, 
  MicOff, 
  Smile, 
  Zap, 
  Moon, 
  Droplets, 
  Sparkles,
  Award
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { registerModal } from '../utils/modalManager';

interface JournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function JournalEntryModal({ isOpen, onClose, onSuccess }: JournalEntryModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Register modal in global stack for edge swipe gestures on mobile/tablet
  useEffect(() => {
    if (!isOpen) return;
    const unregister = registerModal('journal-entry-modal', onClose);
    const handleBackPress = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('app-back-press', handleBackPress);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      unregister();
      window.removeEventListener('app-back-press', handleBackPress);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Journal form state
  const [mood, setMood] = useState<string>('Vui vẻ');
  const [energy, setEnergy] = useState<string>('Khỏe mạnh');
  const [sleep, setSleep] = useState<number>(7);
  const [water, setWater] = useState<number>(4);
  const [notes, setNotes] = useState<string>('');

  // Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [interimText, setInterimText] = useState<string>('');
  
  const recognitionRef = useRef<any>(null);

  // Check browser speech support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
    }
  }, []);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, []);

  const toggleListening = () => {
    if (!speechSupported) {
      setErrorMsg("Trình duyệt của bạn không hỗ trợ Web Speech API.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (isListening) {
      // Stop listening
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      // Start listening
      setMicPermissionDenied(false);
      setErrorMsg(null);
      
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'vi-VN'; // Vietnamese language support
        
        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          setInterimText(interimTranscript);

          if (finalTranscript) {
            setNotes((prev) => {
              const cleanedPrev = prev.trim();
              const suffix = finalTranscript.trim();
              return cleanedPrev ? `${cleanedPrev} ${suffix}` : suffix;
            });
            setInterimText('');
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          if (event.error === 'not-allowed') {
            setMicPermissionDenied(true);
            setErrorMsg("Không thể truy cập Microphone. Vui lòng cấp quyền micro trong cài đặt trình duyệt.");
          } else {
            setErrorMsg(`Lỗi nhận dạng giọng nói: ${event.error}`);
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
          setInterimText('');
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.error("Failed to start Speech Recognition:", err);
        setErrorMsg("Có lỗi xảy ra khi bắt đầu nhận dạng giọng nói.");
        setIsListening(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!notes.trim()) {
      setErrorMsg("Vui lòng điền nội dung chi tiết hoặc đọc lời ghi chú!");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    // Stop listening if it's currently active
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error(e);
      }
      setIsListening(false);
    }

    try {
      await addDoc(collection(db, 'healthJournals'), {
        userId: user.uid,
        mood,
        energy,
        sleep,
        water,
        notes: notes.trim(),
        createdAt: serverTimestamp()
      });

      // Clear fields and trigger success callback
      setNotes('');
      setMood('Vui vẻ');
      setEnergy('Khỏe mạnh');
      setSleep(7);
      setWater(4);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error saving health journal:", err);
      try {
        handleFirestoreError(err, OperationType.CREATE, 'healthJournals');
      } catch (formattedError: any) {
        setErrorMsg(`Không thể lưu nhật ký: ${formattedError.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const moodsList = [
    { name: 'Vui vẻ', emoji: '😊', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { name: 'Tốt', emoji: '🙂', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
    { name: 'Bình thường', emoji: '😐', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
    { name: 'Mệt mỏi', emoji: '😴', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    { name: 'Căng thẳng', emoji: '😫', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' }
  ];

  const energiesList = [
    { name: 'Nhập tràn', emoji: '⚡', desc: 'Tràn đầy năng lượng' },
    { name: 'Khỏe mạnh', emoji: '🔋', desc: 'Tốt định & khỏe khỏe' },
    { name: 'Bình thường', emoji: '📉', desc: 'Hơi mệt hoặc vừa phải' },
    { name: 'Kiệt quệ', emoji: '🔌', desc: 'Cần nghỉ ngơi ngay' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="journal-entry-modal-container" className="fixed inset-0 z-50 flex items-center justify-center p-0 lg:p-4">
          {/* Backdrop */}
          <motion.div
            id="journal-entry-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-bg/85 backdrop-blur-md"
          />

          {/* Modal content */}
          <motion.div
            id="journal-entry-modal-content"
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className="relative w-full h-full lg:h-auto lg:max-w-lg lg:max-h-[90vh] bg-panel border-0 lg:border lg:border-border rounded-none lg:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div id="journal-entry-modal-header" className="p-6 pt-[calc(max(env(safe-area-inset-top,0px),24px)+0.75rem)] lg:pt-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div id="journal-entry-icon-holder" className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h2 id="journal-entry-title" className="font-serif text-xl italic font-light text-white">Ghi chú chuyên sâu</h2>
                  <p id="journal-entry-subtitle" className="text-[10px] text-text-dim font-bold uppercase tracking-widest mt-0.5">Sổ ghi chép nhật ký sức khỏe & giọng nói</p>
                </div>
              </div>
              <button 
                id="journal-entry-close-btn"
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-text-dim hover:text-white transition-all border border-transparent hover:border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form id="journal-entry-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              {errorMsg && (
                <div id="journal-entry-error" className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-light">
                  {errorMsg}
                </div>
              )}

              {/* Status Section (Mood & Energy) */}
              <div id="journal-status-section" className="space-y-4">
                <label id="journal-mood-label" className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">1. Tâm trạng hôm nay</label>
                <div id="journal-mood-grid" className="grid grid-cols-5 gap-2">
                  {moodsList.map((m) => (
                    <button
                      id={`journal-mood-btn-${m.name}`}
                      key={m.name}
                      type="button"
                      onClick={() => setMood(m.name)}
                      className={cn(
                        "p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 transition-all active:scale-95",
                        mood === m.name 
                          ? `${m.color} ring-1 ring-primary/40`
                          : "bg-white/[0.01] border-white/5 text-text-dim hover:text-white hover:border-white/10"
                      )}
                    >
                      <span className="text-xl">{m.emoji}</span>
                      <span className="text-[8px] font-bold uppercase tracking-wider truncate w-full">{m.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Energy Level */}
              <div id="journal-energy-section" className="space-y-3">
                <label id="journal-energy-label" className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">2. Mức năng lượng</label>
                <div id="journal-energy-grid" className="grid grid-cols-2 gap-2">
                  {energiesList.map((e) => (
                    <button
                      id={`journal-energy-btn-${e.name}`}
                      key={e.name}
                      type="button"
                      onClick={() => setEnergy(e.name)}
                      className={cn(
                        "p-3 rounded-xl border text-left flex items-center gap-3 transition-all active:scale-98",
                        energy === e.name 
                          ? "bg-primary/10 text-primary border-primary/20 ring-1 ring-primary/30"
                          : "bg-white/[0.01] border-white/5 text-text-dim hover:text-white hover:border-white/10"
                      )}
                    >
                      <span className="text-xl flex-shrink-0">{e.emoji}</span>
                      <div>
                        <p className="text-xs font-medium">{e.name}</p>
                        <p className="text-[9px] text-text-dim mt-0.5 line-clamp-1">{e.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders for Water and Sleep */}
              <div id="journal-sliders-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Sleep Hours */}
                <div id="journal-sleep-section" className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                      <Moon className="w-3.5 h-3.5 text-indigo-400" />
                      Giấc ngủ
                    </span>
                    <span className="text-xs font-serif italic text-white font-light">{sleep} giờ</span>
                  </div>
                  <input
                    id="journal-sleep-slider"
                    type="range"
                    min="3"
                    max="12"
                    step="0.5"
                    value={sleep}
                    onChange={(e) => setSleep(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[8px] text-text-dim font-bold">
                    <span>ÍT (&lt; 5h)</span>
                    <span>ĐỦ (7h - 8h)</span>
                    <span>NHIỀU (&gt; 9h)</span>
                  </div>
                </div>

                {/* Water Intake */}
                <div id="journal-water-section" className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                      Nước uống
                    </span>
                    <span className="text-xs font-serif italic text-white font-light">{water} cốc (~{water * 250}ml)</span>
                  </div>
                  <input
                    id="journal-water-slider"
                    type="range"
                    min="1"
                    max="12"
                    step="1"
                    value={water}
                    onChange={(e) => setWater(parseInt(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[8px] text-text-dim font-bold">
                    <span>ÍT (1 cốc)</span>
                    <span>ĐỦ (8 cốc)</span>
                    <span>NHIỀU (12 cốc)</span>
                  </div>
                </div>
              </div>

              {/* Dictation Notes Area */}
              <div id="journal-dictation-section" className="space-y-3">
                <div className="flex items-center justify-between">
                  <label id="journal-notes-label" className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">
                    3. Ghi chép chi tiết *
                  </label>
                  
                  {speechSupported ? (
                    <span id="speech-badge" className={cn(
                      "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border flex items-center gap-1.5 transition-all duration-300",
                      isListening 
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse" 
                        : "bg-white/5 text-primary border-white/5"
                    )}>
                      {isListening ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                          Đang nghe giọng nói...
                        </>
                      ) : (
                        "Có hỗ trợ giọng nói"
                      )}
                    </span>
                  ) : (
                    <span id="speech-badge-unsupported" className="text-[8px] font-bold uppercase tracking-wider bg-white/5 text-text-dim px-2 py-0.5 rounded">
                      Giọng nói không khả dụng
                    </span>
                  )}
                </div>

                <div id="journal-textarea-container" className="relative group">
                  <textarea
                    id="journal-notes-textarea"
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Hôm nay sức khỏe bạn thế nào? Hãy viết ghi chép hoặc sử dụng biểu tượng Micro bên để đọc lời ghi âm rảnh tay..."
                    className={cn(
                      "w-full bg-white/5 border border-border rounded-2xl py-3 pl-4 pr-14 text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs transition-all no-scrollbar font-light leading-relaxed resize-none",
                      isListening && "border-rose-500/30 focus:ring-rose-500/10"
                    )}
                  />

                  {/* Micro Button Over Textarea */}
                  {speechSupported && (
                    <button
                      id="voice-dictation-mic-trigger"
                      type="button"
                      onClick={toggleListening}
                      className={cn(
                        "absolute right-3.5 top-3.5 w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300",
                        isListening 
                          ? "bg-rose-500 text-white border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse" 
                          : "bg-white/5 text-text-dim hover:text-white border-white/5 hover:border-white/10 hover:bg-white/10"
                      )}
                      title={isListening ? "Nhấn để dừng ghi âm" : "Nhấn để ghi âm bằng giọng nói"}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                {/* Web Speech status / preview helper */}
                {isListening && interimText && (
                  <div id="journal-speech-interim" className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl text-stone-200 text-xs italic font-light animate-fade-in flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-ping flex-shrink-0" />
                    <span>"{interimText}"</span>
                  </div>
                )}

                {isListening && !interimText && (
                  <p id="journal-speech-hint" className="text-[10px] text-rose-400/80 italic font-light pl-1 animate-pulse">
                    Mời bạn thảo lời nói bằng tiếng Việt... chúng tôi sẽ chuyển thành chữ tự động.
                  </p>
                )}
              </div>

              {/* Action Buttons: Lưu and Đóng */}
              <div id="journal-modal-actions" className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <button
                  id="journal-save-btn"
                  type="submit"
                  disabled={loading}
                  className="flex-1 sm:flex-none px-6 py-3.5 bg-primary text-bg font-bold rounded-xl text-xs uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Đang lưu...' : 'Lưu'}</span>
                </button>
                <button
                  id="journal-cancel-btn"
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 sm:flex-none px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest text-text-dim hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Đóng</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
