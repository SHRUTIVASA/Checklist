import React, { useEffect, useState } from 'react'
import { Col, Row, Form, Container, Card, Image, Alert, Button } from 'react-bootstrap'
import { useAuth } from "./contexts/AuthContext"
import { db } from "./firebase"
import { Link, useNavigate, useLocation } from "react-router-dom"
import {
    doc,
    updateDoc,
    collection,
    addDoc,
    getDocs,
    getDoc,
    writeBatch,
  } from "firebase/firestore";
  import ProfileVector from "./assets/profile.jpg";
  import { getAuth, updatePassword } from 'firebase/auth'


function UserProfile() {
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    // const [userData, setUserData] = useState([])
    const [name, setName] = useState("")
    const [phone, setPhone] = useState("")
    const [address, setAddress] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    const navigate = useNavigate()
    const location = useLocation()
    
    const userData = location.state.userData

    const auth = getAuth();

    console.log(auth.currentUser)

    const updatePasswordHandler = async (e) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            setLoading(false)
            return
        }

        try {
            await updatePassword(auth.currentUser, password)
            setPassword("")
            setConfirmPassword("")
            alert("Password updated successfully")
        }
        catch (error) {
            setError(error.message)
        }
        setLoading(false)
    }

    // console.log(userData)

    const getUserData = async () => {
        try {
            if (userData.role === "Employee") {
                const employeeRef = doc(db, "employees", userData.uid);
                const employeeDoc = await getDoc(employeeRef);
                if (employeeDoc.exists()) {
                    setName(employeeDoc.data().name)
                    setPhone(employeeDoc.data().phone)
                    setAddress(employeeDoc.data().address)
                }
            }
            else if (userData.role === "Admin") {
                const adminRef = doc(db, "admin", userData.uid);
                const adminDoc = await getDoc(adminRef);
                if (adminDoc.exists()) {
                    setName(adminDoc.data().name)
                    setPhone(adminDoc.data().phone)
                    setAddress(adminDoc.data().address)
                }
            }
            else if (userData.role === "Supervisor") {
                const supervisorRef = doc(db, "supervisors", userData.uid);
                const supervisorDoc = await getDoc(supervisorRef);
                if (supervisorDoc.exists()) {
                    setName(supervisorDoc.data().name)
                    setPhone(supervisorDoc.data().phone)
                    setAddress(supervisorDoc.data().address)
                }
            }
            else if (userData.role === "TeamLeader") {
                const teamLeaderRef = doc(db, "teamLeaders", userData.uid);
                const teamLeaderDoc = await getDoc(teamLeaderRef);
                if (teamLeaderDoc.exists()) {
                    setName(teamLeaderDoc.data().name)
                    setPhone(teamLeaderDoc.data().phone)
                    setAddress(teamLeaderDoc.data().address)
                }
            }
            else if (userData.role === "UnitHead") {
                const unitHeadRef = doc(db, "unitHeads", userData.uid);
                const unitHeadDoc = await getDoc(unitHeadRef);
                if (unitHeadDoc.exists()) {
                    setName(unitHeadDoc.data().name)
                    setPhone(unitHeadDoc.data().phone)
                    setAddress(unitHeadDoc.data().address)
                }
            }
            else if (userData.role === "Head") {
                const headRef = doc(db, "heads", userData.uid);
                const headDoc = await getDoc(headRef);
                if (headDoc.exists()) {
                    setName(headDoc.data().name)
                    setPhone(headDoc.data().phone)
                    setAddress(headDoc.data().address)
                }
            }
            else {
                setError("Error updating profile")
                setLoading(false)
                return
            }
        }
        catch (error) {
            setError(error.message)
        }
    }

    useEffect(() => {
        getUserData()
    }
    , [])

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (password !== '' && confirmPassword !== '') {
            if (password !== confirmPassword) {
                setError("Passwords do not match")
                setLoading(false)
                return
            }
            try {
                updatePassword(auth.currentUser, password)
                setPassword("")
                setConfirmPassword("")
                alert("Password updated successfully")
                navigate("/")
            }
            catch (error) {
                setError(error.message)
            }
        }

        try {
            setError("")
            setLoading(true)

            if (userData.role === "Employee") {
                const employeeRef = doc(db, "employees", userData.uid);
                await updateDoc(employeeRef, {
                    name: name,
                    phone: phone,
                    address: address
                });
            }
            else if (userData.role === "Admin") {
                const adminRef = doc(db, "admin", userData.uid);
                await updateDoc(adminRef, {
                    name: name,
                    phone: phone,
                    address: address
                });
            }
            else if (userData.role === "Supervisor") {
                const supervisorRef = doc(db, "supervisors", userData.uid);
                await updateDoc(supervisorRef, {
                    name: name,
                    phone: phone,
                    address: address
                });
            }
            else if (userData.role === "TeamLeader") {
                const teamLeaderRef = doc(db, "teamLeaders", userData.uid);
                await updateDoc(teamLeaderRef, {
                    name: name,
                    phone: phone,
                    address: address
                });
            }
            else if (userData.role === "UnitHead") {
                const unitHeadRef = doc(db, "unitHeads", userData.uid);
                await updateDoc(unitHeadRef, {
                    name: name,
                    phone: phone,
                    address: address
                });
            }
            else if (userData.role === "Head") {
                const headRef = doc(db, "heads", userData.uid);
                await updateDoc(headRef, {
                    name: name,
                    phone: phone,
                    address: address
                });
            }
            else {
                setError("Error updating profile")
                setLoading(false)
                return
            }
            handleNavigation()
        }
        catch (error) {
            setError(error.message)
        }
        setLoading(false)
    }

    const handleNavigation = () => {
        if (userData.role === "Employee") {
            navigate("/EmployeeDashboard")
        }
        else if (userData.role === "Admin") {
            navigate("/AdminDashboard")
        }
        else if (userData.role === "Supervisor") {
            navigate(`/supervisors/${userData.uid}/dashboard`)
        }
        else if (userData.role === "TeamLeader") {
            navigate("/TeamLeaderDashboard")
        }
        else if (userData.role === "UnitHead") {
            navigate("/UnitHeadDashboard")
        }
        else if (userData.role === "Head") {
            navigate("/HeadDashboard")
        }
        else {
            setError("Error updating profile")
            setLoading(false)
            return
        }
    }

  return (
    <>
    <Container fluid>
      <Row className="min-vh-100 flex-column flex-md-row justify-content-center align-items-center">
        {/* Left side (vector) */}
        <Col
          md={6}
          className="d-flex align-items-center justify-content-center"
        >
          <div>
            {/* Place your vector image or component here */}
            <img src={ProfileVector} alt="Vector" className="img-fluid" />
          </div>
        </Col>

        {/* Right side (login card) */}
        <Col md={4} className="d-flex align-items-center">
        <div className="p-4 w-100">
        <Card>
            <Card.Body>
                <h2 className="text-center mb-4">Update Profile</h2>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group id="name">
                        <Form.Label>Name</Form.Label>
                        <Form.Control
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        />
                    </Form.Group>
                    <Form.Group id="phone">
                        <Form.Label>Phone</Form.Label>
                        <Form.Control type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                    </Form.Group>
                    <Form.Group id="address">
                        <Form.Label>Address</Form.Label>
                        <Form.Control type="text" value={address} onChange={(e) => setAddress(e.target.value)} required />
                    </Form.Group>
                    <Form.Group id="password">
                        <Form.Label>Password</Form.Label>
                        <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </Form.Group>
                    <Form.Group id="confirm-password" className='mb-2'>
                        <Form.Label>Confirm Password</Form.Label>
                        <Form.Control type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </Form.Group>
                    <Button disabled={loading} className="w-100" type="submit">Update</Button>
                </Form>
            </Card.Body>
        </Card>
        <div className="w-100 text-center mt-2">
            <Button variant="link" onClick={handleNavigation}>Cancel</Button>
        </div>
        </div>
        </Col>
        </Row>
    </Container>
    </>
  )
}

export default UserProfile