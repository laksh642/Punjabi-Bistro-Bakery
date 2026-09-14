import React from 'react';

interface PunjabiBistroLogoProps {
  className?: string;
  size?: number | string;
  alt?: string;
}

export const PunjabiBistroLogo: React.FC<PunjabiBistroLogoProps> = ({
  className = 'w-12 h-12',
  size,
  alt = 'Punjabi Bistro & Bakery - Only For Foodies',
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <img
      src="/logoo.png"
      alt={alt}
      className={`${className} object-contain rounded-full shadow-xs flex-shrink-0 select-none`}
      style={style}
      loading="eager"
      onError={(e) => {
        // Fallback safety if image is loading
        const target = e.currentTarget;
        target.onerror = null;
      }}
    />
  );
};
