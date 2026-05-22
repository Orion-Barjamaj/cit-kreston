import styles from "./dashboard.module.css";

const metrics = [
  { label: "Hours Saved", value: "12hrs" },
  { label: "Projects Completed", value: "24" },
  { label: "Projects In-progress", value: "7" },
];

const projects = [
  {
    task: "Audit preparation for Vodafone",
    comments: 7,
    links: 2,
    assignee: "Phoenix Winters",
    initials: "PW",
    status: "In Progress",
  },
  {
    task: "Payroll review for Balfin Group",
    comments: 10,
    links: 3,
    assignee: "Cohen Merritt",
    initials: "CM",
    status: "Pending",
  },
  {
    task: "Tax package for Tirana Retail",
    comments: 5,
    links: 8,
    assignee: "Lukas Juarez",
    initials: "LJ",
    status: "Completed",
  },
];

const schedule = [
  { title: "Kickoff Meeting", time: "01:00 PM to 02:30 PM", accent: "green" },
  { title: "Create audit report draft", time: "04:00 PM to 05:30 PM", accent: "blue" },
  { title: "Create client handoff notes", time: "05:00 PM to 06:30 PM", accent: "pink" },
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

export default function DashboardPage() {
  return (
    <section className={styles.pageStack}>
      <header className={styles.dashboardHero}>
        <div>
          <time>Friday, 22nd May</time>
          <h2>Good Evening! Arber,</h2>
        </div>
        <div className={styles.heroActions}>
          <button className={styles.secondaryButton} type="button">
            Share
          </button>
          <button className={styles.secondaryButton} type="button">
            + Add Task
          </button>
        </div>
      </header>

      <div className={styles.metricPill}>
        {metrics.map((metric) => (
          <span key={metric.label}>
            <strong>{metric.value}</strong>
            {metric.label}
          </span>
        ))}
      </div>

      <article className={styles.projectPanel}>
        <div className={styles.panelToolbar}>
          <h3>My Projects</h3>
          <select className={styles.selectControl} defaultValue="week">
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <button className={styles.textButton} type="button">
            See All
          </button>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Task Name</th>
                <th>Assign</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.task}>
                  <td>
                    <span className={styles.taskTitle}>{project.task}</span>
                    <small className={styles.taskMeta}>
                      {project.comments} comments · {project.links} links
                    </small>
                  </td>
                  <td>
                    <span className={styles.assignee}>
                      <i aria-hidden="true">{project.initials}</i>
                      {project.assignee}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusTag} ${styles[`status${project.status.replace(" ", "")}`]}`}>
                      {project.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <div className={styles.twoColumn}>
        <article className={styles.panel}>
          <div className={styles.panelToolbar}>
            <h3>Schedule</h3>
            <button className={styles.textButton} type="button">
              ...
            </button>
          </div>
          <div className={styles.weekStrip}>
            {["Mo 15", "Tu 16", "We 17", "Th 18", "Fr 19", "Sa 20", "Su 14"].map((day) => (
              <span className={day === "We 17" ? styles.currentDay : ""} key={day}>
                {day}
              </span>
            ))}
          </div>
          <ul className={styles.scheduleList}>
            {schedule.map((item) => (
              <li className={styles[`schedule${item.accent}`]} key={item.title}>
                <strong>{item.title}</strong>
                <span>{item.time}</span>
              </li>
            ))}
          </ul>
        </article>

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
