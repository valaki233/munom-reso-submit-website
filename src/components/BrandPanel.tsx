"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function BrandPanel(){
  const router = useRouter();
  const [hasCommittee, setHasCommittee] = useState(false);

  useEffect(() => {
    try { setHasCommittee(!!localStorage.getItem('userCommittee')); } catch {}
  }, []);

  return (
    <div>
      <div className="brand-logo">
        <img src="/icon.png" alt="MunoM logo" />
      </div>
      {hasCommittee && (
        <button
          type="button"
          className="btn-outline btn-block"
          onClick={() => {
            try { localStorage.removeItem('userCommittee'); } catch {}
            router.replace('/login');
          }}
        >
          Log out
        </button>
      )}
    </div>
  );
}

