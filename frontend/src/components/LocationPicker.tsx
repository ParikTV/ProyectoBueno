// src/components/LocationPicker.tsx

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Importa los estilos de Leaflet para que el mapa se vea bien
import 'leaflet/dist/leaflet.css';

// Arreglo para un problema común con los íconos del marcador en React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});


// Este componente interno nos permite reaccionar a eventos del mapa, como los clics
const LocationFinder = ({ onPositionChange }: { onPositionChange: (pos: L.LatLng) => void }) => {
  const map = useMapEvents({
    click(e) {
      // Cuando se hace clic, llamamos a la función con la nueva posición
      onPositionChange(e.latlng);
      // Opcional: Centramos el mapa en la nueva posición
      map.flyTo(e.latlng, map.getZoom());
    },
  });
  return null;
};

// --- Componente Principal del Selector de Ubicación ---
interface LocationPickerProps {
    onLocationSelect: (address: string) => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelect }) => {
    // Coordenadas aproximadas del centro de Costa Rica
    const costaRicaPosition: L.LatLngTuple = [9.934739, -84.087502];
    
    // Estado para guardar la posición del marcador
    const [markerPosition, setMarkerPosition] = useState<L.LatLng | null>(null);

    // Esta función se ejecuta cada vez que el usuario hace clic en el mapa
    const handlePositionChange = async (pos: L.LatLng) => {
        setMarkerPosition(pos); // Actualizamos la posición del marcador visual

        // --- Geocodificación Inversa: Convertir coordenadas a dirección ---
        // Usamos la API gratuita de Nominatim (OpenStreetMap)
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}`);
            const data = await response.json();
            
            // 'display_name' contiene la dirección completa y legible
            if (data && data.display_name) {
                onLocationSelect(data.display_name);
            }
        } catch (error) {
            console.error("Error al obtener la dirección:", error);
            onLocationSelect(`Lat: ${pos.lat.toFixed(5)}, Lng: ${pos.lng.toFixed(5)}`);
        }
    };

    return (
        <div style={{ height: '300px', width: '100%', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #d1d5db' }}>
            <MapContainer center={costaRicaPosition} zoom={7} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <LocationFinder onPositionChange={handlePositionChange} />
                {/* Si hay una posición seleccionada, mostramos el marcador */}
                {markerPosition && <Marker position={markerPosition}></Marker>}
            </MapContainer>
        </div>
    );
};