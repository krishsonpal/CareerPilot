import { useState } from "react";

const WRONG_NAV = [
  {
    id: "W1",
    severity: "critical",
    location: "AppSidebar (Candidate Workspace)",
    trigger: "Brand Logo click",
    current: "/ (Public Marketing Homepage)",
    fix: "/app (Candidate Overview)",
    reason:
      "A logged-in candidate clicking the logo inside /app/* is dumped back onto the public marketing landing page. They are already authenticated — the correct home is their Overview dashboard.",
  },
  {
    id: "W2",
    severity: "critical",
    location: "RecruiterLayout Sidebar",
    trigger: "Brand Logo click",
    current: "/ (Public Marketing Homepage)",
    fix: "/dashboard/manage-jobs",
    reason:
      "Same problem for recruiters. Clicking the logo inside /dashboard/* sends them to the guest-facing marketing site. Should stay within the recruiter portal.",
  },
  {
    id: "W3",
    severity: "critical",
    location: "/apply-job/:id (ApplyJob.jsx)",
    trigger: "Job Not Found / API 404 fallback",
    current: "/ (Public Marketing Homepage)",
    fix: "/all-jobs/all (Job Catalog)",
    reason:
      'When a job ID is invalid or deleted, the error fallback sends the user to the marketing homepage instead of the job catalog. "Job not found" recovery should keep the user in a jobs context.',
  },
  {
    id: "W4",
    severity: "critical",
    location: "/applications (Legacy Applications page)",
    trigger: "Route itself exists",
    current:
      "Rendered under AppLayout (public Navbar+Footer) but requires student auth",
    fix:
      "Redirect /applications → /app/applications, or remove the route entirely",
    reason:
      'This page lives in the "Public Zone" routing diagram but requires a logged-in student. Its functionality is completely duplicated by /app/applications (the Kanban board). It\'s an orphaned legacy route: no Navbar link points to it, it uses the wrong layout for an authenticated page, and it confuses the auth/public boundary.',
  },
  {
    id: "W5",
    severity: "high",
    location: "Home Page — FeaturedJob JobCard",
    trigger: '"Ask AI about Job" button (for Guest users)',
    current: "Navigates directly to /app/assistant with router state {initialPrompt}",
    fix:
      "Guest → /candidate-login?next=/app/assistant (with state preserved); Student → /app/assistant",
    reason:
      "When a guest clicks 'Ask AI about Job' on a home-page featured job card, they hit the ProtectedRoute guard which redirects them — but the router state (initialPrompt) is LOST during the redirect. The AIChatTeaser component already handles this correctly with ?next= + state. FeaturedJob must do the same.",
  },
  {
    id: "W6",
    severity: "high",
    location: "All Jobs Page (/all-jobs/:category) — JobCard",
    trigger: '"Ask AI about Job" button (for Guest users)',
    current: "Navigates directly to /app/assistant with router state {initialPrompt}",
    fix:
      "Guest → /candidate-login?next=/app/assistant (with state preserved); Student → /app/assistant",
    reason:
      "Same initialPrompt state-loss bug as W5. The AllJobs page is public, so guests can see it. When they click 'Ask AI', the prompt context evaporates at the ProtectedRoute boundary. Must mirror the AIChatTeaser's conditional guard pattern.",
  },
  {
    id: "W7",
    severity: "high",
    location: "Recruiter Sidebar — 'View Applications' nav link",
    trigger: "Nav click",
    current: "/dashboard/view-applications (no job_id)",
    fix: "Remove this nav link OR make it disabled until a job is selected; redirect to /dashboard/manage-jobs",
    reason:
      "/dashboard/view-applications requires a ?job_id= query param to function. Navigating there without one is an undefined/broken state — the component doesn't know which job's applicants to load. The correct entry point is Manage Jobs → pick a job → then view its applicants.",
  },
  {
    id: "W8",
    severity: "medium",
    location: "/apply-job/:id — Breadcrumb",
    trigger: '"All Jobs" breadcrumb click (for logged-in candidate)',
    current: "/all-jobs/all (public catalog, always)",
    fix:
      'If user came from /app/jobs → back to /app/jobs. Otherwise → /all-jobs/all. Detect via location.state or "from" param.',
    reason:
      'A logged-in candidate browsing /app/jobs → clicks a job → lands on /apply-job/:id. The breadcrumb always dumps them to the public /all-jobs/all catalog, breaking their workflow. They lose AI recommendations, their applied filters, and their workspace context.',
  },
  {
    id: "W9",
    severity: "medium",
    location: "Candidate Signup (/candidate-signup)",
    trigger: "Successful registration",
    current: "/candidate-login (back to login page)",
    fix: "Auto-login after signup → /app/profile (onboarding) or /app",
    reason:
      "Bouncing a user to the login page immediately after they just signed up is an unnecessary extra step and a poor first experience. Most modern apps auto-authenticate on signup and redirect to an onboarding/profile page.",
  },
  {
    id: "W10",
    severity: "medium",
    location: "High-level Routing Mermaid Diagram (Architecture doc)",
    trigger: "HOME --> APP_ASSISTANT edge",
    current: "Shown as a direct unconditional edge in the diagram",
    fix:
      "Diagram must show it as conditional: Guest → /candidate-login?next=... | Student → /app/assistant",
    reason:
      "The diagram misleads developers reading it into thinking the public home links unconditionally to a protected route. The actual code IS conditional (via AIChatTeaser), but the architecture diagram should reflect that.",
  },
];

