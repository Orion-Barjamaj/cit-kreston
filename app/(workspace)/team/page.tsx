import { connection } from "next/server";
import { getSupabaseServerClient } from "@/app/lib/supabase";
import { addTeamMember } from "./actions";
import styles from "./team.module.css";

type UserRecord = {
  id: number;
  name: string;
  email: string | null;
  role: string;
  avatar: string | null;
  department_id: number | null;
  created_at: string | null;
};

type DepartmentRecord = {
  id: number;
  name: string;
};

type TaskOwnerRecord = {
  assigned_to: number | null;
  status: string | null;
};

type ClientOwnerRecord = {
  assigned_manager_id: number | null;
  status: string | null;
};

type TeamData = {
  clients: ClientOwnerRecord[];
  departments: DepartmentRecord[];
  error?: string;
  isConfigured: boolean;
  tasks: TaskOwnerRecord[];
  users: UserRecord[];
};

const roles = ["Partner", "Manager", "Senior", "Associate", "Junior"];
const completedStatuses = new Set(["done", "completed", "inactive", "archived"]);

function getUniqueDepartments(departments: DepartmentRecord[]) {
  const departmentsByName = new Map<string, DepartmentRecord>();

  departments.forEach((department) => {
    const key = department.name.trim().toLowerCase();

    if (!departmentsByName.has(key)) {
      departmentsByName.set(key, department);
    }
  });

  return Array.from(departmentsByName.values());
}

async function getTeamData(): Promise<TeamData> {
  await connection();

  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return {
      clients: [],
      departments: [],
      isConfigured: false,
      tasks: [],
      users: [],
    };
  }

  const [usersResult, departmentsResult, tasksResult, clientsResult] = await Promise.all([
    supabase.from("users").select("id, name, email, role, avatar, department_id, created_at").order("name"),
    supabase.from("departments").select("id, name").order("name"),
    supabase.from("tasks").select("assigned_to, status"),
    supabase.from("clients").select("assigned_manager_id, status"),
  ]);

  return {
    clients: (clientsResult.data ?? []) as ClientOwnerRecord[],
    departments: (departmentsResult.data ?? []) as DepartmentRecord[],
    error:
      usersResult.error?.message ??
      departmentsResult.error?.message ??
      tasksResult.error?.message ??
      clientsResult.error?.message,
    isConfigured: true,
    tasks: (tasksResult.data ?? []) as TaskOwnerRecord[],
    users: (usersResult.data ?? []) as UserRecord[],
  };
}

function getInitials(user: UserRecord) {
  if (user.avatar?.trim()) {
    return user.avatar.trim().slice(0, 2).toUpperCase();
  }

  return user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatRole(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function isActiveStatus(status: string | null) {
  return !completedStatuses.has((status ?? "").toLowerCase());
}

export default async function TeamPage() {
  const { clients, departments, error, isConfigured, tasks, users } = await getTeamData();
  const uniqueDepartments = getUniqueDepartments(departments);
  const departmentsById = new Map(departments.map((department) => [department.id, department.name]));
  const usersByDepartment = uniqueDepartments.map((department) => ({
    department,
    users: users.filter(
      (user) => departmentsById.get(user.department_id ?? 0)?.trim().toLowerCase() === department.name.trim().toLowerCase(),
    ),
  }));
  const unassignedUsers = users.filter((user) => !user.department_id || !departmentsById.has(user.department_id));

  function getAssignedTasksCount(userId: number) {
    return tasks.filter((task) => task.assigned_to === userId && isActiveStatus(task.status)).length;
  }

  function getActiveClientsCount(userId: number) {
    return clients.filter((client) => client.assigned_manager_id === userId && isActiveStatus(client.status)).length;
  }

  return (
    <section className={styles.pageStack}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>People directory</p>
          <h2>Team</h2>
          <p>View members by department, see workload, and add new staff.</p>
        </div>
      </div>

      {!isConfigured ? (
        <div className={styles.noticeBox}>
          Add your Supabase URL and publishable key to <code>.env.local</code> to load the team.
        </div>
      ) : null}

      {error ? <div className={styles.errorBox}>{error}</div> : null}

      <form action={addTeamMember} className={styles.addMemberForm}>
        <label>
          Name
          <input name="name" placeholder="Sara Berisha" required disabled={!isConfigured} />
        </label>
        <label>
          Email
          <input name="email" placeholder="sara@company.com" required type="email" disabled={!isConfigured} />
        </label>
        <label>
          Role
          <select name="role" defaultValue="Manager" disabled={!isConfigured}>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>
        <label>
          Department
          <select name="department_id" required disabled={!isConfigured || uniqueDepartments.length === 0}>
            {uniqueDepartments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </label>
        <button className={styles.primaryButton} type="submit" disabled={!isConfigured || uniqueDepartments.length === 0}>
          Add Member
        </button>
      </form>

      <div className={styles.teamLayout}>
        <article className={styles.panel}>
          <h3>Departments</h3>
          <div className={styles.departmentGroups}>
            {usersByDepartment.map(({ department, users: departmentUsers }) => (
              <section className={styles.departmentGroup} key={department.id}>
                <div className={styles.departmentHeader}>
                  <strong>{department.name}</strong>
                  <span>{departmentUsers.length} member{departmentUsers.length === 1 ? "" : "s"}</span>
                </div>
                <div className={styles.memberList}>
                  {departmentUsers.length > 0 ? (
                    departmentUsers.map((user) => (
                      <details className={styles.memberCard} key={user.id}>
                        <summary>
                          <span className={styles.avatar}>{getInitials(user)}</span>
                          <span>
                            <strong>{user.name}</strong>
                            <small>{formatRole(user.role)}</small>
                            {user.email ? <small>{user.email}</small> : null}
                          </span>
                        </summary>
                        <div className={styles.memberStats}>
                          <span>{getAssignedTasksCount(user.id)} assigned tasks</span>
                          <span>{getActiveClientsCount(user.id)} active clients</span>
                        </div>
                      </details>
                    ))
                  ) : (
                    <p>No members in this department yet.</p>
                  )}
                </div>
              </section>
            ))}

            {unassignedUsers.length > 0 ? (
              <section className={styles.departmentGroup}>
                <div className={styles.departmentHeader}>
                  <strong>Unassigned</strong>
                  <span>{unassignedUsers.length} member{unassignedUsers.length === 1 ? "" : "s"}</span>
                </div>
                <div className={styles.memberList}>
                  {unassignedUsers.map((user) => (
                    <details className={styles.memberCard} key={user.id}>
                      <summary>
                        <span className={styles.avatar}>{getInitials(user)}</span>
                          <span>
                            <strong>{user.name}</strong>
                            <small>{formatRole(user.role)}</small>
                            {user.email ? <small>{user.email}</small> : null}
                          </span>
                      </summary>
                      <div className={styles.memberStats}>
                        <span>{getAssignedTasksCount(user.id)} assigned tasks</span>
                        <span>{getActiveClientsCount(user.id)} active clients</span>
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </article>

        <aside className={styles.panel}>
          <h3>Hierarchy</h3>
          <ul className={styles.hierarchyList}>
            {uniqueDepartments.map((department) => (
              <li key={department.id}>
                <strong>{department.name}</strong>
                <span>
                  {users
                    .filter(
                      (user) =>
                        departmentsById.get(user.department_id ?? 0)?.trim().toLowerCase() ===
                        department.name.trim().toLowerCase(),
                    )
                    .map((user) => user.name)
                    .join(", ") || "No members"}
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}
