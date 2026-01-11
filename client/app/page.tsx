import Link from 'next/link';
import Head from 'next/head';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6 transition-colors duration-500">
      <Head>
        <title>CrisisConnect</title>
        <meta name="description" content="Disaster Relief Platform" />
      </Head>

      <main className="max-w-4xl w-full grid md:grid-cols-2 gap-8 text-center md:text-left">
        <div className="col-span-1 md:col-span-2 text-center mb-8">
          <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight">
            Crisis<span className="text-red-600">Connect</span>
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Resilient. Real-time. Relief.
          </p>
        </div>

        {/* Victim Module Card */}
        <Link href="/victim" className="group">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 transform transition hover:-translate-y-2 hover:shadow-2xl cursor-pointer h-full flex flex-col justify-between">
            <div>
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 text-3xl">
                🆘
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4 group-hover:text-red-600 transition-colors">
                I Need Help
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Request immediate assistance. Works offline. GPS enabled.
              </p>
            </div>
            <div className="mt-6 flex items-center text-red-600 font-semibold group-hover:underline">
              Request Aid &rarr;
            </div>
          </div>
        </Link>

        {/* Volunteer Module Card */}
        <Link href="/volunteer" className="group">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 transform transition hover:-translate-y-2 hover:shadow-2xl cursor-pointer h-full flex flex-col justify-between">
            <div>
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 text-3xl">
                🤝
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                I Can Help
              </h2>
              <p className="text-gray-600 leading-relaxed">
                View requests near you. Real-time dispatch dashboard.
              </p>
            </div>
            <div className="mt-6 flex items-center text-blue-600 font-semibold group-hover:underline">
              Volunteer Dashboard &rarr;
            </div>
          </div>
        </Link>
        <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all border border-blue-50 md:col-span-2 flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 text-3xl">
            🤝
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Health & NGO Partners</h2>
          <p className="text-gray-600 mb-6 max-w-lg">
            Register your organization to coordinate large-scale relief efforts and manage resources.
          </p>
          <Link
            href="/ngo-register"
            className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors"
          >
            Register as Organization
          </Link>
        </div>
      </main>

      <footer className="mt-16 text-gray-400 text-sm">
        &copy; 2026 CrisisConnect. Offline-First PWA.
      </footer>
    </div >
  );
}
