"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/app/lib/supabase";

export type AddTeamMemberState = {
  message: string;
  status: "idle" | "error" | "success";
};

export async function addTeamMember(
  _previousState: AddTeamMemberState,
  formData: FormData,
): Promise<AddTeamMemberState> {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message: "Supabase is not configured.",
    };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim().toLowerCase();
  const departmentIdValue = String(formData.get("department_id") ?? "").trim();
  const departmentId = Number(departmentIdValue);

  if (!name || !email || !role || !Number.isInteger(departmentId) || departmentId <= 0) {
    return {
      status: "error",
      message: "Name, email, role, and department are required.",
    };
  }

  const { data: department, error: departmentError } = await supabase
    .from("departments")
    .select("id")
    .eq("id", departmentId)
    .maybeSingle();

  if (departmentError || !department) {
    return {
      status: "error",
      message: "Choose a valid department.",
    };
  }

  const { error } = await supabase.from("users").insert({
    name,
    email,
    role,
    department_id: departmentId,
    avatar: name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/team");
  revalidatePath("/tasks");
  revalidatePath("/clients");

  return {
    status: "success",
    message: `${name} was added to the team.`,
  };
}
