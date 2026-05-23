"use client";

import { useState } from "react";
import styles from "./team.module.css";

type TeamMember = {
  activeClientsCount: number;
  email: string | null;
  id: number;
  initials: string;
  name: string;
  role: string;
  tasksCount: number;
};

type RoleGroupProps = {
  label: string;
  members: TeamMember[];
};

export default function RoleGroup({ label, members }: RoleGroupProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section className={styles.departmentGroup}>
      <div className={styles.departmentHeader}>
        <strong>{label}</strong>
        <div className={styles.groupActions}>
          <span>
            {members.length} member{members.length === 1 ? "" : "s"}
          </span>
          <button aria-expanded={isOpen} onClick={() => setIsOpen((current) => !current)} type="button">
            {isOpen ? "Hide" : "Show"}
          </button>
        </div>
      </div>
      {isOpen ? (
        <div className={styles.memberList}>
          {members.length > 0 ? (
            members.map((member) => (
              <article className={styles.memberCard} key={member.id}>
                <div className={styles.memberMain}>
                  <span className={styles.avatar}>{member.initials}</span>
                  <span>
                    <strong>{member.name}</strong>
                    <small>{member.role}</small>
                    {member.email ? <small>{member.email}</small> : null}
                  </span>
                </div>
                <div className={styles.memberStats}>
                  <span>{member.tasksCount} assigned tasks</span>
                  <span>{member.activeClientsCount} active clients</span>
                </div>
              </article>
            ))
          ) : (
            <p>No members in this role yet.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
