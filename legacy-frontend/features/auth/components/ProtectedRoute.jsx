import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/features/auth";
import { checkProfileCompletion } from "@/core/lib/profileValidation";
import { useRef, useEffect } from "react";

export default function ProtectedRoute({ children }) {
  const { authUser, isCheckingAuth } = useAuthStore();
  const location = useLocation();
  const lastCheckRef = useRef(null);

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (!authUser) {
    return <Navigate to="/login" replace />;
  }

  // Check if profile is complete for routes that require it
  // Note: /main is excluded because users can complete their profile from there
  const routesRequiringCompleteProfile = [
    "/swipe",
    "/chat",
    "/matching-queue",
    "/discover",
  ];

  const requiresCompleteProfile = routesRequiringCompleteProfile.some((route) =>
    location.pathname.startsWith(route)
  );

  if (requiresCompleteProfile) {
    // Only check profile completion if authUser has changed or route has changed
    const currentCheck = `${authUser._id}-${location.pathname}`;

    if (lastCheckRef.current !== currentCheck) {
      lastCheckRef.current = currentCheck;

      const { isComplete, missingFields } = checkProfileCompletion(authUser);

      // If profile is incomplete, redirect to onboarding
      if (!isComplete && location.pathname !== "/onboarding") {
        console.log(
          "⚠️ [ProtectedRoute] Profile incomplete, redirecting to onboarding"
        );
        console.log("📋 [ProtectedRoute] Missing fields:", missingFields);
        return <Navigate to="/onboarding" replace />;
      }
    }
  }

  return children;
}
