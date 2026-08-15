// src/contexts/whatsapp-number-context.ts
import { createContext, useContext } from 'react';

export const DEFAULT_WHATSAPP_NUMBER = '573223652569';

export const WhatsappNumberContext = createContext<string | null>(null);

export const useWhatsappNumber = (): string => {
  const context = useContext(WhatsappNumberContext);
  if (!context) {
    throw new Error('useWhatsappNumber must be used within WhatsappNumberProvider');
  }
  return context;
};
