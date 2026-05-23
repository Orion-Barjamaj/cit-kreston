import { connection } from "next/server";
import { ClientRecord, getSupabaseServerClient, type TaskRecord } from "@/app/lib/supabase";
import styles from "./reports.module.css";
import ScheduleWidget, { type ScheduleWeek } from "./schedule-widget";

type ReportsData = {
  clients: ClientRecord[];
  error?: string;
  isConfigured: boolean;
  tasks: TaskRecord[];
};

type ReportCard = {
  label: string;
  value: string;
};

type DepartmentProgress = {
  label: string;
  value: string;
};

type ReportNote = {
  body: string;
  done: boolean;
  title: string;
};

const dayInMs = 24 * 60 * 60 * 1000;
const doneStatuses = new Set(["done", "completed"]);
const weekdayFormatter = new Intl.DateTimeFormat("en", {
  weekday: "short",
});
const timeFormatter = new Intl.DateTimeFormat("en", {
  hour: "numeric",
  minute: "2-digit",
});

async function getReportsData(): Promise<ReportsData> {
  await connection();

  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return {
      clients: [],
      isConfigured: false,
      tasks: [],
    };
  }

  const [clientsResult, tasksResult] = await Promise.all([
    supabase.from("clients").select("id, name, industry, status, assigned_manager_id, created_at"),
    supabase
      .from("tasks")
      .select("id, title, description, status, priority, deadline, client_id, assigned_to, department_id, created_by, created_at"),
  ]);

  return {
    clients: clientsResult.data ?? [],
    error: clientsResult.error?.message ?? tasksResult.error?.message,
    isConfigured: true,
    tasks: tasksResult.data ?? [],
  };
}

function normalizeDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function isDone(task: TaskRecord) {
  return doneStatuses.has((task.status ?? "").toLowerCase());
}

function isActiveClient(client: ClientRecord) {
  const status = (client.status ?? "active").toLowerCase();

  return status !== "completed" && status !== "inactive" && status !== "archived";
}

function getWeekStart(date: Date) {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() + diff);

  return weekStart;
}

function getReportCards(clients: ClientRecord[], tasks: TaskRecord[]): ReportCard[] {
  const today = new Date();
  const weekStart = getWeekStart(today);
  const activeClients = clients.filter(isActiveClient).length;
  const finishedThisWeek = tasks.filter((task) => {
    const createdAt = normalizeDate(task.created_at);

    return createdAt !== null && createdAt >= weekStart && createdAt <= today && isDone(task);
  }).length;
  const tasksWithDeadline = tasks.filter((task) => normalizeDate(task.deadline));
  const overdueTasks = tasksWithDeadline.filter((task) => {
    const deadline = normalizeDate(task.deadline);

    return deadline !== null && deadline < today && !isDone(task);
  }).length;
  const overdueRate = tasksWithDeadline.length > 0 ? Math.round((overdueTasks / tasksWithDeadline.length) * 100) : 0;
  const taskAges = tasks
    .map((task) => normalizeDate(task.created_at))
    .filter((date): date is Date => date !== null)
    .map((date) => Math.max(0, Math.round((today.getTime() - date.getTime()) / dayInMs)));
  const averageTaskAge =
    taskAges.length > 0 ? `${(taskAges.reduce((total, age) => total + age, 0) / taskAges.length).toFixed(1)} days` : "0 days";

  return [
    { label: "Total active clients", value: String(activeClients) },
    { label: "Average task age", value: averageTaskAge },
    { label: "Tasks finished this week", value: String(finishedThisWeek) },
    { label: "Overdue rate", value: `${overdueRate}%` },
  ];
}

function getDepartmentProgress(tasks: TaskRecord[]): DepartmentProgress[] {
  const groupedTasks = new Map<number | null, TaskRecord[]>();

  tasks.forEach((task) => {
    const departmentId = task.department_id;
    groupedTasks.set(departmentId, [...(groupedTasks.get(departmentId) ?? []), task]);
  });

  return Array.from(groupedTasks.entries())
    .sort(([firstId], [secondId]) => (firstId ?? Number.MAX_SAFE_INTEGER) - (secondId ?? Number.MAX_SAFE_INTEGER))
    .slice(0, 4)
    .map(([departmentId, departmentTasks]) => {
      const completeCount = departmentTasks.filter(isDone).length;
      const percent = departmentTasks.length > 0 ? Math.round((completeCount / departmentTasks.length) * 100) : 0;

      return {
        label: departmentId ? `Department ${departmentId}` : "Unassigned",
        value: `${percent}%`,
      };
    });
}

