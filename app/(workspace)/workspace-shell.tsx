"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./workspace.module.css";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Clients", href: "/clients" },
  { label: "My Tasks", href: "/tasks" },
  { label: "Calendar", href: "/calendar" },
  { label: "Reports", href: "/reports" },
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
      </aside>

      <div className={styles.contentArea}>
        <header className={styles.topbar}>
        </header>

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
