

import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';

const containerStyle: React.CSSProperties = {
  height: '300px',
  width: '100%',
  borderRadius: '0.5rem',
  overflow: 'hidden',
  border: '1px solid #d1d5db'
};

const costaRicaCenter = {
  lat: 9.934739,
  lng: -84.087502
};

interface LocationPickerProps {
  onLocationSelect: (address: string) => void;
  initialAddress?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelect, initialAddress }) => {
  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>(costaRicaCenter);

  useEffect(() => {
    if (initialAddress && window.google) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: initialAddress }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const location = results[0].geometry.location;
          const newPos = { lat: location.lat(), lng: location.lng() };
          setMapCenter(newPos);
          setMarkerPosition(newPos);
        }
      });
    }
  }, [initialAddress]);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      

      setMarkerPosition(newPos);
      


      setMapCenter(newPos);

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: newPos }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          onLocationSelect(results[0].formatted_address);
        } else {
          onLocationSelect(`Lat: ${newPos.lat.toFixed(5)}, Lng: ${newPos.lng.toFixed(5)}`);
        }
      });
    }
  }, [onLocationSelect]);

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={mapCenter}
      zoom={markerPosition ? 15 : 7}
      onClick={handleMapClick}
      options={{
        fullscreenControl: false,
        streetViewControl: false,
        mapTypeControl: false,
      }}
    >
      {markerPosition && <Marker position={markerPosition} />}
    </GoogleMap>
  );
};