import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import EvaluatorQueue from "./pages/EvaluatorQueue";
import CreditOfficePosting from "./pages/CreditOfficePosting";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import UploadTranscript from "./pages/UploadTranscript";
import type { Role } from "./types";
import { homeFor } from "./utils/routes";

function Protected({ role, children }: { role: Role; children: ReactElement }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}

function Home() {
  const { user } = useAuth();
  return <Navigate to={user ? homeFor(user.role) : "/login"} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/student"
        element={
          <Protected role="student">
            <StudentDashboard />
          </Protected>
        }
      />
      <Route
        path="/student/upload"
        element={
          <Protected role="student">
            <UploadTranscript />
          </Protected>
        }
      />
      <Route
        path="/evaluator"
        element={
          <Protected role="evaluator">
            <EvaluatorQueue />
          </Protected>
        }
      />
      <Route
        path="/office"
        element={
          <Protected role="credit_office">
            <CreditOfficePosting />
          </Protected>
        }
      />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
