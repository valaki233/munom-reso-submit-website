"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CommitteeGuard from "@/components/CommitteeGuard";
import { CaretDown, PaperPlane } from "@/components/Icons";

type FormType = "resolution" | "amendment";

export default function SubmitPage(){
  const router = useRouter();
  const [type, setType] = useState<FormType>("resolution");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [committeeCode, setCommitteeCode] = useState<string | null>(null);

  // Load committee code (if previously stored by auth/role flow)
  // Mirrors mobile app's AsyncStorage('userCommittee') usage
  useEffect(() => {
    try {
      const code = localStorage.getItem('userCommittee');
      setCommitteeCode(code);
      if (code) {
        router.replace('/committee');
      }
    } catch {}
  }, [router]);

  async function onSubmit(formData: FormData){
    setLoading(true);
    setMessage(null); setError(null);
    try{
      const payload = Object.fromEntries(formData.entries());
      const res = await fetch('/api/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, committeeCode, ...payload })
      });
      if(!res.ok){
        const t = await res.text();
        throw new Error(t || 'Submission failed');
      }
      setMessage(type === 'resolution' ? 'Resolution submitted ✔️' : 'Amendment submitted ✔️');
      (document.getElementById('submit-form') as HTMLFormElement)?.reset();
    }catch(e:any){
      setError(e.message || 'Something went wrong');
    }finally{
      setLoading(false);
    }
  }

  // This page only routes users; content never renders
  return <CommitteeGuard/>;
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