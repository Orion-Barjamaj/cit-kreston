import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { AddDocumentForm, AddTimelineNoteForm } from "../add-document-note-forms";
import AddTaskForm, { type TaskAssignee } from "../add-task-form";
import DocumentSummaryPopover from "../document-summary-popover";
import styles from "../clients.module.css";
import { ClientRecord, getSupabaseServerClient } from "@/app/lib/supabase";

type ClientPageProps = {
  params: Promise<{ id: string }>;
};

const today = new Date("2026-05-22T00:00:00");
const dayInMs = 24 * 60 * 60 * 1000;
const taskDateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "2-digit",
});

const detailDateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

type ClientTaskRecord = {
  id: number;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  deadline: string | null;
  assigned_to: number | null;
  department_id: number | null;
  created_at: string | null;
};

type ClientActivityRecord = {
  id: number;
  client_id: number | null;
  user_id: number | null;
  type: string | null;
  content: string;
  created_at: string | null;
};

type ClientUserRecord = {
  id: number;
  name: string;
  email: string | null;
  role: string;
  department_id: number | null;
};

type ClientTimelineNoteRecord = {
  id: number;
  client_id: number | null;
  uploaded_by: string | null;
  text: string;
  created_at: string | null;
};

type ClientDocumentRecord = {
  id: number;
  client_id: number | null;
  uploaded_by: number | null;
  file_name: string;
  file_url: string | null;
  type: string | null;
  created_at: string | null;
  summary: string | null;
  last_updated: string | null;
};

type TimelineItem = {
  id: string;
  content: string;
  label: string;
  created_at: string | null;
};

type DisplayTask = {
  id: string;
  name: string;
  assignedTo: string;
  status: string;
  deadline: string | null;
  deadlineLabel: string;
  reviewStartedAt: string | null;
};

async function getClient(id: string) {
  await connection();

  const clientId = Number(id);

  if (!Number.isInteger(clientId) || clientId <= 0) {
    notFound();
  }

  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return {
      client: null,
      isConfigured: false,
    };
  }

  const { data, error } = await supabase
    .from("clients")
    .select("id, name, industry, status, assigned_manager_id, created_at")
    .eq("id", clientId)
    .single();

  if (error || !data) {
    notFound();
  }

  return {
    client: data as ClientRecord,
    isConfigured: true,
  };
}

async function getClientTasks(clientId: number) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return [] as ClientTaskRecord[];
  }

  const { data } = await supabase
    .from("tasks")
    .select(
      "id, title, description, status, priority, deadline, assigned_to, department_id, created_at",
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  return (data ?? []) as ClientTaskRecord[];
}

async function getClientActivities(clientId: number) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return [] as ClientActivityRecord[];
  }

  const { data } = await supabase
    .from("activities")
    .select("id, client_id, user_id, type, content, created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  return (data ?? []) as ClientActivityRecord[];
}

async function getClientTimelineNotes(clientId: number) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return [] as ClientTimelineNoteRecord[];
  }

  const { data } = await supabase
    .from("notes")
    .select("id, client_id, uploaded_by, text, created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  return (data ?? []) as ClientTimelineNoteRecord[];
}

async function getClientDocuments(clientId: number) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return [] as ClientDocumentRecord[];
  }

  const { data } = await supabase
    .from("documents")
    .select(
      "id, client_id, uploaded_by, file_name, file_url, type, created_at, summary, last_updated",
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  return (data ?? []) as ClientDocumentRecord[];
}

async function getClientUsers() {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return [] as ClientUserRecord[];
  }

  const { data } = await supabase
    .from("users")
    .select("id, name, email, role, department_id")
    .order("name");

  return (data ?? []) as ClientUserRecord[];
}

function managerName(client: ClientRecord, usersById: Map<number, ClientUserRecord>) {
  if (!client.assigned_manager_id) {
    return "Unassigned";
  }

  return usersById.get(client.assigned_manager_id)?.name ?? "Unassigned";
}

function managerEmail(client: ClientRecord, usersById: Map<number, ClientUserRecord>) {
  if (!client.assigned_manager_id) {
    return "No manager email";
  }

  return usersById.get(client.assigned_manager_id)?.email ?? "No manager email";
}

function displayStatus(status: string | null) {
  return status ?? "active";
}

function daysBetween(firstDate: Date, secondDate: Date) {
  return Math.floor((firstDate.getTime() - secondDate.getTime()) / dayInMs);
}

function formatTaskDate(value: string | null) {
  if (!value) {
    return "No deadline";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No deadline";
  }

  return taskDateFormatter.format(date);
}

function formatDetailDate(value: string | null) {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return detailDateFormatter.format(date);
}

function normalizeTaskDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function mapTask(task: ClientTaskRecord, usersById: Map<number, ClientUserRecord>): DisplayTask {
  const assignedUser = task.assigned_to ? usersById.get(task.assigned_to) : null;

  return {
    id: String(task.id),
    name: task.title,
    assignedTo: assignedUser ? `${assignedUser.name} - ${displayRole(assignedUser.role)}` : "Unassigned",
    status: task.status ?? "todo",
    deadline: normalizeTaskDate(task.deadline),
    deadlineLabel: formatTaskDate(task.deadline),
    reviewStartedAt:
      task.status === "review" ? normalizeTaskDate(task.created_at) : null,
  };
}

function displayRole(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function getAiInsights(
  tasks: DisplayTask[],
  documents: ClientDocumentRecord[],
  activities: ClientActivityRecord[],
) {
  const insights = new Set<string>();
  const activeTasks = tasks.filter((task) => task.status !== "done").length;
  const lastActivity = activities
    .map((item) => new Date(item.created_at ?? ""))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((first, second) => second.getTime() - first.getTime())[0];

  tasks.forEach((task) => {
    if (!task.deadline) {
      return;
    }

    const deadline = new Date(`${task.deadline}T00:00:00`);
    const daysUntilDeadline = daysBetween(deadline, today);

    if (deadline < today && task.status !== "done") {
      insights.add("Task overdue");
    }

    if (
      daysUntilDeadline <= 2 &&
      daysUntilDeadline >= 0 &&
      task.status !== "done"
    ) {
      insights.add("Upcoming deadline requires attention");
    }

    if (task.status === "review" && task.reviewStartedAt) {
      const daysInReview = daysBetween(
        today,
        new Date(`${task.reviewStartedAt}T00:00:00`),
      );

      if (daysInReview > 3) {
        insights.add("Review process may be blocked");
      }
    }
  });

  if (activeTasks > 0 && documents.length === 0) {
    insights.add("Missing client documents");
  }

  if (lastActivity && daysBetween(today, lastActivity) > 7) {
    insights.add("No recent client activity");
  }

  return Array.from(insights);
}

function getTimelineItems(
  activities: ClientActivityRecord[],
  timelineNotes: ClientTimelineNoteRecord[],
) {
  return [
    ...timelineNotes.map((note) => ({
      id: `note-${note.id}`,
      content: note.text,
      label: note.uploaded_by ? `Note by ${note.uploaded_by}` : "note",
      created_at: note.created_at,
    })),
    ...activities.map((activity) => ({
      id: `activity-${activity.id}`,
      content: activity.content,
      label: activity.type ?? "update",
      created_at: activity.created_at,
    })),
  ].sort((first, second) => {
    const firstTime = new Date(first.created_at ?? "").getTime();
    const secondTime = new Date(second.created_at ?? "").getTime();

    return (Number.isNaN(secondTime) ? 0 : secondTime) - (Number.isNaN(firstTime) ? 0 : firstTime);
  }) satisfies TimelineItem[];
}

function getUpcomingTasks(tasks: DisplayTask[]) {
  return tasks
    .filter((task) => task.deadline && task.status !== "done")
    .map((task) => ({ task, date: new Date(`${task.deadline}T00:00:00`) }))
    .filter(({ date }) => !Number.isNaN(date.getTime()))
    .sort((first, second) => first.date.getTime() - second.date.getTime())
    .slice(0, 4);
}

export default async function ClientPage({ params }: ClientPageProps) {
  const { id } = await params;
  const { client, isConfigured } = await getClient(id);

  if (!isConfigured || !client) {
    return (
      <section className={styles.pageStack}>
        <Link className={styles.textButton} href="/clients">
          Back to clients
        </Link>
        <div className={styles.noticeBox}>
          Add your Supabase URL and publishable key to <code>.env.local</code>{" "}
          to load this client.
        </div>
      </section>
    );
  }

  const status = displayStatus(client.status);
  const savedTasks = await getClientTasks(client.id);
  const savedActivities = await getClientActivities(client.id);
  const savedTimelineNotes = await getClientTimelineNotes(client.id);
  const savedDocuments = await getClientDocuments(client.id);
  const teamMembers = await getClientUsers();
  const usersById = new Map(teamMembers.map((user) => [user.id, user]));
  const taskAssignees: TaskAssignee[] = teamMembers.map((user) => ({
    id: user.id,
    name: user.name,
    role: user.role,
  }));
  const tasks = savedTasks.map((task) => mapTask(task, usersById));
  const activities = savedActivities;
  const documents = savedDocuments;
  const timelineItems = getTimelineItems(activities, savedTimelineNotes);
  const clientMessages = savedTimelineNotes.filter((note) => note.uploaded_by === "Client");
  const upcomingTasks = getUpcomingTasks(tasks);
  const aiInsights = getAiInsights(tasks, documents, activities);

  return (
    <section className={styles.pageStack}>
      <div className={styles.clientDetailHeader}>
        <div>
          <p className={styles.eyebrow}>Client file</p>
          <h2>{client.name}</h2>
          <p>
            Review client status, tasks, documents, and activity in one place.
          </p>
        </div>
        <Link className={styles.textButton} href="/clients">
          Back to clients
        </Link>
      </div>

      <article className={styles.panel}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Client overview</p>
            <h3>Account details</h3>
          </div>
          <span className={`${styles.statusTag} ${styles.statusActive}`}>
            {status}
          </span>
        </div>
        <dl className={styles.detailGrid}>
          <div>
            <dt>Industry</dt>
            <dd>{client.industry ?? "Not assigned"}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <span className={styles.statusTag}>{status}</span>
            </dd>
          </div>
          <div>
            <dt>Manager</dt>
            <dd>{managerName(client, usersById)}</dd>
          </div>
          <div>
            <dt>Manager Contact</dt>
            <dd>{managerEmail(client, usersById)}</dd>
          </div>
        </dl>
      </article>

      <aside className={styles.aiSummary}>
        <span className={styles.aiSparkle} aria-hidden="true">
          ✦
        </span>
        <div>
          <div className={styles.sectionHeader}>
            <h3>AI Summary. Generated automatically by AI.</h3>
            <span>
              {aiInsights.length} insight{aiInsights.length === 1 ? "" : "s"}
            </span>
          </div>
          <ul className={styles.cleanList}>
            {aiInsights.length > 0 ? (
              aiInsights.map((insight) => <li key={insight}>{insight}</li>)
            ) : (
              <li>No urgent client risks detected.</li>
            )}
          </ul>
        </div>
      </aside>

      <article className={styles.panel}>
        <div className={styles.clientFileHeader}>
          <div>
            <p className={styles.eyebrow}>Workflow</p>
            <h3>Tasks for this client</h3>
          </div>
        </div>
        <AddTaskForm assignees={taskAssignees} clientId={client.id} />
        <div className={styles.tableWrap}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Task</th>
                <th>Assigned To</th>
                <th>Status</th>
                <th>Deadline</th>
                <th>Update</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.name}</td>
                  <td>{task.assignedTo}</td>
                  <td>
                    <span className={styles.statusTag}>{task.status}</span>
                  </td>
                  <td>{task.deadlineLabel}</td>
                  <td>
                    <button className={styles.textButton} type="button">
                      Comment
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <section className={styles.twoColumn}>
        <article className={styles.panel}>
          <h3>Client Messages</h3>
          <ol className={styles.timelineList}>
            {clientMessages.length > 0 ? (
              clientMessages.map((message) => (
                <li key={message.id}>
                  <time>{formatDetailDate(message.created_at)}</time>
                  <span>{message.text}</span>
                  <small>Client</small>
                </li>
              ))
            ) : (
              <li>
                <time>-</time>
                <span>No client questions or follow-ups yet.</span>
                <small>Client</small>
              </li>
            )}
          </ol>
        </article>

        <article className={styles.panel}>
          <h3>Deadlines & Upcoming Events</h3>
          <ol className={styles.timelineList}>
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map(({ task }) => (
                <li key={task.id}>
                  <time>{task.deadlineLabel}</time>
                  <span>{task.name}</span>
                  <small>{task.status}</small>
                </li>
              ))
            ) : (
              <li>
                <time>-</time>
                <span>No upcoming deadlines.</span>
                <small>clear</small>
              </li>
            )}
          </ol>
        </article>
      </section>

      <section className={styles.twoColumn}>
        <article className={styles.panel}>
          <h3>Activity Timeline</h3>
          <AddTimelineNoteForm clientId={client.id} />
          <ol className={styles.timelineList}>
            {timelineItems.map((item) => (
              <li key={item.id}>
                <time>{formatDetailDate(item.created_at)}</time>
                <span>{item.content}</span>
                <small>{item.label}</small>
              </li>
            ))}
          </ol>
        </article>

        <article className={styles.panel}>
          <h3>Documents</h3>
          <AddDocumentForm clientId={client.id} />
          <ul className={styles.documentList}>
            {documents.map((document) => (
              <li key={document.id}>
                <div>
                  <span>{document.file_name}</span>
                  <small>
                    {document.type ?? "document"} -{" "}
                    {formatDetailDate(document.created_at)}
                  </small>
                </div>
                <div className={styles.documentActions}>
                  <DocumentSummaryPopover
                    fileName={document.file_name}
                    summary={document.summary?.trim() || "No summary saved for this document yet."}
                  />
                  {document.file_url ? (
                    <a
                      className={styles.textButton}
                      href={document.file_url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open
                    </a>
                  ) : (
                    <span className={styles.mutedAction}>No file</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </section>
  );
}
