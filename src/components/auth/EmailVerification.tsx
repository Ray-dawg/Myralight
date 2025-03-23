import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export default function EmailVerification() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="space-y-2">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Verify your email
          </CardTitle>
          <p className="text-center text-gray-600">
            We've sent a verification link to your email address. Please check
            your inbox and click the link to verify your account.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full">
            Resend verification email
          </Button>
          <p className="text-center text-sm text-gray-500">
            Didn't receive the email? Check your spam folder or try resending.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
