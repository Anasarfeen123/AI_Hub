import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import Header from "../components/Header";
import TopNav from "../components/TopNav";
import AdminNav from "../components/AdminNav";
import RoleBadge from "../components/RoleBadge";
import { useAuth } from "../context/AuthContext";
import { fetchMembers, addMember, bulkAddMembers, updateMember } from "../api";
import { isStaff, outranks } from "../lib/roles";

export default function MembersPage() {
  const { user, loading: authLoading } = useAuth();

  const [members, setMembers] = useState(null);
  const [viewerRole, setViewerRole] = useState("member");
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [adding, setAdding] = useState(false);

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkDept, setBulkDept] = useState("");
  const [bulking, setBulking] = useState(false);

  async function load() {
    setError(null);
    try {
      const { members: list, viewerRole: role } = await fetchMembers();
      setMembers(list);
      setViewerRole(role || "member");
    } catch (err) {
      setError(err.message);
    }
  }

  const staff = isStaff(user?.role);

  useEffect(() => {
    if (staff) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filtered = useMemo(() => {
    if (!members) return [];
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.collegeEmail.toLowerCase().includes(q) ||
        (m.department || "").toLowerCase().includes(q)
    );
  }, [members, query]);

  const stats = useMemo(() => {
    if (!members) return null;
    return {
      total: members.length,
      active: members.filter((m) => m.active).length,
      admins: members.filter((m) => m.role === "admin" && m.active).length,
      leads: members.filter((m) => m.role === "superadmin" && m.active).length,
    };
  }, [members]);

  if (authLoading) return <div className="hub-loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!staff) {
    return (
      <>
        <Header />
        <TopNav />
        <div className="editor-wrap">
          <h1>Admins only</h1>
          <p className="md-status">This page is for MIC leads.</p>
        </div>
      </>
    );
  }

  async function handleAdd(e) {
    e.preventDefault();
    setAdding(true);
    setError(null);
    setNotice(null);
    try {
      await addMember(name, email, department);
      setNotice(`Added ${email}. They can sign in straight away.`);
      setName("");
      setEmail("");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleBulk(e) {
    e.preventDefault();
    setBulking(true);
    setError(null);
    setNotice(null);
    try {
      const r = await bulkAddMembers(bulkText, bulkDept);
      const bits = [`Added ${r.added}`];
      if (r.skipped) bits.push(`${r.skipped} already on the list`);
      if (r.invalid?.length) bits.push(`${r.invalid.length} couldn't be read`);
      setNotice(bits.join(" · "));
      if (r.invalid?.length) {
        setError(`Not imported: ${r.invalid.slice(0, 5).join(" | ")}${r.invalid.length > 5 ? " …" : ""}`);
      }
      setBulkText("");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBulking(false);
    }
  }

  async function patch(id, changes) {
    setBusyId(id);
    setError(null);
    setNotice(null);
    try {
      await updateMember(id, changes);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  // Mirrors the server's rule exactly, so the UI never offers a button the API
  // will refuse. The server remains the real gate — this is only about not
  // showing dead controls.
  function canManage(m) {
    if (m.collegeEmail === user.email) return false;
    return outranks(viewerRole, m.role ?? "member");
  }

  return (
    <>
      <Header />
      <TopNav />
      <div className="editor-wrap">
        <h1>Members</h1>
        <AdminNav />

        {stats && (
          <p className="editor-note">
            {stats.total} on the list · {stats.active} active · {stats.admins} admin
            {stats.admins === 1 ? "" : "s"} · {stats.leads} lead{stats.leads === 1 ? "" : "s"}.
            Anyone active here can sign in and edit pages.
          </p>
        )}

        <p className="editor-note">
          <strong>Leads</strong> can promote and remove admins. <strong>Admins</strong> manage
          pages and members but cannot change a lead or another admin — so delegating access can't
          lock the board out.
          {viewerRole === "admin" && " You're an admin, so lead accounts are read-only for you."}
        </p>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}
        {notice && <p className="admin-notice">{notice}</p>}

        <form className="member-add" onSubmit={handleAdd}>
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="email@vitstudent.ac.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Department (optional)"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
          <button type="submit" className="editor-btn" disabled={adding}>
            {adding ? "Adding…" : "Add member"}
          </button>
          <button type="button" className="editor-cancel" onClick={() => setBulkOpen((o) => !o)}>
            {bulkOpen ? "Close bulk add" : "Bulk add"}
          </button>
        </form>

        {bulkOpen && (
          <form className="member-bulk" onSubmit={handleBulk}>
            <label>
              <span>
                One member per line as <code>Name,email</code> — add a third column for their
                department, or set one below for the whole batch. A header row is fine.
              </span>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={"Jane Doe,jane.doe2025@vitstudent.ac.in,UI/UX\nJohn Smith,john.smith2024@vitstudent.ac.in,IoT"}
                rows={8}
              />
            </label>
            <input
              type="text"
              placeholder="Department for this whole batch (optional)"
              value={bulkDept}
              onChange={(e) => setBulkDept(e.target.value)}
            />
            <button type="submit" className="editor-btn" disabled={bulking || !bulkText.trim()}>
              {bulking ? "Importing…" : "Import"}
            </button>
          </form>
        )}

        <input
          className="member-search"
          type="search"
          placeholder={`Search ${members?.length || 0} members by name, email or department…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {!members && !error && <p className="md-status">Loading…</p>}

        {members && (
          <div className="member-table">
            {filtered.length === 0 && <p className="md-status">No members match “{query}”.</p>}
            {filtered.map((m) => {
              const isSelf = m.collegeEmail === user.email;
              const manageable = canManage(m);
              const role = m.role || "member";
              return (
                <div className={`member-row${m.active ? "" : " is-inactive"}`} key={m._id}>
                  <div className="member-identity">
                    <strong>
                      {m.name}
                      {isSelf && <span className="member-you">you</span>}
                      <RoleBadge role={role} />
                      {!m.active && <span className="member-badge member-badge--off">inactive</span>}
                    </strong>
                    <span className="member-email">
                      {m.collegeEmail}
                      {m.department ? ` · ${m.department}` : ""}
                    </span>
                  </div>
                  <div className="member-actions">
                    {role !== "superadmin" && (
                      <button
                        type="button"
                        className="editor-cancel"
                        disabled={busyId === m._id || !manageable}
                        title={
                          isSelf
                            ? "You can't change your own role"
                            : !manageable
                            ? "You can only manage accounts below your own role"
                            : ""
                        }
                        onClick={() => patch(m._id, { role: role === "admin" ? "member" : "admin" })}
                      >
                        {role === "admin" ? "Make member" : "Make admin"}
                      </button>
                    )}

                    {/* Only a lead can hand out or take back the lead role. */}
                    {viewerRole === "superadmin" && !isSelf && (
                      <button
                        type="button"
                        className="editor-cancel"
                        disabled={busyId === m._id}
                        onClick={() =>
                          patch(m._id, { role: role === "superadmin" ? "admin" : "superadmin" })
                        }
                      >
                        {role === "superadmin" ? "Remove lead" : "Make lead"}
                      </button>
                    )}

                    <button
                      type="button"
                      className="editor-cancel"
                      disabled={busyId === m._id || !manageable}
                      title={
                        isSelf
                          ? "You can't deactivate yourself"
                          : !manageable
                          ? "You can only manage accounts below your own role"
                          : ""
                      }
                      onClick={() => patch(m._id, { active: !m.active })}
                    >
                      {m.active ? "Deactivate" : "Reactivate"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
