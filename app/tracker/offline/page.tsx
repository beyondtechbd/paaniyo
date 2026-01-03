import { Droplets, WifiOff, RefreshCw } from 'lucide-react';

export const metadata = {
  title: 'Offline | Paaniyo Water Tracker',
  description: 'You are currently offline',
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-cyan-950 flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        {/* Icon */}
        <div className="relative inline-block mb-8">
          <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full" />
          <div className="relative p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full border border-slate-700">
            <WifiOff className="w-16 h-16 text-slate-400" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-4">
          You&apos;re Offline
        </h1>

        {/* Description */}
        <p className="text-slate-400 mb-8">
          It looks like you&apos;ve lost your internet connection. 
          Don&apos;t worry, you can still track your water intake offline!
        </p>

        {/* Offline Features */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Droplets className="w-6 h-6 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Offline Mode</h2>
          </div>
          <ul className="text-left text-slate-300 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">✓</span>
              Log your water intake locally
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">✓</span>
              View today&apos;s progress
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">✓</span>
              Data syncs when back online
            </li>
          </ul>
        </div>

        {/* Retry Button */}
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/25"
        >
          <RefreshCw className="w-5 h-5" />
          Try Again
        </button>

        {/* Water Tip */}
        <div className="mt-12 p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
          <p className="text-sm text-cyan-300">
            💡 <strong>Tip:</strong> The average adult should drink about 8 glasses (2 liters) of water per day!
          </p>
        </div>
      </div>
    </div>
  );
}
