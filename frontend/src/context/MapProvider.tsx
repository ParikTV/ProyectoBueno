

import React from 'react';
import { useLoadScript } from '@react-google-maps/api';


const libraries: ('places' | 'drawing' | 'geometry' | 'visualization')[] = ['places'];

interface MapProviderProps {
  children: React.ReactNode;
}

export const MapProvider: React.FC<MapProviderProps> = ({ children }) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_Maps_API_KEY,
    libraries,
  });



  if (loadError) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        <h2>Error al cargar Google Maps</h2>
        <p>Por favor, revisa la configuración de tu clave de API en la consola de Google Cloud y asegúrate de que esté correctamente configurada en tu archivo .env.local.</p>
      </div>
    );
  }



  if (!isLoaded) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Cargando mapas...</h2>
      </div>
    );
  }


  return <>{children}</>;
};