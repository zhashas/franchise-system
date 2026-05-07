import { supabase } from "./supabaseClient";

export async function logActivity({ action, details, metadata = {} }) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn("[Logger] No authenticated user");
      return;
    }

    // Get user profile for additional info
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, role")
      .eq("id", user.id)
      .single();

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      user_name: profile?.full_name || null,
      user_email: profile?.email || user.email,
      role: profile?.role || null,
      action,
      details,
      metadata,
    });
  } catch (error) {
    console.error("[Logger] Failed to log activity:", error);
  }
}
