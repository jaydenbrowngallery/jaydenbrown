export function isAdmin(email?: string | null) {
  if (!email) return false;
  const adminEmails = [
    "thethethe33@gmail.com",
    "jaydenbrown@naver.com",
  ];
  return adminEmails.includes(email);
}
