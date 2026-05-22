import styles from "../workspace.module.css";

const documents = [
  ["Payroll May.xlsx", "Payroll file", "Vodafone Albania", "May 21", "Current"],
  ["Audit Draft.pdf", "Audit report", "Balfin Group", "May 20", "Review"],
  ["Tax Return.docx", "Tax document", "Tirana Retail", "May 18", "Replace"],
  ["Service Contract.pdf", "Contract", "Albtelecom", "May 16", "Current"],
];

export default function DocumentsPage() {
  return (
    <section className={styles.pageStack}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>File center</p>
          <h2>Documents</h2>
          <p>Uploaded files, versions, and links back to clients and tasks.</p>
        </div>
        <button className={styles.primaryButton} type="button">Upload</button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Document</th>
              <th>Type</th>
              <th>Client</th>
              <th>Uploaded</th>
              <th>Version</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map(([name, type, client, date, status]) => (
              <tr key={name}>
                <td>{name}</td>
                <td>{type}</td>
                <td>{client}</td>
                <td>{date}</td>
                <td>
                  <span className={styles.statusTag}>{status}</span>
                </td>
                <td>Preview / Download / Replace</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pillRow}>
        <span>Contracts</span>
        <span>Payroll files</span>
        <span>Audit reports</span>
        <span>Tax documents</span>
        <span>Internal notes</span>
      </div>
    </section>
  );
}
