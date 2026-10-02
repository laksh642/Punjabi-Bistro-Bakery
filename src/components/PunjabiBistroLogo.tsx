import React from 'react';
import { useStore } from '../context/StoreContext';

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
  const { businessSettings } = useStore();
  const style = size ? { width: size, height: size } : undefined;
  
  const [hasError, setHasError] = React.useState(false);
  
  // Custom logo from database. If explicitly set to empty string (''), the logo has been removed by admin.
  const rawLogoUrl = businessSettings?.logoUrl !== undefined ? businessSettings.logoUrl : '/logoo.png';
  const logoUrl = (rawLogoUrl || '').trim();

  React.useEffect(() => {
    setHasError(false);
  }, [logoUrl]);

  if (!logoUrl || hasError) {
    // When website logo has been removed by administrator or failed to load
    return (
      <div
        id={id}
        style={style}
        className={`${className} bg-emerald-900 text-amber-300 font-serif font-black flex items-center justify-center rounded-full aspect-square shadow-xs shrink-0 select-none border border-emerald-700/60`}
        title={alt}
      >
        <span className="text-xs sm:text-sm tracking-wider font-bold">PB</span>
      </div>
    );
  }

  return (
    <img
      id={id}
      src={logoUrl}
      alt={alt}
      referrerPolicy="no-referrer"
      className={`${className} object-cover aspect-square rounded-full shadow-xs flex-shrink-0 select-none`}
      style={style}
      loading="eager"
      onError={() => {
        setHasError(true);
      }}
    />
  );
};

