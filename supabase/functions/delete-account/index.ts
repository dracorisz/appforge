import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const json = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json" },
});

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed." });

  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return json(401, { error: "Authentication required." });

  const body = await req.json().catch(() => ({}));
  if (body?.confirm !== "DELETE") return json(400, { error: "Type DELETE to confirm account deletion." });

  const url = Deno.env.get("SUPABASE_URL") || "";
  const publishable = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!url || !publishable || !serviceRole) return json(500, { error: "Account deletion is not configured." });

  const userClient = createClient(url, publishable, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json(401, { error: "Authentication required." });

  const admin = createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: deleteError } = await admin.auth.admin.deleteUser(userData.user.id, false);
  if (deleteError) {
    console.error("delete-account failed", { userId: userData.user.id, message: deleteError.message });
    return json(500, { error: "Could not delete the account. Remove account-owned storage objects or contact support if this continues." });
  }

  return json(200, { deleted: true });
});
