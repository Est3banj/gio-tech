// src/contexts/WhatsappNumberContext.tsx
import React, { useState, useEffect, type ReactNode } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { WhatsappNumberContext, DEFAULT_WHATSAPP_NUMBER } from './whatsapp-number-context';

interface WhatsappNumberProviderProps {
  children: ReactNode;
}

export const WhatsappNumberProvider: React.FC<WhatsappNumberProviderProps> = ({ children }) => {
  const [asesorWhatsappNumber, setAsesorWhatsappNumber] = useState(DEFAULT_WHATSAPP_NUMBER);
  const [asesorIdFromUrl, setAsesorIdFromUrl] = useState<string | null>(null);
  const location = useLocation();

  // Leer parámetro 'asesor' de la URL y persistir en localStorage
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const asesorId = params.get('asesor');

    if (asesorId) {
      setAsesorIdFromUrl(asesorId);
      localStorage.setItem('currentAsesorId', asesorId);
    } else {
      const storedAsesorId = localStorage.getItem('currentAsesorId');
      if (storedAsesorId && location.pathname !== '/') {
        setAsesorIdFromUrl(storedAsesorId);
      } else {
        setAsesorIdFromUrl(null);
        localStorage.removeItem('currentAsesorId');
      }
    }
  }, [location.search, location.pathname]);

  // Obtener número de WhatsApp del asesor desde Firestore
  useEffect(() => {
    if (asesorIdFromUrl) {
      const userDocRef = doc(db, "perfiles_publicos", asesorIdFromUrl);
      const unsub = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().whatsappNumber) {
          setAsesorWhatsappNumber(docSnap.data().whatsappNumber);
        } else {
          setAsesorWhatsappNumber(DEFAULT_WHATSAPP_NUMBER);
        }
      }, () => {
        setAsesorWhatsappNumber(DEFAULT_WHATSAPP_NUMBER);
      });
      return () => unsub();
    } else {
      setAsesorWhatsappNumber(DEFAULT_WHATSAPP_NUMBER);
    }
  }, [asesorIdFromUrl]);

  return (
    <WhatsappNumberContext.Provider value={asesorWhatsappNumber}>
      {children}
    </WhatsappNumberContext.Provider>
  );
};
