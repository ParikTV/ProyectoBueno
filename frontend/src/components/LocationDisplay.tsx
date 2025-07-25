// src/components/LocationDisplay.tsx

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
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

interface LocationDisplayProps {
    address: string;
}

export const LocationDisplay: React.FC<LocationDisplayProps> = ({ address }) => {
    const [position, setPosition] = useState<L.LatLngTuple | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const geocodeAddress = async () => {
            setLoading(true);
            try {
                // Usamos la API de Nominatim para convertir la dirección a coordenadas
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
                const data = await response.json();

                if (data && data.length > 0) {
                    // Si encontramos la ubicación, guardamos la latitud y longitud
                    const { lat, lon } = data[0];
                    setPosition([parseFloat(lat), parseFloat(lon)]);
                } else {
                    setPosition(null);
                }
            } catch (error) {
                console.error("Error en la geocodificación:", error);
                setPosition(null);
            } finally {
                setLoading(false);
            }
        };

        if (address) {
            geocodeAddress();
        }
    }, [address]);

    if (loading) {
        return <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>Cargando mapa...</div>;
    }

    if (!position) {
        return <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px' }}>No se pudo encontrar la ubicación en el mapa.</div>;
    }

    return (
        <div style={{ height: '250px', width: '100%', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #d1d5db', marginTop: '1rem' }}>
            <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={position} />
            </MapContainer>
        </div>
    );
};