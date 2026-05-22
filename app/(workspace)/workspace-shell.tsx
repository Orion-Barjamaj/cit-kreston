"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./workspace.module.css";

type IconName = "calendar" | "clients" | "dashboard" | "reports" | "tasks";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Clients", href: "/clients", icon: "clients" },
  { label: "My Tasks", href: "/tasks", icon: "tasks" },
  { label: "Calendar", href: "/calendar", icon: "calendar" },
  { label: "Reports", href: "/reports", icon: "reports" },
] satisfies { label: string; href: string; icon: IconName }[];

const iconPaths: Record<IconName, React.ReactNode> = {
  calendar: (
    <>
      <path d="M5 4.5h10A1.5 1.5 0 0 1 16.5 6v9.5A1.5 1.5 0 0 1 15 17H5a1.5 1.5 0 0 1-1.5-1.5V6A1.5 1.5 0 0 1 5 4.5Z" />
      <path d="M7 3v3M13 3v3M3.5 8h13" />
    </>
  ),
  clients: (
    <>
      <path d="M7.4 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2.8 17a4.8 4.8 0 0 1 9.2 0" />
      <path d="M13.2 10.4a2.4 2.4 0 0 0 0-4.6M14.2 12.4a4 4 0 0 1 3 4.6" />
    </>
  ),
  dashboard: (
    <>
      <path d="M4 4h5v5H4V4ZM11 4h5v5h-5V4ZM4 11h5v5H4v-5ZM11 11h5v5h-5v-5Z" />
    </>
  ),
  reports: (
    <>
      <path d="M4 16.5h12" />
      <path d="M6 13V8M10 13V4M14 13V7" />
    </>
  ),
  tasks: (
    <>
      <path d="M4 5h12v10.5A1.5 1.5 0 0 1 14.5 17h-9A1.5 1.5 0 0 1 4 15.5V5Z" />
      <path d="m7 10 1.4 1.4L13 7.8M7 14h6" />
    </>
  ),
};

function SidebarIcon({ name }: { name: IconName }) {
  return (
    <svg className={styles.navIcon} aria-hidden="true" viewBox="0 0 20 20" fill="none">
      {iconPaths[name]}
    </svg>
  );
}

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
                <SidebarIcon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className={styles.contentArea}>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
