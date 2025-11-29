// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";

interface AuthContextType {
  role: string | null;
  loading: boolean;
  error: string | null;
  isStaff: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  role: null,
  loading: true,
  error: null,
  isStaff: false,
  isAdmin: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoaded } = useUser();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id;

  useEffect(() => {
    if (!isLoaded || !userId) {
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/users/${userId}`);

        if (!res.ok) throw new Error("Failed to fetch role");

        const data = await res.json();
        setRole(data.role);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [isLoaded, userId]);

  return (
    <AuthContext.Provider
      value={{
        role,
        loading,
        error,
        isStaff: role === "STAFF",
        isAdmin: role === "ADMIN",

      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthRole = () => useContext(AuthContext);
