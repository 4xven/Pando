"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);

        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (userDoc.exists()) {
          setRole(userDoc.data().role);
        } else {
          setRole("user");
        }
      } else {
        setUser(null);
        setRole(null);
      }
    });

    return () => unsub();
  }, []);

  return { user, role };
}