import styles from "../workspace.module.css";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const events = [
  "Payroll submission due",
  "Audit review meeting",
  "Tax deadline",
  "Contract renewal reminder",
];

export default function CalendarPage() {
  return (
    <section className={styles.pageStack}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Planning</p>
          <h2>Calendar</h2>
          <p>Deadlines, meetings, due dates, and reminders.</p>
        </div>
      </div>

      <div className={styles.twoColumnWide}>
        <article className={styles.panel}>
          <h3>May 2026</h3>
          <div className={styles.calendarGrid}>
            {days.map((day) => (
              <strong key={day}>{day}</strong>
            ))}
            {Array.from({ length: 28 }, (_, index) => (
              <span className={index === 10 || index === 17 ? styles.markedDay : ""} key={index}>
                {index + 1}
              </span>
            ))}
          </div>
        </article>

        <article className={styles.panel}>
          <h3>Upcoming</h3>
          <ul className={styles.cleanList}>
            {events.map((event) => (
              <li key={event}>{event}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
