import React from 'react';
import { CompanyBranding } from '../types/logistics';

interface BrandLogoProps {
  branding: CompanyBranding;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  branding,
  size = 'md',
  showSubtitle = true,
  className = ''
}) => {
  if (branding.customLogoUrl) {
    const customHeight = branding.logoHeightPx;
    const computedHeight = customHeight
      ? {
          sm: Math.round(customHeight * 0.7),
          md: customHeight,
          lg: Math.round(customHeight * 1.25),
          xl: Math.round(customHeight * 1.5)
        }[size]
      : undefined;

    const defaultHeightClass = {
      sm: 'h-8 max-w-[140px]',
      md: 'h-11 max-w-[180px]',
      lg: 'h-14 max-w-[220px]',
      xl: 'h-18 max-w-[260px]'
    }[size];

    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <img
          src={branding.customLogoUrl}
          alt={branding.companyName || 'Company Logo'}
          className={`${!computedHeight ? defaultHeightClass : ''} object-contain max-h-full transition-all`}
          style={computedHeight ? { height: `${computedHeight}px` } : undefined}
          referrerPolicy="no-referrer"
          loading="eager"
        />
        {showSubtitle && branding.companyName && (
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 dark:text-white tracking-tight leading-tight text-sm">
              {branding.companyName}
            </span>
            {branding.companySubtitle && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
                {branding.companySubtitle}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Exact reproduction of the Trilogi Global Logistics Partner logo from image.png
  const iconSizes = {
    sm: { box: 28, text: 'text-sm', sub: 'text-[9px]' },
    md: { box: 36, text: 'text-base', sub: 'text-[10px]' },
    lg: { box: 48, text: 'text-xl', sub: 'text-xs' },
    xl: { box: 56, text: 'text-2xl', sub: 'text-sm' }
  }[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Golden Swirl Vortex Sunburst Icon */}
      <svg
        width={iconSizes.box}
        height={iconSizes.box}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 text-amber-500"
      >
        <g stroke="currentColor" strokeWidth="4.5" strokeLinecap="round">
          {/* Radiant logarithmic spiral curved rays */}
          <path d="M50 20 C62 20 72 26 78 36 C80 40 80 46 76 50 C71 55 64 54 58 50 C52 46 48 42 48 35" stroke="#F59E0B" />
          <path d="M78 36 C84 46 84 58 78 70 C75 75 69 77 64 74 C59 70 59 62 61 55 C63 48 62 42 57 37" stroke="#D97706" />
          <path d="M78 70 C70 80 58 84 46 82 C40 81 36 76 37 70 C39 64 47 62 54 62 C61 62 67 59 70 53" stroke="#F59E0B" />
          <path d="M46 82 C34 80 24 72 20 60 C18 55 21 49 27 48 C33 48 38 54 41 60 C44 67 49 71 56 71" stroke="#EAB308" />
          <path d="M20 60 C16 48 18 36 26 26 C30 22 36 22 39 27 C42 32 39 40 35 46 C32 52 32 58 37 64" stroke="#F59E0B" />
          <path d="M26 26 C36 18 50 16 62 20 C67 22 69 28 66 33 C62 38 54 38 48 35 C42 32 35 34 31 39" stroke="#B45309" />
          {/* Inner core spiral */}
          <circle cx="50" cy="50" r="12" stroke="#F59E0B" strokeWidth="3" strokeDasharray="4 3" />
          <circle cx="50" cy="50" r="4" fill="#D97706" />
        </g>
      </svg>

      <div className="flex flex-col">
        <span className={`font-bold tracking-tight text-slate-900 dark:text-white leading-none ${iconSizes.text}`}>
          {branding.companyName}
        </span>
        {showSubtitle && (
          <span className={`text-slate-500 dark:text-slate-400 font-semibold tracking-tight leading-tight mt-0.5 ${iconSizes.sub}`}>
            {branding.companySubtitle}
          </span>
        )}
      </div>
    </div>
  );
};
