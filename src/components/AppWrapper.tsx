"use client"

import { useState, useEffect } from 'react';
import { SplashScreen } from '@/components/SplashScreen';

export const AppWrapper = ({ children }: { children: React.ReactNode }) => {
  const [showSplash, setShowSplash] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      {children}
    </>
  );
};