const MISSING_NAV = [
  {
    id: "M1",
    priority: "critical",
    location: "Candidate Login (/candidate-login) & Recruiter Login (/recruiter-login)",
    missing: '"Forgot Password?" link → /forgot-password (or modal)',
    reason:
      "Neither login page has password recovery navigation. This is a basic, essential auth flow. Without it, users who forget their password have no self-serve path — they'd be permanently locked out.",
  },
  {
    id: "M2",
    priority: "critical",
    location: "Logout action (AppSidebar & RecruiterLayout & Navbar)",
    missing: "Explicit redirect after session destruction",
    reason:
      'The logout action is documented as "Destroys token & session" but the redirect destination is vague ("/ or login"). All three logout locations must explicitly redirect to / (landing page) with a consistent toast. Ambiguity here can cause blank/broken states.',
  },
  {
    id: "M3",
    priority: "high",
    location: "New Candidate first login → /app (Overview)",
    missing: "Onboarding redirect: New user with no resume → /app/profile",
    reason:
      "When a brand-new candidate logs in for the first time, their /app Overview shows empty metric cards (0 applications, 0 matches) and an empty AI assistant with no resume context. There's no navigation guiding them to /app/profile to upload their resume — the critical first step. Add: if(user.hasNoResume) navigate('/app/profile') on Overview mount.",
  },
  {
    id: "M4",
    priority: "high",
    location:
      "Recruiter View Applications (/dashboard/view-applications)",
    missing: 'Link to the public job posting → /apply-job/:id ("Preview Job")',
    reason:
      "Recruiters reviewing candidates have no way to see how their own job posting looks to applicants. A 'Preview Job Posting' link to /apply-job/:id is a standard recruiter workflow that's entirely absent.",
  },
  {
    id: "M5",
    priority: "high",
    location: "Candidate Profile (/app/profile)",
    missing:
      'Post-upload CTA: "Find Matching Jobs" → /app/jobs (after resume processed)',
    reason:
      "After a candidate uploads and processes their resume (completing the 4-stage pipeline), they're left on the profile page with no next-step navigation. The natural next action is to browse AI-matched jobs. Add a CTA button that appears after the pipeline status reaches 'Context Ready'.",
  },
  {
    id: "M6",
    priority: "high",
    location: "Applications Kanban (/app/applications) — Application Detail Modal",
    missing: 'Candidate "Withdraw Application" action → confirmation + stays on board',
    reason:
      "The modal shows the application status but candidates have no way to withdraw an application. Recruiters can change status; candidates can only view. A 'Withdraw' action with a confirm dialog is a missing essential candidate action.",
  },
  {
    id: "M7",
    priority: "medium",
    location: "/terms (Terms & Conditions page)",
    missing: "Back navigation / breadcrumb (especially when arriving from signup)",
    reason:
      "Users who click 'Terms of Service' during signup land on /terms with no back button or breadcrumb. The Navbar is present but lacks a contextual 'Back to Signup' affordance. Users have to use browser back. Add a <Link> back to where they came from via location.state or history.",
  },
  {
    id: "M8",
    priority: "medium",
    location: "Recruiter Manage Jobs (/dashboard/manage-jobs) — Job Cards",
    missing: 'Recruiter "Edit Job" → /dashboard/edit-job/:id',
    reason:
      "There is a 'Post a Job' route (/dashboard/add-job) but no documented 'Edit Job' route. Recruiters can only toggle Active/Closed status on job postings — there's no navigation to edit a job's description, requirements, or salary. Either this route is missing from the docs or it needs to be added.",
  },
  {
    id: "M9",
    priority: "medium",
    location: "Candidate Overview (/app) — First-time empty state",
    missing: '"Complete your profile" empty state → /app/profile',
    reason:
      "When a new user opens Overview and all 3 metric cards show zero, there should be a prominent 'Complete your profile to get started' empty state that links to /app/profile. Currently it just shows empty cards with no guidance.",
  },
  {
    id: "M10",
    priority: "low",
    location: "Auth pages — both Candidate and Recruiter Signup",
    missing: "Email verification step / navigation after signup",
    reason:
      "If the backend sends a verification email, there's no navigation for the 'Check your email' confirmation screen. If emails are verified, this step and its route (/verify-email?token=...) need to be in the architecture.",
  },
];

