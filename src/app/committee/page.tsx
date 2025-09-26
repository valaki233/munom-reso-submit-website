"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CommitteeGuard from "@/components/CommitteeGuard";
import { CaretDown, PaperPlane } from "@/components/Icons";

type FormType = "resolution" | "amendment";

export default function Committee() {
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<FormType>("resolution");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [committeeCode, setCommitteeCode] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    try {
      setCommitteeCode(localStorage.getItem("userCommittee"));
    } catch {}
  }, []);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      let res;
      if (type === "resolution") {
        const file = formData.get("content") as File;
        if (
          !formData.get("title") ||
          !formData.get("sponsor") ||
          !file ||
          file.size === 0
        ) {
          throw new Error("Please fill in all fields and select a file.");
        }

        // Check file size (10MB limit)
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > MAX_FILE_SIZE) {
          throw new Error("File is too large. Maximum size is 10MB.");
        }

        // Read as base64 and send as JSON to proxy
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        // Send to proxy which will forward to Make
        const payload = {
          fileName: file.name,
          data_base64: dataUrl.split(",")[1], // remove data:...;base64, prefix
          title: String(formData.get("title")),
          sponsor: String(formData.get("sponsor")),
          cosponsors: formData.get("cosponsors")
            ? String(formData.get("cosponsors"))
            : undefined,
          committeeCode: committeeCode || undefined,
          type,
        };

        res = await fetch("/api/make-proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // amendment
        const payload = Object.fromEntries(formData.entries());
        if (!payload.resolutionNumber || !payload.content) {
          throw new Error("Please fill in all fields.");
        }
        res = await fetch("/api/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, committeeCode, ...payload }),
        });
      }

      if (!res.ok) {
        let t = await res.text();
        try {
          const j = JSON.parse(t);
          t = j.detail || j.error || t;
        } catch {}
        throw new Error(t || "Submission failed");
      }
      setMessage(
        type === "resolution"
          ? "Resolution submitted ✔️"
          : "Amendment submitted ✔️"
      );
      formRef.current?.reset();
      setFileName(null);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <CommitteeGuard />
      <header className="page-header">
        <div className="title type-select">
          Submit{" "}
          <span className="blue">
            {type === "resolution" ? "Resolution" : "Amendment"}
          </span>
          <button
            aria-label="Change type"
            onClick={() => setMenuOpen((v) => !v)}
            className="caret"
          >
            <CaretDown />
          </button>
          {menuOpen && (
            <div className="type-menu" onMouseLeave={() => setMenuOpen(false)}>
              <div
                className="item"
                onClick={() => {
                  setType("resolution");
                  setMenuOpen(false);
                }}
              >
                Resolution
              </div>
              <div
                className="item"
                onClick={() => {
                  setType("amendment");
                  setMenuOpen(false);
                }}
              >
                Amendment
              </div>
            </div>
          )}
        </div>
      </header>
      <main className="content">
        {type === "resolution" ? (
          <form ref={formRef} action={(fd) => onSubmit(fd)} className="stack">
            <input
              className="input"
              name="title"
              placeholder="Resolution Title"
              required
            />
            <input
              className="input"
              name="sponsor"
              placeholder="Sponsoring Country"
              required
            />
            <input
              className="input"
              name="cosponsors"
              placeholder="Co-sponsoring Countries (optional)"
            />
            <label htmlFor="file-upload" className="input file-upload-label">
              {fileName || "Resolution File (.doc, .docx, .pdf)"}
            </label>
            <input
              id="file-upload"
              className="input"
              type="file"
              name="content"
              accept=".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              required
              onChange={(e) =>
                setFileName(e.target.files ? e.target.files[0].name : null)
              }
            />
            <button className="btn-primary" type="submit" disabled={loading}>
              <PaperPlane />
              {loading ? "Submitting…" : "Submit Resolution"}
            </button>
          </form>
        ) : (
          <form ref={formRef} action={(fd) => onSubmit(fd)} className="stack">
            <input
              className="input"
              name="resolutionNumber"
              placeholder="Amendment To (Resolution #)"
              required
            />
            <textarea
              className="input textarea"
              name="content"
              placeholder="Amendment Content"
              required
            />
            <button className="btn-primary" type="submit" disabled={loading}>
              <PaperPlane />
              {loading ? "Submitting…" : "Submit Amendment"}
            </button>
          </form>
        )}
        {message && (
          <div className="success" role="status">
            {message}
          </div>
        )}
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
      </main>
    </>
  );
}
