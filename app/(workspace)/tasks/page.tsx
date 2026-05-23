import { connection } from "next/server";
import { getSupabaseServerClient, type TaskRecord } from "@/app/lib/supabase";
import TasksBoard from "./tasks-board";
import styles from "./tasks.module.css";

export type TaskMemberOption = {
  id: number;
  name: string;
  role: string;
};

async function getTasks() {
  await connection();

  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return {
      isConfigured: false,
      members: [] as TaskMemberOption[],
      tasks: [] as TaskRecord[],
    };
  }

  const [tasksResult, usersResult] = await Promise.all([
    supabase
    .from("tasks")
    .select("id, title, description, status, priority, deadline, client_id, assigned_to, department_id, created_by, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("users").select("id, name, role").order("name"),
  ]);

  return {
    error: tasksResult.error?.message ?? usersResult.error?.message,
    isConfigured: true,
    members: (usersResult.data ?? []) as TaskMemberOption[],
    tasks: tasksResult.data ?? [],
  };
}

export default async function TasksPage() {
  const { error, isConfigured, members, tasks } = await getTasks();

  return (
    <section className={styles.pageStack}>
      <TasksBoard error={error} initialTasks={tasks} isConfigured={isConfigured} members={members} />
    </section>
  );
}
