import styles from "../workspace.module.css";

const clients = [
  ["Vodafone Albania", "Payroll", "Active", "Arber M.", "May 28"],
  ["Balfin Group", "Audit", "Review", "Mira K.", "May 30"],
  ["Tirana Retail", "Tax", "Blocked", "Arber M.", "Jun 03"],
  ["Albtelecom", "Contracts", "Active", "Dorian P.", "Jun 06"],
];

export default function ClientsPage() {
  return (
    <section className={styles.pageStack}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Client workspace</p>
          <h2>Clients</h2>
          <p>Search, filter, and open a simple client file.</p>
        </div>
        <select className={styles.selectControl} defaultValue="all">
          <option value="all">All departments</option>
          <option value="payroll">Payroll</option>
          <option value="audit">Audit</option>
          <option value="tax">Tax</option>
        </select>
      </div>

      <input className={styles.fullSearch} type="search" placeholder="Search clients" />

      <div className={styles.tableWrap}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Client</th>
              <th>Service</th>
              <th>Status</th>
              <th>Manager</th>
              <th>Deadline</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(([name, service, status, manager, deadline]) => (
              <tr key={name}>
                <td>{name}</td>
                <td>{service}</td>
                <td>
                  <span className={styles.statusTag}>{status}</span>
                </td>
                <td>{manager}</td>
                <td>{deadline}</td>
                <td>
                  <button className={styles.textButton} type="button">
                    Open file
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <article className={styles.panel}>
        <h3>Client File Preview</h3>
        <div className={styles.pillRow}>
          <span>Overview</span>
          <span>Department progress</span>
          <span>Tasks</span>
          <span>Documents</span>
          <span>Notes</span>
          <span>Timeline</span>
        </div>
      </article>
    </section>
  );
}