const ZONE_STRUCTURE = [
  {
    zone: "Public Zone",
    color: "#3b82f6",
    bg: "#eff6ff",
    routes: [
      { path: "/", label: "Home", status: "keep" },
      { path: "/all-jobs/:category", label: "All Jobs Catalog", status: "keep" },
      { path: "/apply-job/:id", label: "Job Detail & Apply", status: "keep" },
      { path: "/about", label: "About", status: "keep" },
      { path: "/terms", label: "Terms & Privacy", status: "keep" },
      { path: "/applications", label: "Legacy Applications", status: "remove", note: "Redirect → /app/applications" },
      { path: "/jobs", label: "/jobs alias", status: "clarify", note: "Ensure it redirects to /all-jobs/all" },
    ],
  },
  {
    zone: "Auth Zone",
    color: "#8b5cf6",
    bg: "#f5f3ff",
    routes: [
      { path: "/candidate-login", label: "Candidate Login", status: "keep" },
      { path: "/candidate-signup", label: "Candidate Signup", status: "keep" },
      { path: "/recruiter-login", label: "Recruiter Login", status: "keep" },
      { path: "/recruiter-signup", label: "Recruiter Signup", status: "keep" },
      { path: "/forgot-password", label: "Forgot Password", status: "add", note: "Missing — add this route" },
      { path: "/verify-email", label: "Email Verification", status: "add", note: "Add if backend sends verification emails" },
    ],
  },
  {
    zone: "Candidate Workspace (Protected: student)",
    color: "#10b981",
    bg: "#f0fdf4",
    routes: [
      { path: "/app", label: "Candidate Overview", status: "keep" },
      { path: "/app/assistant", label: "AI Career Coach", status: "keep" },
      { path: "/app/jobs", label: "Semantic Job Discovery", status: "keep" },
      { path: "/app/applications", label: "ATS Kanban Board", status: "keep" },
      { path: "/app/profile", label: "AI Resume & Pipeline", status: "keep" },
    ],
  },
  {
    zone: "Recruiter Portal (Protected: recruiter)",
    color: "#f59e0b",
    bg: "#fffbeb",
    routes: [
      { path: "/dashboard/manage-jobs", label: "Manage Postings", status: "keep" },
      { path: "/dashboard/add-job", label: "Post a Job", status: "keep" },
      { path: "/dashboard/edit-job/:id", label: "Edit Job Posting", status: "add", note: "Missing — essential CRUD action" },
      { path: "/dashboard/view-applications", label: "ATS Candidate Pipeline", status: "keep", note: "Always require ?job_id= param" },
    ],
  },
];

