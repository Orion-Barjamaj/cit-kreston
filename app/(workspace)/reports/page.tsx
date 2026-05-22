import styles from "./reports.module.css";
import ScheduleWidget from "./schedule-widget";

const reportCards = [
  ["Total active clients", "42"],
  ["Average completion time", "3.8 days"],
  ["Tasks finished this week", "64"],
  ["Overdue rate", "7%"],
];

const notes = [
  {
    title: "Landing Page For Website",
    body: "Confirm scope, content owner, and delivery timeline before work starts.",
    done: false,
  },
  {
    title: "Fixing icons with dark backgrounds",
    body: "Use recognizable icons with strong contrast and simple shapes.",
    done: false,
  },
  {
    title: "Discussion regarding userflow improvement",
    body: "Clarify the main goal of the workflow before changing screens.",
    done: true,
  },
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

      <div className={styles.twoColumn}>
        <ScheduleWidget />

        <article className={styles.panel}>
          <h3>Notes</h3>
          <ul className={styles.noteChecklist}>
            {notes.map((note) => (
              <li className={note.done ? styles.noteDone : ""} key={note.title}>
                <span aria-hidden="true" />
                <div>
                  <strong>{note.title}</strong>
                  <p>{note.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
