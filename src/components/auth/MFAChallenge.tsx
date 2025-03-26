import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Loader2, AlertCircle } from "lucide-react";

interface MFAChallengeProps {
  factorId: string;
  challengeId: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

const MFAChallenge = ({
  factorId,
  challengeId,
  onSuccess,
  onCancel,
}: MFAChallengeProps) => {
  const { verifyMFA } = useAuth();
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!verificationCode) return;

    setLoading(true);
    setError(null);
    try {
      const response = await verifyMFA(factorId, challengeId, verificationCode);

      if (response.success) {
        toast({
          title: "Verification Successful",
          description: "Your identity has been verified.",
        });
        onSuccess();
      } else {
        setError(response.error || "Invalid verification code");
        toast({
          title: "Verification Failed",
          description:
            response.error || "Invalid verification code. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error verifying MFA code:", err);
      setError("An unexpected error occurred. Please try again.");
      toast({
        title: "Verification Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Enter the verification code from your authenticator app to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <Input
            type="text"
            placeholder="Enter 6-digit code"
            value={verificationCode}
            onChange={(e) =>
              setVerificationCode(
                e.target.value.replace(/\D/g, "").substring(0, 6),
              )
            }
            className="text-center text-lg tracking-widest font-mono"
            maxLength={6}
            autoFocus
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button
          onClick={handleVerify}
          disabled={loading || verificationCode.length !== 6}
          className={onCancel ? "" : "w-full"}
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Verify
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MFAChallenge;
