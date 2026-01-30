import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = "md", showText = true }) => {
  const sizes = {
    sm: { icon: "w-8 h-8", text: "text-lg" },
    md: { icon: "w-12 h-12", text: "text-2xl" },
    lg: { icon: "w-20 h-20", text: "text-4xl" },
    xl: { icon: "w-32 h-32", text: "text-5xl" }
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className={`${sizes[size].icon} relative flex items-center justify-center`}>
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full drop-shadow-md"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Swirling Rings - mimicking the image's dynamic lens look */}
          <path 
            d="M50 5C74.8528 5 95 25.1472 95 50C95 74.8528 74.8528 95 50 95C25.1472 95 5 74.8528 5 50" 
            stroke="url(#ring-grad-1)" 
            strokeWidth="3" 
            strokeLinecap="round"
          />
          <path 
            d="M50 15C69.33 15 85 30.67 85 50C85 69.33 69.33 85 50 85" 
            stroke="url(#ring-grad-2)" 
            strokeWidth="8" 
            strokeLinecap="round"
          />
          
          {/* Main Iris Body */}
          <circle cx="50" cy="50" r="28" fill="url(#eye-iris-grad)" />
          
          {/* Internal Lens Reflection */}
          <circle cx="42" cy="40" r="10" fill="url(#reflect-grad)" fillOpacity="0.6" />
          <circle cx="38" cy="36" r="4" fill="white" fillOpacity="0.5" />

          <defs>
            <linearGradient id="ring-grad-1" x1="5" y1="5" x2="95" y2="95" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0ea5e9" />
              <stop offset="1" stopColor="#1e40af" />
            </linearGradient>
            <linearGradient id="ring-grad-2" x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" />
              <stop offset="1" stopColor="#1d4ed8" />
            </linearGradient>
            <radialGradient id="eye-iris-grad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(50 50) rotate(90) scale(28)">
              <stop stopColor="#1e40af" />
              <stop offset="0.7" stopColor="#0369a1" />
              <stop offset="1" stopColor="#0c4a6e" />
            </radialGradient>
            <radialGradient id="reflect-grad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(42 40) rotate(90) scale(10)">
              <stop stopColor="#7dd3fc" />
              <stop offset="1" stopColor="transparent" />
            </radialGradient>
          </defs>
        </svg>
      </div>
      
      {showText && (
        <div className={`font-black tracking-tighter italic text-blue-900 ${sizes[size].text}`}>
          AA<span className="text-blue-600">2000</span>
        </div>
      )}
    </div>
  );
};

export default Logo;