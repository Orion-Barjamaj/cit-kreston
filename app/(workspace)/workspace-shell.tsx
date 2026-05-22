"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./workspace.module.css";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Clients", href: "/clients" },
  { label: "My Tasks", href: "/tasks" },
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
          <strong>Kreston</strong>
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

        <div className={styles.projectGroup}>
          <div className={styles.projectHeader}>
            <strong>Projects</strong>
            <button type="button" aria-label="Add project">
              +
            </button>
          </div>
          <span>
            <i className={styles.projectDotPink} aria-hidden="true" />
            Audit Planning
          </span>
          <span>
            <i className={styles.projectDotGreen} aria-hidden="true" />
            Payroll Review
          </span>
        </div>

        <div className={styles.sidebarFooter}>
          <Link href="/help" className={styles.navLink}>
            <span className={styles.iconSlot} aria-hidden="true" />
            <span>Help & Support</span>
            <small className={styles.helpBadge}>8</small>
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
              <kbd>⌘ F</kbd>
            </label>
            <button className={styles.primaryButton} type="button">
              + New Project
            </button>
            <button className={styles.iconButton} type="button" aria-label="Notifications" />
            <button className={styles.userMenu} type="button">
              <span className={styles.avatar}>AM</span>
            </button>
          </div>
        </header>

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
