import styles from "./team.module.css";

const members = [
  ["Arber M.", "Manager", "Audit", "78%", "Available"],
  ["Mira K.", "Senior", "Tax", "91%", "Waiting review"],
  ["Elira D.", "Junior", "Payroll", "54%", "Available"],
  ["Dorian P.", "Senior", "Legal", "86%", "Overloaded"],
];

export default function TeamPage() {
  return (
    <section className={styles.pageStack}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Internal visibility</p>
          <h2>Team</h2>
          <p>Workload, responsibility, availability, and review bottlenecks.</p>
        </div>
      </div>

      <div className={styles.cardGrid}>
        {members.map(([name, role, department, workload, availability]) => (
          <article className={styles.panel} key={name}>
            <h3>{name}</h3>
            <p>{role} - {department}</p>
            <div className={styles.metricLine}>
              <span>Workload</span>
              <strong>{workload}</strong>
            </div>
            <span className={styles.statusTag}>{availability}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
