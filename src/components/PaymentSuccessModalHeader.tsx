import React from 'react';
import { Check } from 'lucide-react';

interface PaymentSuccessModalHeaderProps {
  title?: string;
  subtitle?: string;
}

export function PaymentSuccessModalHeader({
  title = 'Bill Payment Successful',
  subtitle = 'Your bill payment has been processed Successful. Enjoy uninterrupted service!',
}: PaymentSuccessModalHeaderProps) {
  return (
    <div className="space-y-4 pb-2">
      {/* Top Header Logos Row (Matching Screenshot: bob World Internet + Bank of Baroda on Left, B ASSURED on Right) */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        {/* Left: bob World Internet & Bank of Baroda */}
        <div className="flex items-center space-x-3 sm:space-x-5">
          {/* bob World Internet Logo */}
          <div className="flex items-center">
            <div className="flex flex-col leading-none">
              <span className="text-[#F26522] font-black text-lg sm:text-xl tracking-tighter">bob</span>
              <span className="text-[#F26522] text-[8px] sm:text-[9px] font-semibold -mt-0.5 tracking-tight">World</span>
            </div>
            <div className="bg-[#F26522] text-white text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md italic ml-1 shadow-2xs">
              Internet
            </div>
          </div>

          {/* Bank of Baroda Logo (Icon + Hindi + English + Tagline) */}
          <div className="flex items-center space-x-1.5 border-l border-gray-200 pl-3 sm:pl-4">
            {/* Bank of Baroda Sun Emblem SVG */}
            <svg
              viewBox="0 0 100 100"
              className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 text-[#F26522]"
              fill="currentColor"
            >
              {/* Central stylized dual crescents forming the Baroda Sun */}
              <path d="M50 15 C30 15 15 30 15 50 C15 70 30 85 50 85 C60 85 69 81 76 74 L69 68 C64 73 57 77 50 77 C35 77 23 65 23 50 C23 35 35 23 50 23 C57 23 64 27 69 32 L76 26 C69 19 60 15 50 15 Z" />
              <path d="M50 29 C38 29 29 38 29 50 C29 62 38 71 50 71 C55 71 60 69 64 65 L58 60 C56 62 53 63 50 63 C43 63 37 57 37 50 C37 43 43 37 50 37 C53 37 56 38 58 40 L64 35 C60 31 55 29 50 29 Z" />
              {/* Radiating Sun Rays */}
              <rect x="80" y="46" width="12" height="8" rx="2" />
              <rect x="76" y="27" width="11" height="7" rx="2" transform="rotate(30 76 27)" />
              <rect x="76" y="65" width="11" height="7" rx="2" transform="rotate(-30 76 65)" />
              <rect x="62" y="14" width="10" height="7" rx="2" transform="rotate(60 62 14)" />
              <rect x="62" y="78" width="10" height="7" rx="2" transform="rotate(-60 62 78)" />
            </svg>

            <div className="flex flex-col leading-none">
              <span className="text-[#F26522] font-bold text-[10px] sm:text-xs">बैंक ऑफ़ बड़ौदा</span>
              <span className="text-[#F26522] font-extrabold text-[11px] sm:text-[13px] tracking-tight -mt-0.5">
                Bank of Baroda
              </span>
              <span className="text-[#F26522] text-[6px] sm:text-[7px] tracking-wider uppercase font-medium">
                India&apos;s International Bank
              </span>
            </div>
          </div>
        </div>

        {/* Right: B ASSURED Circular Emblem Badge */}
        <div className="flex items-center">
          <svg viewBox="0 0 100 100" className="w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0" id="b-assured-logo">
            {/* Outer Blue Circle */}
            <circle cx="50" cy="50" r="46" fill="#FFFFFF" stroke="#004B87" strokeWidth="3.5" />
            {/* Inner Thin Ring */}
            <circle cx="50" cy="50" r="40" fill="none" stroke="#004B87" strokeWidth="0.8" opacity="0.5" />

            {/* Stylized Bharat Connect 'B' Monogram */}
            <g fill="#004B87">
              <path d="M 37 25 L 53 25 C 60 25 65 29 65 35 C 65 39.5 62 43 57 44.5 C 63 46 67 50.5 67 56.5 C 67 64 61 68 53 68 L 37 68 Z M 44 32 L 44 42 L 52 42 C 55.5 42 58 39.8 58 37 C 58 34.2 55.5 32 52 32 Z M 44 49 L 44 61 L 52.5 61 C 56.5 61 59.5 58.5 59.5 55 C 59.5 51.5 56.5 49 52.5 49 Z" />
              {/* Orange Dot accent */}
              <circle cx="68" cy="27" r="3.5" fill="#F26522" />
            </g>

            {/* Orange Curved ASSURED text around bottom */}
            <path id="assuredArc" d="M 23 74 A 34 34 0 0 0 77 74" fill="none" />
            <text fill="#F26522" fontSize="9" fontWeight="900" letterSpacing="2">
              <textPath href="#assuredArc" startOffset="50%" textAnchor="middle">
                ASSURED
              </textPath>
            </text>
          </svg>
        </div>
      </div>

      {/* Center Success Checkmark & Title */}
      <div className="text-center space-y-1 pt-1">
        <div className="w-8 h-8 rounded-full bg-[#10b981] text-white flex items-center justify-center mx-auto shadow-2xs">
          <Check className="w-5 h-5 stroke-[3]" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          {title}
        </h2>
        <p className="text-xs text-gray-600">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
