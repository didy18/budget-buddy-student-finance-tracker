"use client"

import { useState, useEffect } from 'react';
import { SplashScreen } from '@/components/SplashScreen';

export const AppWrapper = ({ children }: { children: React.ReactNode }) => {
  const [showSplash, setShowSplash] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check if splash has been shown before
    const hasSeenSplash = localStorage.getItem('budget-buddy-splash-shown');
    
    if (!hasSeenSplash) {
      setShowSplash(true);
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    // Mark splash as shown
    localStorage.setItem('budget-buddy-splash-shown', 'true');
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      {children}
    </>
  );
};