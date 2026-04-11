/**
 * Session cookie flags must match across express-session and res.clearCookie.
 * On http://localhost, secure cookies are not stored — set COOKIE_SECURE=false in .env
 * even if NODE_ENV=production (common when testing locally).
 */
function useSecureSessionCookie() {
  if (process.env.COOKIE_SECURE === "false") return false;
  if (process.env.COOKIE_SECURE === "true") return true;
  return process.env.NODE_ENV === "production";
}

function adminSessionCookieOptions() {
  const secure = useSecureSessionCookie();
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1000,
  };
}

module.exports = { useSecureSessionCookie, adminSessionCookieOptions };
