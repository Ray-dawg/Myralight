import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export default function PineappleInfo() {
  const { login } = useAuth();

  const loginAs = (role: string) => {
    login(role);
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-wrap gap-4 justify-center max-w-md w-full px-4">
      <Button
        variant="outline"
        className="flex-1 min-w-[140px] max-w-[200px]"
        onClick={() => loginAs("admin")}
      >
        🍍 Admin
      </Button>
      <Button
        variant="outline"
        className="flex-1 min-w-[140px] max-w-[200px]"
        onClick={() => loginAs("driver")}
      >
        🍍 Driver
      </Button>
      <Button
        variant="outline"
        className="flex-1 min-w-[140px] max-w-[200px]"
        onClick={() => loginAs("carrier")}
      >
        🍍 Carrier
      </Button>
      <Button
        variant="outline"
        className="flex-1 min-w-[140px] max-w-[200px]"
        onClick={() => loginAs("shipper")}
      >
        🍍 Shipper
      </Button>
    </div>
  );
}
