// Supabase-backed store for OneBS PMS.
// Shape mirrors the previous mock store so existing pages need minimal changes.
import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ProjectStatus = "planning" | "in_progress" | "completed" | "on_hold";
export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type UserRole = "admin" | "manager" | "member";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  locked: boolean;
  avatar?: string;
}

export interface ProjectDoc {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  startDate: string;
  endDate: string;
  members: string[];
  documents: ProjectDoc[];
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  rating?: number;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: "low" | "medium" | "high";
  assignee: string;
  dueDate: string;
  comments: Comment[];
}

export interface Document {
  id: string;
  name: string;
  category: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ProjectActivity {
  id: string;
  projectId: string;
  actorId: string | null;
  actorName: string;
  actionType: string;
  description: string;
  createdAt: string;
}

interface Store {
  initialized: boolean;
  loading: boolean;
  currentUser: User | null;
  users: User[];
  projects: Project[];
  tasks: Task[];
  documents: Document[];
  activities: ProjectActivity[];

  logActivity: (projectId: string, actionType: string, description: string) => Promise<void>;

  init: () => Promise<void>;
  refreshAll: () => Promise<void>;
  logout: () => Promise<void>;

  updateProfile: (patch: Partial<User>) => Promise<void>;
  changePassword: (newPassword: string) => Promise<boolean>;

