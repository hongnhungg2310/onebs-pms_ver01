// Admin endpoint to create a new user (email + password) and assign role.
// Only callers who are themselves admin (verified via JWT) may invoke this.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type Role = "admin" | "manager" | "member" | "director";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Verify caller is admin
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json(401, { error: "Missing authorization" });

  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return json(401, { error: "Invalid session" });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: roleRow, error: roleErr } = await admin
    .from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
  if (roleErr) return json(500, { error: roleErr.message });
  if (!roleRow) return json(403, { error: "Chỉ quản trị viên mới được tạo người dùng" });

  let body: any;
  try { body = await req.json(); } catch { return json(400, { error: "Invalid JSON" }); }

  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const role = String(body?.role ?? "member") as Role;

  if (!name || name.length > 100) return json(400, { error: "Họ tên không hợp lệ" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255)
    return json(400, { error: "Email không hợp lệ" });
  if (password.length < 8 || password.length > 72)
    return json(400, { error: "Mật khẩu phải từ 8 đến 72 ký tự" });
  if (!["admin", "manager", "member", "director"].includes(role))
    return json(400, { error: "Vai trò không hợp lệ" });

  // Create the auth user (email pre-confirmed so they can sign in immediately)
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (createErr || !created.user) return json(400, { error: createErr?.message ?? "Không tạo được tài khoản" });

  const newId = created.user.id;

  // handle_new_user trigger creates profile + member role. Ensure correct name + role.
  await admin.from("profiles").upsert({ id: newId, email, full_name: name });

  if (role !== "member") {
    await admin.from("user_roles").delete().eq("user_id", newId);
    const { error: rErr } = await admin.from("user_roles").insert({ user_id: newId, role });
    if (rErr) return json(500, { error: rErr.message });
  }

  return json(200, { id: newId, email, name, role });
});
