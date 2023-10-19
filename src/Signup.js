import React, { useState } from "react";
import { Form, Button, Card, Alert, Container, Col, Row } from "react-bootstrap";
import { useAuth } from "./contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { doc, setDoc, collection, addDoc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { db } from "./firebase"; 
import Vector from './assets/vector.jpg';

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setpasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Employee");
  const { signup } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const Navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== passwordConfirm) {
      return setError("Passwords do not match");
    }

    try {
      setError("");
      setLoading(true);

      // Create a new user account
      const userCredential = await signup(email, password);
      const user = userCredential.user;

      // Determine the Firestore collection based on the selected role
      let userCollection;
      if (role === "Employee") {
        userCollection = collection(db, "employees");
      } else if (role === "Supervisor") {
        userCollection = collection(db, "supervisors");
      } else if (role === "TeamLeader") {
        userCollection = collection(db, "teamleaders");
      } else if (role === "UnitHead") {
        userCollection = collection(db, "unitheads");
      } else if (role === "Head") {
        userCollection = collection(db, "heads");
      } else {
        // Handle other roles here
        userCollection = collection(db, "otherCollection");
      }

      // After successfully creating the user account, add user data to the Firestore collection
      const userDocData = {
        name: name,
        email: email,
        role: role,
        uid: user.uid, // You can set the role as needed
        tasks: [] // Initialize tasks as an empty array
      };

      // Add the user data to Firestore
      const userDocRef = doc(userCollection, user.uid);
      await setDoc(userDocRef, userDocData); // Set the user document data

      console.log("User added with ID: ", user.uid);

      if (role === "Head") {
        await updateAdminDocument(user.uid);
      }

// Function to update the admin document with the user's UID
async function updateAdminDocument(userUID) {
  try {
    const adminDocRef = doc(db, "admin", "Vh5meuRE7VnxvufEkpkX"); 
    const adminDocSnapshot = await getDoc(adminDocRef);

    if (adminDocSnapshot.exists()) {
      // If the admin document exists, update it by adding the user's UID to the 'assigned' array
      const adminData = adminDocSnapshot.data();
      const assignedArray = adminData.assigned || [];
      assignedArray.push(userUID);

      await updateDoc(adminDocRef, {
        assigned: assignedArray // Update the 'assigned' array with the user's UID
      });

      console.log("User added to admin document: ", userUID);
    } else {
      // If the admin document doesn't exist, create it and set the 'assigned' array
      await setDoc(adminDocRef, {
        assigned: [userUID] // Create the 'assigned' array with the user's UID
      });

      console.log("Admin document created with user: ", userUID);
    }
  } catch (error) {
    console.error("Error updating/admin document:", error);
  }
}


      if (role === "Employee") {
        Navigate("/EmployeeDashboard");
      } else if (role === "Supervisor") {
        Navigate("/SupervisorDashboard");
      } else if (role === "TeamLeader") {
        Navigate("/TeamLeaderDashboard");
      } else if (role === "UnitHead") {
        Navigate("/UnitHeadDashboard");
      }else if (role === "Head") {
        Navigate("/HeadDashboard");
      }

    } catch (error) {
      if (error.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else if (error.code === "auth/email-already-in-use") {
        setError("Email address is already in use.");
      } else if (error.code === "auth/weak-password") {
        setError("Password is too weak.");
      } else {
        setError("Failed to create an account. Please try again later.");
      }
      console.error("Signup error:", error);
    }

    setLoading(false);
  }

  return (
    <Container fluid>
      <Row className="min-vh-100 flex-column flex-md-row justify-content-center align-items-center">
        {/* Left side (vector) */}
        <Col md={6} className="d-flex align-items-center justify-content-center">
          <div>
            <img src={Vector} alt="Vector" className="img-fluid" />
          </div>
        </Col>

        {/* Right side (signup card) */}
        <Col md={4} className="d-flex align-items-center">
          <div className="p-4 w-100">
            <Card>
              <Card.Body>
                <h2 className="text-center mb-4">Sign Up</h2>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                  <Form.Group id="name">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Your Name"
                      onChange={(e) => setName(e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group id="email">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Email address"
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group id="role">
                    <Form.Label>Select Role</Form.Label>
                    <Form.Control
                      as="select"
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="Employee">Employee</option>
                      <option value="Supervisor">Supervisor</option>
                      <option value="TeamLeader">Team Leader</option>
                      <option value="UnitHead">Unit Head</option>
                      <option value="Head">Head</option>
                    </Form.Control>
                  </Form.Group>

                  <Form.Group id="password">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Password"
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group id="password-confirm">
                    <Form.Label>Password Confirmation</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Confirm Password"
                      onChange={(e) => setpasswordConfirm(e.target.value)}
                    />
                  </Form.Group>

                  <Button disabled={loading} className="w-100 mt-3" type="submit">
                    Sign Up
                  </Button>
                </Form>

                <div className="w-100 text-center mt-3">
                  <Link to="/forgot-password">Forgot Password?</Link>
                </div>
              </Card.Body>
            </Card>

            <div className="w-100 text-center mt-2">
              Already have an account? <Link to="/login">Log In</Link>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
