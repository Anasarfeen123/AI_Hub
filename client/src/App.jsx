import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NavProvider } from "./context/NavContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollManager from "./components/ScrollManager";
import KeyboardShortcuts from "./components/KeyboardShortcuts";
import OfflineBanner from "./components/OfflineBanner";

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
const OverviewPage = lazy(() => import("./pages/OverviewPage"));
const CommentsAdminPage = lazy(() => import("./pages/CommentsAdminPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const NotesPage = lazy(() => import("./pages/NotesPage"));
const HelpWantedPage = lazy(() => import("./pages/HelpWantedPage"));
const SuggestionsPage = lazy(() => import("./pages/SuggestionsPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const LinksPage = lazy(() => import("./pages/LinksPage"));

function member(element) {
  return <ProtectedRoute>{element}</ProtectedRoute>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NavProvider>
          <ScrollManager />
          <KeyboardShortcuts />
          <OfflineBanner />
          <Suspense fallback={<div className="hub-loading" aria-busy="true" />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={member(<Home />)} />
              <Route path="/admin" element={member(<ChangesPage />)} />
              <Route path="/admin/pages" element={member(<PagesAdmin />)} />
              <Route path="/admin/members" element={member(<MembersPage />)} />
              <Route path="/admin/overview" element={member(<OverviewPage />)} />
              <Route path="/admin/comments" element={member(<CommentsAdminPage />)} />
              <Route path="/admin/suggestions" element={member(<SuggestionsPage />)} />
              <Route path="/admin/analytics" element={member(<AnalyticsPage />)} />
              <Route path="/admin/links" element={member(<LinksPage />)} />
              <Route path="/me" element={member(<ProfilePage />)} />
              <Route path="/notes" element={member(<NotesPage />)} />
              <Route path="/help-wanted" element={member(<HelpWantedPage />)} />
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
