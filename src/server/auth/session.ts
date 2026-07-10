import { auth } from "@/server/auth";

export async function getCurrentSession() {
  return auth();
}

export async function requireSession() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return session;
}
