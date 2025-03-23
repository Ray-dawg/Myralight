import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadMatch } from "@/api/services/load-matching.service";
import { format } from "date-fns";
import { MapPin, Clock, DollarSign, Truck, CheckCircle } from "lucide-react";

interface CountdownTimerProps {
  duration: number;
  onExpire: () => void;
  className?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  duration,
  onExpire,
  className = "",
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, onExpire]);

  return (
    <div
      className={`font-mono text-lg font-bold ${timeLeft <= 5 ? "text-red-600" : "text-amber-600"} ${className}`}
    >
      {timeLeft}s
    </div>
  );
};

interface LoadSelectionCardsProps {
  loads: LoadMatch[];
  onSelectLoad: (loadId: string) => void;
  onTimerExpired: () => void;
  onScanForLoad: () => void;
  timerDuration?: number;
}

const LoadSelectionCards: React.FC<LoadSelectionCardsProps> = ({
  loads,
  onSelectLoad,
  onTimerExpired,
  onScanForLoad,
  timerDuration = 30,
}) => {
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);

  const handleLoadSelect = (loadId: string) => {
    setSelectedLoadId(loadId);
    onSelectLoad(loadId);
  };

  const formatLoadInfo = (load: LoadMatch) => {
    const pickupTime = new Date(load.pickupWindowStart);
    const deliveryTime = new Date(load.pickupWindowEnd + 24 * 60 * 60 * 1000); // Estimate delivery 24h after pickup end

    return {
      pickupLocation: `${load.pickupLocation.city}, ${load.pickupLocation.state}`,
      deliveryLocation: `${load.deliveryLocation.city}, ${load.deliveryLocation.state}`,
      pickupTime: format(pickupTime, "MMM d, h:mm a"),
      deliveryTime: format(deliveryTime, "MMM d, h:mm a"),
      distance: `${load.distance} miles`,
      rate: load.rate || 0,
      weight: `${load.weight.toLocaleString()} lbs`,
      equipmentType: load.equipmentType,
    };
  };

  return (
    <div className="load-selection-container p-4 bg-white rounded-lg shadow-lg max-w-md mx-auto">
      <div className="selection-header flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Select a Load</h2>
        <CountdownTimer
          duration={timerDuration}
          onExpire={onTimerExpired}
          className="selection-timer"
        />
      </div>

      <p className="selection-instruction text-sm text-gray-600 mb-4">
        Select one of the following loads within {timerDuration} seconds:
      </p>

      <AnimatePresence>
        {loads.map((load) => {
          const loadInfo = formatLoadInfo(load);
          return (
            <motion.div
              key={load.id}
              className={`load-card mb-4 p-4 border rounded-lg cursor-pointer transition-colors ${selectedLoadId === load.id ? "border-primary bg-primary/5" : "border-gray-200 hover:border-primary/50"}`}
              onClick={() => handleLoadSelect(load.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="load-card-header flex justify-between items-start mb-3">
                <h3 className="font-medium">{loadInfo.pickupLocation}</h3>
                <span className="load-distance text-sm text-gray-600">
                  {loadInfo.distance}
                </span>
              </div>

              <div className="load-card-details">
                <div className="load-info space-y-2 mb-3">
                  <div className="info-item flex items-center">
                    <MapPin className="h-4 w-4 text-blue-600 mr-2" />
                    <div>
                      <span className="info-label text-xs text-gray-500 block">
                        From:
                      </span>
                      <span className="info-value text-sm">
                        {loadInfo.pickupLocation}
                      </span>
                      <span className="text-xs text-gray-500 block">
                        {loadInfo.pickupTime}
                      </span>
                    </div>
                  </div>
                  <div className="info-item flex items-center">
                    <MapPin className="h-4 w-4 text-red-600 mr-2" />
                    <div>
                      <span className="info-label text-xs text-gray-500 block">
                        To:
                      </span>
                      <span className="info-value text-sm">
                        {loadInfo.deliveryLocation}
                      </span>
                      <span className="text-xs text-gray-500 block">
                        {loadInfo.deliveryTime}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                      <span className="font-medium">${load.rate}</span>
                    </div>
                    <div className="flex items-center">
                      <Truck className="h-4 w-4 text-gray-600 mr-1" />
                      <span className="text-sm">{loadInfo.equipmentType}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-600 mr-1" />
                      <span className="text-sm">{loadInfo.distance}</span>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full"
                  variant={selectedLoadId === load.id ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLoadSelect(load.id);
                  }}
                >
                  {selectedLoadId === load.id ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Selected
                    </>
                  ) : (
                    "Select Load"
                  )}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {loads.length === 0 && (
        <div className="no-loads-message text-center py-8">
          <p className="text-gray-600 mb-4">No loads available in your area</p>
          <Button className="scan-loads-button" onClick={onScanForLoad}>
            Scan for Loads
          </Button>
        </div>
      )}
    </div>
  );
};

export default LoadSelectionCards;
