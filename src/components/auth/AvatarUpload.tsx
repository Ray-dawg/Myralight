import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Upload, X } from "lucide-react";
import { validateImageFile } from "@/lib/auth.utils";

interface AvatarUploadProps {
  onSuccess?: (url: string) => void;
}

const AvatarUpload = ({ onSuccess }: AvatarUploadProps) => {
  const { profile, uploadAvatar, deleteAvatar } = useAuth();
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast({
        title: "Invalid File",
        description: validation.message,
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      const response = await uploadAvatar(file);

      if (response.success && response.url) {
        toast({
          title: "Avatar Updated",
          description: "Your profile picture has been updated successfully.",
        });
        if (onSuccess) onSuccess(response.url);
      } else {
        toast({
          title: "Upload Failed",
          description:
            response.error || "Failed to upload avatar. Please try again.",
          variant: "destructive",
        });
        // Clear preview on error
        setPreviewUrl(null);
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Upload Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      // Clear preview on error
      setPreviewUrl(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await deleteAvatar();

      if (response.success) {
        toast({
          title: "Avatar Removed",
          description: "Your profile picture has been removed.",
        });
        setPreviewUrl(null);
        if (onSuccess) onSuccess("");
      } else {
        toast({
          title: "Removal Failed",
          description:
            response.error || "Failed to remove avatar. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting avatar:", error);
      toast({
        title: "Removal Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Determine avatar source
  const avatarUrl = previewUrl || profile?.avatar_url || "";
  const initials =
    profile?.first_name && profile?.last_name
      ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
      : profile?.email
        ? profile.email[0].toUpperCase()
        : "U";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={avatarUrl} alt="Profile" />
          <AvatarFallback className="text-lg">
            {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : initials}
          </AvatarFallback>
        </Avatar>

        {!loading && (
          <div className="absolute -bottom-2 -right-2 flex gap-1">
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full shadow-md"
              onClick={triggerFileInput}
            >
              <Upload className="h-4 w-4" />
              <span className="sr-only">Upload avatar</span>
            </Button>

            {(avatarUrl || profile?.avatar_url) && (
              <Button
                size="icon"
                variant="destructive"
                className="h-8 w-8 rounded-full shadow-md"
                onClick={handleDelete}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove avatar</span>
              </Button>
            )}
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <div className="text-center text-sm text-muted-foreground">
        <p>Upload a profile picture</p>
        <p className="text-xs">JPG, PNG or GIF, max 2MB</p>
      </div>
    </div>
  );
};

export default AvatarUpload;
