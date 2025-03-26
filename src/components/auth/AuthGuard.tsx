import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth.tsx";

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

export default function AuthGuard({
  children,
  allowedRoles = [],
  redirectTo = "/login",
}: AuthGuardProps) {
  const { user, profile, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Skip check if still loading
    if (loading) {
      console.log("AuthGuard: Still loading, skipping check");
      return;
    }

    console.log("AuthGuard: Checking authentication and roles", {
      isAuthenticated,
      userRole: profile?.role || user?.user_metadata?.role,
      allowedRoles,
      path: location.pathname,
    });

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      console.log("AuthGuard: Not authenticated, redirecting to", redirectTo);
      navigate(redirectTo, {
        state: { from: location.pathname },
      });
      return;
    }

    // If roles are specified, check if user has required role
    if (allowedRoles.length > 0) {
      const userRole = profile?.role || user?.user_metadata?.role;
      console.log("AuthGuard: Checking role access", {
        userRole,
        allowedRoles,
      });

      if (!userRole) {
        console.error("AuthGuard: No user role found in profile or metadata");
        navigate("/");
        return;
      }

      if (!allowedRoles.includes(userRole)) {
        console.log(
          `AuthGuard: User role ${userRole} not allowed, redirecting to role dashboard`,
        );
        // Redirect to appropriate dashboard based on role
        navigate(`/${userRole}`);
        return;
      }

      console.log(
        `AuthGuard: User has required role ${userRole}, allowing access`,
      );
    }
  }, [
    user,
    profile,
    loading,
    isAuthenticated,
    allowedRoles,
    navigate,
    location.pathname,
    redirectTo,
  ]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated or not authorized, render nothing (redirect will happen)
  if (!isAuthenticated) {
    console.log("AuthGuard: Not rendering children - not authenticated");
    return null;
  }

  // If roles are specified and user doesn't have required role, render nothing
  if (allowedRoles.length > 0) {
    const userRole = profile?.role || user?.user_metadata?.role;
    if (!userRole) {
      console.error("AuthGuard: No user role found, not rendering children");
      return null;
    }

    if (!allowedRoles.includes(userRole)) {
      console.log(
        `AuthGuard: User role ${userRole} not in allowed roles ${allowedRoles.join(", ")}, not rendering children`,
      );
      return null;
    }

    console.log(`AuthGuard: User role ${userRole} authorized for this route`);
  }

  // Otherwise, render children
  return <>{children}</>;
}
