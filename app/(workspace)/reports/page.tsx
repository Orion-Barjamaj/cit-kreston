import { connection } from "next/server";
import { ClientRecord, getSupabaseServerClient, type TaskRecord } from "@/app/lib/supabase";
import styles from "./reports.module.css";
import ScheduleWidget, { type ScheduleWeek } from "./schedule-widget";

type ReportsData = {
  clients: ClientRecord[];
  documents: ClientDocumentRecord[];
  error?: string;
  isConfigured: boolean;
  tasks: TaskRecord[];
};

type ReportCard = {
  label: string;
  value: string;
};

type ReportNote = {
  body: string;
  done: boolean;
  title: string;
};

type ClientDocumentRecord = {
  client_id: number | null;
  id: number;
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
      documents: [],
      isConfigured: false,
      tasks: [],
    };
  }

  const [clientsResult, tasksResult, documentsResult] = await Promise.all([
    supabase.from("clients").select("id, name, industry, risk, status, assigned_manager_id, created_at"),
    supabase
      .from("tasks")
      .select("id, title, description, status, priority, deadline, client_id, assigned_to, department_id, created_by, created_at"),
    supabase.from("documents").select("id, client_id"),
  ]);

  return {
    clients: clientsResult.data ?? [],
    documents: documentsResult.data ?? [],
    error: clientsResult.error?.message ?? tasksResult.error?.message ?? documentsResult.error?.message,
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

function getOverdueTasks(tasks: TaskRecord[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return tasks.filter((task) => {
    const deadline = normalizeDate(task.deadline);

    return deadline !== null && deadline < today && !isDone(task);
  });
}

function getBlockedReviews(tasks: TaskRecord[]) {
  const today = new Date();

  return tasks.filter((task) => {
    const status = (task.status ?? "").toLowerCase();
    const createdAt = normalizeDate(task.created_at);

    return status === "review" && createdAt !== null && today.getTime() - createdAt.getTime() > 3 * dayInMs;
  });
}

function getClientsMissingDocuments(clients: ClientRecord[], documents: ClientDocumentRecord[]) {
  const clientIdsWithDocuments = new Set(
    documents
      .map((document) => document.client_id)
      .filter((clientId): clientId is number => clientId !== null),
  );

  return clients.filter((client) => isActiveClient(client) && !clientIdsWithDocuments.has(client.id));
}

function getHighRiskClients(clients: ClientRecord[]) {
  return clients.filter((client) => {
    const risk = client.risk?.toLowerCase();
    const status = client.status?.toLowerCase();

    return risk === "high" || status === "delayed";
  });
}

function getReportCards(
  clients: ClientRecord[],
  documents: ClientDocumentRecord[],
  tasks: TaskRecord[],
): ReportCard[] {
  return [
    { label: "Overdue items", value: String(getOverdueTasks(tasks).length) },
    { label: "Blocked reviews", value: String(getBlockedReviews(tasks).length) },
    { label: "Missing documents", value: String(getClientsMissingDocuments(clients, documents).length) },
    { label: "High-risk clients", value: String(getHighRiskClients(clients).length) },
  ];
}

function getReportNotes(
  clients: ClientRecord[],
  documents: ClientDocumentRecord[],
  tasks: TaskRecord[],
): ReportNote[] {
  const overdueNotes = getOverdueTasks(tasks).slice(0, 3).map((task) => ({
    body: task.deadline ? `Deadline: ${new Date(task.deadline).toLocaleDateString("en")}` : "Deadline has passed.",
    done: false,
    title: `Overdue: ${task.title}`,
  }));

  const blockedReviewNotes = getBlockedReviews(tasks).slice(0, 3).map((task) => ({
    body: task.description?.trim() || "Review has been open for more than 3 days.",
    done: false,
    title: `Blocked review: ${task.title}`,
  }));

  const missingDocumentNotes = getClientsMissingDocuments(clients, documents).slice(0, 3).map((client) => ({
    body: client.industry ? `${client.industry} client has no saved documents.` : "Client has no saved documents.",
    done: false,
    title: `Missing documents: ${client.name}`,
  }));

  const highRiskNotes = getHighRiskClients(clients).slice(0, 3).map((client) => ({
    body: client.risk ? `Risk: ${client.risk}` : `Status: ${client.status ?? "delayed"}`,
    done: false,
    title: `High-risk client: ${client.name}`,
  }));

  return [...overdueNotes, ...blockedReviewNotes, ...missingDocumentNotes, ...highRiskNotes].slice(0, 8);
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
  const { clients, documents, error, isConfigured, tasks } = await getReportsData();
  const reportCards = getReportCards(clients, documents, tasks);
  const notes = getReportNotes(clients, documents, tasks);
  const scheduleWeeks = getScheduleWeeks(tasks);

  return (
    <section className={styles.pageStack}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Management KPIs</p>
          <h2>Reports</h2>
          <p>Overdue items, blocked reviews, missing documents, and client risk.</p>
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

      <div className={styles.twoColumn}>
        <ScheduleWidget weeks={scheduleWeeks} />

        <article className={styles.panel}>
          <h3>Risk items</h3>
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
                  <p>No overdue items, blocked reviews, missing documents, or high-risk clients found.</p>
                </div>
              </li>
            )}
          </ul>
        </article>
      </div>
    </section>
  );
}
