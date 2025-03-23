import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

interface LoadRequestButtonProps {
  onRequest: () => void;
  isLoading: boolean;
  isDisabled?: boolean;
  hasCurrentLocation: boolean;
}

const LoadRequestButton: React.FC<LoadRequestButtonProps> = ({
  onRequest,
  isLoading,
  isDisabled = false,
  hasCurrentLocation,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (isLoading || isDisabled) return;

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 500);
    onRequest();
  };

  return (
    <motion.div whileTap={{ scale: 0.95 }} className="w-full">
      <Button
        onClick={handleClick}
        disabled={isLoading || isDisabled}
        className="w-full py-6 text-lg relative overflow-hidden"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Finding Loads...
          </>
        ) : !hasCurrentLocation ? (
          <>
            <MapPin className="h-5 w-5 mr-2" />
            Locating You...
          </>
        ) : (
          <>
            <RefreshCw
              className={`h-5 w-5 mr-2 ${isAnimating ? "animate-spin" : ""}`}
            />
            Find Nearby Loads
          </>
        )}

        {/* Ripple effect */}
        {isAnimating && (
          <motion.span
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-white rounded-full"
            style={{ transformOrigin: "center" }}
          />
        )}
      </Button>
    </motion.div>
  );
};

export default LoadRequestButton;
