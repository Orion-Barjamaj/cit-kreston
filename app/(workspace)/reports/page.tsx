import styles from "../workspace.module.css";

const reportCards = [
  ["Total active clients", "42"],
  ["Average completion time", "3.8 days"],
  ["Tasks finished this week", "64"],
  ["Overdue rate", "7%"],
];

export default function ReportsPage() {
  return (
    <section className={styles.pageStack}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Management KPIs</p>
          <h2>Reports</h2>
          <p>Simple workload, progress, activity, and AI insight summaries.</p>
        </div>
        <div className={styles.aiBox}>AI: Audit review is the main bottleneck.</div>
      </div>

      <div className={styles.statsGrid}>
        {reportCards.map(([label, value]) => (
          <article className={styles.statCard} key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>Current month</small>
          </article>
        ))}
      </div>

      <article className={styles.panel}>
        <h3>Department Progress</h3>
        <div className={styles.progressList}>
          <span>Payroll 82%</span>
          <span>Audit 64%</span>
          <span>Tax 74%</span>
          <span>Legal 58%</span>
        </div>
      </article>
    </section>
  );
}
