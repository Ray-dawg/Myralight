import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function DeleteAccount() {
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (confirmText !== "DELETE") {
      setError('Please type "DELETE" to confirm');
      return;
    }

    setLoading(true);

    try {
      // For Supabase, we need to first authenticate the user again
      // before deleting their account
      if (user) {
        // Delete the user account
        const { error } = await supabase.rpc("delete_user");

        if (error) throw error;

        // Log the user out after successful deletion
        await logout();
        navigate("/");
      }
    } catch (error: any) {
      setError(error.message || "Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="space-y-2">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Delete Your Account
          </CardTitle>
          <p className="text-center text-gray-600">
            This action is permanent and cannot be undone. All your data will be
            permanently deleted.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDeleteAccount} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Enter your password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">
                Type <span className="font-bold">DELETE</span> to confirm
              </Label>
              <Input
                id="confirm"
                placeholder='Type "DELETE" here'
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                required
              />
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={loading}
              >
                {loading ? "Deleting Account..." : "Permanently Delete Account"}
              </Button>
            </div>

            <div className="text-center">
              <Button type="button" variant="link" onClick={() => navigate(-1)}>
                Cancel and go back
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
