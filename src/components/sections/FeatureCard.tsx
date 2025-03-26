import React from "react";
import { Card, CardHeader, CardContent } from "../ui/card";
import { Truck, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface FeatureCardProps {
  icon?: typeof Truck;
  title?: string;
  description?: string;
  gains?: string;
  learnMoreUrl?: string;
  iconBgColor?: string;
  iconColor?: string;
  index?: number;
}

const FeatureCard = ({
  icon: Icon = Truck,
  title = "Fleet Management",
  description = "Efficiently manage your entire fleet with real-time tracking and comprehensive analytics.",
  gains,
  learnMoreUrl = "#",
  iconBgColor = "bg-blue-500/10",
  iconColor = "text-blue-500",
  index = 0,
}: FeatureCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="h-full"
    >
      <Card className="bg-white border border-gray-200 h-full transition-all duration-300 hover:shadow-xl hover:shadow-blue-100/20 hover:border-blue-200 group overflow-hidden">
        <CardHeader className="pb-2 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full -mr-10 -mt-10 opacity-70 group-hover:opacity-100 transition-opacity" />

          <div
            className={`w-14 h-14 rounded-2xl ${iconBgColor} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform z-10`}
          >
            <Icon className={`w-7 h-7 ${iconColor}`} />
          </div>

          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
            {title}
          </h3>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-gray-600">{description}</p>

          {gains && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <p className="text-blue-700 text-sm font-medium">{gains}</p>
            </div>
          )}

          <a
            href={learnMoreUrl}
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 group/link"
          >
            Learn more
            <ArrowRight className="ml-1 h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
          </a>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FeatureCard;
