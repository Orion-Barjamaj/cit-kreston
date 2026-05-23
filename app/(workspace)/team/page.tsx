import { connection } from "next/server";
import { getSupabaseServerClient } from "@/app/lib/supabase";
import AddMemberForm from "./add-member-form";
import RoleGroup from "./role-group";
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
const roleGroups = [
  { key: "managers", label: "Managers", roles: new Set(["manager", "partner"]) },
  { key: "seniors", label: "Seniors", roles: new Set(["senior"]) },
  { key: "juniors", label: "Juniors", roles: new Set(["junior", "associate"]) },
];

function normalizeDepartmentName(name: string) {
  return name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
}

function isVisibleDepartment(department: DepartmentRecord) {
  const normalizedName = normalizeDepartmentName(department.name);

  return normalizedName !== "hr" && normalizedName !== "human resources";
}

function getUniqueDepartments(departments: DepartmentRecord[]) {
  const departmentsByName = new Map<string, DepartmentRecord>();

  departments.filter(isVisibleDepartment).forEach((department) => {
    const key = normalizeDepartmentName(department.name);

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
  const groupedUsers = roleGroups.map((group) => ({
    ...group,
    users: users.filter((user) => group.roles.has(user.role.toLowerCase())),
  }));
  const otherUsers = users.filter((user) => !roleGroups.some((group) => group.roles.has(user.role.toLowerCase())));

  function getAssignedTasksCount(userId: number) {
    return tasks.filter((task) => task.assigned_to === userId && isActiveStatus(task.status)).length;
  }

  function getActiveClientsCount(userId: number) {
    return clients.filter((client) => client.assigned_manager_id === userId && isActiveStatus(client.status)).length;
  }

  function mapMember(user: UserRecord) {
    return {
      activeClientsCount: getActiveClientsCount(user.id),
      email: user.email,
      id: user.id,
      initials: getInitials(user),
      name: user.name,
      role: formatRole(user.role),
      tasksCount: getAssignedTasksCount(user.id),
    };
  }

  return (
    <section className={styles.pageStack}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>People directory</p>
          <h2>Team</h2>
          <p>View members by seniority, see workload, and add new staff.</p>
        </div>
      </div>

      {!isConfigured ? (
        <div className={styles.noticeBox}>
          Add your Supabase URL and publishable key to <code>.env.local</code> to load the team.
        </div>
      ) : null}

      {error ? <div className={styles.errorBox}>{error}</div> : null}

      <AddMemberForm departments={uniqueDepartments} isConfigured={isConfigured} roles={roles} />

      <div className={styles.teamLayoutSingle}>
        <article className={styles.panel}>
          <h3>Team by role</h3>
          <div className={styles.departmentGroups}>
            {groupedUsers.map((group) => (
              <RoleGroup key={group.key} label={group.label} members={group.users.map(mapMember)} />
            ))}

            {otherUsers.length > 0 ? (
              <RoleGroup label="Other" members={otherUsers.map(mapMember)} />
            ) : null}
          </div>
        </article>
      </div>
    </section>
  );
}
