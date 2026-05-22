import styles from "../workspace.module.css";

const summaryCards = [
  { label: "Active Clients", value: "42", note: "+6 this month" },
  { label: "Tasks Due Today", value: "11", note: "4 high priority" },
  { label: "Overdue Tasks", value: "3", note: "Needs review" },
  { label: "My Workload", value: "78%", note: "Balanced" },
];

const urgentTasks = [
  "Approve payroll submission for Vodafone",
  "Review audit notes for Balfin Group",
  "Send missing tax document request to Albtelecom",
];

const activity = [
  "Vodafone uploaded payroll files",
  "Senior assigned audit review to Elira",
  "Tax deadline added for Tirana Retail",
];

export default function DashboardPage() {
  return (
    <section className={styles.pageStack}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Manager overview</p>
          <h2>Welcome back, Arber</h2>
          <p>Department activity, urgent work, and AI follow-up signals.</p>
        </div>
        <div className={styles.aiBox}>AI: 2 clients need follow-up today.</div>
      </div>

      <div className={styles.statsGrid}>
        {summaryCards.map((card) => (
          <article className={styles.statCard} key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <small>{card.note}</small>
          </article>
        ))}
      </div>

      <div className={styles.twoColumn}>
        <article className={styles.panel}>
          <h3>Urgent Tasks</h3>
          <ul className={styles.cleanList}>
            {urgentTasks.map((task) => (
              <li key={task}>{task}</li>
            ))}
          </ul>
        </article>

        <article className={styles.panel}>
          <h3>Recent Client Activity</h3>
          <ul className={styles.cleanList}>
            {activity.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
