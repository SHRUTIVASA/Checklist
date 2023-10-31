import React from "react";
import { Container } from "react-bootstrap";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import EmployeeDashboard from "./dashboards/EmployeeDashboard";
import TeamLeaderDashboard from "./dashboards/TeamLeaderDashboard";
import SupervisorDashboard from "./dashboards/SupervisorDashboard";
import UnitHeadDashboard from "./dashboards/UnitHeadDashboard";
import HeadDashboard from "./dashboards/HeadDashboard";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import Login from "./Login";
import Signup from "./Signup";
import ForgotPassword from "./ForgotPassword";
import AdminDashboard from "./dashboards/AdminDashboard";

function App() {
  return (
    // <Container
    //   className="d-flex align-items-center justify-content-center"
    //   style={{ minHeight: "100vh" }}
    // >
    // <div className="w-100" style={{ maxWidth: "400px" }}>
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* <Route path="/" element={<PrivateRoute />}> */}
            <Route path="/Dashboard" element={<DashboardRouter />} />
            <Route path="/EmployeeDashboard" element={<EmployeeDashboard />} />
            <Route
              path="/supervisors/:supervisorId/dashboard"
              element={<SupervisorDashboard />}
            />
            <Route
              path="/TeamLeaderDashboard"
              element={<TeamLeaderDashboard />}
            />
            <Route path="/UnitHeadDashboard" element={<UnitHeadDashboard />} />
            <Route path="/AdminDashboard" element={<AdminDashboard />} />
            <Route path="/HeadDashboard" element={<HeadDashboard />} />
          {/* </Route> */}
        </Routes>
      </AuthProvider>
    </Router>
    // </div>
    // </Container>
  );
}

function DashboardRouter() {
  const { currentUser } = useAuth();

  // Determine the user's role and render the appropriate dashboard
  if (currentUser.role === "Employee") {
    return <EmployeeDashboard />;
  } else if (currentUser.role === "Supervisor") {
    return <SupervisorDashboard />;
  } else if (currentUser.role === "TeamLeader") {
    return <TeamLeaderDashboard />;
  } else if (currentUser.role === "UnitHead") {
    return <UnitHeadDashboard />;
  } else if (currentUser.role === "Admin") {
    return <AdminDashboard />;
  } else if (currentUser.role === "Head") {
    return <HeadDashboard />;
  } else {
    return <div>Unknown role</div>;
  }
}

export default App;
