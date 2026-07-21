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
const RoutingMachine = ({ start, dest, isExpanded }: { start: [number, number]; dest: [number, number], isExpanded: boolean }) => {
    const map = useMap();
    const hasSpoken = useRef(false);
    const controlRef = useRef<any>(null);
    const routeBoundsRef = useRef<L.LatLngBounds | null>(null);

    useEffect(() => {
        if (!map) return;
        const control = L.Routing.control({
            waypoints: [L.latLng(start[0], start[1]), L.latLng(dest[0], dest[1])],
            lineOptions: { styles: [{ color: '#3b82f6', weight: 6, opacity: 0.8 }] },
            createMarker: () => null, // Hide built-in markers
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: false, // Handle fitting manually
            showAlternatives: false,
            show: false, // Hide instruction panel
        }).addTo(map);

        control.on('routesfound', (e: any) => {
             const routes = e.routes;
             if (routes && routes.length > 0) {
                 const bounds = L.latLngBounds(routes[0].coordinates);
                 routeBoundsRef.current = bounds;
                 map.fitBounds(bounds, { padding: [40, 40] });
             }
        });

        controlRef.current = control;

        // Basic voice guidance triggering
        if (!hasSpoken.current) {
            window.speechSynthesis.speak(new SpeechSynthesisUtterance('Iniciando navegação para o destino.'));
            hasSpoken.current = true;
        }

        return () => {
            map.removeControl(control);
        };
    }, [map, start, dest]);

    // Refit bounds when expanded state changes
    useEffect(() => {
        if (routeBoundsRef.current && map) {
            const timers = [
                setTimeout(() => map.fitBounds(routeBoundsRef.current!, { padding: [40, 40] }), 150),
                setTimeout(() => map.fitBounds(routeBoundsRef.current!, { padding: [40, 40] }), 400),
                setTimeout(() => map.fitBounds(routeBoundsRef.current!, { padding: [40, 40] }), 600)
            ];
            return () => timers.forEach(clearTimeout);
        }
    }, [isExpanded, map]);

    return null;
};

// Component to handle automatic centering
// Removed MapCenterUpdater as RoutingMachine now handles fitting

// Component to handle map size changes when container resizes
const MapSizeUpdater = ({ isExpanded }: { isExpanded: boolean }) => {
    const map = useMap();
    useEffect(() => {
        // Trigger resize when animation finishes (or shortly after start)
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 300);
        return () => clearTimeout(timer);
    }, [isExpanded, map]);
    return null;
};

interface RideMapProps {
    startLocation: GeolocationCoordinates | null;
    currentLocation: GeolocationCoordinates | null;
    path: GeolocationCoordinates[];
    destination: { address: string; city: string };
    destinationCoords: GeolocationCoordinates | null;
    driverName: string;
    isExpanded: boolean;
}

const RideMap: React.FC<RideMapProps> = ({ startLocation, currentLocation, path, destination, destinationCoords, driverName, isExpanded }) => {
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
                
                <MapSizeUpdater isExpanded={isExpanded} />

                {startLocation && (
                    <Marker position={startPos}>
                        <Popup>Origem</Popup>
                    </Marker>
                )}
                
                {startLocation && destinationCoords && (
                    <>
                        <RoutingMachine start={startPos} dest={destPos} isExpanded={isExpanded} />
                        <Marker position={destPos}>
                            <Popup>Destino</Popup>
                        </Marker>
                    </>
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
