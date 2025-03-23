import { motion } from "framer-motion";
import FeatureCard from "./FeatureCard";
import { BarChart2, Shield, Truck, Zap, Clock, DollarSign } from "lucide-react";

export default function FeatureGrid() {
  const features = [
    {
      icon: BarChart2,
      title: "Eliminate Information Asymmetry",
      description:
        "Our AI matches creates a transparent market, ensuring you always get fair rates.",
      gains: "18% cost savings for shippers, 22% revenue boost for carriers",
    },
    {
      icon: Shield,
      title: "Remove Unnecessary Intermediaries",
      description:
        "We connect shippers directly to carriers, bypassing brokers who take a cut without adding value.",
      gains: "14% margin increase for carriers, 12% savings for shippers",
    },
    {
      icon: Zap,
      title: "Automate Manual Processes",
      description:
        "Our platform digitizes paperwork, payments, and compliance so you can focus on moving freight.",
      gains: "78% lower admin costs, 94% faster carrier payments",
    },
  ];

  return (
    <section className="py-24 bg-[#0A0F1E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              The Platform Designed for Real Logistics Challenges
            </h2>
            <p className="text-xl text-gray-400">
              Myra connects every part of the logistics ecosystem to:
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                gains={feature.gains}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
