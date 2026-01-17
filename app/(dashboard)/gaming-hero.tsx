'use client';

import { useState, useEffect } from 'react';
import { Monitor, Smartphone, Tablet, Tv, Wifi } from 'lucide-react';

export function GamingHero() {
  const [activeDevice, setActiveDevice] = useState(0);
  const devices = [
    { icon: Monitor, label: 'Desktop' },
    { icon: Tablet, label: 'Tablet' },
    { icon: Smartphone, label: 'Phone' },
    { icon: Tv, label: 'TV' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveDevice((prev) => (prev + 1) % devices.length);
    }, 2000);

    return () => clearInterval(timer);
  }, [devices.length]);

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 via-gray-900 to-black p-8 shadow-2xl border border-purple-500/20">
      <div className="relative">
        {/* Streaming visualization */}
        <div className="aspect-video bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-lg flex items-center justify-center relative overflow-hidden">
          {/* Animated grid background */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(to right, #a855f7 1px, transparent 1px), linear-gradient(to bottom, #a855f7 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }} />
          </div>

          {/* Central cloud icon */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative">
              <div className="absolute inset-0 animate-ping bg-purple-500 rounded-full opacity-20" />
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                <Wifi className="w-10 h-10 text-white" />
              </div>
            </div>
            <p className="mt-4 text-purple-300 font-medium text-sm">Streaming to your device</p>
          </div>

          {/* Streaming lines */}
          <div className="absolute inset-0">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute left-1/2 top-1/2 w-32 h-0.5 bg-gradient-to-r from-purple-500 to-transparent animate-pulse"
                style={{
                  transform: `rotate(${120 * i}deg)`,
                  animationDelay: `${i * 0.3}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Device selector */}
        <div className="mt-6 flex justify-center gap-4">
          {devices.map((device, index) => {
            const Icon = device.icon;
            const isActive = index === activeDevice;
            return (
              <button
                key={device.label}
                onClick={() => setActiveDevice(index)}
                className={`flex flex-col items-center p-3 rounded-lg transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white scale-110'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs mt-1">{device.label}</span>
              </button>
            );
          })}
        </div>

        {/* Stats bar */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">4K</p>
            <p className="text-xs text-gray-400">Resolution</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">120</p>
            <p className="text-xs text-gray-400">FPS</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">&lt;20ms</p>
            <p className="text-xs text-gray-400">Latency</p>
          </div>
        </div>
      </div>
    </div>
  );
}
