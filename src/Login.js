import React, { useState } from "react";
import { Form, Button, Card, Alert, Container, Row, Col } from "react-bootstrap";
import { useAuth } from "./contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore"; // Import Firestore functions for querying documents
import { db } from "./firebase";
import Vector from './assets/vector.jpg';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(""); // Add state for the user's role
  const { login, currentUser } = useAuth(); // Get the currentUser from AuthContext
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const Navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);

      // Call the login function with email and password
      await login(email, password);

      // Redirect to the respective dashboard based on the selected role
      if (currentUser) {
        // Ensure the user has selected a role
        if (!role) {
          setError("Please select a role.");
          setLoading(false);
          return;
        }

        const userRole = role; // Use the selected role

        if (userRole === "Employee") {
          Navigate("/EmployeeDashboard");
        }else if (userRole === "Admin") {
          Navigate("/AdminDashboard");
        }else if (userRole === "Supervisor") {
          Navigate("/supervisors/${supervisorId}/dashboard");
        } else if (userRole === "TeamLeader") {
          Navigate("/TeamLeaderDashboard");
        } else if (userRole === "UnitHead") {
          Navigate("/UnitHeadDashboard");
        }else if (userRole === "Head") {
          Navigate("/HeadDashboard");
        }

        // Fetch tasks based on the user's role and store them in the state
        const tasksCollection = collection(db, userRole); // Adjust the collection name as needed

        const q = query(tasksCollection, where("assignedTo", "array-contains", currentUser.uid));
        const querySnapshot = await getDocs(q);

        const tasksData = [];
        querySnapshot.forEach((doc) => {
          tasksData.push(doc.data());
        });

        // Now, 'tasksData' contains the tasks assigned to the user
        // You can set it in your state or perform any other actions
      }
    } catch (error) {
      setError(error.message);
    }

    setLoading(false);
  }
  return (
    <Container fluid>
      <Row className="min-vh-100 flex-column flex-md-row justify-content-center align-items-center">
        {/* Left side (vector) */}
        <Col md={6} className="d-flex align-items-center justify-content-center">
          <div>
            {/* Place your vector image or component here */}
            <img src={ Vector } alt="Vector" className="img-fluid" />
          </div>
        </Col>

        {/* Right side (login card) */}
        <Col md={4} className="d-flex align-items-center">
          <div className="p-4 w-100">
            <Card>
              <Card.Body>
                <h2 className="text-center mb-4">Log In</h2>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                  <Form.Group id="role">
                    <Form.Label>Role</Form.Label>
                    <Form.Control
                      as="select"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="select">Please select a role</option>
                      <option value="Admin">Admin</option>
                      <option value="Employee">Employee</option>
                      <option value="Supervisor">Supervisor</option>
                      <option value="TeamLeader">Team Leader</option>
                      <option value="UnitHead">Unit Head</option>
                      <option value="Head">Head</option>
                    </Form.Control>
                  </Form.Group>
                  <Form.Group id="email">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Email address"
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group id="password">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Password"
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </Form.Group>
                  <Button disabled={loading} className="w-100 mt-3" type="submit">
                    Log In
                  </Button>
                </Form>
                <div className="w-100 text-center mt-3">
                  <Link to="/forgot-password">Forgot Password?</Link>
                </div>
              </Card.Body>
            </Card>
            <div className="w-100 text-center mt-2">
              Need an account? <Link to="/signup">Sign Up</Link>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
