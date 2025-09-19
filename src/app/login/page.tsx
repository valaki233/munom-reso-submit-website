"use client";

import CommitteeCodeLogin from "@/components/CommitteeCodeLogin";

export default function Page(){
  return (
    <>
      <header className="page-header">
        <div className="title">Committee Access</div>
      </header>
      <main className="content">
        <CommitteeCodeLogin redirect={(c:any) => `/committee`} />
      </main>
    </>
  );
}

