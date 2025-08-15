import React from 'react';
import { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useDesign } from '@/contexts/DesignContext';

interface SkeletonProviderProps {
  children: React.ReactNode;
}

export const SkeletonProvider: React.FC<SkeletonProviderProps> = ({ children }) => {
  const { design } = useDesign();
  
  return (
    <SkeletonTheme 
      baseColor="#f3f4f6" 
      highlightColor="#e5e7eb"
      borderRadius="0.5rem"
    >
      {children}
    </SkeletonTheme>
  );
};
