import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Center, Loader } from "@mantine/core";
import Login from "./pages/Login";
import Register from "./pages/Register";
import WorkerDashboard from "./pages/WorkerDahboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

export default function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <Center h="100vh"><Loader size="xl" /></Center>;

  return (
    <Routes>
      <Route path="/" element={
        user
          ? user.role === "admin" ? <Navigate to="/admin" replace /> : <Navigate to="/worker" replace />
          : <Navigate to="/login" replace />
      } />
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/worker"   element={<ProtectedRoute role="worker"><WorkerDashboard /></ProtectedRoute>} />
      <Route path="/admin"    element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="*"         element={<Navigate to="/" replace />} />
    </Routes>
  );
}
