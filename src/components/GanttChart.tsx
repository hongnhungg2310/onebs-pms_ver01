import { useMemo } from "react";
import type { Task, Project, User } from "@/lib/store";
import { taskStatusLabel } from "@/lib/store";

interface Props {
  project: Project;
  tasks: Task[];
  users: User[];
}

const DAY = 86400000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const parseDate = (s: string) => (s ? startOfDay(new Date(s)) : null);
const fmt = (d: Date) =>
  d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });

const statusColor: Record<string, string> = {
  todo: "bg-muted-foreground/40",
  in_progress: "bg-primary",
  review: "bg-warning",
  done: "bg-success",
};

export default function GanttChart({ project, tasks, users }: Props) {
  const { rows, ticks, totalDays, rangeStart } = useMemo(() => {
    const projStart = parseDate(project.startDate) ?? startOfDay(new Date());
    const projEnd = parseDate(project.endDate) ?? new Date(projStart.getTime() + 30 * DAY);

    const rows = tasks.map((t) => {
      const due = parseDate(t.dueDate);
      const end = due ?? projEnd;
      // Ước lượng start = end - 7 ngày, không sớm hơn projStart
      const estStart = new Date(end.getTime() - 7 * DAY);
      const start = estStart < projStart ? projStart : estStart;
      return { task: t, start, end: end < start ? start : end };
    });

    const minDate = rows.reduce(
      (m, r) => (r.start < m ? r.start : m),
      projStart,
    );
    const maxDate = rows.reduce(
      (m, r) => (r.end > m ? r.end : m),
      projEnd,
    );
    const rangeStart = startOfDay(minDate);
    const rangeEnd = startOfDay(maxDate);
    const totalDays = Math.max(
      1,
      Math.round((rangeEnd.getTime() - rangeStart.getTime()) / DAY) + 1,
    );

    // Khoảng 6-8 cột mốc thời gian
    const tickCount = Math.min(8, Math.max(2, Math.ceil(totalDays / 7)));
    const step = Math.max(1, Math.round(totalDays / tickCount));
    const ticks: { date: Date; offset: number }[] = [];
    for (let i = 0; i <= totalDays; i += step) {
      ticks.push({ date: new Date(rangeStart.getTime() + i * DAY), offset: (i / totalDays) * 100 });
    }

    return { rows, ticks, totalDays, rangeStart };
  }, [project, tasks]);

  const today = startOfDay(new Date());
  const todayOffset =
    ((today.getTime() - rangeStart.getTime()) / DAY / totalDays) * 100;
  const showToday = todayOffset >= 0 && todayOffset <= 100;

  if (!tasks.length) {
    return (
      <div className="text-center text-sm text-muted-foreground py-10">
        Chưa có công việc nào để hiển thị trên Gantt chart.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        {Object.entries(statusColor).map(([k, c]) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className={`inline-block h-2.5 w-3 rounded-sm ${c}`} />
            <span className="text-muted-foreground">{taskStatusLabel[k as keyof typeof taskStatusLabel]}</span>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-md border bg-card">
        <div className="min-w-[720px]">
          {/* Header timeline */}
          <div className="flex border-b bg-muted/40">
            <div className="w-56 shrink-0 px-3 py-2 text-xs font-medium text-muted-foreground border-r">
              Công việc
            </div>
            <div className="relative flex-1 h-9">
              {ticks.map((t, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-l border-border/60 text-[10px] text-muted-foreground pl-1 pt-1.5"
                  style={{ left: `${t.offset}%` }}
                >
                  {fmt(t.date)}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div className="relative">
            {showToday && (
              <div
                className="absolute top-0 bottom-0 border-l-2 border-destructive/70 z-10 pointer-events-none"
                style={{ left: `calc(14rem + ${todayOffset}% * (100% - 14rem) / 100)` }}
                title={`Hôm nay: ${fmt(today)}`}
              />
            )}
            {rows.map(({ task, start, end }) => {
              const u = users.find((x) => x.id === task.assignee);
              const offset =
                ((start.getTime() - rangeStart.getTime()) / DAY / totalDays) * 100;
              const width = Math.max(
                2,
                ((end.getTime() - start.getTime()) / DAY / totalDays) * 100 + (1 / totalDays) * 100,
              );
              return (
                <div key={task.id} className="flex border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                  <div className="w-56 shrink-0 px-3 py-2.5 border-r">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {u?.name ?? "Chưa giao"}
                    </p>
                  </div>
                  <div className="relative flex-1 h-12">
                    {ticks.map((t, i) => (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 border-l border-border/30"
                        style={{ left: `${t.offset}%` }}
                      />
                    ))}
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 h-6 rounded-md ${statusColor[task.status]} shadow-sm flex items-center px-2 text-[11px] text-white font-medium overflow-hidden`}
                      style={{ left: `${offset}%`, width: `${width}%`, minWidth: "24px" }}
                      title={`${task.title} • ${fmt(start)} → ${fmt(end)} • ${taskStatusLabel[task.status]}`}
                    >
                      <span className="truncate">{fmt(end)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        * Thanh thời gian được ước lượng dựa trên hạn hoàn thành của công việc (mặc định 7 ngày trước hạn).
      </p>
    </div>
  );
}
