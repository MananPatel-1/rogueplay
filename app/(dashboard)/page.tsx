import { Button } from '@/components/ui/button';
import { Zap, Globe, Shield, Gamepad2 } from 'lucide-react';
import { GamingHero } from './gaming-hero';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <section className="py-20 bg-gradient-to-b from-gray-900 via-purple-900/20 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-6">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
                Closed Beta - Limited Access
              </div>
              <h1 className="text-4xl font-bold text-white tracking-tight sm:text-5xl md:text-6xl">
                Rogue Play
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Cloud Gaming</span>
              </h1>
              <p className="mt-3 text-base text-gray-300 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Play AAA games instantly on any device. No downloads, no expensive hardware.
                Just pure, lag-free gaming streamed directly to you.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0 flex flex-col sm:flex-row gap-4">
                <Link href="/sign-up">
                  <Button
                    size="lg"
                    className="text-lg rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
                  >
                    <Gamepad2 className="mr-2 h-5 w-5" />
                    Request Beta Access
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg rounded-full border-purple-500/50 text-purple-300 hover:bg-purple-500/10"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <GamingHero />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-900 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Why Rogue Play?
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              Experience the future of gaming without the hardware burden
            </p>
          </div>
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start h-12 w-12 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white mx-auto lg:mx-0">
                <Zap className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-white">
                  Instant Play
                </h2>
                <p className="mt-2 text-base text-gray-400">
                  No downloads, no installations. Click and play your favorite
                  games in seconds with our ultra-fast streaming technology.
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-0 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start h-12 w-12 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white mx-auto lg:mx-0">
                <Globe className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-white">
                  Play Anywhere
                </h2>
                <p className="mt-2 text-base text-gray-400">
                  Your games follow you. Play on your laptop, tablet, phone, or
                  TV. All you need is an internet connection.
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-0 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start h-12 w-12 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white mx-auto lg:mx-0">
                <Shield className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-white">
                  RTX-Powered
                </h2>
                <p className="mt-2 text-base text-gray-400">
                  High-end gaming hardware in the cloud. Ray tracing, 4K resolution,
                  and buttery smooth framerates without the expensive setup.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-purple-900 to-pink-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Ready to Go Rogue?
              </h2>
              <p className="mt-3 max-w-3xl text-lg text-purple-200">
                Join our exclusive beta and be among the first to experience
                the future of cloud gaming. Limited spots available.
              </p>
            </div>
            <div className="mt-8 lg:mt-0 flex justify-center lg:justify-end">
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="text-lg rounded-full bg-white text-purple-900 hover:bg-gray-100"
                >
                  <Gamepad2 className="mr-2 h-5 w-5" />
                  Request Access
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