const CORRECTED_EDGES = [
  { from: "AppSidebar Logo", to: "/app", was: "/", change: "fix" },
  { from: "RecruiterLayout Logo", to: "/dashboard/manage-jobs", was: "/", change: "fix" },
  { from: "ApplyJob 404 fallback", to: "/all-jobs/all", was: "/", change: "fix" },
  { from: "Home FeaturedJob 'Ask AI' (guest)", to: "/candidate-login?next=/app/assistant", was: "/app/assistant (unguarded)", change: "fix" },
  { from: "AllJobs JobCard 'Ask AI' (guest)", to: "/candidate-login?next=/app/assistant", was: "/app/assistant (unguarded)", change: "fix" },
  { from: "Candidate Signup success", to: "/app/profile (auto-login)", was: "/candidate-login", change: "fix" },
  { from: "Recruiter Sidebar 'View Applications'", to: "Remove or disable (no job_id)", was: "/dashboard/view-applications", change: "remove" },
  { from: "/applications (legacy route)", to: "Redirect → /app/applications", was: "Standalone public-layout protected page", change: "remove" },
  { from: "Candidate Login → Forgot Password", to: "/forgot-password", was: "Missing", change: "add" },
  { from: "Recruiter Login → Forgot Password", to: "/forgot-password", was: "Missing", change: "add" },
  { from: "All logouts → post-session", to: "/ (explicit redirect)", was: "Undefined/vague", change: "add" },
  { from: "New Candidate /app mount (no resume)", to: "/app/profile (onboarding)", was: "Empty dashboard, no guidance", change: "add" },
  { from: "Profile page — after upload complete", to: "CTA → /app/jobs", was: "No CTA", change: "add" },
  { from: "ViewApplications — per job", to: "'Preview Posting' → /apply-job/:id", was: "Missing", change: "add" },
  { from: "ApplyJob breadcrumb (from /app/jobs)", to: "/app/jobs (context-aware)", was: "Always /all-jobs/all", change: "fix" },
];

const severityColor = { critical: "#ef4444", high: "#f97316", medium: "#eab308", low: "#6b7280" };
const priorityColor = { critical: "#ef4444", high: "#f97316", medium: "#eab308", low: "#6b7280" };
const statusConfig = {
  keep:    { label: "Keep", bg: "#dcfce7", text: "#15803d" },
  remove:  { label: "Remove", bg: "#fee2e2", text: "#dc2626" },
  add:     { label: "Add", bg: "#dbeafe", text: "#1d4ed8" },
  clarify: { label: "Clarify", bg: "#fef9c3", text: "#92400e" },
};
const changeConfig = {
  fix:    { label: "FIX", bg: "#fff7ed", text: "#c2410c", border: "#fb923c" },
  remove: { label: "REMOVE", bg: "#fef2f2", text: "#991b1b", border: "#f87171" },
  add:    { label: "ADD", bg: "#eff6ff", text: "#1e40af", border: "#60a5fa" },
};

