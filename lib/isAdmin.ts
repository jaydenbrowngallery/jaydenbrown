export function isAdmin(email?: string | null) {
  if (!email) return false;
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "thethethe33@gmail.com";
  return email === adminEmail;
}
