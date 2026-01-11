'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import io, { Socket } from 'socket.io-client';

// Dynamically import Map to avoid SSR issues with Leaflet
const Map = dynamic(() => import('@/components/Map'), {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 w-full h-full min-h-[500px] rounded-xl flex items-center justify-center text-gray-400">Loading Map...</div>
});

interface Request {
    _id: string;
    name: string;
    location: { coordinates: [number, number] };
    urgentNeeds: string[];
    criticalDetails: string;
    status: 'Open' | 'Claimed';
    createdAt: string;
    locationMetadata?: { accuracy: number };
}

// Haversine formula to calculate distance in km
function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance within km
}

let socket: Socket;

export default function VolunteerPage() {
    const [requests, setRequests] = useState<Request[]>([]);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Connect to Socket.io
        socket = io('http://localhost:5000');

        socket.on('connect', () => {
            setIsConnected(true);
        });

        socket.on('new-request', (newReq: Request) => {
            setRequests((prev) => [newReq, ...prev]);
        });

        socket.on('request-updated', (updatedReq: Request) => {
            setRequests(prev => prev.map(req => req._id === updatedReq._id ? updatedReq : req));
        });

        // Fetch initial requests
        fetch('http://localhost:5000/api/requests')
            .then(res => res.json())
            .then(data => setRequests(data))
            .catch(err => console.error('Failed to fetch requests', err));

        // Get User Location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => console.error(err)
            );
        }

        return () => {
            socket.disconnect();
        };
    }, []);

    const handleClaim = async (id: string) => {
        try {
            const res = await fetch(`http://localhost:5000/api/requests/${id}/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ volunteerId: 'vol-' + Math.random().toString(36).substr(2, 9) })
            });
            if (!res.ok) throw new Error('Failed to claim');
            // UI updates via socket event, but we can optimistically update if needed
        } catch (err) {
            console.error('Claim error:', err);
            alert('Failed to claim task. It may have been picked up by someone else.');
        }
    };

    const openRequests = useMemo(() => {
        const active = requests.filter(r => r.status === 'Open');

        if (!userLocation) return active;

        // Calculate distance and sort
        return active.map(req => ({
            ...req,
            distance: getDistanceInKm(
                userLocation.lat, userLocation.lng,
                req.location.coordinates[1], req.location.coordinates[0]
            )
        })).sort((a, b) => a.distance - b.distance);
    }, [requests, userLocation]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow p-4 z-10">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">Volunteer <span className="text-blue-600">Dashboard</span></h1>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                        {isConnected ? 'LIVE DISPATCH' : 'DISCONNECTED'}
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col md:flex-row gap-6 h-[calc(100vh-80px)]">
                {/* Sidebar List */}
                <div className="w-full md:w-1/3 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h2 className="font-semibold text-gray-700">Active Requests ({openRequests.length})</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {openRequests.length === 0 ? (
                            <div className="text-center text-gray-400 mt-10">No active requests.</div>
                        ) : (
                            openRequests.map(req => (
                                <div key={req._id} className="bg-white border border-gray-100 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-gray-800">{req.name}</h3>
                                        <div className="text-right">
                                            <span className="block text-xs text-gray-400">{new Date(req.createdAt).toLocaleTimeString()}</span>
                                            {/* @ts-ignore */}
                                            {typeof req.distance === 'number' && (
                                                <span className="block text-xs font-bold text-blue-600">
                                                    {/* @ts-ignore */}
                                                    {req.distance < 1 ? '< 1 km' : `${req.distance.toFixed(1)} km`} away
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {req.urgentNeeds.map(need => (
                                            <span key={need} className="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded border border-red-100">
                                                {need}
                                            </span>
                                        ))}
                                        {/* Trust Signal */}
                                        {req.locationMetadata && req.locationMetadata.accuracy < 100 ? (
                                            <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded border border-green-100 flex items-center gap-1">
                                                ✅ High Confidence Loc
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 text-xs rounded border border-yellow-100 flex items-center gap-1">
                                                ⚠️ Low Accuracy
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{req.criticalDetails}</p>
                                    <button
                                        onClick={() => handleClaim(req._id)}
                                        className="w-full bg-gray-50 text-blue-600 border border-blue-200 hover:bg-blue-50 text-sm py-2 rounded transition font-medium"
                                    >
                                        Locate & Claim
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Map View */}
                <div className="flex-1 h-[500px] md:h-auto font-sans">
                    <Map
                        requests={openRequests}
                        onClaim={handleClaim}
                        userLocation={userLocation}
                    />
                </div>
            </main>
        </div>
    );
}
