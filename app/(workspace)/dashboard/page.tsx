import Link from "next/link";
import { connection } from "next/server";
import { getSupabaseServerClient, type ClientRecord, type TaskRecord } from "@/app/lib/supabase";
import styles from "./dashboard.module.css";

type DashboardData = {
  clients: ClientRecord[];
  error?: string;
  isConfigured: boolean;
  tasks: TaskRecord[];
  users: DashboardUserRecord[];
};

type Metric = {
  label: string;
  value: string;
};

type WorkloadItem = {
  team: string;
  value: string;
};

type DashboardUserRecord = {
  id: number;
  name: string;
};

const doneStatuses = new Set(["done", "completed"]);
const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "long",
  weekday: "long",
});

async function getDashboardData(): Promise<DashboardData> {
  await connection();

  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return {
      clients: [],
      isConfigured: false,
      tasks: [],
      users: [],
    };
  }

  const [clientsResult, tasksResult, usersResult] = await Promise.all([
    supabase.from("clients").select("id, name, industry, status, assigned_manager_id, created_at"),
    supabase
      .from("tasks")
      .select("id, title, description, status, priority, deadline, client_id, assigned_to, department_id, created_by, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("users").select("id, name"),
  ]);

  return {
    clients: clientsResult.data ?? [],
    error: clientsResult.error?.message ?? tasksResult.error?.message ?? usersResult.error?.message,
    isConfigured: true,
    tasks: tasksResult.data ?? [],
    users: usersResult.data ?? [],
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

function isSameDay(firstDate: Date, secondDate: Date) {
  return firstDate.toDateString() === secondDate.toDateString();
}

function getMetrics(tasks: TaskRecord[]): Metric[] {
  const today = new Date();
  const tasksWithDeadlines = tasks.filter((task) => normalizeDate(task.deadline));
  const overdueTasks = tasksWithDeadlines.filter((task) => {
    const deadline = normalizeDate(task.deadline);

    return deadline !== null && deadline < today && !isDone(task);
  }).length;
  const tasksDueToday = tasksWithDeadlines.filter((task) => {
    const deadline = normalizeDate(task.deadline);

    return deadline !== null && isSameDay(deadline, today) && !isDone(task);
  }).length;
  const activeTasks = tasks.filter((task) => !isDone(task)).length;
  const activeWorkload = tasks.length > 0 ? Math.round((activeTasks / tasks.length) * 100) : 0;

  return [
    { label: "Overdue Tasks", value: String(overdueTasks) },
    { label: "Tasks Due Today", value: String(tasksDueToday) },
    { label: "Active Workload", value: `${activeWorkload}%` },
  ];
}

function getRecentActivity(tasks: TaskRecord[]) {
  return tasks.slice(0, 5).map((task) => {
    const status = task.status ? ` moved to ${task.status}` : " updated";

    return `${task.title}${status}`;
  });
}

function getWorkload(tasks: TaskRecord[]): WorkloadItem[] {
  const groupedTasks = new Map<number | null, TaskRecord[]>();

  tasks.forEach((task) => {
    groupedTasks.set(task.department_id, [...(groupedTasks.get(task.department_id) ?? []), task]);
  });

  return Array.from(groupedTasks.entries())
    .sort(([firstId], [secondId]) => (firstId ?? Number.MAX_SAFE_INTEGER) - (secondId ?? Number.MAX_SAFE_INTEGER))
    .slice(0, 4)
    .map(([departmentId, departmentTasks]) => {
      const activeCount = departmentTasks.filter((task) => !isDone(task)).length;
      const activePercent = departmentTasks.length > 0 ? Math.round((activeCount / departmentTasks.length) * 100) : 0;

      return {
        team: departmentId ? `Department ${departmentId}` : "Unassigned",
        value: `${activePercent}%`,
      };
    });
}

function getInitials(value: string) {
  return value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getClientName(task: TaskRecord, clients: ClientRecord[]) {
  const client = clients.find((item) => item.id === task.client_id);

  return client?.name ?? "No linked client";
}

function getStatusClassName(status: string | null) {
  const normalizedStatus = (status ?? "").toLowerCase();

  if (doneStatuses.has(normalizedStatus)) {
    return `${styles.statusTag} ${styles.statusCompleted}`;
  }

  if (normalizedStatus === "todo" || normalizedStatus === "pending") {
    return `${styles.statusTag} ${styles.statusPending}`;
  }

  return `${styles.statusTag} ${styles.statusInProgress}`;
}

export default async function DashboardPage() {
  const { clients, error, isConfigured, tasks, users } = await getDashboardData();
  const metrics = getMetrics(tasks);
  const recentActivity = getRecentActivity(tasks);
  const workload = getWorkload(tasks);
  const todayLabel = dateFormatter.format(new Date());
  const userNamesById = new Map(users.map((user) => [user.id, user.name]));

  return (
    <section className={styles.pageStack}>
      <header className={styles.dashboardHero}>
        <div>
          <time>{todayLabel}</time>
          <h2>Dashboard</h2>
        </div>
      </header>

      {!isConfigured ? (
        <div className={styles.noticeBox}>
          Add your Supabase URL and anon key to <code>.env</code> to load dashboard data from the database.
        </div>
      ) : null}

      {error ? <div className={styles.errorBox}>{error}</div> : null}

      <div className={styles.metricPill}>
        {metrics.map((metric) => (
          <span key={metric.label}>
            <strong>{metric.value}</strong>
            {metric.label}
          </span>
        ))}
      </div>

      <div className={styles.managerGrid}>
        <article className={styles.panel}>
          <h3>Recent Activity</h3>
          <ul className={styles.activityFeed}>
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => <li key={activity}>{activity}</li>)
            ) : (
              <li>No task activity found.</li>
            )}
          </ul>
        </article>

        <article className={styles.panel}>
          <h3>Active Workload</h3>
          <div className={styles.workloadList}>
            {workload.length > 0 ? (
              workload.map((item) => (
                <div key={item.team}>
                  <span>{item.team}</span>
                  <strong>{item.value}</strong>
                </div>
              ))
            ) : (
              <div>
                <span>No departments</span>
                <strong>0%</strong>
              </div>
            )}
          </div>
        </article>
      </div>

      <article className={styles.projectPanel}>
        <div className={styles.panelToolbar}>
          <h3>My Projects</h3>
          <Link className={styles.textButton} href="/tasks">
            See All
          </Link>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Task Name</th>
                <th>Assign</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length > 0 ? (
                tasks.slice(0, 6).map((task) => {
                  const assignee = task.assigned_to ? userNamesById.get(task.assigned_to) ?? "Unassigned" : "Unassigned";

                  return (
                    <tr key={task.id}>
                      <td>
                        <span className={styles.taskTitle}>{task.title}</span>
                        <small className={styles.taskMeta}>{getClientName(task, clients)}</small>
                      </td>
                      <td>
                        <span className={styles.assignee}>
                          <i aria-hidden="true">{getInitials(assignee)}</i>
                          {assignee}
                        </span>
                      </td>
                      <td>
                        <span className={getStatusClassName(task.status)}>{task.status ?? "Not set"}</span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3}>No tasks found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
