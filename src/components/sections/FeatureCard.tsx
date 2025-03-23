import React from "react";
import { Card, CardHeader, CardContent } from "../ui/card";
import { Truck } from "lucide-react";

interface FeatureCardProps {
  icon?: typeof Truck;
  title?: string;
  description?: string;
  gains?: string;
}

const FeatureCard = ({
  icon: Icon = Truck,
  title = "Fleet Management",
  description = "Efficiently manage your entire fleet with real-time tracking and comprehensive analytics.",
  gains,
}: FeatureCardProps) => {
  return (
    <Card className="bg-gray-900/50 border-gray-800 h-full transition-all duration-300 hover:bg-gray-900/70 hover:border-gray-700">
      <CardHeader className="pb-2">
        <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-blue-500" />
        </div>
        <h3 className="text-xl font-semibold text-white">{title}</h3>
      </CardHeader>
      <CardContent>
        <p className="text-gray-400">{description}</p>
        {gains && <p className="text-blue-400 text-sm mt-2">{gains}</p>}
      </CardContent>
    </Card>
  );
};

export default FeatureCard;
