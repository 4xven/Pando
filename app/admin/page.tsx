"use client";

import AdminGuard from "../components/AdminGuard";
import { redirect } from "next/navigation";

export default function AdminPage() {
  redirect("/admin/dashboard");

  return (
    <AdminGuard>
      <div>Loading...</div>
    </AdminGuard>
  );
}