import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { useStore, taskStatusLabel, TaskStatus, Task } from "@/lib/store";
import { Plus, Search, Pencil, Trash2, Send, Star, MessageSquare, LayoutGrid, List } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const statusColor: Record<TaskStatus, string> = {
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/15 text-primary",
  review: "bg-accent/20 text-accent-foreground",
  done: "bg-secondary/15 text-secondary",
};

const priorityColor = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-accent/20 text-accent-foreground",
  high: "bg-destructive/15 text-destructive",
};

interface Form {
  title: string; description: string; projectId: string; status: TaskStatus;
  priority: "low" | "medium" | "high"; assignee: string; dueDate: string;
}

export default function Tasks() {
  const { tasks, projects, users, currentUser, addTask, updateTask, deleteTask, addComment } = useStore();
  const [search, setSearch] = useState("");
  const [filterProj, setFilterProj] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | TaskStatus>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState<Form>({
    title: "", description: "", projectId: projects[0]?.id || "",
    status: "todo", priority: "medium", assignee: users[0]?.id || "", dueDate: "",
  });
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);

  const filtered = useMemo(() => tasks.filter((t) => {
    const ms = t.title.toLowerCase().includes(search.toLowerCase());
    const mp = filterProj === "all" || t.projectId === filterProj;
    const mst = filterStatus === "all" || t.status === filterStatus;
    return ms && mp && mst;
  }), [tasks, search, filterProj, filterStatus]);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", description: "", projectId: projects[0]?.id || "", status: "todo", priority: "medium", assignee: users[0]?.id || "", dueDate: "" });
    setOpen(true);
  };
  const openEdit = (t: Task) => {
    setEditing(t);
    setForm({ title: t.title, description: t.description, projectId: t.projectId, status: t.status, priority: t.priority, assignee: t.assignee, dueDate: t.dueDate });
    setOpen(true);
  };
  const submit = () => {
    if (!form.title.trim()) { toast.error("Nhập tên công việc"); return; }
    if (editing) { updateTask(editing.id, form); toast.success("Đã cập nhật"); }
    else { addTask(form); toast.success("Đã thêm công việc"); }
    setOpen(false);
  };
  const submitComment = () => {
    if (!activeTask || !comment.trim()) return;
    addComment(activeTask.id, { author: currentUser?.name || "Ẩn danh", content: comment, rating });
    setComment(""); setRating(5);
    toast.success("Đã thêm bình luận");
    // refresh activeTask
    setActiveTask((cur) => cur ? { ...cur, comments: [...cur.comments, { id: "tmp", author: currentUser?.name || "", content: comment, rating, createdAt: new Date().toISOString() }] } : cur);
  };

  const updateStatus = (taskId: string, status: TaskStatus) => {
    updateTask(taskId, { status });
    toast.success("Đã cập nhật trạng thái");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Tìm công việc..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterProj} onValueChange={setFilterProj}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả dự án</SelectItem>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              {(Object.keys(taskStatusLabel) as TaskStatus[]).map((s) => <SelectItem key={s} value={s}>{taskStatusLabel[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-gradient-primary gap-2"><Plus className="h-4 w-4" /> Thêm công việc</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Chỉnh sửa công việc" : "Thêm công việc"}</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-2"><Label>Tên *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-2"><Label>Mô tả</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Dự án</Label>
                  <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Người thực hiện</Label>
                  <Select value={form.assignee} onValueChange={(v) => setForm({ ...form, assignee: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as TaskStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{(Object.keys(taskStatusLabel) as TaskStatus[]).map((s) => <SelectItem key={s} value={s}>{taskStatusLabel[s]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ưu tiên</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Thấp</SelectItem>
                      <SelectItem value="medium">Trung bình</SelectItem>
                      <SelectItem value="high">Cao</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2"><Label>Hạn hoàn thành</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
              <Button onClick={submit} className="bg-gradient-primary">{editing ? "Cập nhật" : "Thêm"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="table" className="w-full">
        <TabsList>
          <TabsTrigger value="table" className="gap-2"><List className="h-4 w-4" /> Bảng</TabsTrigger>
          <TabsTrigger value="kanban" className="gap-2"><LayoutGrid className="h-4 w-4" /> Kanban</TabsTrigger>
        </TabsList>

        <TabsContent value="table">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Công việc</TableHead>
                <TableHead>Dự án</TableHead>
                <TableHead>Phụ trách</TableHead>
                <TableHead>Hạn</TableHead>
                <TableHead>Ưu tiên</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => {
                const proj = projects.find((p) => p.id === t.projectId);
                const u = users.find((x) => x.id === t.assignee);
                return (
                  <TableRow key={t.id} className="hover:bg-muted/40">
                    <TableCell>
                      <div className="font-medium">{t.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{t.description}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{proj?.name || "—"}</TableCell>
                    <TableCell className="text-sm">{u?.name || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.dueDate}</TableCell>
                    <TableCell><Badge className={priorityColor[t.priority]}>{t.priority === "high" ? "Cao" : t.priority === "medium" ? "TB" : "Thấp"}</Badge></TableCell>
                    <TableCell>
                      <Select value={t.status} onValueChange={(v) => updateStatus(t.id, v as TaskStatus)}>
                        <SelectTrigger className={`w-36 h-8 text-xs ${statusColor[t.status]} border-0`}><SelectValue /></SelectTrigger>
                        <SelectContent>{(Object.keys(taskStatusLabel) as TaskStatus[]).map((s) => <SelectItem key={s} value={s}>{taskStatusLabel[s]}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setActiveTask(t)}>
                              <MessageSquare className="h-3.5 w-3.5" />
                            </Button>
                          </SheetTrigger>
                          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                            <SheetHeader><SheetTitle>Bình luận & Đánh giá</SheetTitle></SheetHeader>
                            {activeTask && (
                              <div className="mt-4 space-y-4">
                                <div className="rounded-lg bg-muted/50 p-3">
                                  <p className="font-medium">{activeTask.title}</p>
                                  <p className="text-sm text-muted-foreground mt-1">{activeTask.description}</p>
                                </div>
                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                  {activeTask.comments.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Chưa có bình luận.</p>}
                                  {activeTask.comments.map((c) => (
                                    <div key={c.id} className="flex gap-3">
                                      <Avatar className="h-8 w-8"><AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">{c.author.split(" ").slice(-2).map((n) => n[0]).join("")}</AvatarFallback></Avatar>
                                      <div className="flex-1 rounded-lg bg-card border p-3">
                                        <div className="flex items-center justify-between">
                                          <p className="text-sm font-medium">{c.author}</p>
                                          {c.rating !== undefined && (
                                            <div className="flex">
                                              {Array.from({ length: 5 }).map((_, i) => (
                                                <Star key={i} className={`h-3 w-3 ${i < (c.rating || 0) ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                        <p className="text-sm mt-1">{c.content}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="space-y-2 border-t pt-4">
                                  <Label>Đánh giá</Label>
                                  <div className="flex gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <button key={i} type="button" onClick={() => setRating(i + 1)}>
                                        <Star className={`h-5 w-5 ${i < rating ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                                      </button>
                                    ))}
                                  </div>
                                  <Textarea placeholder="Viết bình luận..." rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
                                  <Button onClick={submitComment} className="w-full bg-gradient-primary gap-2"><Send className="h-3.5 w-3.5" /> Gửi</Button>
                                </div>
                              </div>
                            )}
                          </SheetContent>
                        </Sheet>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Xóa công việc?</AlertDialogTitle><AlertDialogDescription>Hành động không thể hoàn tác.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={() => { deleteTask(t.id); toast.success("Đã xóa"); }} className="bg-destructive">Xóa</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">Không có công việc phù hợp.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
