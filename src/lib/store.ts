// Mock data + simple in-memory store with localStorage persistence
import { create } from "zustand";

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

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  startDate: string;
  endDate: string;
  members: string[]; // user ids
  documents: { id: string; name: string; size: string; uploadedAt: string }[];
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

const seedUsers: User[] = [
  { id: "u1", name: "Nguyễn Văn An", email: "an.nguyen@onebs.vn", role: "admin", locked: false },
  { id: "u2", name: "Trần Thị Bình", email: "binh.tran@onebs.vn", role: "manager", locked: false },
  { id: "u3", name: "Lê Hoàng Cường", email: "cuong.le@onebs.vn", role: "member", locked: false },
  { id: "u4", name: "Phạm Mỹ Duyên", email: "duyen.pham@onebs.vn", role: "member", locked: false },
  { id: "u5", name: "Vũ Quốc Em", email: "em.vu@onebs.vn", role: "member", locked: true },
];

const seedProjects: Project[] = [
  {
    id: "p1",
    name: "Hệ thống ERP nội bộ",
    description: "Xây dựng hệ thống quản trị nguồn lực doanh nghiệp cho OneBS.",
    status: "in_progress",
    progress: 65,
    startDate: "2025-01-15",
    endDate: "2025-08-30",
    members: ["u1", "u2", "u3"],
    documents: [
      { id: "d1", name: "SRS_ERP.pdf", size: "2.4 MB", uploadedAt: "2025-02-01" },
      { id: "d2", name: "Thiết kế DB.xlsx", size: "850 KB", uploadedAt: "2025-02-10" },
    ],
  },
  {
    id: "p2",
    name: "Website thương mại điện tử",
    description: "Nền tảng TMĐT B2B cho khách hàng doanh nghiệp.",
    status: "in_progress",
    progress: 40,
    startDate: "2025-03-01",
    endDate: "2025-10-15",
    members: ["u2", "u4"],
    documents: [{ id: "d3", name: "Wireframe.fig", size: "5.1 MB", uploadedAt: "2025-03-12" }],
  },
  {
    id: "p3",
    name: "Ứng dụng Mobile CRM",
    description: "App di động quản lý quan hệ khách hàng cho đội sales.",
    status: "planning",
    progress: 10,
    startDate: "2025-04-01",
    endDate: "2025-12-30",
    members: ["u1", "u3", "u4"],
    documents: [],
  },
  {
    id: "p4",
    name: "Migration Cloud AWS",
    description: "Di chuyển hạ tầng on-premise lên AWS.",
    status: "completed",
    progress: 100,
    startDate: "2024-09-01",
    endDate: "2025-02-28",
    members: ["u1", "u2"],
    documents: [{ id: "d4", name: "Báo cáo cuối.docx", size: "1.2 MB", uploadedAt: "2025-03-01" }],
  },
];

const seedTasks: Task[] = [
  {
    id: "t1", projectId: "p1", title: "Thiết kế database module HR", description: "Vẽ ERD và viết script tạo bảng",
    status: "done", priority: "high", assignee: "u3", dueDate: "2025-03-15",
    comments: [{ id: "c1", author: "Trần Thị Bình", content: "Schema rất rõ ràng, đã duyệt.", rating: 5, createdAt: "2025-03-14" }],
  },
  {
    id: "t2", projectId: "p1", title: "API quản lý nhân sự", description: "Xây dựng REST API CRUD nhân viên",
    status: "in_progress", priority: "high", assignee: "u3", dueDate: "2025-05-20", comments: [],
  },
  {
    id: "t3", projectId: "p1", title: "Giao diện Dashboard HR", description: "Thiết kế UI dashboard cho HR",
    status: "review", priority: "medium", assignee: "u4", dueDate: "2025-05-10", comments: [],
  },
  {
    id: "t4", projectId: "p2", title: "Trang chủ TMĐT", description: "Landing page và catalog sản phẩm",
    status: "in_progress", priority: "high", assignee: "u4", dueDate: "2025-06-01", comments: [],
  },
  {
    id: "t5", projectId: "p2", title: "Tích hợp cổng thanh toán", description: "VNPay, Momo",
    status: "todo", priority: "medium", assignee: "u2", dueDate: "2025-07-15", comments: [],
  },
  {
    id: "t6", projectId: "p3", title: "Phân tích yêu cầu CRM Mobile", description: "Khảo sát đội sales",
    status: "in_progress", priority: "high", assignee: "u1", dueDate: "2025-04-30", comments: [],
  },
];

