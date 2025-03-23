import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Navigation } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function RequestLoadButton() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    setIsLoading(true);
    // Navigate to the load discovery page
    navigate("/driver/loads/discover");
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      className="w-full md:w-auto"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <Navigation className="h-4 w-4 mr-2" />
      )}
      Request Load
    </Button>
  );
}
