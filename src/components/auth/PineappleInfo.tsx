import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth.tsx";
import { useState } from "react";
import { AlertCircle, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function PineappleInfo() {
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const isProd = process.env.NODE_ENV === "production";

  // Function to handle login with a specific role
  const handleLogin = async (
    role: "admin" | "driver" | "carrier" | "shipper",
  ) => {
    try {
      setIsLoading(role);
      console.log(`Pineapple login clicked for ${role}`);
      await auth.login(role);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col gap-4 items-center max-w-md w-full px-4">
      {isProd && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-lg flex items-center gap-2 text-sm mb-2 w-full">
          <AlertCircle className="h-4 w-4" />
          <span>Production mode: Security code required (7714)</span>
        </div>
      )}

      <div className="flex flex-wrap gap-4 justify-center w-full">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 min-w-[140px] max-w-[200px] bg-white hover:bg-gray-100 relative"
                onClick={() => handleLogin("admin")}
                disabled={!!isLoading}
              >
                {isLoading === "admin" ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Loading...
                  </span>
                ) : (
                  <span>🍍 Admin</span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Bypass as Admin user</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 min-w-[140px] max-w-[200px] bg-white hover:bg-gray-100"
                onClick={() => handleLogin("driver")}
                disabled={!!isLoading}
              >
                {isLoading === "driver" ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Loading...
                  </span>
                ) : (
                  <span>🍍 Driver</span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Bypass as Driver user</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 min-w-[140px] max-w-[200px] bg-white hover:bg-gray-100"
                onClick={() => handleLogin("carrier")}
                disabled={!!isLoading}
              >
                {isLoading === "carrier" ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Loading...
                  </span>
                ) : (
                  <span>🍍 Carrier</span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Bypass as Carrier user</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 min-w-[140px] max-w-[200px] bg-white hover:bg-gray-100"
                onClick={() => handleLogin("shipper")}
                disabled={!!isLoading}
              >
                {isLoading === "shipper" ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Loading...
                  </span>
                ) : (
                  <span>🍍 Shipper</span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Bypass as Shipper user</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="text-xs text-gray-500 text-center mt-2 flex items-center justify-center gap-1">
        <Info className="h-3 w-3" />
        <span>Pineapple bypass sessions last for 365 days</span>
      </div>
    </div>
  );
}
