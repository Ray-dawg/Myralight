import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Clock, BarChart2, Truck } from "lucide-react";

interface HeroSectionProps {
  onLogin?: () => void;
  onRegister?: () => void;
}

export default function HeroSection({
  onLogin = () => console.log("Login clicked"),
  onRegister = () => console.log("Register clicked"),
}: HeroSectionProps) {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#0A0F1E] to-[#111827] flex items-center overflow-hidden pt-20">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=1600&q=80')] bg-cover bg-center opacity-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 to-purple-900/30" />
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-b from-blue-500/10 to-transparent blur-3xl" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-t from-purple-500/10 to-transparent blur-3xl" />

      {/* Animated Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-500 rounded-full"
            initial={{
              x: Math.random() * 100 + "%",
              y: Math.random() * 100 + "%",
              opacity: Math.random() * 0.5 + 0.3,
              scale: Math.random() * 2 + 1,
            }}
            animate={{
              y: [null, "-20%"],
              opacity: [null, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center px-4 py-1.5 rounded-full border border-blue-700 bg-blue-900/50 text-blue-200 text-sm font-medium"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 mr-2 animate-pulse" />
                Next-Generation Logistics Platform
              </motion.div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight leading-tight">
                Revolutionizing <br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
                  Trucking Logistics
                </span>
              </h1>

              <p className="mt-6 text-xl text-gray-300 max-w-2xl leading-relaxed">
                Streamline your operations, reduce costs, and increase
                efficiency with our AI-powered logistics platform built
                specifically for the modern trucking industry.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8">
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                  <p className="text-3xl font-bold text-blue-400">32%</p>
                  <p className="text-sm text-gray-400">Cost Reduction</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                  <p className="text-3xl font-bold text-blue-400">4.2M+</p>
                  <p className="text-sm text-gray-400">Miles Tracked</p>
                </div>
                <div className="hidden sm:block bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                  <p className="text-3xl font-bold text-blue-400">98.7%</p>
                  <p className="text-sm text-gray-400">On-time Delivery</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                size="lg"
                onClick={onRegister}
                className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 h-14 rounded-lg shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 group"
              >
                Start Free Trial
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={onLogin}
                className="text-white border-white/20 hover:bg-white/10 text-lg px-8 h-14 rounded-lg"
              >
                Schedule Demo
              </Button>
            </div>

            <div className="pt-8 border-t border-gray-800/50">
              <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                <p className="text-gray-400 text-sm font-medium">
                  Trusted by industry leaders:
                </p>
                <div className="flex flex-wrap gap-8 items-center opacity-70">
                  <div className="text-white/80 font-semibold">FreightWave</div>
                  <div className="text-white/80 font-semibold">TruckPro</div>
                  <div className="text-white/80 font-semibold">LogiTech</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="relative hidden lg:block"
          >
            <div className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-800">
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
              <div className="absolute top-0 left-0 right-0 flex space-x-1.5 p-3">
                <div className="w-3 h-3 rounded-full bg-red-500/70"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/70"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/70"></div>
              </div>

              <img
                src="/dashboard-preview.png"
                alt="Platform Preview"
                className="w-full mt-6"
              />

              {/* Floating feature highlights */}
              <motion.div
                className="absolute top-1/4 -left-12 bg-blue-900/90 backdrop-blur-sm p-4 rounded-lg border border-blue-700/50 shadow-xl max-w-[200px]"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500/20 p-2 rounded-md">
                    <BarChart2 className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">
                      Real-time Analytics
                    </h3>
                    <p className="text-xs text-blue-200/70 mt-1">
                      Track performance metrics instantly
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute bottom-1/4 -right-12 bg-purple-900/90 backdrop-blur-sm p-4 rounded-lg border border-purple-700/50 shadow-xl max-w-[200px]"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1, duration: 0.5 }}
              >
                <div className="flex items-start gap-3">
                  <div className="bg-purple-500/20 p-2 rounded-md">
                    <Shield className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">
                      Enhanced Security
                    </h3>
                    <p className="text-xs text-purple-200/70 mt-1">
                      End-to-end encryption for all data
                    </p>
                  </div>
                </div>
              </motion.div>

              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1E] via-transparent to-transparent opacity-60" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 320"
          className="w-full"
        >
          <path
            fill="#ffffff"
            fillOpacity="1"
            d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,197.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
        </svg>
      </div>
    </div>
  );
}
