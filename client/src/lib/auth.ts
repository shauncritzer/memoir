/**
 * Get the login URL for Manus OAuth
 */
export function getLoginUrl(redirectTo?: string): string {
  const baseUrl = import.meta.env.VITE_OAUTH_PORTAL_URL || "https://portal.manus.im";
  const appId = import.meta.env.VITE_APP_ID;
  
  if (!appId) {
    console.error("VITE_APP_ID is not configured");
    return "/";
  }
  
  const params = new URLSearchParams({
    app_id: appId,
    redirect_uri: `${window.location.origin}/api/oauth/callback`,
  });
  
  if (redirectTo) {
    params.append("state", redirectTo);
  }
  
  return `${baseUrl}/login?${params.toString()}`;
}

/**
 * Logout the current user
 */
export async function logout() {
  // Call the logout mutation via tRPC
  // This will be handled by the component using trpc.auth.logout.useMutation()
  window.location.href = "/";
}
