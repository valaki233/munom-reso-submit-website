"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function CommitteeGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Allow access to /login without redirecting
    if (pathname === "/login") {
      setChecked(true);
      return;
    }
    try {
      const code = localStorage.getItem("userCommittee");
      if (!code) {
        router.replace("/login");
      }
    } catch {}
    setChecked(true);
  }, [pathname, router]);

  // Avoid flashing protected content
  if (!checked) return null;
  return null;
}

