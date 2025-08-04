// frontend/src/context/MapProvider.tsx

import React from 'react';
import { useLoadScript } from '@react-google-maps/api';

// Define las librerías de Google Maps que necesitarás en tu aplicación
const libraries: ('places' | 'drawing' | 'geometry' | 'visualization')[] = ['places'];

interface MapProviderProps {
  children: React.ReactNode;
}

export const MapProvider: React.FC<MapProviderProps> = ({ children }) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_Maps_API_KEY,
    libraries,
  });

  // Si hay un error al cargar la API, muestra un mensaje claro.
  // Esto es crucial para diagnosticar problemas con la clave de API.
  if (loadError) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        <h2>Error al cargar Google Maps</h2>
        <p>Por favor, revisa la configuración de tu clave de API en la consola de Google Cloud y asegúrate de que esté correctamente configurada en tu archivo .env.local.</p>
      </div>
    );
  }

  // Mientras la API carga, muestra un mensaje de espera.
  // Esto evita que se muestren los "espacios en blanco".
  if (!isLoaded) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Cargando mapas...</h2>
      </div>
    );
  }

  // Una vez que la API está cargada, renderiza el resto de la aplicación.
  return <>{children}</>;
};