export default function NavAudit() {
  const [tab, setTab] = useState("wrong");

  const tabs = [
    { id: "wrong", label: `🔴 Wrong Navigations (${WRONG_NAV.length})` },
    { id: "missing", label: `🟡 Missing Navigations (${MISSING_NAV.length})` },
    { id: "routes", label: "📦 Route Structure" },
    { id: "matrix", label: "✅ Correction Matrix" },
  ];

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#f8fafc", minHeight: "100vh", padding: "0 0 48px" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)", padding: "32px 32px 24px", color: "#fff" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#94a3b8", marginBottom: 8, textTransform: "uppercase" }}>
          CareerPilot · Navigation Audit
        </div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, lineHeight: 1.2 }}>
          Frontend Navigation — Issues & Restructure
        </h1>
        <p style={{ margin: "10px 0 0", color: "#94a3b8", fontSize: 14, maxWidth: 560 }}>
          {WRONG_NAV.length} wrong navigations identified &nbsp;·&nbsp; {MISSING_NAV.length} missing navigations found &nbsp;·&nbsp; {CORRECTED_EDGES.length} corrections mapped
        </p>

        {/* Summary pills */}
        <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
          {[
            { label: "Critical", count: [...WRONG_NAV, ...MISSING_NAV].filter(x => x.severity === "critical" || x.priority === "critical").length, color: "#ef4444" },
            { label: "High", count: [...WRONG_NAV, ...MISSING_NAV].filter(x => x.severity === "high" || x.priority === "high").length, color: "#f97316" },
            { label: "Medium", count: [...WRONG_NAV, ...MISSING_NAV].filter(x => x.severity === "medium" || x.priority === "medium").length, color: "#eab308" },
            { label: "Low", count: [...WRONG_NAV, ...MISSING_NAV].filter(x => x.severity === "low" || x.priority === "low").length, color: "#6b7280" },
          ].map(p => (
            <div key={p.label} style={{ background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: "4px 14px", fontSize: 13, fontWeight: 600, color: p.color, border: `1px solid ${p.color}44` }}>
              {p.count} {p.label}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 32px", display: "flex", gap: 0, overflowX: "auto" }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: "none", border: "none", padding: "14px 18px", cursor: "pointer",
              fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
              color: tab === t.id ? "#1e40af" : "#64748b",
              borderBottom: tab === t.id ? "2px solid #1e40af" : "2px solid transparent",
              whiteSpace: "nowrap", transition: "all 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "28px 32px", maxWidth: 1100, margin: "0 auto" }}>

        {/* WRONG NAVIGATIONS TAB */}
        {tab === "wrong" && (
          <div>
            <p style={{ color: "#64748b", fontSize: 14, marginTop: 0, marginBottom: 24 }}>
              These navigations currently exist in the code but lead to <strong>wrong destinations</strong>. Each needs to be fixed or removed.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {WRONG_NAV.map(item => (
                <div key={item.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <div style={{ background: severityColor[item.severity] + "18", borderBottom: "1px solid " + severityColor[item.severity] + "33", padding: "10px 18px", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ background: severityColor[item.severity], color: "#fff", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                      {item.severity}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{item.id}</span>
                    <span style={{ fontSize: 13, color: "#475569", marginLeft: 4 }}>— {item.location}</span>
                  </div>
                  <div style={{ padding: "16px 18px" }}>
                    <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Trigger</div>
                        <div style={{ fontSize: 13, color: "#374151", background: "#f8fafc", padding: "6px 10px", borderRadius: 6, border: "1px solid #e2e8f0" }}>{item.trigger}</div>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>❌ Current (Wrong)</div>
                        <div style={{ fontSize: 13, color: "#dc2626", background: "#fef2f2", padding: "8px 10px", borderRadius: 6, border: "1px solid #fecaca", fontFamily: "monospace" }}>{item.current}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>✅ Should Be</div>
                        <div style={{ fontSize: 13, color: "#15803d", background: "#f0fdf4", padding: "8px 10px", borderRadius: 6, border: "1px solid #bbf7d0", fontFamily: "monospace" }}>{item.fix}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, background: "#f8fafc", padding: "10px 12px", borderRadius: 6, borderLeft: "3px solid " + severityColor[item.severity] }}>
                      <strong>Why: </strong>{item.reason}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MISSING NAVIGATIONS TAB */}
        {tab === "missing" && (
          <div>
            <p style={{ color: "#64748b", fontSize: 14, marginTop: 0, marginBottom: 24 }}>
              These navigations <strong>don't exist yet</strong> but are essential for a complete, correct user flow.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {MISSING_NAV.map(item => (
                <div key={item.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <div style={{ background: priorityColor[item.priority] + "18", borderBottom: "1px solid " + priorityColor[item.priority] + "33", padding: "10px 18px", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ background: priorityColor[item.priority], color: "#fff", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                      {item.priority}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{item.id}</span>
                    <span style={{ fontSize: 13, color: "#475569", marginLeft: 4 }}>— {item.location}</span>
                  </div>
                  <div style={{ padding: "16px 18px" }}>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>➕ What's Missing</div>
                      <div style={{ fontSize: 13, color: "#1d4ed8", background: "#eff6ff", padding: "8px 10px", borderRadius: 6, border: "1px solid #bfdbfe", fontFamily: "monospace" }}>{item.missing}</div>
                    </div>
                    <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, background: "#f8fafc", padding: "10px 12px", borderRadius: 6, borderLeft: "3px solid " + priorityColor[item.priority] }}>
                      <strong>Why: </strong>{item.reason}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ROUTE STRUCTURE TAB */}
        {tab === "routes" && (
          <div>
            <p style={{ color: "#64748b", fontSize: 14, marginTop: 0, marginBottom: 24 }}>
              Restructured route inventory. <span style={{ background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>Keep</span> = no change needed. <span style={{ background: "#fee2e2", color: "#dc2626", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>Remove</span> = delete or redirect. <span style={{ background: "#dbeafe", color: "#1d4ed8", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>Add</span> = new route needed.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(440px, 1fr))", gap: 20 }}>
              {ZONE_STRUCTURE.map(zone => (
                <div key={zone.zone} style={{ background: "#fff", border: `1px solid ${zone.color}44`, borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  <div style={{ background: zone.color, padding: "12px 18px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{zone.zone}</div>
                  </div>
                  <div style={{ padding: 4 }}>
                    {zone.routes.map(r => {
                      const s = statusConfig[r.status];
                      return (
                        <div key={r.path} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderBottom: "1px solid #f1f5f9" }}>
                          <span style={{ background: s.bg, color: s.text, borderRadius: 4, padding: "2px 7px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", marginTop: 1 }}>{s.label}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{r.label}</div>
                            <div style={{ fontSize: 12, color: "#94a3b8", fontFamily: "monospace" }}>{r.path}</div>
                            {r.note && <div style={{ fontSize: 12, color: "#92400e", marginTop: 3, fontStyle: "italic" }}>⚠ {r.note}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CORRECTION MATRIX TAB */}
        {tab === "matrix" && (
          <div>
            <p style={{ color: "#64748b", fontSize: 14, marginTop: 0, marginBottom: 24 }}>
              Every navigation change consolidated. Use this as your implementation checklist.
            </p>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#0f172a", color: "#fff" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, width: 70 }}>Type</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>Navigation Source</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#f87171" }}>Was (Wrong / Missing)</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#86efac" }}>Now (Correct)</th>
                  </tr>
                </thead>
                <tbody>
                  {CORRECTED_EDGES.map((edge, i) => {
                    const c = changeConfig[edge.change];
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ padding: "10px 16px" }}>
                          <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 4, padding: "2px 7px", fontSize: 11, fontWeight: 700 }}>{c.label}</span>
                        </td>
                        <td style={{ padding: "10px 16px", color: "#1e293b", fontWeight: 500 }}>{edge.from}</td>
                        <td style={{ padding: "10px 16px", color: "#dc2626", fontFamily: "monospace", fontSize: 12 }}>{edge.was}</td>
                        <td style={{ padding: "10px 16px", color: "#15803d", fontFamily: "monospace", fontSize: 12 }}>{edge.to}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Priority order guidance */}
            <div style={{ marginTop: 28, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px 24px" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15, color: "#0f172a" }}>Recommended Fix Order</h3>
              {[
                { step: "1", label: "Fix the two logo navigations (W1, W2) — 2-line code change each", color: "#ef4444" },
                { step: "2", label: "Remove/redirect legacy /applications route (W4) — prevents auth boundary confusion", color: "#ef4444" },
                { step: "3", label: "Fix 404 fallback in ApplyJob.jsx (W3) — 1-line change", color: "#ef4444" },
                { step: "4", label: "Fix 'Ask AI' guest guard in FeaturedJob & AllJobs JobCard (W5, W6) — mirror AIChatTeaser pattern", color: "#f97316" },
                { step: "5", label: "Remove/disable Recruiter 'View Applications' sidebar link without job_id (W7)", color: "#f97316" },
                { step: "6", label: "Add Forgot Password route & links on both login pages (M1)", color: "#f97316" },
                { step: "7", label: "Standardise post-logout redirect to / across all 3 logout triggers (M2)", color: "#f97316" },
                { step: "8", label: "Add new-user onboarding redirect on /app mount (M3, M9)", color: "#eab308" },
                { step: "9", label: "Fix breadcrumb context-awareness on /apply-job/:id (W8)", color: "#eab308" },
                { step: "10", label: "Add 'Preview Posting' link for recruiters in ViewApplications (M4) + Profile CTA (M5)", color: "#eab308" },
              ].map(s => (
                <div key={s.step} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: s.color, color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.step}</div>
                  <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5, paddingTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
