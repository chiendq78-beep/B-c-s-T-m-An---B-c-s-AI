import React, { useState } from 'react';
import { 
  Eye, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers, 
  Maximize2, 
  Info, 
  Sparkles,
  Camera,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AnatomyPartData } from '../../data/anatomyData';

interface AnatomyIllustrationViewerProps {
  part: AnatomyPartData;
  onAskAI?: (prompt: string) => void;
}

export default function AnatomyIllustrationViewer({
  part,
  onAskAI
}: AnatomyIllustrationViewerProps) {
  const [viewMode, setViewMode] = useState<'diagram' | 'medical_photo' | 'xray'>('diagram');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedStructureIdx, setSelectedStructureIdx] = useState<number | null>(null);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [imgError, setImgError] = useState<boolean>(false);

  // Helper to render customized SVG anatomical diagrams per organ system
  const renderVectorDiagram = () => {
    const systemId = part.systemId;
    const partCode = part.code;

    // Head / Skull / Brain
    if (partCode === 'SKULL' || part.category === 'head') {
      return (
        <svg viewBox="0 0 540 440" className="w-full h-full select-none" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="frontalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="parietalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="temporalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="zygomaticGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#9333ea" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="maxillaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="mandibleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ea580c" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="nasalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#db2777" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="boneBase" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f1f5f9" />
              <stop offset="50%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
            <filter id="skullShadow" x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#000000" floodOpacity="0.6" />
            </filter>
            <filter id="boneGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Technical blueprint grid */}
          <pattern id="skullGrid" width="22" height="22" patternUnits="userSpaceOnUse">
            <path d="M 22 0 L 0 0 0 22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.7" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#skullGrid)" />

          {/* Cranium Overall Contour Underlay */}
          <g filter="url(#skullShadow)">
            {/* Top Cranial Vault (Vòm sọ - Parietal & Occipital back outline) */}
            <path
              d="M 185 85 C 185 30, 355 30, 355 85 C 385 110, 395 160, 385 205 C 375 240, 360 270, 335 295 L 335 340 C 335 375, 205 375, 205 340 L 205 295 C 180 270, 165 240, 155 205 C 145 160, 155 110, 185 85 Z"
              fill="url(#boneBase)"
              stroke="#334155"
              strokeWidth="2.5"
            />

            {/* 1. Xương Đỉnh (Parietal Bones - Left & Right top vault) */}
            <path
              d="M 195 80 C 220 40, 320 40, 345 80 C 375 110, 380 145, 375 170 L 340 160 C 320 115, 220 115, 200 160 L 165 170 C 160 145, 165 110, 195 80 Z"
              fill="url(#parietalGrad)"
              stroke="#312e81"
              strokeWidth="1.8"
              className="cursor-pointer transition-all hover:opacity-100 opacity-90"
              onClick={() => setSelectedStructureIdx(0)}
            />
            {/* Coronal Suture (Khớp vành răng cưa) */}
            <path
              d="M 175 160 Q 200 135 270 130 Q 340 135 365 160"
              fill="none"
              stroke="#1e293b"
              strokeWidth="2"
              strokeDasharray="2 3"
            />
            {/* Sagittal Suture (Khớp dọc giữa hai xương đỉnh) */}
            <path
              d="M 270 38 L 270 130"
              fill="none"
              stroke="#1e293b"
              strokeWidth="2"
              strokeDasharray="2 3"
            />

            {/* 2. Xương Trán (Frontal Bone - Forehead & Supraorbital ridges) */}
            <path
              d="M 175 160 C 200 135 340 135 365 160 C 375 180, 365 210, 345 220 C 325 215, 310 200, 270 200 C 230 200, 215 215, 195 220 C 175 210, 165 180, 175 160 Z"
              fill="url(#frontalGrad)"
              stroke="#0369a1"
              strokeWidth="1.8"
              className="cursor-pointer transition-all hover:opacity-100 opacity-95"
              onClick={() => setSelectedStructureIdx(0)}
            />
            {/* Cung mày & Diện trên ổ mắt */}
            <path d="M 200 205 Q 235 195 260 205" fill="none" stroke="#bae6fd" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 280 205 Q 305 195 340 205" fill="none" stroke="#bae6fd" strokeWidth="2.5" strokeLinecap="round" />

            {/* 3. Xương Thái Dương (Temporal Bone - 2 bên màng nhĩ) */}
            <path
              d="M 160 175 C 150 205, 155 240, 175 260 L 190 245 C 180 230, 180 200, 185 180 Z"
              fill="url(#temporalGrad)"
              stroke="#b45309"
              strokeWidth="1.5"
              className="cursor-pointer hover:opacity-100 opacity-90"
              onClick={() => setSelectedStructureIdx(0)}
            />
            <path
              d="M 380 175 C 390 205, 385 240, 365 260 L 350 245 C 360 230, 360 200, 355 180 Z"
              fill="url(#temporalGrad)"
              stroke="#b45309"
              strokeWidth="1.5"
              className="cursor-pointer hover:opacity-100 opacity-90"
              onClick={() => setSelectedStructureIdx(0)}
            />

            {/* 4. Hốc Mắt (Orbits - Trái & Phải) */}
            <g className="cursor-pointer" onClick={() => setSelectedStructureIdx(1)}>
              {/* Hốc mắt trái */}
              <ellipse cx="225" cy="225" rx="27" ry="24" fill="#090d16" stroke="#475569" strokeWidth="2.5" />
              <ellipse cx="225" cy="225" rx="23" ry="20" fill="#020617" />
              <circle cx="232" cy="228" r="4.5" fill="#1e293b" />
              <path d="M 220 212 Q 228 210 238 214" stroke="#64748b" strokeWidth="1.5" fill="none" />

              {/* Hốc mắt phải */}
              <ellipse cx="315" cy="225" rx="27" ry="24" fill="#090d16" stroke="#475569" strokeWidth="2.5" />
              <ellipse cx="315" cy="225" rx="23" ry="20" fill="#020617" />
              <circle cx="308" cy="228" r="4.5" fill="#1e293b" />
              <path d="M 320 212 Q 312 210 302 214" stroke="#64748b" strokeWidth="1.5" fill="none" />
            </g>

            {/* 5. Xương Mũi & Hốc Mũi (Nasal Bones & Piriform Aperture) */}
            <g className="cursor-pointer" onClick={() => setSelectedStructureIdx(1)}>
              {/* Xương chính mũi (Nasal bridge) */}
              <polygon points="263,202 277,202 279,235 261,235" fill="url(#nasalGrad)" stroke="#9d174d" strokeWidth="1.5" />
              <line x1="270" y1="202" x2="270" y2="235" stroke="#fbcfe8" strokeWidth="1" />

              {/* Hốc mũi hình quả lê (Piriform Aperture) */}
              <path
                d="M 270 236 C 263 245, 256 265, 260 274 C 265 278, 275 278, 280 274 C 284 265, 277 245, 270 236 Z"
                fill="#020617"
                stroke="#475569"
                strokeWidth="2"
              />
              {/* Vách ngăn mũi (Vomer / Nasal Septum) */}
              <line x1="270" y1="238" x2="270" y2="273" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
              <ellipse cx="265" cy="265" rx="3.5" ry="5.5" fill="#0f172a" />
              <ellipse cx="275" cy="265" rx="3.5" ry="5.5" fill="#0f172a" />
            </g>

            {/* 6. Xương Gò Má (Zygomatic Bones) */}
            <g className="cursor-pointer" onClick={() => setSelectedStructureIdx(1)}>
              {/* Gò má trái */}
              <path
                d="M 178 225 C 172 245, 176 265, 196 270 C 205 270, 210 255, 206 242 C 200 230, 185 220, 178 225 Z"
                fill="url(#zygomaticGrad)"
                stroke="#6b21a8"
                strokeWidth="1.5"
                className="hover:opacity-100 opacity-90"
              />
              {/* Cung gò má nối thái dương */}
              <path d="M 166 220 Q 155 240 178 250" fill="none" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" />

              {/* Gò má phải */}
              <path
                d="M 362 225 C 368 245, 364 265, 344 270 C 335 270, 330 255, 334 242 C 340 230, 355 220, 362 225 Z"
                fill="url(#zygomaticGrad)"
                stroke="#6b21a8"
                strokeWidth="1.5"
                className="hover:opacity-100 opacity-90"
              />
              {/* Cung gò má nối thái dương */}
              <path d="M 374 220 Q 385 240 362 250" fill="none" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" />
            </g>

            {/* 7. Xương Hàm Trên (Maxilla) & Răng Hàm Trên */}
            <g className="cursor-pointer" onClick={() => setSelectedStructureIdx(1)}>
              <path
                d="M 215 260 C 235 255, 305 255, 325 260 L 325 295 Q 270 305 215 295 Z"
                fill="url(#maxillaGrad)"
                stroke="#047857"
                strokeWidth="1.8"
                className="hover:opacity-100 opacity-90"
              />
              {/* Cung răng trên (Maxillary Teeth Row) */}
              <rect x="228" y="293" width="84" height="14" rx="3" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.2" />
              {/* Răng trên cá nhân */}
              <line x1="239" y1="293" x2="239" y2="307" stroke="#94a3b8" strokeWidth="1.2" />
              <line x1="249" y1="293" x2="249" y2="307" stroke="#94a3b8" strokeWidth="1.2" />
              <line x1="259" y1="293" x2="259" y2="307" stroke="#94a3b8" strokeWidth="1.2" />
              <line x1="270" y1="293" x2="270" y2="307" stroke="#64748b" strokeWidth="1.5" />
              <line x1="281" y1="293" x2="281" y2="307" stroke="#94a3b8" strokeWidth="1.2" />
              <line x1="291" y1="293" x2="291" y2="307" stroke="#94a3b8" strokeWidth="1.2" />
              <line x1="301" y1="293" x2="301" y2="307" stroke="#94a3b8" strokeWidth="1.2" />
            </g>

            {/* 8. Xương Hàm Dưới (Mandible) & Cằm & Răng Hàm Dưới */}
            <g className="cursor-pointer" onClick={() => setSelectedStructureIdx(2)}>
              {/* Thân và ngành hàm dưới */}
              <path
                d="M 195 290 L 205 345 C 215 375, 235 385, 270 385 C 305 385, 325 375, 335 345 L 345 290 C 335 298, 325 310, 310 310 C 290 310, 270 315, 270 315 C 270 315, 250 310, 230 310 C 215 310, 205 298, 195 290 Z"
                fill="url(#mandibleGrad)"
                stroke="#c2410c"
                strokeWidth="2.2"
                className="hover:opacity-100 opacity-95"
              />
              {/* Cung răng dưới (Mandibular Teeth Row) */}
              <rect x="233" y="307" width="74" height="13" rx="3" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.2" />
              <line x1="243" y1="307" x2="243" y2="320" stroke="#94a3b8" strokeWidth="1.2" />
              <line x1="252" y1="307" x2="252" y2="320" stroke="#94a3b8" strokeWidth="1.2" />
              <line x1="261" y1="307" x2="261" y2="320" stroke="#94a3b8" strokeWidth="1.2" />
              <line x1="270" y1="307" x2="270" y2="320" stroke="#64748b" strokeWidth="1.5" />
              <line x1="279" y1="307" x2="279" y2="320" stroke="#94a3b8" strokeWidth="1.2" />
              <line x1="288" y1="307" x2="288" y2="320" stroke="#94a3b8" strokeWidth="1.2" />
              <line x1="297" y1="307" x2="297" y2="320" stroke="#94a3b8" strokeWidth="1.2" />

              {/* Lồi củ cằm (Mental protuberance) & Lỗ cằm (Mental foramen) */}
              <path d="M 255 365 Q 270 375 285 365" stroke="#fed7aa" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <circle cx="235" cy="340" r="2.5" fill="#7c2d12" />
              <circle cx="305" cy="340" r="2.5" fill="#7c2d12" />
            </g>
          </g>

          {/* Interactive Medical Callouts & Label Pinpoints */}
          {showLabels && (
            <g className="transition-opacity duration-300">
              {/* 1. Xương Trán (Frontal Bone) */}
              <g className="cursor-pointer group" onClick={() => setSelectedStructureIdx(0)}>
                <line x1="240" y1="170" x2="90" y2="130" stroke="#0ea5e9" strokeWidth="1.8" strokeDasharray="3 3" />
                <circle cx="240" cy="170" r="4.5" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                <rect x="15" y="114" width="85" height="30" rx="8" fill="#0f172a" stroke="#0ea5e9" strokeWidth="1.2" />
                <text x="57" y="133" fill="#e0f2fe" fontSize="10.5" fontWeight="bold" textAnchor="middle">Xương Trán</text>
              </g>

              {/* 2. Xương Đỉnh (Parietal Bone) */}
              <g className="cursor-pointer group" onClick={() => setSelectedStructureIdx(0)}>
                <line x1="330" y1="95" x2="450" y2="70" stroke="#6366f1" strokeWidth="1.8" strokeDasharray="3 3" />
                <circle cx="330" cy="95" r="4.5" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" />
                <rect x="440" y="54" width="85" height="30" rx="8" fill="#0f172a" stroke="#6366f1" strokeWidth="1.2" />
                <text x="482" y="73" fill="#e0e7ff" fontSize="10.5" fontWeight="bold" textAnchor="middle">Xương Đỉnh</text>
              </g>

              {/* 3. Hốc Mắt (Orbit) */}
              <g className="cursor-pointer group" onClick={() => setSelectedStructureIdx(1)}>
                <line x1="225" y1="225" x2="85" y2="210" stroke="#38bdf8" strokeWidth="1.8" strokeDasharray="3 3" />
                <circle cx="225" cy="225" r="4.5" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                <rect x="15" y="195" width="80" height="30" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.2" />
                <text x="55" y="214" fill="#f0f9ff" fontSize="10.5" fontWeight="bold" textAnchor="middle">Hốc Mắt</text>
              </g>

              {/* 4. Xương Gò Má (Zygomatic Bone) */}
              <g className="cursor-pointer group" onClick={() => setSelectedStructureIdx(1)}>
                <line x1="355" y1="245" x2="445" y2="225" stroke="#a855f7" strokeWidth="1.8" strokeDasharray="3 3" />
                <circle cx="355" cy="245" r="4.5" fill="#9333ea" stroke="#ffffff" strokeWidth="2" />
                <rect x="435" y="210" width="92" height="30" rx="8" fill="#0f172a" stroke="#a855f7" strokeWidth="1.2" />
                <text x="481" y="229" fill="#fae8ff" fontSize="10.5" fontWeight="bold" textAnchor="middle">Xương Gò Má</text>
              </g>

              {/* 5. Xương Mũi & Hốc Mũi */}
              <g className="cursor-pointer group" onClick={() => setSelectedStructureIdx(1)}>
                <line x1="270" y1="255" x2="95" y2="275" stroke="#ec4899" strokeWidth="1.8" strokeDasharray="3 3" />
                <circle cx="270" cy="255" r="4.5" fill="#db2777" stroke="#ffffff" strokeWidth="2" />
                <rect x="15" y="260" width="88" height="30" rx="8" fill="#0f172a" stroke="#ec4899" strokeWidth="1.2" />
                <text x="59" y="279" fill="#fce7f3" fontSize="10.5" fontWeight="bold" textAnchor="middle">Xương Mũi</text>
              </g>

              {/* 6. Xương Hàm Trên (Maxilla) */}
              <g className="cursor-pointer group" onClick={() => setSelectedStructureIdx(1)}>
                <line x1="315" y1="280" x2="440" y2="295" stroke="#10b981" strokeWidth="1.8" strokeDasharray="3 3" />
                <circle cx="315" cy="280" r="4.5" fill="#059669" stroke="#ffffff" strokeWidth="2" />
                <rect x="430" y="280" width="98" height="30" rx="8" fill="#0f172a" stroke="#10b981" strokeWidth="1.2" />
                <text x="479" y="299" fill="#d1fae5" fontSize="10.5" fontWeight="bold" textAnchor="middle">Xương Hàm Trên</text>
              </g>

              {/* 7. Xương Hàm Dưới (Mandible) */}
              <g className="cursor-pointer group" onClick={() => setSelectedStructureIdx(2)}>
                <line x1="285" y1="365" x2="430" y2="375" stroke="#f97316" strokeWidth="1.8" strokeDasharray="3 3" />
                <circle cx="285" cy="365" r="4.5" fill="#ea580c" stroke="#ffffff" strokeWidth="2" />
                <rect x="420" y="360" width="108" height="30" rx="8" fill="#0f172a" stroke="#f97316" strokeWidth="1.2" />
                <text x="474" y="379" fill="#ffedd5" fontSize="10.5" fontWeight="bold" textAnchor="middle">Xương Hàm Dưới</text>
              </g>
            </g>
          )}
        </svg>
      );
    }

    // Spine (Cột sống)
    if (partCode === 'SPINE_SYSTEM' || part.category === 'spine') {
      return (
        <svg viewBox="0 0 500 420" className="w-full h-full select-none" preserveAspectRatio="xMidYMid meet">
          <pattern id="spineGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.8" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#spineGrid)" />

          {/* Cervical Section C1-C7 (Đoạn Cổ) */}
          <g className="cursor-pointer" onClick={() => setSelectedStructureIdx(0)}>
            <path d="M 235 50 Q 255 70 245 110" stroke="#0d9488" strokeWidth="16" strokeLinecap="round" fill="none" opacity="0.8" />
            <path d="M 235 50 Q 255 70 245 110" stroke="#e2e8f0" strokeWidth="12" strokeDasharray="4 6" strokeLinecap="round" fill="none" />
            <line x1="255" y1="75" x2="350" y2="75" stroke="#0d9488" strokeWidth="1.5" strokeDasharray="3 3" />
            <rect x="350" y="60" width="130" height="30" rx="6" fill="#0f172a" stroke="#0d9488" strokeWidth="1" />
            <text x="415" y="80" fill="#f8fafc" fontSize="10" fontWeight="bold" textAnchor="middle">7 Đốt sống Cổ (C1 - C7)</text>
          </g>

          {/* Thoracic Section T1-T12 (Đoạn Ngực) */}
          <g className="cursor-pointer" onClick={() => setSelectedStructureIdx(1)}>
            <path d="M 245 115 Q 220 180 250 240" stroke="#3b82f6" strokeWidth="20" strokeLinecap="round" fill="none" opacity="0.8" />
            <path d="M 245 115 Q 220 180 250 240" stroke="#e2e8f0" strokeWidth="15" strokeDasharray="5 7" strokeLinecap="round" fill="none" />
            <line x1="230" y1="175" x2="90" y2="175" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 3" />
            <rect x="25" y="160" width="130" height="30" rx="6" fill="#0f172a" stroke="#3b82f6" strokeWidth="1" />
            <text x="90" y="180" fill="#f8fafc" fontSize="10" fontWeight="bold" textAnchor="middle">12 Đốt Ngực (T1 - T12)</text>
          </g>

          {/* Lumbar Section L1-L5 (Đoạn Thắt lưng) */}
          <g className="cursor-pointer" onClick={() => setSelectedStructureIdx(2)}>
            <path d="M 250 245 Q 270 290 250 330" stroke="#f59e0b" strokeWidth="24" strokeLinecap="round" fill="none" opacity="0.8" />
            <path d="M 250 245 Q 270 290 250 330" stroke="#e2e8f0" strokeWidth="18" strokeDasharray="6 8" strokeLinecap="round" fill="none" />
            <line x1="265" y1="285" x2="355" y2="285" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />
            <rect x="350" y="270" width="135" height="30" rx="6" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" />
            <text x="417" y="290" fill="#f8fafc" fontSize="10" fontWeight="bold" textAnchor="middle">5 Đốt Thắt Lưng (L1 - L5)</text>
          </g>

          {/* Sacrum & Coccyx (Cùng Cụt) */}
          <g className="cursor-pointer" onClick={() => setSelectedStructureIdx(2)}>
            <polygon points="235,335 265,335 250,385" fill="#ef4444" stroke="#e2e8f0" strokeWidth="2" opacity="0.85" />
            <line x1="250" y1="365" x2="110" y2="365" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" />
            <rect x="40" y="350" width="125" height="30" rx="6" fill="#0f172a" stroke="#ef4444" strokeWidth="1" />
            <text x="102" y="370" fill="#f8fafc" fontSize="10" fontWeight="bold" textAnchor="middle">Xương Cùng & Cụt</text>
          </g>
        </svg>
      );
    }

    // Cardiovascular / Heart (Hệ tuần hoàn / Trái tim)
    if (systemId === 'CARDIOVASCULAR' || part.name_vi.toLowerCase().includes('tim') || part.name_vi.toLowerCase().includes('mạch')) {
      return (
        <svg viewBox="0 0 500 400" className="w-full h-full select-none" preserveAspectRatio="xMidYMid meet">
          <pattern id="heartGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.8" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#heartGrid)" />

          {/* Aorta & Major Vessels (Cung ĐM chủ & Thân ĐM Phổi) */}
          <path d="M 230 160 C 230 80, 290 80, 290 150" fill="none" stroke="#ef4444" strokeWidth="26" strokeLinecap="round" />
          <path d="M 210 160 L 210 100" fill="none" stroke="#3b82f6" strokeWidth="20" strokeLinecap="round" />
          <path d="M 270 85 L 270 55" fill="none" stroke="#ef4444" strokeWidth="12" strokeLinecap="round" />
          <path d="M 250 85 L 250 55" fill="none" stroke="#ef4444" strokeWidth="12" strokeLinecap="round" />

          {/* Heart Muscular Body */}
          <path
            d="M 180 150 C 140 190, 180 290, 260 340 C 330 280, 360 190, 310 150 C 270 140, 230 170, 180 150 Z"
            fill="#dc2626"
            stroke="#991b1b"
            strokeWidth="4"
            filter="drop-shadow(0 10px 15px rgba(220,38,38,0.3))"
          />

          {/* Left Ventricle & Right Ventricle division */}
          <path d="M 245 160 Q 255 240 260 335" stroke="#7f1d1d" strokeWidth="4" fill="none" />

          {/* Coronary Arteries (Động mạch vành) */}
          <path d="M 240 180 Q 215 220 200 260" stroke="#fca5a5" strokeWidth="3" fill="none" />
          <path d="M 255 200 Q 285 240 300 270" stroke="#fca5a5" strokeWidth="3" fill="none" />

          {showLabels && (
            <g>
              {/* Cung động mạch chủ */}
              <line x1="260" y1="80" x2="380" y2="80" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx="260" cy="80" r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
              <rect x="380" y="65" width="105" height="28" rx="6" fill="#0f172a" stroke="#ef4444" strokeWidth="1" />
              <text x="432" y="83" fill="#f8fafc" fontSize="10" fontWeight="bold" textAnchor="middle">Cung ĐM Chủ</text>

              {/* Tâm thất trái */}
              <line x1="290" y1="250" x2="390" y2="250" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx="290" cy="250" r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
              <rect x="390" y="235" width="95" height="28" rx="6" fill="#0f172a" stroke="#ef4444" strokeWidth="1" />
              <text x="437" y="253" fill="#f8fafc" fontSize="10" fontWeight="bold" textAnchor="middle">Tâm Thất Trái</text>

              {/* Tâm thất phải */}
              <line x1="210" y1="240" x2="90" y2="240" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx="210" cy="240" r="4" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
              <rect x="25" y="225" width="95" height="28" rx="6" fill="#0f172a" stroke="#3b82f6" strokeWidth="1" />
              <text x="72" y="243" fill="#f8fafc" fontSize="10" fontWeight="bold" textAnchor="middle">Tâm Thất Phải</text>
            </g>
          )}
        </svg>
      );
    }

    // Default High-tech Anatomy Vector Representation for any other organs/systems
    return (
      <svg viewBox="0 0 500 400" className="w-full h-full select-none" preserveAspectRatio="xMidYMid meet">
        <pattern id="genGrid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.8" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#genGrid)" />

        {/* Central Anatomical Silhouette */}
        <circle cx="250" cy="200" r="120" fill="none" stroke="#0d9488" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.4" className="animate-spin-slow" />
        <circle cx="250" cy="200" r="80" fill="rgba(13, 148, 136, 0.15)" stroke="#14b8a6" strokeWidth="2" />
        
        {/* Core anatomical representation */}
        <path
          d="M 210 160 Q 250 120 290 160 Q 330 200 290 250 Q 250 280 210 250 Q 170 200 210 160 Z"
          fill="#0f766e"
          stroke="#2dd4bf"
          strokeWidth="3"
          filter="drop-shadow(0 0 15px rgba(20,184,166,0.5))"
        />

        {/* Crosshair coordinate markers */}
        <line x1="120" y1="200" x2="380" y2="200" stroke="#0d9488" strokeWidth="1" strokeDasharray="2 4" opacity="0.6" />
        <line x1="250" y1="70" x2="250" y2="330" stroke="#0d9488" strokeWidth="1" strokeDasharray="2 4" opacity="0.6" />

        {/* Dynamic labels */}
        {part.structures.slice(0, 3).map((st, i) => {
          const yPos = 120 + i * 70;
          return (
            <g key={i} className="cursor-pointer" onClick={() => setSelectedStructureIdx(i)}>
              <line x1="250" y1={yPos} x2={370} y2={yPos} stroke="#2dd4bf" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx="250" cy={yPos} r="4" fill="#0d9488" stroke="#ffffff" strokeWidth="1.5" />
              <rect x="370" y={yPos - 14} width="115" height="28" rx="6" fill="#0f172a" stroke="#2dd4bf" strokeWidth="1" />
              <text x="427" y={yPos + 4} fill="#f8fafc" fontSize="10" fontWeight="bold" textAnchor="middle">
                {st.name.length > 16 ? st.name.slice(0, 15) + '…' : st.name}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-xl flex flex-col">
      {/* Top Controls Bar */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('diagram')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'diagram'
                ? 'bg-teal-600 text-white shadow-xs font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Sơ đồ Giải Phẫu</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('medical_photo')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'medical_photo'
                ? 'bg-teal-600 text-white shadow-xs font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Ảnh Y Khoa Chuẩn</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('xray')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'xray'
                ? 'bg-teal-600 text-white shadow-xs font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Mặt Cắt X-Quang</span>
          </button>
        </div>

        {/* Zoom & Labels Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowLabels(!showLabels)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
              showLabels
                ? 'bg-teal-950 text-teal-300 border-teal-700'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            {showLabels ? 'Ẩn chú thích' : 'Hiện chú thích'}
          </button>

          <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5">
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.max(0.8, prev - 0.2))}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-md cursor-pointer"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-slate-400 px-1.5">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.min(2.0, prev + 0.2))}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-md cursor-pointer"
              title="Phóng to"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-md cursor-pointer"
              title="Đặt lại zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Visual Display Stage */}
      <div className="relative h-64 sm:h-80 md:h-96 w-full flex items-center justify-center overflow-hidden bg-radial from-slate-900 to-slate-950 p-4">
        <motion.div
          animate={{ scale: zoomLevel }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          className="w-full h-full flex items-center justify-center"
        >
          {viewMode === 'diagram' && renderVectorDiagram()}

          {viewMode === 'medical_photo' && (
            <div className="relative w-full h-full flex items-center justify-center">
              {!imgError ? (
                <img
                  src={part.illustrationUrl}
                  alt={part.name_vi}
                  onError={() => setImgError(true)}
                  className="max-h-full max-w-full object-contain rounded-xl shadow-2xl border border-slate-800"
                />
              ) : (
                renderVectorDiagram()
              )}
            </div>
          )}

          {viewMode === 'xray' && (
            <div className="relative w-full h-full flex items-center justify-center filter invert contrast-125 hue-rotate-180 brightness-90">
              {renderVectorDiagram()}
            </div>
          )}
        </motion.div>

        {/* Floating Structure Info Badge when Clicked */}
        <AnimatePresence>
          {selectedStructureIdx !== null && part.structures[selectedStructureIdx] && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-auto sm:max-w-md bg-slate-900/95 backdrop-blur-md border border-teal-500/50 rounded-xl p-3 shadow-2xl text-white z-20 space-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-teal-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>{part.structures[selectedStructureIdx].name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStructureIdx(null)}
                  className="text-slate-400 hover:text-white text-xs px-1"
                >
                  ✕
                </button>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {part.structures[selectedStructureIdx].detail}
              </p>
              {onAskAI && (
                <button
                  type="button"
                  onClick={() => onAskAI(`Phân tích giải phẫu và ý nghĩa lâm sàng của "${part.structures[selectedStructureIdx].name}" thuộc ${part.name_vi}`)}
                  className="text-[10px] text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 pt-0.5 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Hỏi Bác sĩ AI về cấu trúc này</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom overlay badge */}
        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-800 text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-teal-400" />
          <span>{part.name_vi} • {part.name_latin || part.name_en}</span>
        </div>
      </div>
    </div>
  );
}
