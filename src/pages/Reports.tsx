import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useStore, statusLabel, taskStatusLabel } from "@/lib/store";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell,
  CartesianGrid, Legend,
} from "recharts";
import {
  Printer, FolderKanban, ListTodo, AlertTriangle, CheckCircle2, Users, TrendingUp,
} from "lucide-react";

const COLORS = ["hsl(196 79% 51%)", "hsl(152 65% 54%)", "hsl(43 100% 58%)", "hsl(215 16% 55%)"];

const initials = (name: string) =>
  name.split(" ").map((p) => p[0]).slice(-2).join("").toUpperCase();

export default function Reports() {
  const { projects, tasks, users } = useStore();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ===== KPIs =====
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "in_progress").length;
  const completedProjects = projects.filter((p) => p.status === "completed").length;
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const overdueTasks = tasks.filter(
    (t) => t.status !== "done" && t.dueDate && new Date(t.dueDate) < today
  );
  const completionRate = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const avgProgress = totalProjects
    ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / totalProjects)
    : 0;

  // ===== Project status pie =====
  const projectStatusData = (["planning", "in_progress", "completed", "on_hold"] as const).map((s) => ({
    name: statusLabel[s], value: projects.filter((p) => p.status === s).length,
  }));

  // ===== Task status bar =====
  const taskStatusData = (["todo", "in_progress", "review", "done"] as const).map((s) => ({
    name: taskStatusLabel[s], value: tasks.filter((t) => t.status === s).length,
  }));

  // ===== Employee productivity =====
  const productivity = useMemo(() => {
    return users
      .filter((u) => u.role !== "admin" && u.role !== "director")
      .map((u) => {
        const my = tasks.filter((t) => t.assignee === u.id);
        const done = my.filter((t) => t.status === "done").length;
        const inProg = my.filter((t) => t.status === "in_progress" || t.status === "review").length;
        const overdue = my.filter(
          (t) => t.status !== "done" && t.dueDate && new Date(t.dueDate) < today
        ).length;
        const ratings = my.flatMap((t) => t.comments.map((c) => c.rating).filter((r): r is number => !!r));
        const avgRating = ratings.length
          ? +(ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
          : null;
        const rate = my.length ? Math.round((done / my.length) * 100) : 0;
        return { user: u, total: my.length, done, inProg, overdue, rate, avgRating };
      })
      .sort((a, b) => b.done - a.done);
  }, [users, tasks]);

  const topPerformers = productivity.filter((p) => p.total > 0).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="no-print flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Báo cáo & Thống kê</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Tổng hợp tình hình dự án, công việc và năng suất nhân viên.
          </p>
        </div>
        <Button onClick={() => window.print()} variant="outline" className="gap-2">
          <Printer className="h-4 w-4" /> Xuất báo cáo
        </Button>
      </div>

      {/* Print-only header */}
      <div className="hidden print:block border-b pb-4">
        <h1 className="text-2xl font-bold">Báo cáo Quản lý Dự án</h1>
        <p className="text-sm text-muted-foreground">
          Ngày xuất: {new Date().toLocaleDateString("vi-VN")} • Gửi: Ban Giám đốc
        </p>
      </div>

      {/* ===== KPI cards ===== */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2.5 text-primary"><FolderKanban className="h-5 w-5" /></div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Tổng số dự án</p>
              <p className="text-2xl font-bold">{totalProjects}</p>
              <p className="text-[11px] text-muted-foreground">
                {activeProjects} đang chạy • {completedProjects} hoàn thành
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-md bg-blue-500/10 p-2.5 text-blue-600"><ListTodo className="h-5 w-5" /></div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Tổng công việc</p>
              <p className="text-2xl font-bold">{totalTasks}</p>
              <p className="text-[11px] text-muted-foreground">Tỉ lệ hoàn thành {completionRate}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-md bg-emerald-500/10 p-2.5 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Đã hoàn thành</p>
              <p className="text-2xl font-bold">{doneTasks}</p>
              <p className="text-[11px] text-muted-foreground">Tiến độ TB dự án {avgProgress}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-md bg-destructive/10 p-2.5 text-destructive"><AlertTriangle className="h-5 w-5" /></div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Công việc quá hạn</p>
              <p className="text-2xl font-bold">{overdueTasks.length}</p>
              <p className="text-[11px] text-muted-foreground">
                {totalTasks ? Math.round((overdueTasks.length / totalTasks) * 100) : 0}% tổng số CV
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== Charts ===== */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Trạng thái dự án</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={projectStatusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {projectStatusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 text-xs mt-2">
              {projectStatusData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="ml-auto font-semibold">{d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Phân bổ trạng thái công việc</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={taskStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="value" fill="hsl(196 79% 51%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ===== Top performers ===== */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" /> Top nhân viên năng suất
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topPerformers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có dữ liệu công việc.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topPerformers.map((p) => ({
                name: p.user.name, "Hoàn thành": p.done, "Đang xử lý": p.inProg, "Quá hạn": p.overdue,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Hoàn thành" stackId="a" fill="hsl(152 65% 54%)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Đang xử lý" stackId="a" fill="hsl(196 79% 51%)" />
                <Bar dataKey="Quá hạn" stackId="a" fill="hsl(0 84% 60%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ===== Productivity table ===== */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" /> Năng suất chi tiết theo nhân viên
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nhân viên</TableHead>
                  <TableHead className="text-center">Tổng CV</TableHead>
                  <TableHead className="text-center">Hoàn thành</TableHead>
                  <TableHead className="text-center">Đang xử lý</TableHead>
                  <TableHead className="text-center">Quá hạn</TableHead>
                  <TableHead className="text-center">Đánh giá TB</TableHead>
                  <TableHead className="min-w-[160px]">Tỉ lệ hoàn thành</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productivity.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">Chưa có dữ liệu.</TableCell></TableRow>
                ) : productivity.map((p) => (
                  <TableRow key={p.user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7"><AvatarFallback className="text-xs">{initials(p.user.name)}</AvatarFallback></Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{p.user.name}</span>
                          <span className="text-[11px] text-muted-foreground capitalize">{p.user.role}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{p.total}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-200">{p.done}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{p.inProg}</TableCell>
                    <TableCell className="text-center">
                      {p.overdue > 0
                        ? <Badge variant="destructive">{p.overdue}</Badge>
                        : <span className="text-muted-foreground">0</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      {p.avgRating != null ? <span className="font-medium">{p.avgRating} ★</span> : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={p.rate} className="h-2 flex-1" />
                        <span className="text-xs font-medium w-9 text-right">{p.rate}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ===== Project breakdown ===== */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderKanban className="h-4 w-4 text-primary" /> Chi tiết theo dự án
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dự án</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                  <TableHead className="text-center">Thành viên</TableHead>
                  <TableHead className="text-center">CV</TableHead>
                  <TableHead className="text-center">Hoàn thành</TableHead>
                  <TableHead className="text-center">Quá hạn</TableHead>
                  <TableHead className="text-center">Hạn chót</TableHead>
                  <TableHead className="min-w-[140px]">Tiến độ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">Chưa có dự án.</TableCell></TableRow>
                ) : projects.map((p) => {
                  const my = tasks.filter((t) => t.projectId === p.id);
                  const done = my.filter((t) => t.status === "done").length;
                  const overdue = my.filter((t) => t.status !== "done" && t.dueDate && new Date(t.dueDate) < today).length;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium max-w-[240px] truncate">{p.name}</TableCell>
                      <TableCell className="text-center"><Badge variant="outline">{statusLabel[p.status]}</Badge></TableCell>
                      <TableCell className="text-center">{p.members.length}</TableCell>
                      <TableCell className="text-center">{my.length}</TableCell>
                      <TableCell className="text-center text-emerald-600 font-medium">{done}</TableCell>
                      <TableCell className="text-center">
                        {overdue > 0 ? <Badge variant="destructive">{overdue}</Badge> : <span className="text-muted-foreground">0</span>}
                      </TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground">
                        {p.endDate ? new Date(p.endDate).toLocaleDateString("vi-VN") : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={p.progress} className="h-2 flex-1" />
                          <span className="text-xs font-medium w-9 text-right">{p.progress}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ===== Overdue tasks list ===== */}
      {overdueTasks.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertTriangle className="h-4 w-4" /> Danh sách công việc quá hạn ({overdueTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Công việc</TableHead>
                    <TableHead>Dự án</TableHead>
                    <TableHead>Người phụ trách</TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                    <TableHead className="text-center">Hạn</TableHead>
                    <TableHead className="text-center">Trễ (ngày)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueTasks.map((t) => {
                    const proj = projects.find((p) => p.id === t.projectId);
                    const u = users.find((x) => x.id === t.assignee);
                    const days = Math.ceil((today.getTime() - new Date(t.dueDate).getTime()) / 86400000);
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium max-w-[240px] truncate">{t.title}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">{proj?.name ?? "—"}</TableCell>
                        <TableCell className="text-sm">{u?.name ?? "—"}</TableCell>
                        <TableCell className="text-center"><Badge variant="outline">{taskStatusLabel[t.status]}</Badge></TableCell>
                        <TableCell className="text-center text-xs">{new Date(t.dueDate).toLocaleDateString("vi-VN")}</TableCell>
                        <TableCell className="text-center"><Badge variant="destructive">{days}</Badge></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
