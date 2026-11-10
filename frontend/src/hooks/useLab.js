import { useContext } from 'react';
import { LabContext } from '../context/LabContext';

export function useLab() {
  const ctx = useContext(LabContext);
  if (!ctx) throw new Error('useLab deve ser usado dentro de <LabProvider>.');
  return ctx;
}
