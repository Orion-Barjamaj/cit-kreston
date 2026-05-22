"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./workspace.module.css";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Clients", href: "/clients" },
  { label: "Tasks", href: "/tasks" },
  { label: "Calendar", href: "/calendar" },
  { label: "Documents", href: "/documents" },
  { label: "Team", href: "/team" },
  { label: "Reports", href: "/reports" },
  { label: "Alerts", href: "/alerts" },
  { label: "Settings", href: "/settings" },
];

export default function WorkspaceShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <div className={styles.workspace}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>K</span>
          <span>
            <strong>KRESTON</strong>
            <small>ALBANIA</small>
          </span>
        </div>

        <nav className={styles.nav} aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.active : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className={styles.iconSlot} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/help" className={styles.navLink}>
            <span className={styles.iconSlot} aria-hidden="true" />
            <span>Help & Support</span>
          </Link>

          <Link href="/settings" className={styles.profileButton}>
            <span className={styles.avatar}>AM</span>
            <span>
              <strong>Arber M.</strong>
              <small>Manager</small>
            </span>
          </Link>
        </div>
      </aside>

      <div className={styles.contentArea}>
        <header className={styles.topbar}>
          <h1>{navItems.find((item) => item.href === pathname)?.label ?? "Dashboard"}</h1>
          <div className={styles.topbarActions}>
            <label className={styles.search}>
              <span className={styles.searchIcon} aria-hidden="true" />
              <input type="search" placeholder="Search clients, tasks..." />
            </label>
            <button className={styles.iconButton} type="button" aria-label="Notifications" />
            <button className={styles.userMenu} type="button">
              Arber M.
              <span aria-hidden="true">⌄</span>
            </button>
          </div>
        </header>

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
