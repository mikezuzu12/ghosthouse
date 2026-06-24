import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface UseAuthOptions {
  requiredRole?: 'customer' | 'driver' | 'admin';
  redirectTo?: string;
}

export function useAuth(options?: UseAuthOptions) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { requiredRole, redirectTo } = options || {};

  useEffect(() => {
    if (status === 'loading') return;

    // Not authenticated
    if (!session) {
      router.push(redirectTo || '/login');
      return;
    }

    // Get the user's role and convert to lowercase for case-insensitive comparison
    const userRole = session.user?.role?.toLowerCase();

    // Check role if required
    if (requiredRole) {
      const requiredRoleLower = requiredRole.toLowerCase();
      
      if (userRole !== requiredRoleLower) {
        // Redirect based on actual role (case-insensitive)
        if (userRole === 'driver') {
          router.push('/driver/dashboard');
        } else if (userRole === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      }
    }
  }, [session, status, router, requiredRole, redirectTo]);

  return {
    session,
    status,
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: !!session,
    isCustomer: session?.user?.role?.toLowerCase() === 'customer',
    isDriver: session?.user?.role?.toLowerCase() === 'driver',
    isAdmin: session?.user?.role?.toLowerCase() === 'admin',
  };
}