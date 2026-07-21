import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { Ride, GeolocationCoordinates } from '../types';

// Fix for default leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to handle routing
const RoutingMachine = ({ start, dest }: { start: [number, number]; dest: [number, number] }) => {
    const map = useMap();
    const hasSpoken = useRef(false);

    useEffect(() => {
        if (!map) return;
        const control = L.Routing.control({
            waypoints: [L.latLng(start[0], start[1]), L.latLng(dest[0], dest[1])],
            lineOptions: { styles: [{ color: '#6366f1', weight: 4 }] },
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            showAlternatives: false,
            show: false, // Hide instruction panel to avoid visual glitches
        }).addTo(map);

        // Basic voice guidance triggering
        if (!hasSpoken.current) {
            window.speechSynthesis.speak(new SpeechSynthesisUtterance('Iniciando navegação para o destino.'));
            hasSpoken.current = true;
        }

        return () => {
            map.removeControl(control);
        };
    }, [map, start, dest]);
    return null;
};

interface RideMapProps {
    startLocation: GeolocationCoordinates | null;
    currentLocation: GeolocationCoordinates | null;
    path: GeolocationCoordinates[];
    destination: { address: string; city: string };
    destinationCoords: GeolocationCoordinates | null;
    driverName: string;
}

const RideMap: React.FC<RideMapProps> = ({ startLocation, currentLocation, path, destination, destinationCoords, driverName }) => {
    // Center map on origin or current location
    const centerPos: [number, number] = [
        currentLocation?.latitude || startLocation?.latitude || -23.5505,
        currentLocation?.longitude || startLocation?.longitude || -46.6333
    ];
    
    const startPos: [number, number] = [
        startLocation?.latitude || -23.5505,
        startLocation?.longitude || -46.6333
    ];
    
    const destPos: [number, number] = destinationCoords ? [destinationCoords.latitude, destinationCoords.longitude] : startPos;

    return (
        <div className="h-full w-full">
            <MapContainer center={centerPos} zoom={14} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {startLocation && destinationCoords && (
                    <RoutingMachine start={startPos} dest={destPos} />
                )}
                
                {currentLocation && (
                    <Marker position={[currentLocation.latitude, currentLocation.longitude]}>
                        <Popup>{driverName}</Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
};

export default RideMap;
