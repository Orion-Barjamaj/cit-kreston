import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import styles from "../clients.module.css";
import { ClientRecord, getSupabaseServerClient } from "@/app/lib/supabase";

type ClientPageProps = {
  params: Promise<{ id: string }>;
};

const tasks = [
  ["Review payroll documents", "Sara", "Review", "Tomorrow"],
  ["Prepare audit checklist", "Andi", "In Progress", "Friday"],
  ["Confirm tax declaration", "Arber", "Pending", "May 28"],
];

const timeline = [
  ["May 20", "Contract signed"],
  ["May 21", "Documents uploaded"],
  ["May 22", "Payroll files checked"],
  ["May 23", "Review pending"],
];

const documents = ["signed_contract.pdf", "company_extract.pdf", "payroll_may.xlsx"];
const notes = ["Waiting for manager approval.", "Client asked for a May 28 follow-up."];

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

      <article className={styles.panel}>
        <p className={styles.eyebrow}>Client overview</p>
        <h2>{client.name}</h2>
        <dl className={styles.detailGrid}>
          <div>
            <dt>Name</dt>
            <dd>{client.name}</dd>
          </div>
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

      <article className={styles.panel}>
        <div className={styles.clientFileHeader}>
          <h3>Tasks for this client</h3>
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
