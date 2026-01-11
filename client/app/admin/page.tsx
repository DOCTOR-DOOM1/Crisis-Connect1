'use client';

import { useEffect, useState } from 'react';

interface NGO {
    _id: string;
    name: string;
    type: string;
    contactEmail: string;
    licenseId: string;
    verified: boolean;
    createdAt: string;
}

export default function AdminDashboard() {
    const [ngos, setNgos] = useState<NGO[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNgos = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/admin/ngos');
            const data = await res.json();
            setNgos(data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNgos();
    }, []);

    const handleVerify = async (id: string) => {
        try {
            const res = await fetch(`http://localhost:5000/api/admin/ngos/${id}/verify`, {
                method: 'POST'
            });
            if (res.ok) {
                setNgos(prev => prev.map(n => n._id === id ? { ...n, verified: true } : n));
            }
        } catch (err) {
            console.error('Verification failed', err);
        }
        const handleDecline = async (id: string) => {
            if (!confirm('Are you sure you want to decline and remove this NGO?')) return;
            try {
                const res = await fetch(`http://localhost:5000/api/admin/ngos/${id}`, {
                    method: 'DELETE'
                });
                if (res.ok) {
                    setNgos(prev => prev.filter(n => n._id !== id));
                }
            } catch (err) {
                console.error('Decline failed', err);
            }
        };
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Admin <span className="text-red-600">Console</span></h1>
                        <p className="text-gray-500">Manage NGO Partners and Compliance</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg shadow text-sm font-mono">
                        Status: <span className="text-green-600">● Live</span>
                    </div>
                </header>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h2 className="font-semibold text-gray-700">Registered Organizations</h2>
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                            Total: {ngos.length}
                        </span>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-gray-400">Loading data...</div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Organization</th>
                                    <th className="px-6 py-3 font-medium">Type</th>
                                    <th className="px-6 py-3 font-medium">License ID</th>
                                    <th className="px-6 py-3 font-medium">Contact</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {ngos.map(ngo => (
                                    <tr key={ngo._id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 font-medium text-gray-900">{ngo.name}</td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">
                                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                                {ngo.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-gray-500">{ngo.licenseId}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {ngo.contactEmail}
                                            <div className="text-xs text-gray-400">{ngo.contactPhone}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {ngo.verified ? (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-bold flex w-fit items-center gap-1">
                                                    ✓ Verified
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-bold flex w-fit items-center gap-1">
                                                    ⏳ Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {!ngo.verified && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleVerify(ngo._id)}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded shadow transition"
                                                    >
                                                        Verify
                                                    </button>
                                                    <button
                                                        onClick={() => handleDecline(ngo._id)}
                                                        className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 text-xs px-3 py-1.5 rounded shadow-sm transition"
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {ngos.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-gray-400">
                                            No NGOs registered yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
