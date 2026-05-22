import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import AddDocumentNoteForms from "../add-document-note-forms";
import AddTaskForm from "../add-task-form";
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

type ClientDocumentRecord = {
  id: number;
  client_id: number | null;
  uploaded_by: number | null;
  file_name: string;
  file_url: string | null;
  type: string | null;
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

const fallbackTasks: DisplayTask[] = [
  {
    id: "fallback-payroll",
    name: "Review payroll documents",
    assignedTo: "Sara",
    status: "review",
    deadline: "2026-05-24",
    deadlineLabel: "May 24",
    reviewStartedAt: "2026-05-18",
  },
  {
    id: "fallback-audit",
    name: "Prepare audit checklist",
    assignedTo: "Andi",
    status: "progress",
    deadline: "2026-05-21",
    deadlineLabel: "May 21",
    reviewStartedAt: null,
  },
  {
    id: "fallback-tax",
    name: "Confirm tax declaration",
    assignedTo: "Arber",
    status: "todo",
    deadline: "2026-05-28",
    deadlineLabel: "May 28",
    reviewStartedAt: null,
  },
];

const fallbackActivities: ClientActivityRecord[] = [
  {
    id: 1,
    client_id: null,
    user_id: 3,
    type: "update",
    content: "Contract signed",
    created_at: "2026-05-20T00:00:00",
  },
  {
    id: 2,
    client_id: null,
    user_id: 2,
    type: "update",
    content: "Documents uploaded",
    created_at: "2026-05-21T00:00:00",
  },
  {
    id: 3,
    client_id: null,
    user_id: 4,
    type: "comment",
    content: "Payroll files checked",
    created_at: "2026-05-22T00:00:00",
  },
  {
    id: 4,
    client_id: null,
    user_id: 1,
    type: "alert",
    content: "Review pending",
    created_at: "2026-05-23T00:00:00",
  },
];

const fallbackDocuments: ClientDocumentRecord[] = [
  {
    id: 1,
    client_id: null,
    uploaded_by: 1,
    file_name: "signed_contract.pdf",
    file_url: null,
    type: "contract",
    created_at: "2026-05-20T00:00:00",
  },
  {
    id: 2,
    client_id: null,
    uploaded_by: 2,
    file_name: "company_extract.pdf",
    file_url: null,
    type: "report",
    created_at: "2026-05-21T00:00:00",
  },
  {
    id: 3,
    client_id: null,
    uploaded_by: 4,
    file_name: "payroll_may.xlsx",
    file_url: null,
    type: "payroll",
    created_at: "2026-05-22T00:00:00",
  },
];

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
    .select("id, title, description, status, priority, deadline, assigned_to, department_id, created_at")
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

async function getClientDocuments(clientId: number) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return [] as ClientDocumentRecord[];
  }

  const { data } = await supabase
    .from("documents")
    .select("id, client_id, uploaded_by, file_name, file_url, type, created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  return (data ?? []) as ClientDocumentRecord[];
}

function managerName(client: ClientRecord) {
  return client.assigned_manager_id
    ? `Manager #${client.assigned_manager_id}`
    : "Unassigned";
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

function mapTask(task: ClientTaskRecord): DisplayTask {
  return {
    id: String(task.id),
    name: task.title,
    assignedTo: task.assigned_to ? `User #${task.assigned_to}` : "Unassigned",
    status: task.status ?? "todo",
    deadline: normalizeTaskDate(task.deadline),
    deadlineLabel: formatTaskDate(task.deadline),
    reviewStartedAt: task.status === "review" ? normalizeTaskDate(task.created_at) : null,
  };
}

function getDocumentSummary(document: ClientDocumentRecord) {
  const type = document.type ?? "document";

  if (type === "contract") {
    return "AI Summary: Contract document. Check renewal dates, signature completeness, and client obligations.";
  }

  if (type === "payroll") {
    return "AI Summary: Payroll file. Review employee totals, submission deadline, and approval status.";
  }

  if (type === "audit") {
    return "AI Summary: Audit document. Review evidence quality, open findings, and manager signoff.";
  }

  if (type === "tax") {
    return "AI Summary: Tax document. Check missing declarations, submission period, and supporting files.";
  }

  return "AI Summary: Client report. Review key findings, unresolved items, and next action owner.";
}

function getAiInsights(tasks: DisplayTask[], documents: ClientDocumentRecord[], activities: ClientActivityRecord[]) {
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
  const savedDocuments = await getClientDocuments(client.id);
  const tasks = savedTasks.length > 0 ? savedTasks.map(mapTask) : fallbackTasks;
  const activities = savedActivities.length > 0 ? savedActivities : fallbackActivities;
  const documents = savedDocuments.length > 0 ? savedDocuments : fallbackDocuments;
  const notes = activities.filter((activity) => activity.type === "comment" || activity.type === "update");
  const aiInsights = getAiInsights(tasks, documents, activities);

  return (
    <section className={styles.pageStack}>
      <div className={styles.clientDetailHeader}>
        <div>
          <p className={styles.eyebrow}>Client file</p>
          <h2>{client.name}</h2>
          <p>Review client status, tasks, documents, and activity in one place.</p>
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
          <span className={`${styles.statusTag} ${styles.statusActive}`}>{status}</span>
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
            <dd>{managerName(client)}</dd>
          </div>
        </dl>
      </article>

      <aside className={styles.aiSummary}>
        <div className={styles.sectionHeader}>
          <h3>AI Summary</h3>
          <span>{aiInsights.length} insight{aiInsights.length === 1 ? "" : "s"}</span>
        </div>
        <ul className={styles.cleanList}>
          {aiInsights.length > 0 ? (
            aiInsights.map((insight) => <li key={insight}>{insight}</li>)
          ) : (
            <li>No urgent client risks detected.</li>
          )}
        </ul>
      </aside>

      <article className={styles.panel}>
        <div className={styles.clientFileHeader}>
          <div>
            <p className={styles.eyebrow}>Workflow</p>
            <h3>Tasks for this client</h3>
          </div>
        </div>
        <AddTaskForm clientId={client.id} />
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
          <h3>Activity Timeline</h3>
          <ol className={styles.timelineList}>
            {activities.map((activity) => (
              <li key={activity.id}>
                <time>{formatDetailDate(activity.created_at)}</time>
                <span>{activity.content}</span>
                <small>{activity.type ?? "update"}</small>
              </li>
            ))}
          </ol>
        </article>

        <article className={styles.panel}>
          <h3>Documents & Notes</h3>
          <AddDocumentNoteForms clientId={client.id} />
          <ul className={styles.documentList}>
            {documents.map((document) => (
              <li key={document.id}>
                <div>
                  <span>{document.file_name}</span>
                  <small>
                    {document.type ?? "document"} - {formatDetailDate(document.created_at)}
                  </small>
                </div>
                <div className={styles.documentActions}>
                  <details className={styles.documentInfo}>
                    <summary aria-label={`Show AI summary for ${document.file_name}`}>i</summary>
                    <p>{getDocumentSummary(document)}</p>
                  </details>
                  {document.file_url ? (
                    <a className={styles.textButton} href={document.file_url} rel="noreferrer" target="_blank">
                      Open
                    </a>
                  ) : (
                    <span className={styles.mutedAction}>No file</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className={styles.noteList}>
            {notes.map((note) => (
              <div key={note.id}>
                <strong>{note.type ?? "note"}</strong>
                <p>{note.content}</p>
                <small>{formatDetailDate(note.created_at)}</small>
              </div>
            ))}
          </div>
        </article>
      </section>
    </section>
  );
}
