// Seed demo users + projects + tasks + documents for OneBS PMS demo.
// Idempotent: safe to call multiple times.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Role = "admin" | "manager" | "member" | "director";
const DEMO_PASSWORD = "Demo@1234";

const DEMO_USERS: { email: string; full_name: string; role: Role; locked?: boolean }[] = [
  { email: "an.nguyen@onebs.vn", full_name: "Nguyễn Văn An", role: "admin" },
  { email: "binh.tran@onebs.vn", full_name: "Trần Thị Bình", role: "manager" },
  { email: "cuong.le@onebs.vn", full_name: "Lê Hoàng Cường", role: "member" },
  { email: "duyen.pham@onebs.vn", full_name: "Phạm Mỹ Duyên", role: "member" },
  { email: "em.vu@onebs.vn", full_name: "Vũ Quốc Em", role: "member", locked: true },
  { email: "giamdoc.hoang@onebs.vn", full_name: "Hoàng Minh Giám", role: "director" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Ensure users exist
    const userIds: Record<string, string> = {};
    for (const u of DEMO_USERS) {
      // Try to find existing
      const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
      let existing = list?.users.find((x) => x.email?.toLowerCase() === u.email.toLowerCase());
      if (!existing) {
        const { data: created, error } = await supabase.auth.admin.createUser({
          email: u.email,
          password: DEMO_PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: u.full_name },
        });
        if (error) throw new Error(`createUser ${u.email}: ${error.message}`);
        existing = created.user!;
      }
      userIds[u.email] = existing.id;

      // Update profile
      await supabase.from("profiles").update({
        full_name: u.full_name,
        locked: !!u.locked,
      }).eq("id", existing.id);

      // Set role: clear and reinsert desired
      await supabase.from("user_roles").delete().eq("user_id", existing.id);
      await supabase.from("user_roles").insert({ user_id: existing.id, role: u.role });
    }

    const adminId = userIds["an.nguyen@onebs.vn"];
    const mgrId = userIds["binh.tran@onebs.vn"];
    const m1 = userIds["cuong.le@onebs.vn"];
    const m2 = userIds["duyen.pham@onebs.vn"];

    // 2. Wipe existing demo data and reseed (only if no projects yet to keep idempotent on subsequent)
    const { count } = await supabase.from("projects").select("*", { count: "exact", head: true });
    if ((count ?? 0) === 0) {
      const projects = [
        { name: "Hệ thống ERP nội bộ", description: "Xây dựng hệ thống quản trị nguồn lực doanh nghiệp cho OneBS.", status: "in_progress", progress: 65, start_date: "2025-01-15", end_date: "2025-08-30", created_by: adminId, members: [adminId, mgrId, m1] },
        { name: "Website thương mại điện tử", description: "Nền tảng TMĐT B2B cho khách hàng doanh nghiệp.", status: "in_progress", progress: 40, start_date: "2025-03-01", end_date: "2025-10-15", created_by: mgrId, members: [mgrId, m2] },
        { name: "Ứng dụng Mobile CRM", description: "App di động quản lý quan hệ khách hàng cho đội sales.", status: "planning", progress: 10, start_date: "2025-04-01", end_date: "2025-12-30", created_by: adminId, members: [adminId, m1, m2] },
        { name: "Migration Cloud AWS", description: "Di chuyển hạ tầng on-premise lên AWS.", status: "completed", progress: 100, start_date: "2024-09-01", end_date: "2025-02-28", created_by: adminId, members: [adminId, mgrId] },
      ];

      const projectIds: string[] = [];
      for (const p of projects) {
        const { members, ...row } = p;
        const { data, error } = await supabase.from("projects").insert(row).select("id").single();
        if (error) throw new Error(`project: ${error.message}`);
        projectIds.push(data.id);
        await supabase.from("project_members").insert(members.map((uid) => ({ project_id: data.id, user_id: uid })));
      }

      const [p1, p2, p3] = projectIds;
      const tasks = [
        { project_id: p1, title: "Thiết kế database module HR", description: "Vẽ ERD và viết script tạo bảng", status: "done", priority: "high", assignee_id: m1, due_date: "2025-03-15" },
        { project_id: p1, title: "API quản lý nhân sự", description: "Xây dựng REST API CRUD nhân viên", status: "in_progress", priority: "high", assignee_id: m1, due_date: "2025-05-20" },
        { project_id: p1, title: "Giao diện Dashboard HR", description: "Thiết kế UI dashboard cho HR", status: "review", priority: "medium", assignee_id: m2, due_date: "2025-05-10" },
        { project_id: p2, title: "Trang chủ TMĐT", description: "Landing page và catalog sản phẩm", status: "in_progress", priority: "high", assignee_id: m2, due_date: "2025-06-01" },
        { project_id: p2, title: "Tích hợp cổng thanh toán", description: "VNPay, Momo", status: "todo", priority: "medium", assignee_id: mgrId, due_date: "2025-07-15" },
        { project_id: p3, title: "Phân tích yêu cầu CRM Mobile", description: "Khảo sát đội sales", status: "in_progress", priority: "high", assignee_id: adminId, due_date: "2025-04-30" },
      ];
      await supabase.from("tasks").insert(tasks);

      await supabase.from("documents").insert([
        { name: "Quy trình quản lý dự án OneBS.pdf", category: "Quy trình", size: "1.8 MB", uploaded_by: adminId },
        { name: "Template báo cáo tuần.docx", category: "Template", size: "120 KB", uploaded_by: mgrId },
        { name: "Coding convention.pdf", category: "Tiêu chuẩn", size: "640 KB", uploaded_by: m1 },
        { name: "Hướng dẫn Git workflow.md", category: "Hướng dẫn", size: "45 KB", uploaded_by: adminId },
      ]);
    }

    return new Response(
      JSON.stringify({ success: true, password: DEMO_PASSWORD, users: DEMO_USERS.map((u) => u.email) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
