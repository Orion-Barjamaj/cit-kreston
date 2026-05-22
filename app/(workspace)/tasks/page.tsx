import { connection } from "next/server";
import { getSupabaseServerClient, type TaskRecord } from "@/app/lib/supabase";
import TasksBoard from "./tasks-board";
import styles from "./tasks.module.css";

async function getTasks() {
  await connection();

  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return {
      isConfigured: false,
      tasks: [] as TaskRecord[],
    };
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, description, status, priority, deadline, client_id, assigned_to, department_id, created_by, created_at")
    .order("created_at", { ascending: false });

  return {
    error: error?.message,
    isConfigured: true,
    tasks: data ?? [],
  };
}

export default async function TasksPage() {
  const { error, isConfigured, tasks } = await getTasks();

  return (
    <section className={styles.pageStack}>
      <TasksBoard error={error} initialTasks={tasks} isConfigured={isConfigured} />
    </section>
  );
}
