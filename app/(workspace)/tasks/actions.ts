"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient, type TaskRecord } from "@/app/lib/supabase";

export type TaskStatus = "juniors" | "seniors" | "managers";

export type CreateTaskInput = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: string;
  deadline: string;
  clientId: string;
  assignedTo: string;
  departmentId: string;
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
  const departmentId = getOptionalPositiveInt(input.departmentId);

  if (!title) {
    return {
      status: "error",
      message: "Task title is required.",
    };
  }

  if (!validTaskStatuses.has(input.status)) {
    return {
      status: "error",
      message: "Choose a valid task status.",
    };
  }

  if (!validTaskPriorities.has(priority)) {
    return {
      status: "error",
      message: "Choose a valid priority.",
    };
  }

  if (clientId === undefined || assignedTo === undefined || departmentId === undefined) {
    return {
      status: "error",
      message: "Client, assigned user, and department IDs must be positive numbers.",
    };
  }

  if (clientId !== null && !(await recordExists("clients", clientId))) {
    return {
      status: "error",
      message: `Client ID ${clientId} does not exist. Leave Client ID blank or choose an existing client.`,
    };
  }

  if (assignedTo !== null && !(await recordExists("users", assignedTo))) {
    return {
      status: "error",
      message: `Assigned user ID ${assignedTo} does not exist. Leave Assigned user ID blank or choose an existing user.`,
    };
  }

  if (departmentId !== null && !(await recordExists("departments", departmentId))) {
    return {
      status: "error",
      message: `Department ID ${departmentId} does not exist. Leave Department ID blank or choose an existing department.`,
    };
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title,
      description: description || null,
      status: input.status,
      priority,
      deadline: deadline ? `${deadline}T00:00:00` : null,
      client_id: clientId,
      assigned_to: assignedTo,
      department_id: departmentId,
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
