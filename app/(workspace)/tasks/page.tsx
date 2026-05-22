import styles from "../workspace.module.css";

const columns = [
  {
    title: "To Do",
    tasks: ["Collect payroll files", "Prepare tax checklist"],
  },
  {
    title: "In Progress",
    tasks: ["Audit sampling - Balfin", "Contract renewal notes"],
  },
  {
    title: "Review",
    tasks: ["VAT return - Tirana Retail"],
  },
  {
    title: "Done",
    tasks: ["Client onboarding call"],
  },
];

export default function TasksPage() {
  return (
    <section className={styles.pageStack}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Work tracking</p>
          <h2>Tasks</h2>
          <p>Track status, assignee, deadline, priority, and client.</p>
        </div>
      </div>

      <div className={styles.kanban}>
        {columns.map((column) => (
          <section className={styles.kanbanColumn} key={column.title}>
            <h3>{column.title}</h3>
            {column.tasks.map((task) => (
              <article className={styles.taskCard} key={task}>
                <strong>{task}</strong>
                <span>Client: Vodafone Albania</span>
                <span>Assignee: Arber M.</span>
                <span>Deadline: May 28</span>
                <div className={styles.cardActions}>
                  <button type="button">Open</button>
                  <button type="button">Assign</button>
                  <button type="button">Comment</button>
                </div>
              </article>
            ))}
          </section>
        ))}
      </div>
    </section>
  );
}
