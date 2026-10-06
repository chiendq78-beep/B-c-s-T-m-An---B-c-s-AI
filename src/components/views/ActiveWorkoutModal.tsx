import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  SkipBack, 
  CheckCircle2, 
  Clock, 
  Flame, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  X, 
  ArrowLeft,
  Lock,
  ChevronRight, 
  Sparkles, 
  Check, 
  Activity,
  Award,
  Wind
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { registerModal } from '../../utils/modalManager';
import { cn } from '../../lib/utils';

export interface ExerciseStepItem {
  id: string;
  name: string;
  name_en?: string;
  durationMinutes: number;
  durationSeconds: number;
  purpose: string;
  purpose_en?: string;
  alignmentTip: string;
  alignmentTip_en?: string;
  poseAnimationType: 'cat_cow' | 'child_pose' | 'bridge' | 'cobra' | 'knee_hug' | 'savasana' | 'default';
}

export interface WorkoutExerciseData {
  id: string;
  title: string;
  title_en?: string;
  category: string;
  categoryLabel: string;
  tag: string;
  duration: number; // minutes
  kcal: number;
  level: string;
  image: string;
  description: string;
  benefits: string[];
  steps: string[];
  structuredSteps?: ExerciseStepItem[];
}

interface ActiveWorkoutModalProps {
  exercise: WorkoutExerciseData | null;
  onClose: () => void;
  onComplete: (actualMinutes: number, actualKcal: number) => void;
  isEn?: boolean;
}

