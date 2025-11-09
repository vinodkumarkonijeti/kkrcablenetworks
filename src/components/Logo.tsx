import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  /**
   * When true the image will fill its container (useful for circular containers).
   * It will use `object-cover` and full width/height instead of fixed pixel size.
   */
  fill?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 40, fill = false }) => {
  const style: React.CSSProperties | undefined = fill
    ? undefined
    : ({ width: size, height: size } as React.CSSProperties);

  const combinedClass = fill
    ? `w-full h-full object-cover ${className}`
    : `inline-block object-contain ${className}`;

  return (
    <img
      src="/logo.jpg"
      alt="KKR Logo"
      style={style}
      className={combinedClass}
      onError={(e) => {
        // fallback to svg if jpg not available
        const target = e.currentTarget as HTMLImageElement;
        if (target.src.indexOf('/logo.svg') === -1) target.src = '/logo.svg';
      }}
    />
  );
};

export default Logo;
