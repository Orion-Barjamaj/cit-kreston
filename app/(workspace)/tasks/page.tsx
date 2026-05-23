import { connection } from "next/server";
import { getSupabaseServerClient, type TaskRecord } from "@/app/lib/supabase";
import TasksBoard from "./tasks-board";
import styles from "./tasks.module.css";

export type TaskMemberOption = {
  department_id: number | null;
  id: number;
  name: string;
  role: string;
};

export type TaskDepartmentOption = {
  id: number;
  name: string;
};

function normalizeDepartmentName(name: string) {
  return name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
}

function getVisibleDepartments(departments: TaskDepartmentOption[]) {
  const departmentsByName = new Map<string, TaskDepartmentOption>();

  departments.forEach((department) => {
    const key = normalizeDepartmentName(department.name);

    if (key === "hr" || key === "human resources" || departmentsByName.has(key)) {
      return;
    }

    departmentsByName.set(key, department);
  });

  return Array.from(departmentsByName.values());
}

async function getTasks() {
  await connection();

  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return {
      isConfigured: false,
      departments: [] as TaskDepartmentOption[],
      members: [] as TaskMemberOption[],
      tasks: [] as TaskRecord[],
    };
  }

  const [tasksResult, usersResult, departmentsResult] = await Promise.all([
    supabase
    .from("tasks")
    .select("id, title, description, status, priority, deadline, client_id, assigned_to, department_id, created_by, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("users").select("id, name, role, department_id").order("name"),
    supabase.from("departments").select("id, name").order("name"),
  ]);

  return {
    error: tasksResult.error?.message ?? usersResult.error?.message ?? departmentsResult.error?.message,
    isConfigured: true,
    departments: getVisibleDepartments((departmentsResult.data ?? []) as TaskDepartmentOption[]),
    members: (usersResult.data ?? []) as TaskMemberOption[],
    tasks: tasksResult.data ?? [],
  };
}

export default async function TasksPage() {
  const { departments, error, isConfigured, members, tasks } = await getTasks();

  return (
    <section className={styles.pageStack}>
      <TasksBoard departments={departments} error={error} initialTasks={tasks} isConfigured={isConfigured} members={members} />
    </section>
  );
}
