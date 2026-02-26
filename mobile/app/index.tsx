import { Redirect } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";

export default function Index() {
  const { session, loading } = useAuthStore();
  if (loading) return null;
  return <Redirect href={session ? "/(tabs)" : "/auth/login"} />;
}
