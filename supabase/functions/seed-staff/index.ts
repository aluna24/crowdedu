import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STAFF = [
  { email: "lhwcadmin@email.gwu.edu", password: "Healthx.Wellness2103!", full_name: "LHWC Admin", role: "admin" },
  { email: "lhwcstaff@email.gwu.edu", password: "LernerisGreat2103!", full_name: "LHWC Staff", role: "employee" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const results: Array<Record<string, unknown>> = [];

  for (const s of STAFF) {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: s.email,
      password: s.password,
      email_confirm: true,
      user_metadata: { full_name: s.full_name, role: s.role, staff_seed: true },
    });

    let userId = created?.user?.id;

    if (createErr) {
      // If user already exists, find them
      const { data: list } = await admin.auth.admin.listUsers();
      const existing = list?.users.find((u) => u.email?.toLowerCase() === s.email.toLowerCase());
      if (!existing) {
        results.push({ email: s.email, status: "error", error: createErr.message });
        continue;
      }
      userId = existing.id;
      // Update password to match
      await admin.auth.admin.updateUserById(userId, { password: s.password });
      // Ensure profile exists
      await admin.from("profiles").upsert({ id: userId, email: s.email, full_name: s.full_name });
    }

    if (!userId) {
      results.push({ email: s.email, status: "error", error: "no user id" });
      continue;
    }

    // Ensure correct role; remove any other roles for this user
    await admin.from("user_roles").delete().eq("user_id", userId);
    const { error: roleErr } = await admin.from("user_roles").insert({ user_id: userId, role: s.role });

    results.push({
      email: s.email,
      status: roleErr ? "role_error" : "ok",
      role: s.role,
      error: roleErr?.message,
    });
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
