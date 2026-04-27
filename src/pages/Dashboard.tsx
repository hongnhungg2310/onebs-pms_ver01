import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStore, statusLabel, taskStatusLabel } from "@/lib/store";
import { FolderKanban, ListTodo, Users, FileText, Calendar, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { projects, tasks, users, documents, currentUser } = useStore();

  const stats = [
    { label: "Dự án", value: projects.length, icon: FolderKanban, color: "bg-primary/10 text-primary", to: "/projects" },
    { label: "Công việc", value: tasks.length, icon: ListTodo, color: "bg-secondary/10 text-secondary", to: "/tasks" },
    { label: "Thành viên", value: users.length, icon: Users, color: "bg-accent/15 text-accent-foreground", to: "/users" },
    { label: "Tài liệu", value: documents.length, icon: FileText, color: "bg-muted text-foreground", to: "/documents" },
  ];

  const myTasks = tasks.filter((t) => t.assignee === currentUser?.id && t.status !== "done").slice(0, 5);
  const recentProjects = [...projects].slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Xin chào{currentUser?.name ? `, ${currentUser.name}` : ""} 👋</h2>
        <p className="text-sm text-muted-foreground mt-1">Tổng quan nhanh về hoạt động trong hệ thống.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to}>
            <Card className="bg-gradient-card hover:shadow-md transition-smooth h-full">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-3xl font-bold mt-1">{s.value}</p>
                </div>
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${s.color}`}>
                  <s.icon className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Công việc của tôi</CardTitle>
            <Button asChild size="sm" variant="ghost" className="gap-1">
              <Link to="/tasks">Xem tất cả <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {myTasks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Không có công việc đang chờ.</p>
            )}
            {myTasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/40 transition-smooth">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{t.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <Calendar className="h-3 w-3" /> {t.dueDate || "—"}
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0">{taskStatusLabel[t.status]}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Dự án gần đây</CardTitle>
            <Button asChild size="sm" variant="ghost" className="gap-1">
              <Link to="/projects">Xem tất cả <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentProjects.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Chưa có dự án.</p>
            )}
            {recentProjects.map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`} className="block space-y-1.5 rounded-md border p-3 hover:bg-muted/40 transition-smooth">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate pr-3">{p.name}</span>
                  <Badge variant="outline" className="shrink-0">{statusLabel[p.status]}</Badge>
                </div>
                <Progress value={p.progress} className="h-2" />
                <div className="text-xs text-muted-foreground">Tiến độ: {p.progress}%</div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
