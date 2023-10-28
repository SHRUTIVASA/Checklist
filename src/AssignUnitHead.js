import React, { useState, useEffect } from "react";
import { Form, Button } from "react-bootstrap";
import { getDocs, collection } from "firebase/firestore"; // Import Firestore functions
import { db } from "./firebase";

export default function AssignUnitHead({ unitHeads, onAssignUnitHead }) {
  const [selectedHead, setSelectedHead] = useState("");
  const [selectedUnitheads, setSelectedUnitheads] = useState([]); // Updated state variable name
  const [heads, setHeads] = useState([]); // Updated state variable name
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchHeads = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "heads"));
        const headsData = querySnapshot.docs.map((doc) => ({
          uid: doc.id,
          ...doc.data(),
        }));

        setHeads(headsData); // Updated state variable name
      } catch (error) {
        console.error("Error fetching heads:", error);
        setError("Error fetching heads. Please try again later.");
      }
    };

    fetchHeads();
  }, []);

  const handleCheckboxChange = (event) => {
    const { value } = event.target;
    setSelectedUnitheads((prevSelectedUnitheads) => {
      if (prevSelectedUnitheads.includes(value)) {
        return prevSelectedUnitheads.filter((uid) => uid !== value);
      } else {
        return [...prevSelectedUnitheads, value];
      }
    });
  };

  const handleSubmit = () => {
    if (selectedHead && selectedUnitheads.length > 0) {
      // Call the onAssignUnitHead callback with the selected head UID and selected unithead UIDs
      onAssignUnitHead(selectedHead, selectedUnitheads);
    } else {
      setError("Please select a head and at least one unithead.");
    }
  };

  return (
    <div>
      <Form>
        <Form.Group controlId="heads">
          <Form.Label>Select Head</Form.Label>
          <Form.Control
            as="select"
            value={selectedHead}
            onChange={(e) => setSelectedHead(e.target.value)}
          >
            <option value="">Select a Head</option>
            {heads.map((head) => (
              <option key={head.uid} value={head.uid}>
                {head.name}
              </option>
            ))}
          </Form.Control>
        </Form.Group>

        <Form.Group controlId="unitheads">
          <Form.Label>Select Unitheads</Form.Label>
          {unitHeads.map((unithead) => (
            <Form.Check
              key={unithead.uid}
              type="checkbox"
              id={unithead.uid}
              label={unithead.name}
              value={unithead.uid}
              checked={selectedUnitheads.includes(unithead.uid)}
              onChange={handleCheckboxChange}
            />
          ))}
        </Form.Group>

        <Button variant="primary" onClick={handleSubmit}>
          Assign Unitheads
        </Button>
        {successMessage && (
          <div className="text-success mt-2">{successMessage}</div>
        )}
        {errorMessage && <div className="text-danger mt-2">{errorMessage}</div>}
      </Form>
    </div>
  );
}
