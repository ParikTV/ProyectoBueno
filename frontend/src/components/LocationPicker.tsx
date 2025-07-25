// src/components/LocationPicker.tsx

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';

// Arreglo para un problema común con los íconos del marcador en React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});


// --- COMPONENTE INTERNO PARA MANEJAR EVENTOS DEL MAPA ---
// MODIFICADO: Ahora también ayuda a centrar el mapa.
const MapEventsManager = ({ onPositionChange, markerPosition }: { onPositionChange: (pos: L.LatLng) => void, markerPosition: L.LatLng | null }) => {
  const map = useMap();

  useMapEvents({
    click(e) {
      onPositionChange(e.latlng);
    },
  });

  // Este efecto centra el mapa en el marcador cuando la posición cambia
  useEffect(() => {
    if (markerPosition) {
      map.flyTo(markerPosition, 15); // Zoom de 15 para ver la calle
    }
  }, [markerPosition, map]);

  return null;
};


// --- COMPONENTE PRINCIPAL DEL SELECTOR DE UBICACIÓN ---
interface LocationPickerProps {
    onLocationSelect: (address: string) => void;
    initialAddress?: string; // <-- Prop para la dirección inicial
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelect, initialAddress }) => {
    // Coordenadas del centro de Costa Rica (como respaldo)
    const costaRicaPosition: L.LatLngTuple = [9.934739, -84.087502];
    
    // Estado para guardar la posición del marcador
    const [markerPosition, setMarkerPosition] = useState<L.LatLng | null>(null);
    const [mapCenter, setMapCenter] = useState<L.LatLngTuple>(costaRicaPosition);

    // --- NUEVO EFECTO: Geocodificar la dirección inicial al cargar ---
    useEffect(() => {
        const geocodeInitialAddress = async () => {
            if (initialAddress) {
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(initialAddress)}`);
                    const data = await response.json();
                    if (data && data.length > 0) {
                        const { lat, lon } = data[0];
                        const initialPos: L.LatLngTuple = [parseFloat(lat), parseFloat(lon)];
                        setMapCenter(initialPos);
                        setMarkerPosition(new L.LatLng(initialPos[0], initialPos[1]));
                    }
                } catch (error) {
                    console.error("Error al geocodificar la dirección inicial:", error);
                }
            }
        };
        geocodeInitialAddress();
    }, [initialAddress]);


    // Esta función se ejecuta cada vez que el usuario hace clic en el mapa
    const handlePositionChange = async (pos: L.LatLng) => {
        setMarkerPosition(pos); // Actualizamos la posición del marcador visual

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}`);
            const data = await response.json();
            
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
            <MapContainer center={mapCenter} zoom={markerPosition ? 15 : 7} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapEventsManager onPositionChange={handlePositionChange} markerPosition={markerPosition} />
                
                {markerPosition && <Marker position={markerPosition}></Marker>}
            </MapContainer>
        </div>
    );
};