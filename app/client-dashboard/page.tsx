import { connection } from "next/server";
import { getSupabaseServerClient } from "@/app/lib/supabase";
import { ClientQuestionForm, ClientUploadForm } from "./client-portal-forms";
import styles from "./client-dashboard.module.css";

type ClientRecord = {
  id: number;
  name: string;
  industry: string | null;
  status: string | null;
  assigned_manager_id: number | null;
};

type TaskRecord = {
  id: number;
  title: string;
  status: string | null;
  priority: string | null;
  deadline: string | null;
};

type UserRecord = {
  id: number;
  name: string;
  email: string | null;
  role: string | null;
};

type DocumentRecord = {
  id: number;
  file_name: string;
  file_url: string | null;
  type: string | null;
  created_at: string | null;
  summary: string | null;
};

type NoteRecord = {
  id: number;
  text: string;
  uploaded_by: string | null;
  created_at: string | null;
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

const progressAreas = ["Payroll Processing", "Audit Review", "Tax Documents", "Contract Review"];

function formatDate(value: string | null) {
  if (!value) {
    return "No date";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "No date" : dateFormatter.format(date);
}

function formatStatus(status: string | null) {
  return (status ?? "todo").replace(/-/g, " ");
}

function isDone(status: string | null) {
  return ["done", "completed"].includes((status ?? "").toLowerCase());
}

function getProgressStatus(area: string, tasks: TaskRecord[]) {
  const areaWord = area.split(" ")[0].toLowerCase();
  const matchingTasks = tasks.filter((task) => task.title.toLowerCase().includes(areaWord));

  if (matchingTasks.length === 0) {
    return "Not started";
  }

  if (matchingTasks.every((task) => isDone(task.status))) {
    return "Completed";
  }

  if (matchingTasks.some((task) => (task.status ?? "").toLowerCase() === "review")) {
    return "In review";
  }

  return "In progress";
}

function getUpcomingEvents(tasks: TaskRecord[]) {
  const now = new Date();

  return tasks
    .filter((task) => task.deadline && !isDone(task.status))
    .map((task) => ({ task, date: new Date(task.deadline ?? "") }))
    .filter(({ date }) => !Number.isNaN(date.getTime()) && date >= now)
    .sort((first, second) => first.date.getTime() - second.date.getTime())
    .slice(0, 4);
}

function getAiInsights(tasks: TaskRecord[], documents: DocumentRecord[], notes: NoteRecord[]) {
  const overdueTasks = tasks.filter((task) => {
    const deadline = task.deadline ? new Date(task.deadline) : null;

    return deadline && !Number.isNaN(deadline.getTime()) && deadline < new Date() && !isDone(task.status);
  }).length;
  const reviewTasks = tasks.filter((task) => (task.status ?? "").toLowerCase() === "review").length;

  return [
    `${tasks.filter((task) => !isDone(task.status)).length} active task${tasks.length === 1 ? "" : "s"}`,
    overdueTasks > 0 ? `${overdueTasks} overdue deadline${overdueTasks === 1 ? "" : "s"}` : "No overdue deadlines",
    reviewTasks > 0 ? `${reviewTasks} item${reviewTasks === 1 ? "" : "s"} waiting review` : "No reviews waiting",
    documents.length > 0 ? `${documents.length} document${documents.length === 1 ? "" : "s"} available` : "No documents shared yet",
    notes.filter((note) => note.uploaded_by === "Client").length > 0 ? "Your latest notes were sent to the team" : "No client questions sent yet",
  ];
}

async function getDashboardData() {
  await connection();

  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return {
      isConfigured: false,
      client: null,
      manager: null,
      tasks: [] as TaskRecord[],
      documents: [] as DocumentRecord[],
      notes: [] as NoteRecord[],
      error: undefined as string | undefined,
    };
  }

  const { data: clients, error: clientError } = await supabase
    .from("clients")
    .select("id, name, industry, status, assigned_manager_id")
    .order("created_at", { ascending: false });
  const client =
    ((clients ?? []) as ClientRecord[]).find((item) => (item.status ?? "active").toLowerCase() === "active") ??
    ((clients ?? []) as ClientRecord[])[0] ??
    null;

  if (!client) {
    return {
      isConfigured: true,
      client: null,
      manager: null,
      tasks: [] as TaskRecord[],
      documents: [] as DocumentRecord[],
      notes: [] as NoteRecord[],
      error: clientError?.message,
    };
  }

  const [tasksResult, documentsResult, notesResult, managerResult] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, status, priority, deadline")
      .eq("client_id", client.id)
      .order("deadline", { ascending: true }),
    supabase
      .from("documents")
      .select("id, file_name, file_url, type, created_at, summary")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("notes")
      .select("id, text, uploaded_by, created_at")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .limit(8),
    client.assigned_manager_id
      ? supabase.from("users").select("id, name, email, role").eq("id", client.assigned_manager_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  return {
    isConfigured: true,
    client,
    manager: managerResult.data as UserRecord | null,
    tasks: (tasksResult.data ?? []) as TaskRecord[],
    documents: (documentsResult.data ?? []) as DocumentRecord[],
    notes: (notesResult.data ?? []) as NoteRecord[],
    error: clientError?.message ?? tasksResult.error?.message ?? documentsResult.error?.message ?? notesResult.error?.message ?? managerResult.error?.message,
  };
}

export default async function ClientDashboardPage() {
  const { client, documents, error, isConfigured, manager, notes, tasks } = await getDashboardData();
  const aiInsights = getAiInsights(tasks, documents, notes);
  const upcomingEvents = getUpcomingEvents(tasks);

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Client portal</p>
            <h1>{client?.name ?? "Client Dashboard"}</h1>
            <p>{client ? `${client.industry ?? "General"} account status: ${client.status ?? "active"}` : "Secure client progress and document view."}</p>
          </div>
        </header>

        {!isConfigured ? (
          <div className={styles.noticeBox}>
            Add your Supabase URL and publishable key to <code>.env.local</code> to load the client dashboard.
          </div>
        ) : null}

        {error ? <div className={styles.errorBox}>{error}</div> : null}

        <aside className={styles.aiSummary}>
          <span className={styles.aiSparkle} aria-hidden="true">✦</span>
          <div>
            <div className={styles.aiHeader}>
              <h2>AI Summary. Generated automatically by AI.</h2>
              <span>{aiInsights.length} insights</span>
            </div>
            <ul>
              {aiInsights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </aside>

        {client ? (
          <>
            <section className={styles.progressGrid}>
              {progressAreas.map((area) => (
                <article className={styles.progressCard} key={area}>
                  <span>{area}</span>
                  <strong>{getProgressStatus(area, tasks)}</strong>
                </article>
              ))}
            </section>

            <section className={styles.twoColumn}>
              <article className={styles.panel}>
                <h2>Deadlines & Upcoming Events</h2>
                <ul className={styles.eventList}>
                  {upcomingEvents.length > 0 ? (
                    upcomingEvents.map(({ task, date }) => (
                      <li key={task.id}>
                        <strong>{task.title}</strong>
                        <span>{formatDate(date.toISOString())} - {formatStatus(task.status)}</span>
                      </li>
                    ))
                  ) : (
                    <li>No upcoming events.</li>
                  )}
                </ul>
              </article>

              <article className={styles.panel}>
                <h2>Manager Contact</h2>
                <div className={styles.managerBox}>
                  <strong>{manager?.name ?? "Manager not assigned"}</strong>
                  <span>{manager?.role ?? "Kreston manager"}</span>
                  {manager?.email ? <a href={`mailto:${manager.email}`}>{manager.email}</a> : <span>No email saved</span>}
                </div>
              </article>
            </section>

            <article className={styles.panel}>
              <h2>Documents</h2>
              <ul className={styles.documentList}>
                {documents.length > 0 ? (
                  documents.map((document) => (
                    <li key={document.id}>
                      <div>
                        <strong>{document.file_name}</strong>
                        <span>{document.type ?? "document"} - {formatDate(document.created_at)}</span>
                        <p>{document.summary?.trim() || "No AI summary saved for this document yet."}</p>
                      </div>
                      {document.file_url ? (
                        <a href={document.file_url} rel="noreferrer" target="_blank">
                          Download
                        </a>
                      ) : (
                        <span>No file</span>
                      )}
                    </li>
                  ))
                ) : (
                  <li>No documents shared yet.</li>
                )}
              </ul>
            </article>

            <section className={styles.twoColumn}>
              <article className={styles.panel}>
                <h2>Upload Requested Files</h2>
                <ClientUploadForm clientId={client.id} />
              </article>

              <article className={styles.panel}>
                <h2>Questions & Follow-ups</h2>
                <ClientQuestionForm clientId={client.id} />
                <ul className={styles.noteList}>
                  {notes.length > 0 ? (
                    notes.map((note) => (
                      <li key={note.id}>
                        <strong>{note.text}</strong>
                        <span>{note.uploaded_by ?? "Team"} - {formatDate(note.created_at)}</span>
                      </li>
                    ))
                  ) : (
                    <li>No notes yet.</li>
                  )}
                </ul>
              </article>
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}
