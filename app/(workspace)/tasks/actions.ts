"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient, type TaskRecord } from "@/app/lib/supabase";

export type TaskStatus = "juniors" | "seniors" | "managers";

export type CreateTaskInput = {
  title: string;
  description: string;
  priority: string;
  deadline: string;
  clientId: string;
  assignedTo: string;
};

export type TaskActionState = {
  message: string;
  status: "error" | "success";
  task?: TaskRecord;
};

const validTaskStatuses = new Set<TaskStatus>(["juniors", "seniors", "managers"]);
const validTaskPriorities = new Set(["low", "medium", "high"]);

function cleanText(value: string) {
  return value.trim();
}

function getOptionalPositiveInt(value: string) {
  const cleanValue = cleanText(value);

  if (!cleanValue) {
    return null;
  }

  const numberValue = parseInt(cleanValue, 10);

  return Number.isNaN(numberValue) || numberValue <= 0 ? undefined : numberValue;
}

async function recordExists(table: "clients" | "departments" | "users", id: number) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return false;
  }

  const { data, error } = await supabase.from(table).select("id").eq("id", id).maybeSingle();

  return !error && data !== null;
}

function getStatusFromRole(role: string | null): TaskStatus {
  const normalizedRole = (role ?? "").toLowerCase();

  if (normalizedRole === "senior") {
    return "seniors";
  }

  if (normalizedRole === "manager" || normalizedRole === "partner") {
    return "managers";
  }

  return "juniors";
}

export async function createTask(input: CreateTaskInput): Promise<TaskActionState> {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message: "Supabase is not configured.",
    };
  }

  const title = cleanText(input.title);
  const description = cleanText(input.description);
  const priority = cleanText(input.priority) || "medium";
  const deadline = cleanText(input.deadline);
  const clientId = getOptionalPositiveInt(input.clientId);
  const assignedTo = getOptionalPositiveInt(input.assignedTo);

  if (!title) {
    return {
      status: "error",
      message: "Task title is required.",
    };
  }

  if (!validTaskPriorities.has(priority)) {
    return {
      status: "error",
      message: "Choose a valid priority.",
    };
  }

  if (clientId === undefined || assignedTo === undefined) {
    return {
      status: "error",
      message: "Client and assigned user must be valid.",
    };
  }

  if (!assignedTo) {
    return {
      status: "error",
      message: "Choose a team member.",
    };
  }

  if (clientId !== null && !(await recordExists("clients", clientId))) {
    return {
      status: "error",
      message: `Client ID ${clientId} does not exist. Leave Client ID blank or choose an existing client.`,
    };
  }

  const { data: assignedUser, error: assignedUserError } = await supabase
    .from("users")
    .select("id, role, department_id")
    .eq("id", assignedTo)
    .single();

  if (assignedUserError || !assignedUser) {
    return {
      status: "error",
      message: "Selected team member does not exist.",
    };
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title,
      description: description || null,
      status: getStatusFromRole(assignedUser.role),
      priority,
      deadline: deadline ? `${deadline}T00:00:00` : null,
      client_id: clientId,
      assigned_to: assignedTo,
      department_id: assignedUser.department_id,
      created_by: null,
    })
    .select("id, title, description, status, priority, deadline, client_id, assigned_to, department_id, created_by, created_at")
    .single();

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/tasks");

  return {
    status: "success",
    message: `${title} was added.`,
    task: data,
  };
}

export async function updateTaskStatus(taskId: number, status: TaskStatus): Promise<TaskActionState> {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message: "Supabase is not configured.",
    };
  }

  if (!Number.isInteger(taskId) || taskId <= 0) {
    return {
      status: "error",
      message: "Task ID is invalid.",
    };
  }

  if (!validTaskStatuses.has(status)) {
    return {
      status: "error",
      message: "Choose a valid task status.",
    };
  }

  const { error } = await supabase.from("tasks").update({ status }).eq("id", taskId);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/tasks");

  return {
    status: "success",
    message: "Task status updated.",
  };
}
