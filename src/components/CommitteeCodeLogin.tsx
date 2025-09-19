"use client";

import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

type Props = {
  redirect?: string | ((committee: any) => string);
  localStorageKey?: string; // defaults to "userCommittee"
  supabaseUrl?: string; // optional override
  supabaseAnonKey?: string; // optional override
};

const supabaseClientCache = new Map<string, ReturnType<typeof createClient>>();

function getSupabaseClient(url?: string, key?: string) {
  // Support both NEXT_PUBLIC_* and EXPO_PUBLIC_* for this web app
  const envUrl =
    url ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.EXPO_PUBLIC_SUPABASE_URL;
  const envKey =
    key ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!envUrl || !envKey) {
    throw new Error(
      "Supabase URL/Anon Key missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or EXPO_PUBLIC_ variants)."
    );
  }

  const cacheKey = `${envUrl}|${envKey}`;
  if (!supabaseClientCache.has(cacheKey)) {
    supabaseClientCache.set(cacheKey, createClient(envUrl, envKey));
  }
  return supabaseClientCache.get(cacheKey)!;
}

export default function CommitteeCodeLogin({
  redirect,
  localStorageKey = "userCommittee",
  supabaseUrl,
  supabaseAnonKey,
}: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = getSupabaseClient(supabaseUrl, supabaseAnonKey);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Please enter a code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from("committees")
        .select("*")
        .eq("committee_code", trimmed)
        .single();

      if (dbError || !data) {
        setError("Invalid code. Please check and try again.");
        return;
      }

      localStorage.setItem(localStorageKey, trimmed);

      const target =
        typeof redirect === "function"
          ? redirect(data)
          : redirect ?? "/committee";

      router.push(target);
    } catch (err) {
      console.error(err);
      setError("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="stack" style={{ maxWidth: 560, margin: "0 auto" }}>
      <label htmlFor="committee-code" className="" style={{ color: "#6b7280" }}>
        Enter your committee code
      </label>
      <input
        id="committee-code"
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="e.g. GA1, ECOSOC-02"
        disabled={loading}
        className="input"
      />
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? "Verifying…" : "Continue"}
      </button>
      {error && <p style={{ color: "#b91c1c", marginTop: 4 }}>{error}</p>}
    </form>
  );
}