  addProject: (p: Omit<Project, "id" | "documents" | "members"> & { members?: string[] }) => Promise<void>;
  updateProject: (id: string, patch: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  addTask: (t: Omit<Task, "id" | "comments">) => Promise<void>;
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addComment: (taskId: string, comment: Omit<Comment, "id" | "createdAt">) => Promise<void>;

  addDocument: (d: Omit<Document, "id" | "uploadedAt">) => Promise<void>;
  updateDocument: (id: string, patch: Partial<Document>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;

  addUser: (u: Omit<User, "id" | "locked">) => Promise<void>;
  updateUser: (id: string, patch: Partial<User>) => Promise<void>;
  toggleLockUser: (id: string) => Promise<void>;
}

const nameFromProfile = (full_name: string, email: string) => full_name?.trim() || email.split("@")[0];

export const useStore = create<Store>((set, get) => ({
  initialized: false,
  loading: false,
  currentUser: null,
  users: [],
  projects: [],
  tasks: [],
  documents: [],
  activities: [],

  logActivity: async (projectId, actionType, description) => {
    const cur = get().currentUser;
    if (!cur) return;
    const { error } = await supabase.from("project_activities").insert({
      project_id: projectId,
      actor_id: cur.id,
      action_type: actionType,
      description,
    });
    if (error) { console.error(error); return; }
    const { data } = await supabase
      .from("project_activities")
      .select("*")
      .order("created_at", { ascending: false });
    const userNameById = new Map(get().users.map((u) => [u.id, u.name]));
    const activities: ProjectActivity[] = (data ?? []).map((a: any) => ({
      id: a.id,
      projectId: a.project_id,
      actorId: a.actor_id,
      actorName: userNameById.get(a.actor_id) ?? "Hệ thống",
      actionType: a.action_type,
      description: a.description,
      createdAt: a.created_at,
    }));
    set({ activities });
  },

  init: async () => {
    if (get().initialized) return;
    set({ initialized: true });

    const apply = async (uid: string | null) => {
      if (!uid) {
        set({ currentUser: null, users: [], projects: [], tasks: [], documents: [] });
        return;
      }
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", uid),
      ]);
      const role = (roles?.[0]?.role ?? "member") as UserRole;
      if (profile) {
        set({
          currentUser: {
            id: profile.id,
            name: nameFromProfile(profile.full_name, profile.email),
            email: profile.email,
            role,
            locked: profile.locked,
            avatar: profile.avatar_url ?? undefined,
          },
        });
      }
      await get().refreshAll();
    };

    supabase.auth.onAuthStateChange((_event, session) => {
      // Defer Supabase calls to avoid deadlocks
      setTimeout(() => apply(session?.user?.id ?? null), 0);
    });

    const { data: { session } } = await supabase.auth.getSession();
    await apply(session?.user?.id ?? null);
  },

  refreshAll: async () => {
    set({ loading: true });
    try {
      const [profilesRes, rolesRes, projectsRes, membersRes, tasksRes, commentsRes, docsRes, projDocsRes, activitiesRes] =
        await Promise.all([
          supabase.from("profiles").select("*").order("full_name"),
          supabase.from("user_roles").select("user_id, role"),
          supabase.from("projects").select("*").order("created_at", { ascending: false }),
          supabase.from("project_members").select("*"),
          supabase.from("tasks").select("*").order("created_at", { ascending: false }),
          supabase.from("task_comments").select("*").order("created_at"),
          supabase.from("documents").select("*").order("created_at", { ascending: false }),
          supabase.from("project_documents").select("*").order("created_at", { ascending: false }),
          supabase.from("project_activities").select("*").order("created_at", { ascending: false }),
        ]);

      const roleMap = new Map<string, UserRole>();
      (rolesRes.data ?? []).forEach((r: any) => roleMap.set(r.user_id, r.role));

      const users: User[] = (profilesRes.data ?? []).map((p: any) => ({
        id: p.id,
        name: nameFromProfile(p.full_name, p.email),
        email: p.email,
        role: roleMap.get(p.id) ?? "member",
        locked: p.locked,
        avatar: p.avatar_url ?? undefined,
      }));
      const userNameById = new Map(users.map((u) => [u.id, u.name]));

      const memberByProj = new Map<string, string[]>();
      (membersRes.data ?? []).forEach((m: any) => {
        const arr = memberByProj.get(m.project_id) ?? [];
        arr.push(m.user_id);
        memberByProj.set(m.project_id, arr);
      });

      const docsByProj = new Map<string, ProjectDoc[]>();
      (projDocsRes.data ?? []).forEach((d: any) => {
        const arr = docsByProj.get(d.project_id) ?? [];
        arr.push({ id: d.id, name: d.name, size: d.size, uploadedAt: d.created_at?.slice(0, 10) ?? "" });
        docsByProj.set(d.project_id, arr);
      });

      const projects: Project[] = (projectsRes.data ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description ?? "",
        status: p.status,
        progress: p.progress,
        startDate: p.start_date,
        endDate: p.end_date,
        members: memberByProj.get(p.id) ?? [],
        documents: docsByProj.get(p.id) ?? [],
      }));

      const commentsByTask = new Map<string, Comment[]>();
      (commentsRes.data ?? []).forEach((c: any) => {
        const arr = commentsByTask.get(c.task_id) ?? [];
        arr.push({
          id: c.id,
          author: userNameById.get(c.author_id) ?? "Ẩn danh",
          content: c.content,
          rating: c.rating ?? undefined,
          createdAt: c.created_at,
        });
        commentsByTask.set(c.task_id, arr);
      });

      const tasks: Task[] = (tasksRes.data ?? []).map((t: any) => ({
        id: t.id,
        projectId: t.project_id,
        title: t.title,
        description: t.description ?? "",
        status: t.status,
        priority: t.priority,
        assignee: t.assignee_id ?? "",
        dueDate: t.due_date ?? "",
        comments: commentsByTask.get(t.id) ?? [],
      }));

      const documents: Document[] = (docsRes.data ?? []).map((d: any) => ({
        id: d.id,
        name: d.name,
        category: d.category ?? "",
        size: d.size ?? "",
        uploadedBy: userNameById.get(d.uploaded_by) ?? "—",
        uploadedAt: d.created_at?.slice(0, 10) ?? "",
      }));

      set({ users, projects, tasks, documents, loading: false });
    } catch (e) {
      console.error(e);
      set({ loading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ currentUser: null, users: [], projects: [], tasks: [], documents: [] });
  },

  updateProfile: async (patch) => {
    const cur = get().currentUser; if (!cur) return;
    const dbPatch: any = {};
    if (patch.name !== undefined) dbPatch.full_name = patch.name;
    if (patch.email !== undefined) dbPatch.email = patch.email;
    if (patch.avatar !== undefined) dbPatch.avatar_url = patch.avatar;
    const { error } = await supabase.from("profiles").update(dbPatch).eq("id", cur.id);
    if (error) { toast.error(error.message); return; }
    set({ currentUser: { ...cur, ...patch } });
  },

  changePassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { toast.error(error.message); return false; }
    return true;
  },

  addProject: async (p) => {
    const { data, error } = await supabase.from("projects").insert({
      name: p.name, description: p.description, status: p.status, progress: p.progress,
      start_date: p.startDate, end_date: p.endDate, created_by: get().currentUser?.id,
    }).select("id").single();
    if (error) { toast.error(error.message); return; }
    if (p.members?.length && data) {
      await supabase.from("project_members").insert(p.members.map((uid) => ({ project_id: data.id, user_id: uid })));
    }
    await get().refreshAll();
  },

