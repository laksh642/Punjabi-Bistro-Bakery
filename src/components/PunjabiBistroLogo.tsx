import React from 'react';

interface PunjabiBistroLogoProps {
  id?: string;
  className?: string;
  size?: number | string;
  alt?: string;
}

export const PunjabiBistroLogo: React.FC<PunjabiBistroLogoProps> = ({
  id,
  className = 'w-12 h-12',
  size,
  alt = 'Punjabi Bistro & Bakery - Only For Foodies',
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <img
      id={id}
      src="/logoo.png"
      alt={alt}
      referrerPolicy="no-referrer"
      className={`${className} object-cover aspect-square rounded-full shadow-xs flex-shrink-0 select-none`}
      style={style}
      loading="eager"
      onError={(e) => {
        // Fallback safety if image is loading
        const target = e.currentTarget;
        target.onerror = null;
        if (!target.src.includes('1789046230843.png')) {
          target.src = '/1789046230843.png';
        }
      }}
    />
  );
};
