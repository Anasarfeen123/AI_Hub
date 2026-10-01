import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NavProvider } from "./context/NavContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollManager from "./components/ScrollManager";

// Each screen is its own chunk, so a member opening a page doesn't download
// the admin tools, and the signed-out landing page stays small.
const Login = lazy(() => import("./pages/Login"));
const Home = lazy(() => import("./pages/Home"));
const ContentPage = lazy(() => import("./pages/ContentPage"));
const EditPage = lazy(() => import("./pages/EditPage"));
const ChangesPage = lazy(() => import("./pages/ChangesPage"));
const MembersPage = lazy(() => import("./pages/MembersPage"));
const PagesAdmin = lazy(() => import("./pages/PagesAdmin"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const SavedPage = lazy(() => import("./pages/SavedPage"));

function member(element) {
  return <ProtectedRoute>{element}</ProtectedRoute>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NavProvider>
          <ScrollManager />
          <Suspense fallback={<div className="hub-loading" aria-busy="true" />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={member(<Home />)} />
              <Route path="/admin" element={member(<ChangesPage />)} />
              <Route path="/admin/pages" element={member(<PagesAdmin />)} />
              <Route path="/admin/members" element={member(<MembersPage />)} />
              <Route path="/contributors" element={member(<LeaderboardPage />)} />
              <Route path="/my-edits" element={member(<ChangesPage mine />)} />
              <Route path="/saved" element={member(<SavedPage />)} />
              <Route path="/edit/*" element={member(<EditPage />)} />
              <Route path="/*" element={member(<ContentPage />)} />
            </Routes>
          </Suspense>
        </NavProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
