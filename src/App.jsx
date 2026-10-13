import { BrowserRouter, HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DataEntry from "./pages/DataEntry";
import CategoryPage from "./pages/CategoryPage";
import Admin from "./pages/Admin";
import Tasks from "./pages/Tasks";
import Compliance from "./pages/Compliance";
import ComingSoon from "./pages/ComingSoon";
import { DEMO } from "./config";

function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#0a0e17] flex items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }
  // DEMO is only true in the local design-preview build, never in the live app.
  if (!session && !DEMO) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/entry" element={<ProtectedRoute><DataEntry /></ProtectedRoute>} />
      <Route path="/category/:category" element={<ProtectedRoute><CategoryPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
      <Route path="/compliance" element={<ProtectedRoute><Compliance /></ProtectedRoute>} />
      <Route path="/coming-soon" element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />
    </Routes>
  );
}

// The standalone design preview is opened as a plain file, so it needs hash
// routing. The live app always uses normal browser routing.
const Router = DEMO ? HashRouter : BrowserRouter;

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
