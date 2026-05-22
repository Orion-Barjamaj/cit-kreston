import styles from "./client-dashboard.module.css";

const tasks = [
  {
    id: "payroll-review",
    title: "Payroll Review",
    assignedTo: "Sara",
    status: "Review",
    deadline: "May 24",
    priority: "High",
  },
  {
    id: "audit-checklist",
    title: "Audit Checklist",
    assignedTo: "Andi",
    status: "In Progress",
    deadline: "May 26",
    priority: "Medium",
  },
  {
    id: "tax-documents",
    title: "Tax Documents",
    assignedTo: "Arber",
    status: "To Do",
    deadline: "May 28",
    priority: "High",
  },
];

const activity = [
  "Sara uploaded payroll files",
  "Andi started audit checklist",
  "Arber assigned tax review",
];

const notes = [
  "Waiting for manager approval.",
  "Client asked for a May 28 follow-up.",
  "Payroll files are ready for final review.",
];

export default function ClientDashboardPage() {
  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Client review</p>
            <h1>Client Dashboard</h1>
            <p>View task status, deadlines, activity, and important AI notes.</p>
          </div>
        </header>

        <aside className={styles.aiSummary}>
          <h2>AI Summary</h2>
          <ul>
            <li>2 overdue tasks</li>
            <li>Payroll waiting review</li>
            <li>Tax documents missing</li>
          </ul>
        </aside>

        <article className={styles.panel}>
          <h2>Client Tasks</h2>
          <div className={styles.tableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Assigned</th>
                  <th>Status</th>
                  <th>Deadline</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td>{task.title}</td>
                    <td>{task.assignedTo}</td>
                    <td>
                      <span className={styles.statusTag}>{task.status}</span>
                    </td>
                    <td>{task.deadline}</td>
                    <td>{task.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <section className={styles.twoColumn}>
          <article className={styles.panel}>
            <h2>Activity Timeline</h2>
            <ol className={styles.activityList}>
              {activity.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </article>

          <article className={styles.panel}>
            <h2>Notes</h2>
            <ul className={styles.noteList}>
              {notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </article>
        </section>
      </section>
    </main>
  );
}
