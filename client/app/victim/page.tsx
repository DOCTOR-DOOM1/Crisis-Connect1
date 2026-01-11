'use client';

import { useState, useEffect } from 'react';
import { saveRequestOffline, getUnsyncedRequests, markRequestSynced } from '@/utils/db'; // Adjust path if needed

const NEEDS = ['Water', 'Food', 'Medical', 'Shelter', 'Other'];

export default function VictimPage() {
    const [formData, setFormData] = useState({
        name: '',
        urgentNeeds: [] as string[],
        criticalDetails: '',
        otherNeedDetail: '',
    });
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [status, setStatus] = useState<string>('');
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsOffline(!navigator.onLine);

            const handleOnline = () => {
                setIsOffline(false);
                syncRequests();
            };

            const handleOffline = () => setIsOffline(true);

            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);

            // Get Location
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setLocation({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            // @ts-ignore
                            accuracy: position.coords.accuracy,
                        });
                    },
                    (error) => {
                        console.error('Error getting location:', error);
                        setStatus('Error getting location. Please enable GPS.');
                    }
                );
            }

            // Try initial sync if online
            if (navigator.onLine) {
                syncRequests();
            }

            return () => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            };
        }
    }, []);

    const syncRequests = async () => {
        try {
            const unsynced = await getUnsyncedRequests();
            if (unsynced.length > 0) {
                setStatus(`Syncing ${unsynced.length} offline requests...`);
                for (const req of unsynced) {
                    // @ts-ignore
                    await submitToServer(req, req.id);
                }
                setStatus('All offline requests synced!');
            }
        } catch (error) {
            console.error('Sync error:', error);
        }
    };

    const submitToServer = async (data: any, id?: number) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const response = await fetch(`${apiUrl}/api/requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error('Failed to submit');

            if (id) {
                await markRequestSynced(id);
            }
            return true;
        } catch (error) {
            console.error('Submission failed:', error);
            throw error;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!location) {
            setStatus('Location is required. Please allow GPS access.');
            return;
        }

        // Append 'Other' details to critical details if present
        let finalDetails = formData.criticalDetails;
        if (formData.urgentNeeds.includes('Other') && formData.otherNeedDetail) {
            finalDetails += `\n[Other Need: ${formData.otherNeedDetail}]`;
        }

        const payload = {
            name: formData.name,
            urgentNeeds: formData.urgentNeeds,
            criticalDetails: finalDetails,
            ...location
        };

        try {
            if (navigator.onLine) {
                await submitToServer(payload);
                setStatus('Request sent successfully!');
            } else {
                await saveRequestOffline(payload);
                setStatus('Offline: Request saved. Will send when online.');
            }
            // Reset form
            setFormData({ name: '', urgentNeeds: [], criticalDetails: '', otherNeedDetail: '' });
        } catch (error) {
            // Fallback to offline save if server fails
            await saveRequestOffline(payload);
            const errMsg = error instanceof Error ? error.message : 'Unknown error';
            setStatus(`Server Error (${errMsg}). Saved locally.`);
        }
    };

    const toggleNeed = (need: string) => {
        setFormData(prev => ({
            ...prev,
            urgentNeeds: prev.urgentNeeds.includes(need)
                ? prev.urgentNeeds.filter(n => n !== need)
                : [...prev.urgentNeeds, need]
        }));
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                <div className="bg-red-600 p-6 text-white text-center">
                    <h1 className="text-2xl font-bold uppercase tracking-wider">Crisis Request</h1>
                    <p className="text-red-100 text-sm mt-1">Submit your urgent needs immediately</p>
                </div>

                {isOffline && (
                    <div className="bg-yellow-100 text-yellow-800 px-4 py-2 text-center text-sm font-semibold">
                        You are currently OFFLINE. Requests will be saved.
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition text-gray-900 placeholder-gray-500 bg-gray-50 bg-opacity-50"
                            placeholder="Your Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">Urgent Needs</label>
                        <div className="grid grid-cols-2 gap-2">
                            {NEEDS.map(need => (
                                <button
                                    key={need}
                                    type="button"
                                    onClick={() => toggleNeed(need)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${formData.urgentNeeds.includes(need)
                                        ? 'bg-red-600 text-white shadow-md transform scale-105'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {need}
                                </button>
                            ))}
                        </div>
                        {/* Conditional input for 'Other' */}
                        {formData.urgentNeeds.includes('Other') && (
                            <input
                                type="text"
                                className="mt-3 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-gray-900 placeholder-gray-500 bg-gray-50 animate-fadeIn"
                                placeholder="Please specify other needs..."
                                value={formData.otherNeedDetail}
                                onChange={(e) => setFormData({ ...formData, otherNeedDetail: e.target.value })}
                                autoFocus
                            />
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-1">Critical Details</label>
                        <textarea
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition text-gray-900 placeholder-gray-500 bg-gray-50 bg-opacity-50"
                            placeholder="Describe your situation..."
                            value={formData.criticalDetails}
                            onChange={(e) => setFormData({ ...formData, criticalDetails: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-1">Location</label>
                        {location ? (
                            <div className="text-green-700 text-sm flex items-center gap-1 font-semibold">
                                <span>📍</span> GPS Coordinates Acquired
                            </div>
                        ) : (
                            <div className="text-orange-600 text-sm animate-pulse font-medium">
                                Waiting for GPS...
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={!location}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        REQUEST AID
                    </button>
                </form>

                {status && (
                    <div className="bg-gray-50 border-t border-gray-100 p-4 text-center text-sm text-gray-700 font-medium">
                        {status}
                    </div>
                )}
            </div>
        </div>
    );
}
