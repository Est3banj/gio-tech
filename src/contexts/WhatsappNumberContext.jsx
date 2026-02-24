// src/contexts/WhatsappNumberContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase'; // Asegúrate de que 'db' esté exportado desde firebase.js

const WhatsappNumberContext = createContext();

export const useWhatsappNumber = () => {
  return useContext(WhatsappNumberContext);
};

export const WhatsappNumberProvider = ({ children }) => {
  const defaultWhatsappNumber = '573223652569'; // Número general de la tienda
  const [asesorWhatsappNumber, setAsesorWhatsappNumber] = useState(defaultWhatsappNumber);
  const [asesorIdFromUrl, setAsesorIdFromUrl] = useState(null);

  // Este useEffect leerá el parámetro 'asesor' de la URL y lo persistirá
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const asesorId = params.get('asesor');

    // Si la URL tiene un asesorId, lo usamos y lo guardamos en localStorage
    if (asesorId) {
      setAsesorIdFromUrl(asesorId);
      localStorage.setItem('currentAsesorId', asesorId);
      // console.log("DEBUG [WhatsappContext]: Asesor ID de URL:", asesorId); // DEBUG
    }
    // Si no hay asesorId en la URL, pero estamos en la página principal,
    // debemos asegurarnos de usar el default y limpiar localStorage si no hay asesor.
    else {
      // Solo recupera de localStorage si NO estamos en la ruta raíz para asegurar el default en '/'
      const storedAsesorId = localStorage.getItem('currentAsesorId');
      if (storedAsesorId && window.location.pathname !== '/') {
        setAsesorIdFromUrl(storedAsesorId);
        // console.log("DEBUG [WhatsappContext]: Asesor ID de localStorage:", storedAsesorId); // DEBUG
      } else {
        setAsesorIdFromUrl(null); // Asegura que no haya un ID de asesor
        localStorage.removeItem('currentAsesorId'); // Limpia localStorage si volvemos a la raíz sin asesor
        // console.log("DEBUG [WhatsappContext]: No asesor ID en URL ni (recuperado de) localStorage para la ruta actual."); // DEBUG
      }
    }
  }, [window.location.search, window.location.pathname]); // Depende de la URL para re-evaluar

  // Este useEffect obtendrá el número de WhatsApp del asesor de Firestore
  useEffect(() => {
    if (asesorIdFromUrl) {
      const userDocRef = doc(db, "usuarios", asesorIdFromUrl);
      const unsub = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().whatsappNumber) {
          const number = docSnap.data().whatsappNumber;
          setAsesorWhatsappNumber(number);
          // console.log("DEBUG [WhatsappContext]: Número de asesor obtenido de Firestore:", number); // DEBUG
        } else {
          setAsesorWhatsappNumber(defaultWhatsappNumber); // Fallback al número de la tienda
          // console.warn(`DEBUG [WhatsappContext]: Asesor con ID ${asesorIdFromUrl} no encontrado o sin número. Usando número de la tienda.`); // DEBUG
        }
      }, (error) => {
        console.error("DEBUG [WhatsappContext]: Error al obtener número del asesor:", error);
        setAsesorWhatsappNumber(defaultWhatsappNumber); // Fallback en caso de error
      });
      return () => unsub(); // Limpiar listener
    } else {
      setAsesorWhatsappNumber(defaultWhatsappNumber); // Si no hay asesorId, usar el número de la tienda
    }
  }, [asesorIdFromUrl, defaultWhatsappNumber]); // Se re-ejecuta si asesorIdFromUrl cambia

  return (
    <WhatsappNumberContext.Provider value={asesorWhatsappNumber}>
      {children}
    </WhatsappNumberContext.Provider>
  );
};