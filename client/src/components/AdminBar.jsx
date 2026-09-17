import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isStaff } from "../lib/roles";

// One way in to member management, above the nav. Admins and leads only —
// plain members get nothing rendered at all.
export default function AdminBar() {
  const { user } = useAuth();
  if (!isStaff(user?.role)) return null;

  return (
    <div className="adminbar">
      <Link to="/admin/members" className="adminbar-btn">
        Manage members
      </Link>
    </div>
  );
}
