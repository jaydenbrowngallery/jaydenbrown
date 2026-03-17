export function isAdmin(email?: string | null) {
  if (!email) return false;
  return email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
}