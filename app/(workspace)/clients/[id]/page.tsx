import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import styles from "../../workspace.module.css";
import { ClientRecord, getSupabaseServerClient } from "@/app/lib/supabase";

type ClientPageProps = {
  params: Promise<{ id: string }>;
};

const statusItems = [
  { department: "Audit", status: "In Progress", progress: 62 },
  { department: "Payroll", status: "Review", progress: 78 },
  { department: "Tax", status: "Completed", progress: 100 },
  { department: "Legal", status: "Waiting Documents", progress: 36 },
];

const tasks = [
  ["Review payroll docs", "Sara", "Review", "Tomorrow"],
  ["Audit preparation", "Andi", "In Progress", "Friday"],
  ["Submit tax forms", "Arber", "Done", "-"],
  ["Request legal documents", "Kejsi", "To Do", "May 28"],
];

const timeline = [
  ["May 20", "Client onboarded"],
  ["May 21", "Audit task created"],
  ["May 22", "Payroll docs uploaded"],
  ["May 23", "Tax review completed"],
];

const documents = ["payroll_may.pdf", "audit_report.docx", "tax_forms.xlsx"];

const notes = [
  ["Arber", "Client requested updated payroll report."],
  ["Kejsi", "Waiting for audit approval."],
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

function managerName(client: ClientRecord) {
  return client.assigned_manager_id ? `Manager #${client.assigned_manager_id}` : "Unassigned";
}

function displayStatus(status: string | null) {
  return status ?? "active";
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
          Add your Supabase URL and publishable key to <code>.env.local</code> to load this client.
        </div>
      </section>
    );
  }

  const status = displayStatus(client.status);

  return (
    <section className={styles.pageStack}>
      <Link className={styles.textButton} href="/clients">
        Back to clients
      </Link>

      <header className={styles.clientHero}>
        <div>
          <p className={styles.eyebrow}>Client file</p>
          <h2>{client.name}</h2>
          <p>
            {status} client
            {client.industry ? ` · ${client.industry}` : ""} · Managed by: {managerName(client)}
          </p>
        </div>

        <div className={styles.clientHeroAside}>
          <span>Next Deadline: Tomorrow</span>
          <strong>Status: {status}</strong>
          <div className={styles.actionRow}>
            <button className={styles.primaryButton} type="button">
              + Add Task
            </button>
            <button className={styles.secondaryButton} type="button">
              + Upload Document
            </button>
            <button className={styles.secondaryButton} type="button">
              + Add Note
            </button>
          </div>
        </div>
      </header>

      <div className={styles.statsGrid}>
        {[
          ["Tasks Active", "12"],
          ["Completed", "34"],
          ["Overdue", "2"],
          ["Departments", "4"],
        ].map(([label, value]) => (
          <article className={styles.statCard} key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{client.name}</small>
          </article>
        ))}
      </div>

      <section className={styles.twoColumnWide}>
        <article className={styles.panel}>
          <h3>Department Status</h3>
          <div className={styles.departmentList}>
            {statusItems.map((item) => (
              <div className={styles.departmentItem} key={item.department}>
                <div>
                  <strong>{item.department}</strong>
                  <span className={styles.statusTag}>{item.status}</span>
                </div>
                <div className={styles.progressBar}>
                  <span style={{ width: `${item.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.aiSummary}>
          <h3>AI Summary</h3>
          <ul className={styles.cleanList}>
            <li>Payroll delayed by 2 days</li>
            <li>Missing tax documents</li>
            <li>Audit progressing normally</li>
            <li>Follow-up recommended</li>
          </ul>
        </article>
      </section>

      <article className={styles.panel}>
        <div className={styles.clientFileHeader}>
          <h3>Tasks</h3>
          <button className={styles.textButton} type="button">
            Add task
          </button>
        </div>
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
              {tasks.map(([task, assignedTo, taskStatus, deadline]) => (
                <tr key={task}>
                  <td>{task}</td>
                  <td>{assignedTo}</td>
                  <td>
                    <span className={styles.statusTag}>{taskStatus}</span>
                  </td>
                  <td>{deadline}</td>
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
            {timeline.map(([date, event]) => (
              <li key={`${date}-${event}`}>
                <time>{date}</time>
                <span>{event}</span>
              </li>
            ))}
          </ol>
        </article>

        <article className={styles.panel}>
          <h3>Documents</h3>
          <ul className={styles.documentList}>
            {documents.map((document) => (
              <li key={document}>
                <span>{document}</span>
                <button className={styles.textButton} type="button">
                  Preview
                </button>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <article className={styles.panel}>
        <div className={styles.clientFileHeader}>
          <h3>Notes</h3>
          <button className={styles.textButton} type="button">
            Add note
          </button>
        </div>
        <div className={styles.noteList}>
          {notes.map(([author, note]) => (
            <div key={`${author}-${note}`}>
              <strong>{author}</strong>
              <p>{note}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