// Clinically Optimized Timing for "Yoga Phục Hồi Chuyên Sâu" (Total exactly 25 minutes = 1500s)
export const YOGA_SPINE_CLINICAL_STEPS: ExerciseStepItem[] = [
  {
    id: 'step-cat-cow',
    name: 'Tư thế Con Mèo - Con Bò (Cat-Cow)',
    name_en: 'Cat-Cow Pose (Marjaryasana-Bitilasana)',
    durationMinutes: 3,
    durationSeconds: 180,
    purpose: 'Khởi động & Làm mềm dẻo toàn bộ cột sống, giải tỏa áp lực đĩa đệm',
    purpose_en: 'Warm-up & spinal flexibility, relieves intervertebral disc tension',
    alignmentTip: 'Hít vào võng nhẹ lưng, mở ngực ngẩng đầu (Bò) • Thở ra cuộn tròn cột sống, hóp bụng gập cằm về ngực (Mèo). Giữ nhịp thở chậm rãi theo chuyển động.',
    alignmentTip_en: 'Inhale arch back gently, open chest (Cow) • Exhale round spine, tuck chin and navel (Cat). Maintain fluid slow breath.',
    poseAnimationType: 'cat_cow'
  },
  {
    id: 'step-child-pose',
    name: 'Tư thế Em Bé (Child Pose)',
    name_en: 'Child Pose (Balasana)',
    durationMinutes: 3,
    durationSeconds: 180,
    purpose: 'Kéo giãn vùng cơ thắt lưng & Thư giãn, giảm chèn ép rễ thần kinh',
    purpose_en: 'Lumbar stretching & hip decompression, relieves sciatic nerve tension',
    alignmentTip: 'Hạ mông về sát gót chân, vươn dài hai tay về phía trước, trán chạm nhẹ thảm. Thở chậm bằng bụng và cảm nhận vùng thắt lưng được kéo giãn tự nhiên.',
    alignmentTip_en: 'Lower hips toward heels, extend arms forward, forehead gently on mat. Breathe slowly into belly and feel lumbar stretch.',
    poseAnimationType: 'child_pose'
  },
  {
    id: 'step-dynamic-bridge',
    name: 'Tư thế Cây Cầu Động (Dynamic Bridge)',
    name_en: 'Dynamic Bridge Pose (Setu Bandhasana)',
    durationMinutes: 4,
    durationSeconds: 240,
    purpose: 'Củng cố cơ mông, đùi sau & Đáy chậu (giảm tải áp lực cho vùng lưng)',
    purpose_en: 'Strengthens glutes, hamstrings & pelvic floor (offloading lumbar spine)',
    alignmentTip: 'Nằm ngửa gập gối, bàn chân song song rộng bằng vai. Hít vào nâng hông siết nhẹ cơ mông; thở ra hạ chậm từng đốt sống xuống thảm (10-15 lần nhịp nhàng).',
    alignmentTip_en: 'Lie on back, bend knees shoulder-width. Inhale lift hips engaging glutes; exhale lower spine vertebra by vertebra.',
    poseAnimationType: 'bridge'
  },
  {
    id: 'step-baby-cobra',
    name: 'Tư thế Rắn Hổ Mang Nhẹ (Baby Cobra)',
    name_en: 'Baby Cobra Pose (Bhujangasana)',
    durationMinutes: 3,
    durationSeconds: 180,
    purpose: 'Kích hoạt nhóm cơ dựng sống, giải phóng áp lực đĩa đệm (ngửa lưng an toàn)',
    purpose_en: 'Activates erector spinae, decompresses discs with safe spine extension',
    alignmentTip: 'Nằm sấp, đặt nhẹ bàn tay ngang ngực. Hít vào dùng sức mạnh của cơ lưng nâng nhẹ ngực khỏi thảm (không dồn lực vào cổ tay); giữ 30-45 giây rồi hạ nghỉ.',
    alignmentTip_en: 'Lie prone, palms by chest. Inhale using back muscles to lift upper chest gently (no hand pressure); hold 30-45s then release.',
    poseAnimationType: 'cobra'
  },
  {
    id: 'step-knee-hug',
    name: 'Thắt lưng gập nhẹ / Lăn lưng nhẹ (Knee-to-Chest)',
    name_en: 'Knee-to-Chest & Gentle Lumbar Roll (Apanasana)',
    durationMinutes: 2,
    durationSeconds: 120,
    purpose: 'Trả lại trạng thái trung tính cho cột sống trước khi nghỉ sâu',
    purpose_en: 'Returns spine to neutral alignment and releases residual lumbar tightness',
    alignmentTip: 'Nằm ngửa, hai tay ôm vòng quanh gối kéo nhẹ về phía ngực. Hít thở sâu và lắc lư nhẹ sang hai bên để massage tự nhiên vùng cơ lưng thắt lưng.',
    alignmentTip_en: 'Lie supine, wrap arms around knees pulling gently to chest. Breathe deeply and rock side-to-side for natural lumbar massage.',
    poseAnimationType: 'knee_hug'
  },
  {
    id: 'step-savasana',
    name: 'Savasana & Thở bụng sâu (Corpse Pose)',
    name_en: 'Corpse Pose (Savasana) & Deep Diaphragmatic Breath',
    durationMinutes: 10,
    durationSeconds: 600,
    purpose: 'Thư giãn sâu, cân bằng hệ thần kinh thực vật & Giảm đau toàn thân',
    purpose_en: 'Deep parasympathetic recovery, nervous system rebalancing & pain relief',
    alignmentTip: 'Nằm ngửa thả lỏng toàn thân, nhắm mắt thư thái. Đặt một tay lên bụng: hít vào 4 giây bụng phồng lên, thở ra 6-8 giây bụng xẹp xuống êm ái.',
    alignmentTip_en: 'Lie relaxed on back, eyes gently closed. Place hand on belly: inhale 4s belly rises, exhale 6-8s body melts into floor.',
    poseAnimationType: 'savasana'
  }
];

