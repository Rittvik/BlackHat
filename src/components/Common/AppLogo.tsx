import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: number;
}

export const AppLogo: React.FC<AppLogoProps> = ({ className = 'w-6 h-6', size }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 800 800" 
      className={className}
      style={size ? { width: `${size}px`, height: `${size}px` } : undefined}
    >
      <defs>
        {/* Background Gradient */}
        <radialGradient id="bhBgGrad" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#0f1724" />
          <stop offset="60%" stopColor="#070a0f" />
          <stop offset="100%" stopColor="#030508" />
        </radialGradient>

        {/* Cyan Glow Filter */}
        <filter id="bhCyanGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Intense Node Glow */}
        <filter id="bhNodeGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Hat Body Gradient */}
        <linearGradient id="bhHatLeftFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#141c28" />
          <stop offset="100%" stopColor="#090d14" />
        </linearGradient>

        <linearGradient id="bhHatRightFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0c1929" />
          <stop offset="100%" stopColor="#06101c" />
        </linearGradient>

        {/* Cyan Gradient */}
        <linearGradient id="bhCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#70f3ff" />
          <stop offset="100%" stopColor="#00a8ff" />
        </linearGradient>
      </defs>

      {/* Dark Canvas Background */}
      <rect width="800" height="800" fill="url(#bhBgGrad)" rx="32" />

      {/* Ambient Central Cyber Glow */}
      <circle cx="430" cy="400" r="220" fill="#00f0ff" opacity="0.04" filter="url(#bhCyanGlow)" />

      <g transform="translate(0, 30)">
        {/* Base Fills */}
        <path d="M 400,210 L 320,230 L 290,390 L 400,410 Z" fill="url(#bhHatLeftFill)" stroke="#223247" strokeWidth="1.5" />
        <path d="M 400,210 L 450,225 L 515,310 L 490,410 L 400,410 Z" fill="url(#bhHatRightFill)" stroke="#00507a" strokeWidth="1.5" />
        <path d="M 230,470 Q 180,480 220,530 Q 300,590 400,600 Q 550,580 630,480 Q 560,530 400,545 Q 270,540 230,470 Z" fill="#060b12" opacity="0.85" />

        {/* Left Half: Minimalist White Hat Geometry */}
        <path d="M 400,210 L 330,228 L 312,280 L 348,275 L 290,395 L 400,415" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 330,228 L 370,265 L 400,270" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 400,600 C 290,595 210,560 170,515 C 145,487 165,465 210,465 C 265,465 340,480 400,490" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
        <path d="M 292,385 C 330,405 365,412 400,415" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
        <path d="M 285,420 C 325,442 365,450 400,453" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />

        {/* Center Division Line */}
        <line x1="400" y1="210" x2="400" y2="600" stroke="#1d2e42" strokeWidth="2" strokeDasharray="4,6" />

        {/* Right Half: Multi-Agent Network & Circuit Grid */}
        <path d="M 400,210 L 460,228 L 515,290 L 500,405 L 400,415" fill="none" stroke="url(#bhCyanGrad)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" filter="url(#bhCyanGlow)" />
        <path d="M 400,490 C 475,502 555,490 620,440 L 645,455 L 590,520 C 530,570 460,595 400,600" fill="none" stroke="url(#bhCyanGrad)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" filter="url(#bhCyanGlow)" />
        <path d="M 400,453 C 445,456 495,445 530,420" fill="none" stroke="#00f0ff" strokeWidth="3.5" strokeLinecap="round" opacity="0.9" />

        {/* Network Lines */}
        <g stroke="#00f0ff" strokeLinecap="round" strokeLinejoin="round" filter="url(#bhCyanGlow)">
          <line x1="400" y1="270" x2="445" y2="295" strokeWidth="3" />
          <line x1="445" y1="295" x2="480" y2="265" strokeWidth="2.5" />
          <line x1="445" y1="295" x2="475" y2="350" strokeWidth="3.5" />
          <line x1="475" y1="350" x2="425" y2="370" strokeWidth="2.5" />
          <line x1="425" y1="370" x2="425" y2="430" strokeWidth="2.5" />
          <line x1="475" y1="350" x2="540" y2="330" strokeWidth="3" />
          <line x1="540" y1="330" x2="565" y2="375" strokeWidth="2" />
          <line x1="475" y1="350" x2="510" y2="415" strokeWidth="2.5" />
          <line x1="510" y1="415" x2="465" y2="435" strokeWidth="2.5" />
          <line x1="510" y1="415" x2="550" y2="455" strokeWidth="2" />
          <polyline points="465,435 465,475 510,485" strokeWidth="2" fill="none" opacity="0.7" />
          <polyline points="425,430 425,465 440,480" strokeWidth="2" fill="none" opacity="0.7" />
        </g>

        {/* Multi-Agent Nodes */}
        <g filter="url(#bhNodeGlow)">
          {/* Orchestrator Node */}
          <circle cx="475" cy="350" r="9" fill="#FFFFFF" stroke="#00f0ff" strokeWidth="3.5" />
          <circle cx="475" cy="350" r="16" fill="none" stroke="#00f0ff" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.8" />

          {/* Worker Agent Nodes */}
          <circle cx="445" cy="295" r="6" fill="#00f0ff" stroke="#FFFFFF" strokeWidth="2" />
          <circle cx="480" cy="265" r="5" fill="#00f0ff" />
          <circle cx="540" cy="330" r="6.5" fill="#00f0ff" stroke="#FFFFFF" strokeWidth="2" />
          <circle cx="565" cy="375" r="4.5" fill="#70f3ff" />
          <circle cx="425" cy="370" r="5" fill="#00f0ff" />
          <circle cx="425" cy="430" r="4.5" fill="#70f3ff" />
          <circle cx="510" cy="415" r="5.5" fill="#00f0ff" stroke="#FFFFFF" strokeWidth="1.5" />
          <circle cx="465" cy="435" r="4" fill="#70f3ff" />
          <circle cx="550" cy="455" r="4" fill="#00f0ff" />

          {/* Floating Task Signals */}
          <circle cx="555" cy="280" r="3" fill="#70f3ff" opacity="0.9" />
          <circle cx="580" cy="315" r="4" fill="#00f0ff" opacity="0.8" />
          <circle cx="595" cy="355" r="2.5" fill="#70f3ff" opacity="0.7" />
          <circle cx="575" cy="410" r="3" fill="#00f0ff" opacity="0.6" />
          <circle cx="515" cy="245" r="2.5" fill="#70f3ff" opacity="0.8" />
        </g>

        <polygon points="565,510 595,490 620,505 590,528" fill="#00f0ff" opacity="0.25" />
      </g>
    </svg>
  );
};
