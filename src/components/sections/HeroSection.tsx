import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface HeroSectionProps {
  onLogin?: () => void;
  onRegister?: () => void;
}

export default function HeroSection({
  onLogin = () => console.log("Login clicked"),
  onRegister = () => console.log("Register clicked"),
}: HeroSectionProps) {
  return (
    <div className="relative min-h-[90vh] bg-[#0A0F1E] flex items-center overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-b from-blue-500/20 to-transparent blur-3xl" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-t from-purple-500/20 to-transparent blur-3xl" />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="space-y-2">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center px-3 py-1 rounded-full border border-gray-700 bg-gray-800/50 text-gray-300 text-sm"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                Making logistics smarter, fairer, and more accessible
              </motion.div>
              <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
                Making Logistics Work for
                <br />
                <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
                  Shippers, Carriers & Consumers
                </span>
              </h1>
              <p className="mt-6 text-xl text-gray-300 max-w-2xl">
                Eliminating waste and unfairness from logistics through
                transparency, efficiency, and cutting-edge technology.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                onClick={onRegister}
                className="bg-blue-600 hover:bg-blue-700 text-lg px-8"
              >
                Join the Logistics Revolution
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={onLogin}
                className="text-white border-white/20 hover:bg-white/10 text-lg px-8"
              >
                See How It Works
              </Button>
            </div>

            <div className="pt-8 border-t border-gray-800">
              <p className="text-gray-400 text-sm">
                Trusted by 20,000+ users | 120,000+ miles dispatched daily
              </p>
            </div>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="relative hidden lg:block"
          >
            <div className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-800">
              <img
                src="/dashboard-preview.png"
                alt="Platform Preview"
                className="w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1E] via-transparent to-transparent" />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
