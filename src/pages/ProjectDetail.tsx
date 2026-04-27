import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useStore, statusLabel, taskStatusLabel, roleLabel, TaskStatus } from "@/lib/store";
import { ArrowLeft, FileText, Upload, Calendar, UserPlus, Trash2 } from "lucide-react";
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

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, tasks, users, updateProject, updateTask } = useStore();
  const project = projects.find((p) => p.id === id);
  const [newDocName, setNewDocName] = useState("");

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
    <div className="space-y-5">
      <Button variant="ghost" size="sm" onClick={() => navigate("/projects")} className="gap-2 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Danh sách dự án
      </Button>

      <Card className="bg-gradient-card">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{project.name}</h2>
              <p className="text-muted-foreground mt-1">{project.description}</p>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
                <Badge className="bg-primary/15 text-primary border-primary/30">{statusLabel[project.status]}</Badge>
                <span className="flex items-center gap-1 text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> {project.startDate} → {project.endDate}</span>
              </div>
            </div>
            <div className="md:w-64 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tiến độ tổng</span>
                <span className="font-bold">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-3" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="progress">
        <TabsList>
          <TabsTrigger value="progress">Tiến độ</TabsTrigger>
          <TabsTrigger value="members">Thành viên ({memberUsers.length})</TabsTrigger>
          <TabsTrigger value="docs">Tài liệu ({project.documents.length})</TabsTrigger>
        </TabsList>

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
      </Tabs>
    </div>
  );
}
