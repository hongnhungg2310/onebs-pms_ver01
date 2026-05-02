import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useStore, statusLabel, taskStatusLabel, roleLabel, TaskStatus } from "@/lib/store";
import { ArrowLeft, FileText, Upload, Calendar, UserPlus, Trash2, Activity, History, Plus } from "lucide-react";
import GanttChart from "@/components/GanttChart";

const taskStatusColor: Record<TaskStatus, string> = {
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
const priorityLabel = { low: "Thấp", medium: "TB", high: "Cao" };
import { useState } from "react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface TaskForm {
  title: string;
  description: string;
  status: TaskStatus;
  priority: "low" | "medium" | "high";
  assignee: string;
  dueDate: string;
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, tasks, users, activities, updateProject, updateTask, addTask } = useStore();
  const project = projects.find((p) => p.id === id);
  const [newDocName, setNewDocName] = useState("");

  // Task creation dialog state
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskForm, setTaskForm] = useState<TaskForm>({
    title: "", description: "", status: "todo", priority: "medium", assignee: "", dueDate: "",
  });

  const openTaskDialog = (status: TaskStatus) => {
    setTaskForm({
      title: "", description: "", status, priority: "medium",
      assignee: users[0]?.id || "", dueDate: "",
    });
    setTaskDialogOpen(true);
  };

  const submitTask = async () => {
    if (!taskForm.title.trim()) { toast.error("Nhập tên công việc"); return; }
    if (!project) return;
    await addTask({ ...taskForm, projectId: project.id });
    toast.success("Đã thêm công việc");
    setTaskDialogOpen(false);
  };

  if (!project) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">Không tìm thấy dự án.</p>
        <Button asChild variant="link" className="mt-2"><Link to="/projects">Về danh sách dự án</Link></Button>
      </Card>
    );
  }

  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const memberUsers = users.filter((u) => project.members.includes(u.id));
  const availableMembers = users.filter((u) => !project.members.includes(u.id));

  const addMember = (userId: string) => {
    updateProject(project.id, { members: [...project.members, userId] });
    toast.success("Đã thêm thành viên");
  };
  const removeMember = (userId: string) => {
    updateProject(project.id, { members: project.members.filter((m) => m !== userId) });
    toast.success("Đã gỡ thành viên");
  };
  const addDoc = () => {
    if (!newDocName.trim()) return;
    updateProject(project.id, {
      documents: [...project.documents, { id: Math.random().toString(36).slice(2, 8), name: newDocName, size: "—", uploadedAt: new Date().toISOString().slice(0, 10) }],
    });
    setNewDocName("");
    toast.success("Đã thêm tài liệu");
  };
  const removeDoc = (docId: string) => {
    updateProject(project.id, { documents: project.documents.filter((d) => d.id !== docId) });
  };
  const updateProgress = (val: number) => updateProject(project.id, { progress: val });

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate("/projects")}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Danh sách dự án
      </button>

      <Card className="bg-gradient-card">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold truncate">{project.name}</h2>
                <Badge className="bg-primary/15 text-primary border-primary/30">{statusLabel[project.status]}</Badge>
              </div>
              {project.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
              )}
              <span className="flex items-center gap-1 text-xs text-muted-foreground mt-1.5">
                <Calendar className="h-3.5 w-3.5" /> {project.startDate} → {project.endDate}
              </span>
            </div>
            <div className="md:w-56 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Tiến độ tổng</span>
                <span className="font-bold">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task creation dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Thêm công việc</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2"><Label>Tên *</Label><Input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Mô tả</Label><Textarea rows={3} value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Người thực hiện</Label>
                <Select value={taskForm.assignee} onValueChange={(v) => setTaskForm({ ...taskForm, assignee: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select value={taskForm.status} onValueChange={(v) => setTaskForm({ ...taskForm, status: v as TaskStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(Object.keys(taskStatusLabel) as TaskStatus[]).map((s) => <SelectItem key={s} value={s}>{taskStatusLabel[s]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ưu tiên</Label>
                <Select value={taskForm.priority} onValueChange={(v) => setTaskForm({ ...taskForm, priority: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Thấp</SelectItem>
                    <SelectItem value="medium">Trung bình</SelectItem>
                    <SelectItem value="high">Cao</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hạn hoàn thành</Label>
                <Input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>Hủy</Button>
            <Button onClick={submitTask} className="bg-gradient-primary">Thêm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">Công việc ({projectTasks.length})</TabsTrigger>
          <TabsTrigger value="members">Thành viên ({memberUsers.length})</TabsTrigger>
          <TabsTrigger value="docs">Tài liệu ({project.documents.length})</TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5"><History className="h-3.5 w-3.5" /> Lịch sử</TabsTrigger>
          <TabsTrigger value="progress">Tiến độ</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bảng Kanban công việc</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {(Object.keys(taskStatusLabel) as TaskStatus[]).map((col) => {
                  const colTasks = projectTasks.filter((t) => t.status === col);
                  return (
                    <div
                      key={col}
                      className="rounded-lg border bg-muted/30 p-3 flex flex-col min-h-[360px]"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        const tid = e.dataTransfer.getData("text/plain");
                        if (tid) {
                          updateTask(tid, { status: col });
                          toast.success("Đã cập nhật trạng thái");
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge className={taskStatusColor[col]}>{taskStatusLabel[col]}</Badge>
                          <span className="text-xs text-muted-foreground">{colTasks.length}</span>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => openTaskDialog(col)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2 flex-1">
                        {colTasks.map((t) => {
                          const u = users.find((x) => x.id === t.assignee);
                          return (
                            <div
                              key={t.id}
                              draggable
                              onDragStart={(e) => e.dataTransfer.setData("text/plain", t.id)}
                              className="rounded-md border bg-card p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-smooth space-y-2"
                            >
                              <p className="text-sm font-medium line-clamp-2">{t.title}</p>
                              {t.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                              )}
                              <div className="flex items-center justify-between gap-2">
                                <Badge className={`${priorityColor[t.priority]} text-[10px]`}>
                                  {priorityLabel[t.priority]}
                                </Badge>
                                {u && (
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-[10px]">
                                      {u.name.split(" ").slice(-2).map((n) => n[0]).join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                              </div>
                              {t.dueDate && (
                                <p className="text-[10px] text-muted-foreground">Hạn: {t.dueDate}</p>
                              )}
                            </div>
                          );
                        })}
                        {colTasks.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-6">Trống</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {projectTasks.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Dự án chưa có công việc nào.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gantt chart - Lịch trình công việc</CardTitle>
            </CardHeader>
            <CardContent>
              <GanttChart project={project} tasks={projectTasks} users={users} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cập nhật tiến độ tổng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input type="range" min={0} max={100} value={project.progress} onChange={(e) => updateProgress(Number(e.target.value))} />
              <div className="text-sm text-muted-foreground">
                {projectTasks.filter((t) => t.status === "done").length}/{projectTasks.length} công việc đã hoàn thành • Tiến độ: <span className="font-semibold text-foreground">{project.progress}%</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Danh sách thành viên</span>
                {availableMembers.length > 0 && (
                  <Select onValueChange={addMember}>
                    <SelectTrigger className="w-56"><SelectValue placeholder="+ Thêm thành viên" /></SelectTrigger>
                    <SelectContent>
                      {availableMembers.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {memberUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 rounded-lg border p-3 bg-card">
                    <Avatar><AvatarFallback className="bg-gradient-primary text-primary-foreground">{u.name.split(" ").slice(-2).map((n) => n[0]).join("")}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{roleLabel[u.role]}</p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeMember(u.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                {memberUsers.length === 0 && <p className="text-sm text-muted-foreground col-span-full">Chưa có thành viên nào.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Tài liệu dự án</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input placeholder="Tên tài liệu (vd: Báo cáo tuần 1.pdf)" value={newDocName} onChange={(e) => setNewDocName(e.target.value)} />
                <Button onClick={addDoc} className="bg-gradient-primary gap-2"><Upload className="h-4 w-4" /> Tải lên</Button>
              </div>
              <div className="space-y-2">
                {project.documents.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 rounded-md border p-3 bg-card hover:shadow-sm transition-smooth">
                    <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center"><FileText className="h-4 w-4" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.size} • {d.uploadedAt}</p>
                    </div>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeDoc(d.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                {project.documents.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Chưa có tài liệu nào.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" /> Lịch sử hoạt động
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const projActivities = activities.filter((a) => a.projectId === project.id);
                if (projActivities.length === 0) {
                  return <p className="text-sm text-muted-foreground text-center py-8">Chưa có hoạt động nào được ghi nhận.</p>;
                }
                return (
                  <div className="relative space-y-4 pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
                    {projActivities.map((a) => (
                      <div key={a.id} className="relative">
                        <div className="absolute -left-[18px] top-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{a.description}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              <span className="font-medium text-foreground/80">{a.actorName}</span>
                              {" • "}
                              {new Date(a.createdAt).toLocaleString("vi-VN")}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px] shrink-0">{a.actionType}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