const seedDocuments: Document[] = [
  { id: "gd1", name: "Quy trình quản lý dự án OneBS.pdf", category: "Quy trình", size: "1.8 MB", uploadedBy: "Nguyễn Văn An", uploadedAt: "2025-01-10" },
  { id: "gd2", name: "Template báo cáo tuần.docx", category: "Template", size: "120 KB", uploadedBy: "Trần Thị Bình", uploadedAt: "2025-01-15" },
  { id: "gd3", name: "Coding convention.pdf", category: "Tiêu chuẩn", size: "640 KB", uploadedBy: "Lê Hoàng Cường", uploadedAt: "2025-02-05" },
  { id: "gd4", name: "Hướng dẫn Git workflow.md", category: "Hướng dẫn", size: "45 KB", uploadedBy: "Nguyễn Văn An", uploadedAt: "2025-02-12" },
];

interface Store {
  currentUser: User | null;
  users: User[];
  projects: Project[];
  tasks: Task[];
  documents: Document[];
  login: (email: string) => boolean;
  logout: () => void;
  updateProfile: (patch: Partial<User>) => void;
  addProject: (p: Omit<Project, "id" | "documents" | "members"> & { members?: string[] }) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addTask: (t: Omit<Task, "id" | "comments">) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addComment: (taskId: string, comment: Omit<Comment, "id" | "createdAt">) => void;
  addDocument: (d: Omit<Document, "id" | "uploadedAt">) => void;
  updateDocument: (id: string, patch: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  addUser: (u: Omit<User, "id" | "locked">) => void;
  updateUser: (id: string, patch: Partial<User>) => void;
  toggleLockUser: (id: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 9);

export const useStore = create<Store>((set, get) => ({
  currentUser: seedUsers[0],
  users: seedUsers,
  projects: seedProjects,
  tasks: seedTasks,
  documents: seedDocuments,
  login: (email) => {
    const u = get().users.find((x) => x.email.toLowerCase() === email.toLowerCase() && !x.locked);
    if (u) { set({ currentUser: u }); return true; }
    return false;
  },
  logout: () => set({ currentUser: null }),
  updateProfile: (patch) => set((s) => {
    if (!s.currentUser) return s;
    const updated = { ...s.currentUser, ...patch };
    return { currentUser: updated, users: s.users.map((u) => u.id === updated.id ? updated : u) };
  }),
  addProject: (p) => set((s) => ({ projects: [...s.projects, { ...p, id: uid(), documents: [], members: p.members ?? [] }] })),
  updateProject: (id, patch) => set((s) => ({ projects: s.projects.map((p) => p.id === id ? { ...p, ...patch } : p) })),
  deleteProject: (id) => set((s) => ({ projects: s.projects.filter((p) => p.id !== id), tasks: s.tasks.filter((t) => t.projectId !== id) })),
  addTask: (t) => set((s) => ({ tasks: [...s.tasks, { ...t, id: uid(), comments: [] }] })),
  updateTask: (id, patch) => set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, ...patch } : t) })),
  deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
  addComment: (taskId, comment) => set((s) => ({
    tasks: s.tasks.map((t) => t.id === taskId
      ? { ...t, comments: [...t.comments, { ...comment, id: uid(), createdAt: new Date().toISOString() }] }
      : t),
  })),
  addDocument: (d) => set((s) => ({ documents: [...s.documents, { ...d, id: uid(), uploadedAt: new Date().toISOString().slice(0, 10) }] })),
  updateDocument: (id, patch) => set((s) => ({ documents: s.documents.map((d) => d.id === id ? { ...d, ...patch } : d) })),
  deleteDocument: (id) => set((s) => ({ documents: s.documents.filter((d) => d.id !== id) })),
  addUser: (u) => set((s) => ({ users: [...s.users, { ...u, id: uid(), locked: false }] })),
  updateUser: (id, patch) => set((s) => ({ users: s.users.map((u) => u.id === id ? { ...u, ...patch } : u) })),
  toggleLockUser: (id) => set((s) => ({ users: s.users.map((u) => u.id === id ? { ...u, locked: !u.locked } : u) })),
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
