"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
  if (user === undefined) return; 

  if (!user) {
    router.push("/login");
  } else if (role !== "admin") {
    router.push("/");
  }
}, [user, role, router]);

  if (!user || role !== "admin") return null;

  return <>{children}</>;
}