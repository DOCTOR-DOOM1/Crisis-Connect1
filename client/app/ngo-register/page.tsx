'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NGORegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        type: 'Medical',
        contactEmail: '',
        contactPhone: '',
        licenseId: ''
    });
    const [status, setStatus] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('Registering...');

        try {
            const res = await fetch('http://localhost:5000/api/ngos/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Registration failed');
            }

            const data = await res.json();

            // Simulating "Login" by saving to localStorage (in a real app, use HTTP-only cookies)
            localStorage.setItem('ngo_user', JSON.stringify(data));

            setStatus('Registration successful! Redirecting...');
            setTimeout(() => router.push('/volunteer'), 1500); // Redirect to dashboard
        } catch (err: any) {
            setStatus('Error: ' + err.message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                <div className="bg-blue-600 p-6 text-white text-center">
                    <h1 className="text-2xl font-bold uppercase tracking-wider">NGO Partner</h1>
                    <p className="text-blue-100 text-sm mt-1">Join the network to coordinate relief efforts</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 placeholder-gray-500"
                            placeholder="e.g. Red Cross Local Chapter"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Organization Type</label>
                        <select
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="Medical">Medical / Healthcare</option>
                            <option value="Rescue">Search & Rescue</option>
                            <option value="Food/Shelter">Food & Shelter</option>
                            <option value="Logistics">Logistics & Transport</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 placeholder-gray-500"
                            placeholder="contact@org.com"
                            value={formData.contactEmail}
                            onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Phone</label>
                        <input
                            type="tel"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 placeholder-gray-500"
                            placeholder="+1 234 567 8900"
                            value={formData.contactPhone}
                            onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Government License / Tax ID</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 placeholder-gray-500"
                            placeholder="e.g. 501(c)(3) ID, FCRA Number"
                            value={formData.licenseId}
                            onChange={e => setFormData({ ...formData, licenseId: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                    >
                        Register Organization
                    </button>
                </form>

                {status && (
                    <div className={`mt-4 text-center p-3 rounded-lg ${status.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        {status}
                    </div>
                )}
            </div>
        </div>
    );
}
