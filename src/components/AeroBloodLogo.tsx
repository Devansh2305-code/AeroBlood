import React from 'react';

interface AeroBloodLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  showText?: boolean;
}

export default function AeroBloodLogo({ className = '', size = 'md', showText = false }: AeroBloodLogoProps) {
  // Determine pixel sizes
  const getDimensions = () => {
    if (typeof size === 'number') return { width: size, height: size };
    switch (size) {
      case 'sm': return { width: 32, height: 32 };
      case 'lg': return { width: 64, height: 64 };
      case 'xl': return { width: 120, height: 120 };
      case 'md':
      default:
        return { width: 40, height: 40 };
    }
  };

  const { width, height } = getDimensions();

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Custom Vector SVG Logo Graphic */}
      <svg
        width={width}
        height={height}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-md select-none transition-transform duration-300 hover:scale-105"
      >
        <defs>
          {/* Main Blood Droplet Gradients */}
          <radialGradient id="dropletGrad" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#ff4d4d" />
            <stop offset="60%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#991b1b" />
          </radialGradient>
          
          <linearGradient id="dropletGloss" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.6" />
            <stop offset="100%" stopColor="white" stopOpacity="0.0" />
          </linearGradient>

          {/* Aerodynamic Outer Wings / Network Connection Gradients */}
          <linearGradient id="wingGradLeft" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#475569" stopOpacity="0.3" />
          </linearGradient>

          <linearGradient id="wingGradRight" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dc2626" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#1e293b" stopOpacity="0.4" />
          </linearGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Glow effect for background */}
        <circle cx="50" cy="55" r="30" fill="#dc2626" opacity="0.12" filter="url(#glow)" />

        {/* Outer Aerodynamic Network Ring (Left Wing / Path) */}
        <path
          d="M 50 12 C 30 12 12 35 12 55 C 12 70 25 88 50 88"
          stroke="url(#wingGradLeft)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="4 2"
          className="opacity-70"
        />

        {/* Outer Aerodynamic Network Ring (Right Wing / Path) */}
        <path
          d="M 50 12 C 70 12 88 35 88 55 C 88 70 75 88 50 88"
          stroke="url(#wingGradRight)"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Network Node Dots along the rings */}
        <circle cx="21" cy="32" r="3.5" fill="#ef4444" />
        <circle cx="79" cy="32" r="3.5" fill="#ef4444" />
        <circle cx="12" cy="55" r="4.5" fill="#475569" />
        <circle cx="88" cy="55" r="4.5" fill="#dc2626" />
        <circle cx="28" cy="80" r="3" fill="#94a3b8" />
        <circle cx="72" cy="80" r="3" fill="#dc2626" />

        {/* Connecting vector link lines to central droplet */}
        <line x1="21" y1="32" x2="38" y2="44" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="2 2" className="opacity-60" />
        <line x1="79" y1="32" x2="62" y2="44" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="2 2" className="opacity-60" />
        <line x1="12" y1="55" x2="34" y2="60" stroke="#cbd5e1" strokeWidth="1.5" className="opacity-40" />
        <line x1="88" y1="55" x2="66" y2="60" stroke="#fca5a5" strokeWidth="1.5" className="opacity-50" />

        {/* Central Blood Droplet (Glossy / 3D-feeling) */}
        <path
          d="M 50 20 C 50 20 28 48 28 62 C 28 74 38 84 50 84 C 62 84 72 74 72 62 C 72 48 50 20 50 20 Z"
          fill="url(#dropletGrad)"
          className="drop-shadow-lg"
        />

        {/* Highlight Curve on Droplet for 3D realism */}
        <path
          d="M 50 26 C 47 31 32 50 32 60 C 32 63 34 65 37 65 C 34 60 48 35 50 26 Z"
          fill="url(#dropletGloss)"
        />

        {/* White core reflection dot */}
        <circle cx="43" cy="50" r="2.5" fill="white" opacity="0.8" />
        
        {/* Heart beat pulse line on bottom */}
        <path
          d="M 40 70 L 46 70 L 48 64 L 51 76 L 53 68 L 55 70 L 60 70"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-90"
        />
      </svg>

      {/* Conditional branding labels */}
      {showText && (
        <div className="flex flex-col select-none">
          <h1 className="font-display font-black text-slate-900 tracking-tight leading-none text-base">
            AEROBLOOD
          </h1>
          <span className="text-[10px] text-slate-500 font-medium tracking-wide">
            Connecting Blood. Saving Lives.
          </span>
        </div>
      )}
    </div>
  );
}
