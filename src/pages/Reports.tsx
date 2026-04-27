import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore, statusLabel, taskStatusLabel } from "@/lib/store";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import { Printer, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const COLORS = ["hsl(196 79% 51%)", "hsl(152 65% 54%)", "hsl(43 100% 58%)", "hsl(215 16% 55%)"];

export default function Reports() {
  const { projects, tasks } = useStore();

  const projectStatusData = (["planning", "in_progress", "completed", "on_hold"] as const).map((s) => ({
    name: statusLabel[s], value: projects.filter((p) => p.status === s).length,
  }));

  const taskStatusData = (["todo", "in_progress", "review", "done"] as const).map((s) => ({
    name: taskStatusLabel[s], value: tasks.filter((t) => t.status === s).length,
  }));

  const monthly = [
    { month: "T1", "Hoàn thành": 4, "Mới": 8 },
    { month: "T2", "Hoàn thành": 6, "Mới": 10 },
    { month: "T3", "Hoàn thành": 9, "Mới": 7 },
    { month: "T4", "Hoàn thành": 12, "Mới": 11 },
    { month: "T5", "Hoàn thành": 8, "Mới": 9 },
  ];

  return (
    <div className="space-y-6">
      <div className="no-print flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Báo cáo & Thống kê</h2>
          <p className="text-sm text-muted-foreground mt-1">Biểu đồ tổng hợp tình hình dự án và công việc.</p>
        </div>
        <Button onClick={() => window.print()} variant="outline" className="gap-2">
          <Printer className="h-4 w-4" /> In báo cáo
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Hoạt động công việc theo tháng</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend />
                <Line type="monotone" dataKey="Hoàn thành" stroke="hsl(152 65% 54%)" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Mới" stroke="hsl(196 79% 51%)" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Trạng thái dự án</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
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
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Phân bổ trạng thái công việc</CardTitle></CardHeader>
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

        <Card>
          <CardHeader><CardTitle>Tiến độ các dự án</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {projects.map((p) => (
              <div key={p.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate pr-3">{p.name}</span>
                  <Badge variant="outline" className="shrink-0">{p.progress}%</Badge>
                </div>
                <Progress value={p.progress} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
