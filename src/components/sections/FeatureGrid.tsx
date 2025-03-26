import { motion } from "framer-motion";
import FeatureCard from "./FeatureCard";
import {
  BarChart2,
  Shield,
  Truck,
  Zap,
  Clock,
  DollarSign,
  Compass,
  Users,
  FileText,
  Globe,
  Smartphone,
  Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FeatureGrid() {
  const features = [
    {
      icon: BarChart2,
      title: "Real-time Analytics",
      description:
        "Get instant insights into your logistics operations with powerful dashboards and customizable reports.",
      gains: "18% cost savings for shippers, 22% revenue boost for carriers",
      iconBgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: Shield,
      title: "Secure Transactions",
      description:
        "End-to-end encryption and advanced security protocols protect your sensitive data and financial transactions.",
      gains: "99.9% uptime with enterprise-grade security compliance",
      iconBgColor: "bg-indigo-100",
      iconColor: "text-indigo-600",
    },
    {
      icon: Zap,
      title: "Automated Workflows",
      description:
        "Eliminate manual processes with intelligent automation for paperwork, payments, and compliance requirements.",
      gains: "78% lower admin costs, 94% faster carrier payments",
      iconBgColor: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      icon: Compass,
      title: "Intelligent Routing",
      description:
        "AI-powered route optimization that considers traffic, weather, and historical data to find the most efficient paths.",
      gains: "Reduce fuel costs by up to 15% and improve delivery times",
      iconBgColor: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      icon: Users,
      title: "Carrier Marketplace",
      description:
        "Connect directly with verified carriers through our transparent marketplace with ratings and performance metrics.",
      gains: "Access to 10,000+ vetted carriers nationwide",
      iconBgColor: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      icon: Smartphone,
      title: "Mobile Accessibility",
      description:
        "Manage your logistics operations from anywhere with our fully-featured mobile app for iOS and Android.",
      gains: "Real-time notifications and updates on the go",
      iconBgColor: "bg-rose-100",
      iconColor: "text-rose-600",
    },
  ];

  return (
    <section className="py-24 bg-white" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
              Powerful Features
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Optimize Your Logistics
            </h2>
            <p className="text-xl text-gray-600">
              Our comprehensive platform connects every part of the logistics
              ecosystem
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              gains={feature.gains}
              iconBgColor={feature.iconBgColor}
              iconColor={feature.iconColor}
              index={index}
            />
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-20 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl overflow-hidden shadow-xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-8 lg:p-12 flex flex-col justify-center">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Ready to transform your logistics operations?
              </h3>
              <p className="text-blue-100 mb-8 text-lg">
                Join thousands of companies already using our platform to
                streamline their operations and reduce costs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-white text-blue-700 hover:bg-blue-50 text-lg px-8 h-12"
                >
                  Get Started
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 text-lg px-8 h-12"
                >
                  Contact Sales
                </Button>
              </div>
            </div>
            <div className="hidden lg:block relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-transparent z-10" />
              <img
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80"
                alt="Logistics operations"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
