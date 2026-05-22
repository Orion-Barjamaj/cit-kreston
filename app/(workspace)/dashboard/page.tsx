import styles from "./dashboard.module.css";
import ScheduleWidget from "./schedule-widget";

const metrics = [
  { label: "Overdue Tasks", value: "3" },
  { label: "Tasks Due Today", value: "7" },
  { label: "Active Workload", value: "82%" },
];

const recentActivity = [
  "Vodafone task updated",
  "Audit completed",
  "Tax review assigned",
];

const workload = [
  { team: "Audit", value: "86%" },
  { team: "Payroll", value: "72%" },
  { team: "Tax", value: "68%" },
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

      <div className={styles.managerGrid}>
        <article className={styles.panel}>
          <h3>Recent Activity</h3>
          <ul className={styles.activityFeed}>
            {recentActivity.map((activity) => (
              <li key={activity}>{activity}</li>
            ))}
          </ul>
        </article>

        <article className={styles.panel}>
          <h3>Active Workload</h3>
          <div className={styles.workloadList}>
            {workload.map((item) => (
              <div key={item.team}>
                <span>{item.team}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </article>
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
