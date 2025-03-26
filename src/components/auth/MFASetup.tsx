import { useState, useEffect } from "react";
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
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface MFASetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

const MFASetup = ({ onComplete, onCancel }: MFASetupProps) => {
  const { enableMFA, verifyMFA } = useAuth();
  const [loading, setLoading] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [setupInfo, setSetupInfo] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initMFA = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await enableMFA();
        if (response.success && response.setupInfo) {
          setSetupInfo(response.setupInfo);
        } else {
          setError(response.error || "Failed to initialize MFA setup");
          toast({
            title: "MFA Setup Error",
            description: response.error || "Failed to initialize MFA setup",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error("Error initializing MFA:", err);
        setError("An unexpected error occurred. Please try again.");
        toast({
          title: "MFA Setup Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    initMFA();
  }, [enableMFA]);

  const handleVerify = async () => {
    if (!verificationCode || !setupInfo) return;

    setLoading(true);
    setError(null);
    try {
      const response = await verifyMFA(
        setupInfo.factorId,
        setupInfo.challengeId,
        verificationCode,
      );

      if (response.success) {
        setSetupComplete(true);
        setRecoveryCodes(setupInfo.recoveryCodes || []);
        toast({
          title: "MFA Enabled",
          description:
            "Multi-factor authentication has been successfully enabled for your account.",
        });
      } else {
        setError(response.error || "Failed to verify code");
        toast({
          title: "Verification Failed",
          description:
            response.error || "Failed to verify code. Please try again.",
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

  const handleComplete = () => {
    if (onComplete) onComplete();
  };

  if (loading && !setupInfo) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Setting Up Two-Factor Authentication</CardTitle>
          <CardDescription>
            Please wait while we prepare your 2FA setup...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (setupComplete) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            Two-Factor Authentication Enabled
          </CardTitle>
          <CardDescription>
            Your account is now protected with an additional layer of security.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recoveryCodes.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">Recovery Codes</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Save these recovery codes in a secure place. You can use them to
                access your account if you lose your authenticator device.
              </p>
              <div className="bg-muted p-3 rounded-md">
                <ul className="text-sm font-mono">
                  {recoveryCodes.map((code, index) => (
                    <li key={index}>{code}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleComplete} className="w-full">
            Done
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Set Up Two-Factor Authentication</CardTitle>
        <CardDescription>
          Enhance your account security by enabling two-factor authentication.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {setupInfo?.qrCode && (
          <div className="mb-6">
            <h3 className="font-medium mb-2">1. Scan QR Code</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Scan this QR code with your authenticator app (like Google
              Authenticator, Authy, or Microsoft Authenticator).
            </p>
            <div className="flex justify-center mb-4">
              <div
                className="bg-white p-2 rounded-md"
                dangerouslySetInnerHTML={{ __html: setupInfo.qrCode }}
              />
            </div>
            {setupInfo.secret && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">
                  Or enter this code manually:
                </p>
                <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                  {setupInfo.secret}
                </code>
              </div>
            )}
          </div>
        )}

        <div>
          <h3 className="font-medium mb-2">2. Enter Verification Code</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Enter the 6-digit code from your authenticator app to verify setup.
          </p>
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
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleVerify}
          disabled={loading || verificationCode.length !== 6}
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Verify & Enable
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MFASetup;
