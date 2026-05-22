import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
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

const timeline = [
  { date: "2026-05-20", label: "May 20", event: "Contract signed" },
  { date: "2026-05-21", label: "May 21", event: "Documents uploaded" },
  { date: "2026-05-22", label: "May 22", event: "Payroll files checked" },
  { date: "2026-05-23", label: "May 23", event: "Review pending" },
];

const documents = [
  "signed_contract.pdf",
  "company_extract.pdf",
  "payroll_may.xlsx",
];
const notes = [
  "Waiting for manager approval.",
  "Client asked for a May 28 follow-up.",
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

function getAiInsights(tasks: DisplayTask[]) {
  const insights = new Set<string>();
  const activeTasks = tasks.filter((task) => task.status !== "done").length;
  const lastActivity = timeline
    .map((item) => new Date(`${item.date}T00:00:00`))
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
  const tasks = savedTasks.length > 0 ? savedTasks.map(mapTask) : fallbackTasks;
  const aiInsights = getAiInsights(tasks);

  return (
    <section className={styles.pageStack}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>{client.name}</h2>

        <Link className={styles.textButton} href="/clients">
          Back to clients
        </Link>
      </div>

      <article className={styles.panel}>
        <p className={styles.eyebrow}>Client overview</p>
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
        <h3>AI Summary</h3>
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
          <h3>Tasks for this client</h3>
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
            {timeline.map((item) => (
              <li key={`${item.date}-${item.event}`}>
                <time>{item.label}</time>
                <span>{item.event}</span>
              </li>
            ))}
          </ol>
        </article>

        <article className={styles.panel}>
          <h3>Documents & Notes</h3>
          <ul className={styles.documentList}>
            {documents.map((document) => (
              <li key={document}>
                <span>{document}</span>
                <button className={styles.textButton} type="button">
                  Open
                </button>
              </li>
            ))}
          </ul>
          <div className={styles.noteList}>
            {notes.map((note) => (
              <div key={note}>
                <strong>Note</strong>
                <p>{note}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </section>
  );
}
