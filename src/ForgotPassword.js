import React, { useState, useContext } from "react";
import {
  Form,
  Button,
  Card,
  Alert,
  Container,
  Row,
  Col,
} from "react-bootstrap";
import { useAuth } from "./contexts/AuthContext";
import { Link } from "react-router-dom";
import Vector from "./assets/Forgot_Password4.png";

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setMessage("");
      setError("");
      setLoading(true);
      await resetPassword(email);
      setMessage("Check your inbox for further instructions");
    } catch {
      setError("Failed to reset password");
    }

    setLoading(false);
  }

  return (
    <Container fluid>
    <Row className="min-vh-100 flex-column flex-md-row justify-content-center align-items-center">
    {/* Left side (vector) */}
    <Col
      md={6}
      className="d-flex align-items-center justify-content-center"
    >
      <div>
        {/* Place your vector image or component here */}
        <img src={Vector} alt="Vector" className="img-fluid" />
      </div>
    </Col>
            {/* Right side (login card) */}
            <Col md={4} className="d-flex align-items-center">
            <div className="p-4 w-100">
      <Card>
        <Card.Body>
          <h2 className="text-center mb-4">Password Reset</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {message && <Alert variant="success">{message}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group id="email">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>
            <div style={{ marginTop: '10px' }}>
            <Button
              disabled={loading}
              className="w-100"
              type="submit"
              onClick={handleSubmit}
            >
              Reset Password
            </Button>
            </div>
          </Form>
          <div className="w-100 text-center mt-3">
            <Link to="/">Login</Link>
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
}
