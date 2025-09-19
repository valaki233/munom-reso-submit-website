"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CommitteeGuard from "@/components/CommitteeGuard";
import { CaretDown, PaperPlane } from "@/components/Icons";

type FormType = "resolution" | "amendment";

export default function Committee(){
  const router = useRouter();
  const [type, setType] = useState<FormType>("resolution");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [committeeCode, setCommitteeCode] = useState<string | null>(null);

  useEffect(() => {
    try { setCommitteeCode(localStorage.getItem('userCommittee')); } catch {}
  }, []);

  async function onSubmit(formData: FormData){
    setLoading(true);
    setMessage(null); setError(null);
    try{
      const payload = Object.fromEntries(formData.entries());
      if(type === 'resolution'){
        if(!payload.title || !payload.sponsor || !payload.content){
          throw new Error('Please fill in all fields.');
        }
      } else {
        if(!payload.resolutionNumber || !payload.content){
          throw new Error('Please fill in all fields.');
        }
      }
      const res = await fetch('/api/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, committeeCode, ...payload })
      });
      if(!res.ok){
        let t = await res.text();
        try { const j = JSON.parse(t); t = j.detail || j.error || t; } catch {}
        throw new Error(t || 'Submission failed');
      }
      setMessage(type === 'resolution' ? 'Resolution submitted ✔️' : 'Amendment submitted ✔️');
      (document.getElementById('committee-submit-form') as HTMLFormElement)?.reset();
    }catch(e:any){
      setError(e.message || 'Something went wrong');
    }finally{
      setLoading(false);
    }
  }

  return (
    <>
      <CommitteeGuard/>
      <header className="page-header">
        <div className="title type-select">
          Submit <span className="blue">{type === 'resolution' ? 'Resolution' : 'Amendment'}</span>
          <button aria-label="Change type" onClick={() => setMenuOpen(v=>!v)} className="caret"><CaretDown/></button>
          {menuOpen && (
            <div className="type-menu" onMouseLeave={()=> setMenuOpen(false)}>
              <div className="item" onClick={()=>{setType('resolution'); setMenuOpen(false);}}>Resolution</div>
              <div className="item" onClick={()=>{setType('amendment'); setMenuOpen(false);}}>Amendment</div>
            </div>
          )}
        </div>
      </header>
      <main className="content">
        {type === 'resolution' ? (
          <form id="committee-submit-form" action={(fd)=> onSubmit(fd)} className="stack">
            <input className="input" name="title" placeholder="Resolution Title" required/>
            <input className="input" name="sponsor" placeholder="Sponsoring Country" required/>
            <textarea className="input textarea" name="content" placeholder="Resolution Content (link or text)" required/>
            <button className="btn-primary" type="submit" disabled={loading}>
              <PaperPlane/>
              {loading ? 'Submitting…' : 'Submit Resolution'}
            </button>
          </form>
        ) : (
          <form id="committee-submit-form" action={(fd)=> onSubmit(fd)} className="stack">
            <input className="input" name="resolutionNumber" placeholder="Amendment To (Resolution #)" required/>
            <textarea className="input textarea" name="content" placeholder="Amendment Content" required/>
            <button className="btn-primary" type="submit" disabled={loading}>
              <PaperPlane/>
              {loading ? 'Submitting…' : 'Submit Amendment'}
            </button>
          </form>
        )}
        {message && <div className="success" role="status">{message}</div>}
        {error && <div className="error" role="alert">{error}</div>}
      </main>
    </>
  );
}
