import { redirect, useLocation } from '@tanstack/react-router';
import { useAuth } from '@clerk/clerk-react';; // your sign-in route object

export const useRequireAuth = () => {
  const { isSignedIn } = useAuth();
  const location = useLocation();

  if (!isSignedIn) {
    throw redirect({
      to: '/',
      search: { redirectTo: location.pathname }, // redirect back after login
    });
  }
};
