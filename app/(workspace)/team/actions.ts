"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/app/lib/supabase";

export async function addTeamMember(formData: FormData) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return;
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim().toLowerCase();
  const departmentIdValue = String(formData.get("department_id") ?? "").trim();
  const departmentId = Number(departmentIdValue);

  if (!name || !email || !role || !Number.isInteger(departmentId) || departmentId <= 0) {
    return;
  }

  await supabase.from("users").insert({
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

  revalidatePath("/team");
}
