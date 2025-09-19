import CommitteeGuard from "@/components/CommitteeGuard";

export default function Executive(){
  return (
    <>
      <CommitteeGuard/>
      <main className="content">
        <div className="page-header"><div className="title">Executive</div></div>
        <p style={{color:'#9aa6b2'}}>This is a placeholder. We can add executive tools here.</p>
      </main>
    </>
  );
}