export default function ActiveWorkoutModal({
  exercise,
  onClose,
  onComplete,
  isEn = false
}: ActiveWorkoutModalProps) {
  // Audio state
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Active workout steps calculation
  const steps: ExerciseStepItem[] = useMemo(() => {
    if (!exercise) return [];
    if (exercise.id === 'hero-yoga-spine') {
      return YOGA_SPINE_CLINICAL_STEPS;
    }
    if (exercise.structuredSteps && exercise.structuredSteps.length > 0) {
      return exercise.structuredSteps;
    }
    // Fallback parser for other exercises with raw steps array
    const stepCount = exercise.steps.length || 1;
    const minutesPerStep = Math.max(1, Math.round(exercise.duration / stepCount));
    return exercise.steps.map((st, idx) => ({
      id: `step-${idx}`,
      name: st.split(':')[0] || st,
      durationMinutes: minutesPerStep,
      durationSeconds: minutesPerStep * 60,
      purpose: st.split(':')[1]?.trim() || (isEn ? 'Therapeutic movement' : 'Động tác phục hồi'),
      alignmentTip: isEn ? 'Maintain steady rhythmic breathing and proper alignment.' : 'Giữ nhịp thở đều đặn và thả lỏng các nhóm cơ hỗ trợ.',
      poseAnimationType: 'default'
    }));
  }, [exercise, isEn]);

  // Overall timing state
  const totalWorkoutSecondsGoal = useMemo(() => {
    return steps.reduce((acc, curr) => acc + curr.durationSeconds, 0);
  }, [steps]);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepSecondsRemaining, setStepSecondsRemaining] = useState(
    steps[0]?.durationSeconds || 180
  );
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Register edge swipe & Escape listener
  useEffect(() => {
    if (!exercise) return;
    const handleCloseModal = () => {
      setIsTimerRunning(false);
      onClose();
    };
    const unregister = registerModal('active-workout-flow-modal', handleCloseModal);
    const handleBack = (e: Event) => {
      e.preventDefault();
      handleCloseModal();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCloseModal();
    };
    window.addEventListener('app-back-press', handleBack);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      unregister();
      window.removeEventListener('app-back-press', handleBack);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [exercise, onClose]);

  // Reset or setup step timer when step changes
  useEffect(() => {
    if (steps[currentStepIndex]) {
      setStepSecondsRemaining(steps[currentStepIndex].durationSeconds);
    }
  }, [currentStepIndex, steps]);

  // Gentle Audio Chime using Web Audio API (Zero external MP3 dependency)
  const playSound = (type: 'step_change' | 'complete' | 'tick') => {
    if (isAudioMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (type === 'tick') {
        // Short soft ping for 3-2-1 countdown
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(620, ctx.currentTime);
        gain.gain.setValueAtTime(0.09, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.09);
      } else if (type === 'step_change') {
        // Two-tone gentle singing bowl chime (528 Hz -> 792 Hz Solfeggio healing chord)
        const notes = [528, 792];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
          gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.08 + 0.65);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.08);
          osc.stop(ctx.currentTime + idx * 0.08 + 0.7);
        });
      } else if (type === 'complete') {
        // Peaceful celebratory 4-note chord
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
          gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.12 + 0.9);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.12);
          osc.stop(ctx.currentTime + idx * 0.12 + 0.95);
        });
      }
    } catch (e) {
      // Audio autoplay policy fallback
    }
  };

  // Main countdown timer interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && !sessionCompleted) {
      interval = setInterval(() => {
        setTotalElapsedSeconds(prev => prev + 1);

        setStepSecondsRemaining(prev => {
          if (prev <= 4 && prev > 1) {
            playSound('tick');
          }
          if (prev <= 1) {
            // Step countdown finished: auto advance or complete
            if (currentStepIndex < steps.length - 1) {
              playSound('step_change');
              setCurrentStepIndex(curr => curr + 1);
              return steps[currentStepIndex + 1]?.durationSeconds || 180;
            } else {
              // Final step reached
              playSound('complete');
              setSessionCompleted(true);
              setIsTimerRunning(false);
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, sessionCompleted, currentStepIndex, steps]);

  if (!exercise) return null;

  const currentStep = steps[currentStepIndex] || steps[0];

  // Step navigation controls
  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      setStepSecondsRemaining(steps[currentStepIndex - 1].durationSeconds);
      setIsTimerRunning(true);
    }
  };

  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      playSound('step_change');
      setCurrentStepIndex(prev => prev + 1);
      setStepSecondsRemaining(steps[currentStepIndex + 1].durationSeconds);
      setIsTimerRunning(true);
    } else {
      handleFinishEarly();
    }
  };

  const handleSelectStep = (index: number) => {
    setCurrentStepIndex(index);
    setStepSecondsRemaining(steps[index].durationSeconds);
    setIsTimerRunning(true);
    if (sessionCompleted) setSessionCompleted(false);
  };

  const handleFinishEarly = () => {
    setIsTimerRunning(false);
    setSessionCompleted(true);
    playSound('complete');
  };

  const handleConfirmCompletion = () => {
    const actualMinutes = Math.max(1, Math.round(totalElapsedSeconds / 60)) || exercise.duration;
    const actualKcal = Math.round((exercise.kcal / exercise.duration) * actualMinutes);
    onComplete(actualMinutes, actualKcal);
    onClose();
  };

  // Helper format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(Math.max(0, secs) / 60);
    const s = Math.max(0, secs) % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentStepTotal = currentStep.durationSeconds;
  const currentStepProgressPercent = Math.min(
    100, 
    Math.max(0, ((currentStepTotal - stepSecondsRemaining) / currentStepTotal) * 100)
  );

  const overallProgressPercent = Math.min(
    100,
    Math.max(0, (totalElapsedSeconds / (totalWorkoutSecondsGoal || 1500)) * 100)
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 lg:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden select-none animate-in fade-in duration-200">
      <motion.div
        initial={{ scale: 0.98, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.98, opacity: 0, y: 15 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-none lg:rounded-3xl w-full h-full lg:max-w-2xl lg:h-[94vh] overflow-hidden flex flex-col shadow-2xl border-0 lg:border lg:border-slate-200 relative"
      >
        {/* ================================================================= */}
        {/* 1. TOP HEADER (Sticky, Minimal & Clean)                           */}
        {/* ================================================================= */}
        <div className="px-4 sm:px-6 pt-[calc(max(env(safe-area-inset-top,0px),24px)+0.6rem)] lg:pt-4 pb-3.5 border-b border-slate-200 bg-white/95 backdrop-blur-md flex items-center justify-between gap-3 shrink-0 z-20">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 -ml-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95"
              title={isEn ? "Back" : "Quay lại"}
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div className="min-w-0">
              <h2 className="font-serif text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-snug truncate uppercase">
                {exercise.title}
              </h2>
              <p className="text-[11px] text-teal-700 font-semibold tracking-wide truncate">
                {isEn ? "Goal" : "Mục tiêu"}: {exercise.duration} {isEn ? "Minutes" : "Phút"} • {exercise.tag}
              </p>
            </div>
          </div>

          {/* Sound & Mode Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsAudioMuted(!isAudioMuted)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs active:scale-95",
                isAudioMuted 
                  ? "bg-slate-100 text-slate-500 border-slate-200" 
                  : "bg-teal-50 text-teal-700 border-teal-200/90 font-bold"
              )}
              title={isAudioMuted ? (isEn ? "Unmute audio" : "Bật âm thanh") : (isEn ? "Mute audio" : "Tắt âm thanh")}
            >
              {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-teal-600" />}
              <span>{isAudioMuted ? (isEn ? "Muted" : "Tắt âm") : (isEn ? "Âm thanh" : "Âm thanh")}</span>
            </button>
          </div>
        </div>

        {/* Global Workout Progress Line */}
        <div className="w-full bg-slate-100 h-1.5 overflow-hidden shrink-0">
          <div 
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${overallProgressPercent}%` }}
          />
        </div>

        {/* ================================================================= */}
        {/* 2. BODY CONTENT SCROLLABLE CONTAINER                              */}
        {/* ================================================================= */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5 bg-slate-50/50 pb-28">
          
          {/* A. ACTIVE POSE STAGE (Upper Hero Card) */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-4 sm:p-6 space-y-4 relative">
            
            {/* Pose Title & Step Indicator Badge */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-600 text-white shadow-xs">
                    {isEn ? `Step ${currentStepIndex + 1} of ${steps.length}` : `Bước ${currentStepIndex + 1} / ${steps.length}`}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    ⏱️ {currentStep.durationMinutes} {isEn ? "min" : "phút"}
                  </span>
                </div>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                  {currentStep.name}
                </h3>
                <p className="text-xs text-teal-800/90 font-medium">
                  {currentStep.purpose}
                </p>
              </div>
            </div>

            {/* Pose Visual Guide Animation Stage (Light White Background, Green Text) */}
            <div className="relative rounded-2xl overflow-hidden bg-[#fafcfb] border border-emerald-200/90 p-4 sm:p-5 flex flex-col items-center justify-center text-center min-h-[175px] sm:min-h-[195px] shadow-2xs">
              {/* Subtle Light Green Grid Pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#05966914_1px,transparent_1px),linear-gradient(to_bottom,#05966914_1px,transparent_1px)] bg-[size:22px_22px] pointer-events-none" />

              {/* Dynamic Pose Visual Canvas */}
              <PoseVisualGuide 
                type={currentStep.poseAnimationType} 
                isTimerRunning={isTimerRunning}
                isEn={isEn}
              />

              {/* Step Countdown Timer Overlay */}
              <div className="relative z-10 space-y-1 mt-3">
                <span className="text-[10.5px] font-bold uppercase tracking-widest text-emerald-700 block">
                  {isEn ? "Step Time Remaining" : "THỜI GIAN ĐỘNG TÁC HIỆN TẠI"}
                </span>
                <div className="font-mono text-3xl sm:text-4xl font-black text-emerald-950 tracking-wider">
                  {formatTime(stepSecondsRemaining)}
                </div>
                <p className="text-[11.5px] font-medium text-emerald-700/80">
                  {isEn 
                    ? `Total: ${formatTime(totalElapsedSeconds)} / ${formatTime(totalWorkoutSecondsGoal)}` 
                    : `(Tổng bài tập: ${formatTime(totalElapsedSeconds)} / ${formatTime(totalWorkoutSecondsGoal)})`}
                </p>
              </div>

              {/* Breathing & Alignment Prompt */}
              <div className="relative z-10 mt-3 px-3.5 py-2 rounded-xl bg-white/95 border border-emerald-200/90 text-emerald-950 text-[11.5px] leading-relaxed max-w-md shadow-2xs">
                <span className="font-bold text-emerald-800">💡 {isEn ? "Breath & Alignment" : "Định tuyến & Hơi thở"}: </span>
                <span className="text-emerald-900/90">{currentStep.alignmentTip}</span>
              </div>
            </div>

            {/* Interactive Step Timer Controls (Skip Back | Pause/Resume | Skip Next) */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 pt-1">
              {/* Previous Step */}
              <button
                type="button"
                onClick={handlePreviousStep}
                disabled={currentStepIndex === 0}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-xs active:scale-95",
                  currentStepIndex === 0
                    ? "opacity-40 cursor-not-allowed bg-slate-50 text-slate-400 border-slate-200"
                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                )}
                title={isEn ? "Previous step / Skip" : "Bỏ qua / Lùi lại động tác trước"}
              >
                <SkipBack className="w-4 h-4 text-slate-600" />
                <span>{isEn ? "Bỏ qua" : "Bỏ qua"}</span>
              </button>

              {/* Play / Pause Toggle */}
              <button
                type="button"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="flex items-center gap-2 px-6 sm:px-8 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm uppercase tracking-wider shadow-md shadow-teal-600/30 transition-all cursor-pointer active:scale-95"
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="w-4 h-4 fill-white" />
                    <span>{isEn ? "TẠM DỪNG" : "TẠM DỪNG"}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                    <span>{isEn ? "TIẾP TỤC" : "TIẾP TỤC"}</span>
                  </>
                )}
              </button>

              {/* Next Step */}
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
                title={isEn ? "Next step" : "Sang động tác tiếp"}
              >
                <span>{isEn ? "Tiếp" : "Tiếp"}</span>
                <SkipForward className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>

          {/* B. INTERACTIVE STEPS LIST WITH VISUAL STATUS HIGHLIGHTS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span>{isEn ? "WORKOUT ROUTINE STEPS" : "CÁC BƯỚC THỰC HIỆN"}</span>
                <span className="text-teal-700 font-bold">
                  ({currentStepIndex + 1}/{steps.length})
                </span>
              </h4>
              <span className="text-[11px] text-slate-500">
                {isEn ? "Tap any step to jump" : "Nhấp vào bước để chuyển nhanh"}
              </span>
            </div>

            <div className="space-y-2.5">
              {steps.map((st, idx) => {
                const isActive = idx === currentStepIndex;
                const isCompleted = idx < currentStepIndex || sessionCompleted;
                const isPending = idx > currentStepIndex && !sessionCompleted;

                return (
                  <div
                    key={st.id || idx}
                    onClick={() => handleSelectStep(idx)}
                    className={cn(
                      "p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 shadow-2xs group relative overflow-hidden",
                      isActive && "bg-teal-50 border-teal-600 shadow-md shadow-teal-600/15 ring-2 ring-teal-500/60",
                      isCompleted && "bg-slate-50/80 border-emerald-300 text-slate-600 hover:bg-slate-100",
                      isPending && "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    {/* Active Accent Left Stripe */}
                    {isActive && (
                      <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-teal-600 rounded-l-2xl" />
                    )}

                    <div className="flex items-start gap-3 min-w-0">
                      {/* Status Icon Indicator */}
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold transition-transform group-hover:scale-105",
                        isActive && "bg-teal-600 text-white shadow-xs animate-pulse",
                        isCompleted && "bg-emerald-100 text-emerald-700 border border-emerald-300",
                        isPending && "bg-slate-100 text-slate-400 border border-slate-200"
                      )}>
                        {isCompleted ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : isActive ? (
                          <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>

                      {/* Step Details */}
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-teal-700 text-white shadow-xs animate-pulse">
                              {isEn ? "In Progress" : "Đang tập"}
                            </span>
                          )}
                          {isCompleted && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-semibold bg-emerald-100 text-emerald-800">
                              {isEn ? "✓ Done" : "✓ Đã xong"}
                            </span>
                          )}
                          {isPending && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-medium bg-slate-100 text-slate-500">
                              {isEn ? "🔒 Pending" : "🔒 Chờ"}
                            </span>
                          )}
                          <h5 className={cn(
                            "font-bold text-xs sm:text-sm leading-snug",
                            isActive ? "text-teal-950 font-extrabold" : isCompleted ? "text-slate-600" : "text-slate-800"
                          )}>
                            {idx + 1}. {st.name}
                          </h5>
                        </div>

                        <p className={cn(
                          "text-[11px] leading-relaxed line-clamp-2",
                          isActive ? "text-teal-900 font-medium" : "text-slate-500"
                        )}>
                          {st.purpose}
                        </p>
                      </div>
                    </div>

                    {/* Step Timing on Right */}
                    <div className="text-right shrink-0">
                      <span className={cn(
                        "text-xs font-bold block",
                        isActive ? "text-teal-700 font-mono text-sm" : isCompleted ? "text-slate-400" : "text-slate-600"
                      )}>
                        {isActive ? formatTime(stepSecondsRemaining) : `${st.durationMinutes} ${isEn ? "min" : "phút"}`}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-normal">
                        {isActive ? `${Math.round(currentStepProgressPercent)}%` : isCompleted ? (isEn ? "Done ✓" : "Xong ✓") : (isEn ? "Pending" : "Chờ")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 3. FIXED STICKY BOTTOM BAR (No Text Overlap, Generous Padding)     */}
        {/* ================================================================= */}
        <div className="shrink-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 sm:px-6 py-3.5 pb-[calc(max(env(safe-area-inset-bottom,0px),16px)+0.75rem)] shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 z-30">
          <div className="min-w-0 w-full sm:w-auto text-center sm:text-left">
            <span className="text-xs font-bold text-slate-800 block truncate">
              {sessionCompleted 
                ? (isEn ? "🎉 Workout session completed!" : "🎉 Buổi tập đã hoàn thành!") 
                : (isEn ? `Step ${currentStepIndex + 1}/${steps.length}: ${currentStep.name}` : `Đang tập: ${currentStepIndex + 1}/${steps.length} • ${currentStep.name}`)}
            </span>
            <span className="text-[11px] text-slate-500 block truncate">
              {isEn ? "Total time:" : "Tổng bài tập:"} <strong className="text-teal-700 font-mono font-bold">{formatTime(totalElapsedSeconds)}</strong> / {formatTime(totalWorkoutSecondsGoal)} • ~{Math.round((exercise.kcal / exercise.duration) * Math.max(1, Math.round(totalElapsedSeconds / 60)))} kcal
            </span>
          </div>

          <div className="w-full sm:w-auto flex items-center justify-center">
            {sessionCompleted ? (
              <button
                type="button"
                onClick={handleConfirmCompletion}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm uppercase tracking-wider shadow-md shadow-emerald-600/25 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isEn ? "SAVE & RECORD TO HISTORY" : "✓ LƯU VÀO LỊCH SỬ TẬP"}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishEarly}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm uppercase tracking-wider shadow-md shadow-teal-600/25 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                title={isEn ? "Finish early and record workout" : "Bấm khi bạn đã hoàn thành bài tập sớm"}
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{isEn ? "FINISH WORKOUT (Tap when finished early)" : "HOÀN THÀNH BUỔI TẬP (Bấm khi tập xong sớm)"}</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Visual Pose Alignment Component (Interactive Vector Yoga Figures & Alignment Lines)
function PoseVisualGuide({ 
  type, 
  isTimerRunning,
  isEn 
}: { 
  type: string; 
  isTimerRunning: boolean;
  isEn: boolean;
}) {
  return (
    <div className="relative w-full max-w-[280px] h-[95px] flex items-center justify-center">
      {type === 'cat_cow' && (
        <svg viewBox="0 0 200 80" className="w-full h-full text-emerald-600 drop-shadow-xs">
          {/* Floor Alignment line */}
          <line x1="20" y1="70" x2="180" y2="70" stroke="#059669" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
          
          {/* Hands and Knees */}
          <circle cx="50" cy="68" r="3.5" fill="#047857" />
          <circle cx="150" cy="68" r="3.5" fill="#047857" />

          {/* Animated Spine Curve: Alternating Cat Arch & Cow Drop */}
          <path 
            d="M 50 68 L 50 45 Q 100 24 150 45 L 150 68" 
            fill="none" 
            stroke="#059669" 
            strokeWidth="3.5" 
            strokeLinecap="round"
          >
            <animate 
              attributeName="d" 
              dur="4s" 
              repeatCount="indefinite"
              values="
                M 50 68 L 50 45 Q 100 20 150 45 L 150 68;
                M 50 68 L 50 48 Q 100 55 150 48 L 150 68;
                M 50 68 L 50 45 Q 100 20 150 45 L 150 68
              " 
            />
          </path>

          {/* Head & Neck Alignment */}
          <circle cx="36" cy="40" r="7.5" fill="#0d9488">
            <animate 
              attributeName="cy" 
              dur="4s" 
              repeatCount="indefinite"
              values="46; 30; 46"
            />
          </circle>

          {/* Glowing vertebral alignment nodes */}
          <circle cx="80" cy="30" r="3" fill="#f59e0b">
            <animate attributeName="cy" dur="4s" repeatCount="indefinite" values="27; 52; 27" />
          </circle>
          <circle cx="100" cy="28" r="3" fill="#f59e0b">
            <animate attributeName="cy" dur="4s" repeatCount="indefinite" values="24; 54; 24" />
          </circle>
          <circle cx="120" cy="30" r="3" fill="#f59e0b">
            <animate attributeName="cy" dur="4s" repeatCount="indefinite" values="27; 52; 27" />
          </circle>
        </svg>
      )}

      {type === 'child_pose' && (
        <svg viewBox="0 0 200 80" className="w-full h-full text-emerald-600 drop-shadow-xs">
          <line x1="20" y1="70" x2="180" y2="70" stroke="#059669" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
          {/* Folded Body & Elongated Lumbar */}
          <path 
            d="M 140 68 C 145 50, 130 38, 105 45 C 80 50, 60 66, 40 68" 
            fill="none" 
            stroke="#059669" 
            strokeWidth="3.5" 
            strokeLinecap="round"
          />
          {/* Extended Arms */}
          <path d="M 60 60 L 30 68" stroke="#047857" strokeWidth="3" strokeLinecap="round" />
          {/* Resting Head */}
          <circle cx="50" cy="65" r="6.5" fill="#0d9488" />
          {/* Lumbar decompression visual rays */}
          <path d="M 105 35 L 105 24" stroke="#f59e0b" strokeWidth="2" strokeDasharray="2 2" />
          <path d="M 120 37 L 128 28" stroke="#f59e0b" strokeWidth="2" strokeDasharray="2 2" />
          <path d="M 90 37 L 82 28" stroke="#f59e0b" strokeWidth="2" strokeDasharray="2 2" />
        </svg>
      )}

      {type === 'bridge' && (
        <svg viewBox="0 0 200 80" className="w-full h-full text-emerald-600 drop-shadow-xs">
          <line x1="20" y1="70" x2="180" y2="70" stroke="#059669" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
          {/* Feet on floor */}
          <circle cx="140" cy="68" r="3.5" fill="#047857" />
          {/* Shoulders on floor */}
          <circle cx="50" cy="68" r="3.5" fill="#047857" />
          {/* Head */}
          <circle cx="36" cy="68" r="6.5" fill="#0d9488" />
          {/* Elevated Pelvis Bridge Curve */}
          <path 
            d="M 50 68 L 90 36 L 140 68" 
            fill="none" 
            stroke="#059669" 
            strokeWidth="3.5" 
            strokeLinecap="round"
          >
            <animate 
              attributeName="d" 
              dur="3s" 
              repeatCount="indefinite"
              values="
                M 50 68 L 95 32 L 140 68;
                M 50 68 L 95 56 L 140 68;
                M 50 68 L 95 32 L 140 68
              " 
            />
          </path>
          {/* Pelvic contraction highlight */}
          <circle cx="95" cy="34" r="3.5" fill="#f59e0b">
            <animate attributeName="cy" dur="3s" repeatCount="indefinite" values="32; 56; 32" />
          </circle>
        </svg>
      )}

      {type === 'cobra' && (
        <svg viewBox="0 0 200 80" className="w-full h-full text-emerald-600 drop-shadow-xs">
          <line x1="20" y1="70" x2="180" y2="70" stroke="#059669" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
          {/* Lower legs & hips resting on floor */}
          <path d="M 160 68 L 105 68" stroke="#047857" strokeWidth="3" strokeLinecap="round" />
          {/* Upper torso lifted by back muscles */}
          <path 
            d="M 105 68 C 90 68, 75 56, 60 38" 
            fill="none" 
            stroke="#059669" 
            strokeWidth="3.5" 
            strokeLinecap="round"
          >
            <animate 
              attributeName="d" 
              dur="4s" 
              repeatCount="indefinite"
              values="
                M 105 68 C 90 68, 75 56, 60 38;
                M 105 68 C 90 68, 75 62, 60 56;
                M 105 68 C 90 68, 75 56, 60 38
              " 
            />
          </path>
          {/* Head & Neck */}
          <circle cx="56" cy="30" r="6.5" fill="#0d9488">
            <animate attributeName="cy" dur="4s" repeatCount="indefinite" values="30; 48; 30" />
          </circle>
          {/* Hand placement indicator (no weight) */}
          <circle cx="75" cy="68" r="3" fill="#f59e0b" />
        </svg>
      )}

      {type === 'knee_hug' && (
        <svg viewBox="0 0 200 80" className="w-full h-full text-emerald-600 drop-shadow-xs">
          <line x1="20" y1="70" x2="180" y2="70" stroke="#059669" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
          {/* Back resting on floor */}
          <path d="M 40 68 L 110 68" stroke="#047857" strokeWidth="3" strokeLinecap="round" />
          <circle cx="32" cy="68" r="6.5" fill="#0d9488" />
          {/* Knees pulled into chest */}
          <path 
            d="M 110 68 C 115 50, 100 36, 80 40 C 70 42, 65 55, 65 68" 
            fill="none" 
            stroke="#059669" 
            strokeWidth="3.5" 
            strokeLinecap="round"
          />
          {/* Hands holding knees */}
          <circle cx="82" cy="42" r="3.5" fill="#f59e0b" />
        </svg>
      )}

      {type === 'savasana' && (
        <svg viewBox="0 0 200 80" className="w-full h-full text-emerald-600 drop-shadow-xs">
          <line x1="20" y1="70" x2="180" y2="70" stroke="#059669" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
          {/* Complete Relaxed Supine Body */}
          <path d="M 45 68 L 160 68" stroke="#059669" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="35" cy="68" r="6.5" fill="#0d9488" />
          {/* Gentle Breathing Aura Pulse Ring */}
          <circle cx="95" cy="55" r="16" fill="none" stroke="#10b981" strokeWidth="1.5" opacity="0.7">
            <animate attributeName="r" dur="5s" repeatCount="indefinite" values="10; 22; 10" />
            <animate attributeName="opacity" dur="5s" repeatCount="indefinite" values="0.8; 0.2; 0.8" />
          </circle>
          <circle cx="95" cy="55" r="3.5" fill="#f59e0b" />
        </svg>
      )}

      {type === 'default' && (
        <div className="flex items-center gap-3 text-emerald-800">
          <Activity className="w-8 h-8 text-emerald-600 animate-pulse" />
          <div className="text-left">
            <span className="text-xs font-bold block text-emerald-950">{isEn ? "Clinical Alignment" : "Định tuyến trị liệu"}</span>
            <span className="text-[10px] text-emerald-700/80">{isEn ? "Perform steadily with awareness" : "Thực hiện chậm rãi theo hơi thở"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
