import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <p className={styles.eyebrow}>Kreston Albania</p>
        <h1>Client work, deadlines, and manager oversight in one place.</h1>
        <p>
          Open the admin workspace for internal workflows or use the client dashboard for a read-only client view.
        </p>
        <div className={styles.actions}>
          <Link className={styles.primary} href="/dashboard">
            Admin Workspace
          </Link>
          <Link className={styles.secondary} href="/client-dashboard">
            Client Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
