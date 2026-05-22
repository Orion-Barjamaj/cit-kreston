import styles from "../workspace.module.css";

const alerts = [
  ["High", "Payroll file missing for Vodafone"],
  ["High", "Audit review overdue by 2 days"],
  ["Medium", "Contract renewal in 5 days"],
  ["Medium", "Client inactivity for Tirana Retail"],
  ["Low", "Approval blocked for tax checklist"],
];

export default function AlertsPage() {
  return (
    <section className={styles.pageStack}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Warnings</p>
          <h2>Alerts</h2>
          <p>Overdue work, missing documents, deadlines, approvals, and inactivity.</p>
        </div>
      </div>

      <div className={styles.alertList}>
        {alerts.map(([level, message]) => (
          <article className={styles.alertItem} key={message}>
            <span className={styles.statusTag}>{level}</span>
            <strong>{message}</strong>
            <button className={styles.textButton} type="button">Review</button>
          </article>
        ))}
      </div>
    </section>
  );
}