function getReportNotes(tasks: TaskRecord[]): ReportNote[] {
  return tasks
    .filter((task) => task.description || task.title)
    .sort((first, second) => {
      const firstDate = normalizeDate(first.created_at)?.getTime() ?? 0;
      const secondDate = normalizeDate(second.created_at)?.getTime() ?? 0;

      return secondDate - firstDate;
    })
    .slice(0, 3)
    .map((task) => ({
      body: task.description?.trim() || `Status: ${task.status ?? "not set"}`,
      done: isDone(task),
      title: task.title,
    }));
}

function getAiInsight(tasks: TaskRecord[]) {
  const today = new Date();
  const overdueTasks = tasks.filter((task) => {
    const deadline = normalizeDate(task.deadline);

    return deadline !== null && deadline < today && !isDone(task);
  });

  if (overdueTasks.length > 0) {
    return `${overdueTasks.length} overdue task${overdueTasks.length === 1 ? "" : "s"} need attention.`;
  }

  const reviewTasks = tasks.filter((task) => (task.status ?? "").toLowerCase() === "review");

  if (reviewTasks.length > 0) {
    return "Review is the main active bottleneck.";
  }

  return "No urgent report risks detected.";
}

function getScheduleWeeks(tasks: TaskRecord[]): ScheduleWeek[] {
  const tasksWithDeadlines = tasks
    .map((task) => ({ task, deadline: normalizeDate(task.deadline) }))
    .filter((item): item is { task: TaskRecord; deadline: Date } => item.deadline !== null)
    .sort((first, second) => first.deadline.getTime() - second.deadline.getTime())
    .slice(0, 21);
  const firstDeadline = tasksWithDeadlines[0]?.deadline ?? new Date();
  const startDate = getWeekStart(firstDeadline);

  return Array.from({ length: 3 }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + weekIndex * 7 + dayIndex);

      const items = tasksWithDeadlines
        .filter(({ deadline }) => deadline.toDateString() === date.toDateString())
        .map(({ task, deadline }) => ({
          accent: (isDone(task) ? "green" : deadline < new Date() ? "pink" : "blue") as "green" | "blue" | "pink",
          detail: task.description?.trim() || `Status: ${task.status ?? "not set"}`,
          time: timeFormatter.format(deadline),
          title: task.title,
        }));

      return {
        date: date.getDate(),
        items,
        label: weekdayFormatter.format(date).slice(0, 2),
      };
    }),
  );
}

export default async function ReportsPage() {
  const { clients, error, isConfigured, tasks } = await getReportsData();
  const reportCards = getReportCards(clients, tasks);
  const departmentProgress = getDepartmentProgress(tasks);
  const notes = getReportNotes(tasks);
  const scheduleWeeks = getScheduleWeeks(tasks);

  return (
    <section className={styles.pageStack}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Management KPIs</p>
          <h2>Reports</h2>
          <p>Simple workload, progress, activity, and AI insight summaries.</p>
        </div>
      </div>

      {!isConfigured ? (
        <div className={styles.noticeBox}>
          Add your Supabase URL and anon key to <code>.env</code> to load reports from the database.
        </div>
      ) : null}

      {error ? <div className={styles.errorBox}>{error}</div> : null}

      <div className={styles.statsGrid}>
        {reportCards.map((card) => (
          <article className={styles.statCard} key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <small>Current database data</small>
          </article>
        ))}
      </div>

      <article className={styles.panel}>
        <h3>Department Progress</h3>
        <div className={styles.progressList}>
          {departmentProgress.length > 0 ? (
            departmentProgress.map((item) => (
              <span key={item.label}>
                {item.label} {item.value}
              </span>
            ))
          ) : (
            <span>No department task data</span>
          )}
        </div>
      </article>

      <div className={styles.twoColumn}>
        <ScheduleWidget weeks={scheduleWeeks} />

        <article className={styles.panel}>
          <h3>Notes</h3>
          <ul className={styles.noteChecklist}>
            {notes.length > 0 ? (
              notes.map((note) => (
                <li className={note.done ? styles.noteDone : ""} key={note.title}>
                  <span aria-hidden="true" />
                  <div>
                    <strong>{note.title}</strong>
                    <p>{note.body}</p>
                  </div>
                </li>
              ))
            ) : (
              <li>
                <span aria-hidden="true" />
                <div>
                  <strong>No task notes found</strong>
                  <p>Add task descriptions to populate this list.</p>
                </div>
              </li>
            )}
          </ul>
        </article>
      </div>
    </section>
  );
}
