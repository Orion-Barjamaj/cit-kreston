import styles from "../workspace.module.css";

export default function SettingsPage() {
  return (
    <section className={styles.pageStack}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Account preferences</p>
          <h2>Settings</h2>
          <p>Profile, department, notifications, permissions, language, and theme.</p>
        </div>
      </div>

      <div className={styles.twoColumn}>
        <article className={styles.panel}>
          <h3>Profile</h3>
          <div className={styles.formStack}>
            <label>Name<input defaultValue="Arber M." /></label>
            <label>Department<input defaultValue="Audit" /></label>
            <label>Role<input defaultValue="Manager" /></label>
          </div>
        </article>

        <article className={styles.panel}>
          <h3>Preferences</h3>
          <div className={styles.toggleRow}>
            <span>Email notifications</span>
            <input type="checkbox" defaultChecked />
          </div>
          <div className={styles.toggleRow}>
            <span>AI alerts</span>
            <input type="checkbox" defaultChecked />
          </div>
          <button className={styles.primaryButton} type="button">Logout</button>
        </article>
      </div>
    </section>
  );
}
