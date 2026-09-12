import { getCurrentUser } from "@/lib/auth";
import { Landing } from "@/components/landing";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  return <Landing loggedIn={!!user} />;
}
