import { redirect } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export default async function Home() {
  // If Supabase is configured, fetch the first available user
  if (isSupabaseConfigured()) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .limit(1)
        .single();
      
      if (profile && profile.username) {
        redirect(`/book/${profile.username}`);
      }
    } catch (err) {
      console.error("Error fetching initial user for redirect:", err);
    }
  }
  
  // Fallback to the mock user if Supabase is not configured or query failed/empty
  redirect("/book/icyflame06j8e");
}
