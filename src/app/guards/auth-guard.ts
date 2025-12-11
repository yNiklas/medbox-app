import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { createAuthGuard, AuthGuardData } from 'keycloak-angular';

const isAccessAllowed = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
  authData: AuthGuardData
): Promise<boolean> => {
  const { authenticated, grantedRoles, keycloak } = authData;

  // Force login if unauthenticated
  if (!authenticated) {
    await keycloak.login({
      redirectUri: window.location.origin + state.url
    });
    return false;
  }

  // Get required roles from route
  const requiredRoles: string[] = route.data['roles'];

  // If no roles required → allow
  if (!Array.isArray(requiredRoles) || requiredRoles.length === 0) {
    return true;
  }

  // If roles required → check them
  const hasRequiredRole = (role: string): boolean =>
    Object.values(grantedRoles.resourceRoles).some((roles) => roles.includes(role));
  return requiredRoles.every((role) => hasRequiredRole(role));
};

// Export the guard in functional style
export const canActivateAuth = createAuthGuard(isAccessAllowed);
