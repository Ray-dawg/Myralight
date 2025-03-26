import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface SocialLoginButtonsProps {
  redirectTo?: string;
}

export default function SocialLoginButtons({
  redirectTo = "/",
}: SocialLoginButtonsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSocialLogin = async (
    provider: "google" | "github" | "facebook",
  ) => {
    try {
      setIsLoading(provider);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}${redirectTo}`,
        },
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in with social provider",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="flex flex-col space-y-3">
      <Button
        variant="outline"
        type="button"
        disabled={isLoading !== null}
        onClick={() => handleSocialLogin("google")}
        className="flex items-center justify-center gap-2"
      >
        {isLoading === "google" ? (
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary"></div>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8" />
            <path d="M8 12h8" />
          </svg>
        )}
        Continue with Google
      </Button>

      <Button
        variant="outline"
        type="button"
        disabled={isLoading !== null}
        onClick={() => handleSocialLogin("github")}
        className="flex items-center justify-center gap-2"
      >
        {isLoading === "github" ? (
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary"></div>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
          </svg>
        )}
        Continue with GitHub
      </Button>
    </div>
  );
}
