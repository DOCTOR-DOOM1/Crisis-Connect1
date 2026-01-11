'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icons in Next.js
const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

interface Request {
    _id: string;
    name: string;
    location: { coordinates: [number, number] };
    urgentNeeds: string[];
    criticalDetails: string;
    status: 'Open' | 'Claimed';
}

interface MapProps {
    requests: Request[];
    onClaim: (id: string) => void;
    userLocation: { lat: number; lng: number } | null;
}

// Component to recenter map when user location changes
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo([lat, lng], 13);
    }, [lat, lng, map]);
    return null;
}

const Map = ({ requests, onClaim, userLocation }: MapProps) => {
    return (
        <div className="h-full w-full rounded-xl overflow-hidden shadow-lg border border-gray-200 z-0">
            <MapContainer
                center={[51.505, -0.09]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {userLocation && (
                    <RecenterMap lat={userLocation.lat} lng={userLocation.lng} />
                )}

                {/* User Location Marker */}
                {userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lng]} icon={L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                    })}>
                        <Popup>You are here</Popup>
                    </Marker>
                )}

                {requests.map((req) => (
                    <Marker
                        key={req._id}
                        position={[req.location.coordinates[1], req.location.coordinates[0]]}
                        icon={icon}
                    >
                        <Popup>
                            <div className="p-2 min-w-[200px]">
                                <h3 className="font-bold text-lg mb-1">{req.name}</h3>
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {req.urgentNeeds.map(need => (
                                        <span key={need} className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                                            {need}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-gray-600 text-sm mb-3">{req.criticalDetails}</p>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-xs font-mono text-gray-400">
                                        {new Date().toLocaleTimeString()}
                                    </span>
                                    <button
                                        onClick={() => onClaim(req._id)}
                                        className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700 transition"
                                    >
                                        Claim Task
                                    </button>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default Map;
