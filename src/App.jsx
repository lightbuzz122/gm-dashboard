import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DataEntry from "./pages/DataEntry";
import CategoryPage from "./pages/CategoryPage";
import Admin from "./pages/Admin";
import Tasks from "./pages/Tasks";
import Compliance from "./pages/Compliance";
import ComingSoon from "./pages/ComingSoon";

function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#0a0e17] flex items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }
  // TEMPORARY: login requirement disabled for a demo — see comment below.
  // if (!session) return <Navigate to="/login" replace />;
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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
