import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const GUEST_COOKIE = "mt_guest";

function createGuestToken() {
  return crypto.randomUUID();
}

export async function getOrCreateGuestProfile() {
  const cookieStore = await cookies();
  let guestToken = cookieStore.get(GUEST_COOKIE)?.value;

  if (!guestToken) {
    guestToken = createGuestToken();
    cookieStore.set(GUEST_COOKIE, guestToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365
    });
  }

  return prisma.userProfile.upsert({
    where: { guestToken },
    update: {},
    create: { guestToken }
  });
}
