import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { sanitizeString, isValidEmail } from "@/lib/auth.utils";
import PineappleInfo from "./PineappleInfo";

export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");

  const auth = useAuth();
  const { loginWithCredentials } = auth;

  // Fetch CSRF token on component mount
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-csrf-token`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            credentials: "include", // Important for cookies
          },
        );

        if (response.ok) {
          const data = await response.json();
          setCsrfToken(data.csrfToken);
        } else {
          console.error("Failed to fetch CSRF token");
        }
      } catch (error) {
        console.error("Error fetching CSRF token:", error);
      }
    };

    fetchCsrfToken();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Sanitize email input
    const sanitizedEmail = sanitizeString(formData.email);
    // Don't sanitize password as it may contain special characters
    const password = formData.password;

    // Validate email format
    if (!isValidEmail(sanitizedEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    // Validate CSRF token exists
    if (!csrfToken) {
      setError(
        "Security token missing. Please refresh the page and try again.",
      );
      return;
    }

    setLoading(true);

    try {
      if (typeof loginWithCredentials !== "function") {
        console.error(
          "loginWithCredentials is not a function:",
          loginWithCredentials,
        );
        console.log("Full auth object:", auth);
        setError("Authentication system error. Please try again.");
        return;
      }
      const { success, error } = await loginWithCredentials(
        sanitizedEmail,
        password,
        csrfToken, // Pass CSRF token to login function
      );
      if (!success && error) {
        setError(error);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setError(
        error.message || "Failed to login. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold text-center">
            Sign In
          </CardTitle>
          <p className="text-center text-gray-600">
            Enter your credentials to access your account
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>

            {/* Hidden CSRF token field */}
            <input type="hidden" name="csrfToken" value={csrfToken} />

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !csrfToken}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            <p className="text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:underline">
                Create Account
              </Link>
            </p>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-4 text-center">
              Developer Options
            </h3>
            <PineappleInfo />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
