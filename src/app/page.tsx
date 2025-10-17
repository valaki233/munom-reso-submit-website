"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CommitteeGuard from "@/components/CommitteeGuard";
import { CaretDown, PaperPlane } from "@/components/Icons";

type FormType = "resolution" | "amendment";

export default function SubmitPage() {
  const router = useRouter();
  const [type, setType] = useState<FormType>("resolution");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [committeeCode, setCommitteeCode] = useState<string | null>(null);

  useEffect(() => {
    try {
      const code = localStorage.getItem("userCommittee");
      setCommitteeCode(code);
    } catch {}
  }, []);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const payload = Object.fromEntries(formData.entries());
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, committeeCode, ...payload }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Submission failed");
      }
      setMessage(
        type === "resolution"
          ? "Resolution submitted ✔️"
          : "Amendment submitted ✔️"
      );
      (document.getElementById("submit-form") as HTMLFormElement)?.reset();
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <div style={{ margin: 'auto', maxWidth: '600px', paddingTop: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <button onClick={() => setType("resolution")} style={{ all: 'unset', cursor: 'pointer', padding: '0.5rem 1rem', borderBottom: type === 'resolution' ? '2px solid' : '2px solid transparent' }}>Resolution</button>
          <button onClick={() => setType("amendment")} style={{ all: 'unset', cursor: 'pointer', padding: '0.5rem 1rem', borderBottom: type === 'amendment' ? '2px solid' : '2px solid transparent' }}>Amendment</button>
        </div>

        {message && <p style={{ color: 'green' }}>{message}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {type === "resolution" ? (
          <ResolutionForm onSubmit={onSubmit} loading={loading} />
        ) : (
          <AmendmentForm onSubmit={onSubmit} loading={loading} />
        )}
      </div>
    </main>
  );
}

function ResolutionForm({ onSubmit, loading }: { onSubmit: (fd: FormData)=>void; loading: boolean }){
  return (
    <form id="submit-form" action={(fd)=> onSubmit(fd)} className="stack">
      <input className="input" name="title" placeholder="Resolution Title" required/>
      <input className="input" name="sponsor" placeholder="Sponsoring Country" required/>
      <textarea className="input textarea" name="content" placeholder="Resolution Content (link or text)" required/>
      <button className="btn-primary" type="submit" disabled={loading}>
        <PaperPlane/>
        {loading ? 'Submitting…' : 'Submit Resolution'}
      </button>
    </form>
  );
}

function AmendmentForm({ onSubmit, loading }: { onSubmit: (fd: FormData)=>void; loading: boolean }){
  return (
    <form id="submit-form" action={(fd)=> onSubmit(fd)} className="stack">
      <input className="input" name="resolutionNumber" placeholder="Amendment To (Resolution #)" required/>
      <textarea className="input textarea" name="content" placeholder="Amendment Content" required/>
      <button className="btn-primary" type="submit" disabled={loading}>
        <PaperPlane/>
        {loading ? 'Submitting…' : 'Submit Amendment'}
      </button>
    </form>
  );
}