  updateProject: async (id, patch) => {
    const dbPatch: any = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.description !== undefined) dbPatch.description = patch.description;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.progress !== undefined) dbPatch.progress = patch.progress;
    if (patch.startDate !== undefined) dbPatch.start_date = patch.startDate;
    if (patch.endDate !== undefined) dbPatch.end_date = patch.endDate;
    if (Object.keys(dbPatch).length) {
      const { error } = await supabase.from("projects").update(dbPatch).eq("id", id);
      if (error) { toast.error(error.message); return; }
    }
    if (patch.members !== undefined) {
      await supabase.from("project_members").delete().eq("project_id", id);
      if (patch.members.length) {
        await supabase.from("project_members").insert(patch.members.map((uid) => ({ project_id: id, user_id: uid })));
      }
    }
    if (patch.documents !== undefined) {
      // Sync project_documents: add new ones (those without matching id in DB) and delete removed
      const existing = get().projects.find((p) => p.id === id)?.documents ?? [];
      const existingIds = new Set(existing.map((d) => d.id));
      const newIds = new Set(patch.documents.map((d) => d.id));
      const toDelete = [...existingIds].filter((x) => !newIds.has(x));
      const toAdd = patch.documents.filter((d) => !existingIds.has(d.id));
      if (toDelete.length) await supabase.from("project_documents").delete().in("id", toDelete);
      if (toAdd.length) {
        await supabase.from("project_documents").insert(
          toAdd.map((d) => ({ project_id: id, name: d.name, size: d.size, uploaded_by: get().currentUser?.id })),
        );
      }
    }
    await get().refreshAll();
  },

  deleteProject: async (id) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    await get().refreshAll();
  },

  addTask: async (t) => {
    const { error } = await supabase.from("tasks").insert({
      project_id: t.projectId, title: t.title, description: t.description,
      status: t.status, priority: t.priority,
      assignee_id: t.assignee || null, due_date: t.dueDate || null,
    });
    if (error) { toast.error(error.message); return; }
    await get().refreshAll();
  },

  updateTask: async (id, patch) => {
    const dbPatch: any = {};
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.description !== undefined) dbPatch.description = patch.description;
    if (patch.projectId !== undefined) dbPatch.project_id = patch.projectId;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.priority !== undefined) dbPatch.priority = patch.priority;
    if (patch.assignee !== undefined) dbPatch.assignee_id = patch.assignee || null;
    if (patch.dueDate !== undefined) dbPatch.due_date = patch.dueDate || null;
    const { error } = await supabase.from("tasks").update(dbPatch).eq("id", id);
    if (error) { toast.error(error.message); return; }
    await get().refreshAll();
  },

  deleteTask: async (id) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    await get().refreshAll();
  },

  addComment: async (taskId, comment) => {
    const cur = get().currentUser; if (!cur) return;
    const { error } = await supabase.from("task_comments").insert({
      task_id: taskId, author_id: cur.id, content: comment.content, rating: comment.rating ?? null,
    });
    if (error) { toast.error(error.message); return; }
    await get().refreshAll();
  },

  addDocument: async (d) => {
    const cur = get().currentUser; if (!cur) return;
    const { error } = await supabase.from("documents").insert({
      name: d.name, category: d.category, size: d.size, uploaded_by: cur.id,
    });
    if (error) { toast.error(error.message); return; }
    await get().refreshAll();
  },

  updateDocument: async (id, patch) => {
    const dbPatch: any = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.category !== undefined) dbPatch.category = patch.category;
    if (patch.size !== undefined) dbPatch.size = patch.size;
    const { error } = await supabase.from("documents").update(dbPatch).eq("id", id);
    if (error) { toast.error(error.message); return; }
    await get().refreshAll();
  },

  deleteDocument: async (id) => {
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    await get().refreshAll();
  },

  addUser: async (u) => {
    // Creating users requires admin API → use seed-demo-data style. For demo, prompt to use seed.
    toast.info("Vui lòng tạo tài khoản mới qua màn hình Đăng ký hoặc liên hệ quản trị viên.");
    void u;
  },

  updateUser: async (id, patch) => {
    const dbPatch: any = {};
    if (patch.name !== undefined) dbPatch.full_name = patch.name;
    if (patch.email !== undefined) dbPatch.email = patch.email;
    if (patch.locked !== undefined) dbPatch.locked = patch.locked;
    if (Object.keys(dbPatch).length) {
      const { error } = await supabase.from("profiles").update(dbPatch).eq("id", id);
      if (error) { toast.error(error.message); return; }
    }
    if (patch.role !== undefined) {
      await supabase.from("user_roles").delete().eq("user_id", id);
      const { error } = await supabase.from("user_roles").insert({ user_id: id, role: patch.role });
      if (error) { toast.error(error.message); return; }
    }
    await get().refreshAll();
  },

  toggleLockUser: async (id) => {
    const u = get().users.find((x) => x.id === id);
    if (!u) return;
    const { error } = await supabase.from("profiles").update({ locked: !u.locked }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    await get().refreshAll();
  },
}));

export const statusLabel: Record<ProjectStatus, string> = {
  planning: "Lập kế hoạch", in_progress: "Đang thực hiện", completed: "Hoàn thành", on_hold: "Tạm dừng",
};
export const taskStatusLabel: Record<TaskStatus, string> = {
  todo: "Cần làm", in_progress: "Đang làm", review: "Đánh giá", done: "Hoàn thành",
};
export const roleLabel: Record<UserRole, string> = {
  admin: "Quản trị viên", manager: "Quản lý dự án", member: "Thành viên",
};
