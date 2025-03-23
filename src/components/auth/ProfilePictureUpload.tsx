import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, Upload, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function ProfilePictureUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Check file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }

      // Check file type
      if (!selectedFile.type.startsWith("image/")) {
        setError("File must be an image");
        return;
      }

      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setError("");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select an image to upload");
      return;
    }

    setLoading(true);

    try {
      if (user) {
        // Upload file to Supabase Storage
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `profile-pictures/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        // Update user profile with avatar URL
        const { error: updateError } = await supabase.auth.updateUser({
          data: { avatar_url: data.publicUrl },
        });

        if (updateError) throw updateError;

        // Navigate back
        navigate(-1);
      }
    } catch (error: any) {
      setError(error.message || "Failed to upload profile picture");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="space-y-2">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Update Profile Picture
          </CardTitle>
          <p className="text-center text-gray-600">
            Upload a new profile picture to personalize your account
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              {previewUrl ? (
                <div className="flex flex-col items-center">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFile(null);
                      setPreviewUrl(null);
                    }}
                    className="mt-2"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-12 w-12 text-gray-400" />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="picture" className="block text-center">
                  Select a new profile picture
                </Label>
                <input
                  id="picture"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex justify-center">
                  <Label
                    htmlFor="picture"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md cursor-pointer transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    Choose File
                  </Label>
                </div>
                <p className="text-xs text-center text-gray-500 mt-2">
                  Supported formats: JPG, PNG, GIF (max 5MB)
                </p>
              </div>
            </div>

            <div className="pt-4 flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="w-1/2"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-1/2"
                disabled={loading || !file}
              >
                {loading ? "Uploading..." : "Upload Picture"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
