

import React, { useState, useEffect } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';

const containerStyle: React.CSSProperties = {
  height: '250px',
  width: '100%',
  borderRadius: '0.5rem',
  overflow: 'hidden',
  border: '1px solid #d1d5db',
  marginTop: '1rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#f3f4f6'
};

interface LocationDisplayProps {
  address: string;
}

export const LocationDisplay: React.FC<LocationDisplayProps> = ({ address }) => {
  const [position, setPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {

    if (!window.google || !window.google.maps) {
      console.warn("La API de Google Maps aún no está disponible.");
      return;
    }

    if (address) {
      setIsLoading(true);
      setError(null);
      const geocoder = new window.google.maps.Geocoder();
      
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const location = results[0].geometry.location;
          setPosition({ lat: location.lat(), lng: location.lng() });
        } else {

          console.error(`La geocodificación falló: ${status}`);
          setError(`No se pudo encontrar la dirección en el mapa. (Error: ${status})`);
          setPosition(null);
        }
        setIsLoading(false);
      });
    } else {
        setIsLoading(false);
        setError("No se proporcionó ninguna dirección.");
    }
  }, [address]);

  if (isLoading) {
    return <div style={containerStyle}>Buscando ubicación...</div>;
  }
  
  if (error) {
     return <div style={{...containerStyle, backgroundColor: '#fee2e2', color: '#b91c1c'}}>{error}</div>;
  }

  if (position) {
    return (
      <div style={{...containerStyle, border: '1px solid #d1d5db'}}>
        <GoogleMap
          mapContainerStyle={{ height: '100%', width: '100%' }}
          center={position}
          zoom={16}
          options={{
            fullscreenControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            zoomControl: false,
            gestureHandling: 'none',
          }}
        >
          <Marker position={position} />
        </GoogleMap>
      </div>
    );
  }

  return null;
};