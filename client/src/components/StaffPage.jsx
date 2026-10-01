import { Navigate } from "react-router-dom";
import Header from "./Header";
import TopNav from "./TopNav";
import AdminNav from "./AdminNav";
import { useAuth } from "../context/AuthContext";
import { isStaff } from "../lib/roles";
import useDocumentTitle from "../hooks/useDocumentTitle";

// The frame every admin screen shares: the sign-in check, the staff gate, the
// heading and the admin tabs. The server enforces the same rule on every
// request; this only avoids showing a page that would just error.
export default function StaffPage({ title, intro, wide = false, children }) {
  useDocumentTitle(title);
  const { user, loading } = useAuth();

  if (loading) return <div className="hub-loading" aria-busy="true" />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <>
      <Header />
      <TopNav />
      <main id="main" className={`editor-wrap${wide ? " editor-wrap--wide" : ""}`}>
        <h1>{title}</h1>
        {isStaff(user.role) ? (
          <>
            <AdminNav />
            {intro && <p className="editor-note">{intro}</p>}
            {children}
          </>
        ) : (
          <div className="empty-state empty-state--boxed">
            <p>
              <strong>This page is for admins and leads.</strong>
            </p>
            <p className="md-status">If you think you should have access, ask a lead.</p>
          </div>
        )}
      </main>
    </>
  );
}
