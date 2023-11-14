import React, { useEffect, useState } from 'react'
import { Col, Row, Form, Container, Card, Image, Alert, Button } from 'react-bootstrap'
import { useAuth } from "./contexts/AuthContext"
import { db } from "./firebase"
import { Link, useNavigate } from "react-router-dom"
import {
    doc,
    updateDoc,
    collection,
    addDoc,
    getDocs,
    getDoc,
    writeBatch,
  } from "firebase/firestore";


function UserProfile() {
    const { currentUser } = useAuth()
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [userData, setUserData] = useState([])
    const [name, setName] = useState("")
    const [phone, setPhone] = useState("")
    const [address, setAddress] = useState("")

    const navigate = useNavigate()

    useEffect(() => {
        const fetchData = async () => {
            const data = await db.collection("users").doc(currentUser.uid).get()
            setUserData(data.data())
        }
        fetchData()
    }
    , [])

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            setError("")
            setLoading(true)
            await updateDoc(doc(db, "users", currentUser.uid), {
                name: name,
                phone: phone,
                address: address
            })
            navigate("/Dashboard")
        } catch {
            setError("Failed to update profile")
        }
        setLoading(false)
    }
  return (
    <>
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
        <div className="w-100" style={{ maxWidth: "400px" }}>
        <Card>
            <Card.Body>
                <h2 className="text-center mb-4">Update Profile</h2>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group id="name">
                        <Form.Label>Name</Form.Label>
                        <Form.Control type="text" defaultValue={userData.name} onChange={(e) => setName(e.target.value)} required />
                    </Form.Group>
                    <Form.Group id="phone">
                        <Form.Label>Phone</Form.Label>
                        <Form.Control type="text" defaultValue={userData.phone} onChange={(e) => setPhone(e.target.value)} required />
                    </Form.Group>
                    <Form.Group id="address">
                        <Form.Label>Address</Form.Label>
                        <Form.Control type="text" defaultValue={userData.address} onChange={(e) => setAddress(e.target.value)} required />
                    </Form.Group>
                    <Button disabled={loading} className="w-100" type="submit">Update</Button>
                </Form>
            </Card.Body>
        </Card>
        <div className="w-100 text-center mt-2">
            <Link to="/Dashboard">Cancel</Link>
        </div>
        </div>
    </Container>
    </>
  )
}

export default UserProfile