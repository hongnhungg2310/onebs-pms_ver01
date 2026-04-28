import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useStore, ProjectStatus, statusLabel, Project } from "@/lib/store";
import { Plus, Search, Pencil, Trash2, Calendar, FolderKanban, ClipboardList, Crown, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

const statusColor: Record<ProjectStatus, string> = {
  planning: "bg-accent/20 text-accent-foreground border-accent/30",
  in_progress: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  completed: "bg-secondary/15 text-secondary border-secondary/30",
  on_hold: "bg-muted text-muted-foreground border-border",
};

const initials = (name: string) =>
  name.split(" ").map((n) => n[0]).slice(-2).join("").toUpperCase();

const formatShortDate = (d: string) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yy = String(dt.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
};

interface FormState {
  name: string; description: string; status: ProjectStatus; progress: number; startDate: string; endDate: string; managerId: string;
}
const empty: FormState = { name: "", description: "", status: "planning", progress: 0, startDate: "", endDate: "", managerId: "" };

export default function Projects() {
  const { projects, tasks, users, addProject, updateProject, deleteProject } = useStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | ProjectStatus>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState<FormState>(empty);

  const managerCandidates = useMemo(
    () => users.filter((u) => (u.role === "manager" || u.role === "admin") && !u.locked),
    [users]
  );

  const filtered = useMemo(() => projects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || p.status === filter;
    return matchSearch && matchFilter;
  }), [projects, search, filter]);

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({
      name: p.name, description: p.description, status: p.status, progress: p.progress,
      startDate: p.startDate, endDate: p.endDate,
      managerId: p.members[0] || "",
    });
    setOpen(true);
  };
  const submit = () => {
    if (!form.name.trim()) { toast.error("Vui lòng nhập tên dự án"); return; }
    if (!form.managerId) { toast.error("Vui lòng chọn quản lý dự án"); return; }
    const { managerId, ...rest } = form;
    if (editing) {
      // Đặt manager là phần tử đầu trong danh sách thành viên
      const others = editing.members.filter((m) => m !== managerId);
      updateProject(editing.id, { ...rest, members: [managerId, ...others] });
      toast.success("Đã cập nhật dự án");
    } else {
      addProject({ ...rest, members: [managerId] });
      toast.success("Đã thêm dự án mới");
    }
    setOpen(false);
  };
  const onDelete = (id: string) => { deleteProject(id); toast.success("Đã xóa dự án"); };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm dự án theo tên hoặc mô tả..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              {(Object.keys(statusLabel) as ProjectStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{statusLabel[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-gradient-primary gap-2"><Plus className="h-4 w-4" /> Thêm dự án</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Chỉnh sửa dự án" : "Thêm dự án mới"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Tên dự án *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ví dụ: Hệ thống CRM" />
              </div>
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ProjectStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(statusLabel) as ProjectStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>{statusLabel[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tiến độ (%)</Label>
                  <Input type="number" min={0} max={100} value={form.progress} onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Ngày bắt đầu</Label>
                  <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Ngày kết thúc</Label>
                  <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
              <Button onClick={submit} className="bg-gradient-primary">{editing ? "Cập nhật" : "Thêm mới"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => {
          const projectTaskCount = tasks.filter((t) => t.projectId === p.id).length;
          const memberUsers = p.members.map((mid) => users.find((u) => u.id === mid)).filter(Boolean) as typeof users;
          const manager = memberUsers.find((u) => u.role === "manager") || memberUsers.find((u) => u.role === "admin") || memberUsers[0];
          const visibleAvatars = memberUsers.slice(0, 3);
          const extraCount = Math.max(0, memberUsers.length - visibleAvatars.length);
          return (
            <Card key={p.id} className="group relative hover:shadow-lg hover:-translate-y-0.5 transition-smooth bg-gradient-card overflow-hidden">
              <Link to={`/projects/${p.id}`} className="absolute inset-0 z-0" aria-label={`Xem ${p.name}`} />
              <CardContent className="relative z-10 p-5 space-y-4 pointer-events-none">
                {/* Header row: icon + star + status + actions */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 pointer-events-auto">
                    <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                      <FolderKanban className="h-5 w-5" />
                    </div>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex items-center gap-1 pointer-events-auto">
                    <Badge variant="outline" className={`rounded-full px-3 ${statusColor[p.status]}`}>
                      {statusLabel[p.status]}
                    </Badge>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-smooth ml-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.preventDefault(); openEdit(p); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => e.preventDefault()}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xóa dự án?</AlertDialogTitle>
                            <AlertDialogDescription>Hành động này sẽ xóa cả các công việc liên quan và không thể hoàn tác.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(p.id)} className="bg-destructive">Xóa</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>

                {/* Title & description */}
                <div className="space-y-1">
                  <h3 className="text-lg font-bold tracking-tight truncate">{p.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">{p.description || "—"}</p>
                </div>

                {/* Pills: task count + manager */}
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/60 px-2.5 py-1 text-xs">
                    <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-semibold">{projectTaskCount}</span>
                    <span className="text-muted-foreground">task</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/60 px-2.5 py-1 text-xs max-w-[60%]">
                    <Crown className="h-3.5 w-3.5 text-primary" />
                    <span className="truncate">{manager?.name || "Chưa có quản lý"}</span>
                  </span>
                </div>

                {/* Progress (compact) */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Tiến độ</span>
                    <span className="font-semibold">{p.progress}%</span>
                  </div>
                  <Progress value={p.progress} className="h-1.5" />
                </div>

                {/* Footer: avatars + due date */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center -space-x-2">
                    {visibleAvatars.map((u) => (
                      <Avatar key={u.id} className="h-7 w-7 border-2 border-background">
                        {u.avatar && <AvatarImage src={u.avatar} alt={u.name} />}
                        <AvatarFallback className="text-[10px]">{initials(u.name)}</AvatarFallback>
                      </Avatar>
                    ))}
                    {extraCount > 0 && (
                      <span className="h-7 min-w-7 px-1.5 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-semibold">
                        +{extraCount}
                      </span>
                    )}
                    {memberUsers.length === 0 && (
                      <span className="text-xs text-muted-foreground">Chưa có thành viên</span>
                    )}
                  </div>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" /> {formatShortDate(p.endDate)}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card className="md:col-span-2 xl:col-span-3 border-dashed">
            <CardContent className="p-12 text-center text-muted-foreground">
              Không tìm thấy dự án phù hợp.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
