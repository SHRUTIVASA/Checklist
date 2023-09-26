import React, { useState, useEffect } from "react";
import { Form, Button } from "react-bootstrap";
import { getDocs, collection } from "firebase/firestore"; // Import Firestore functions
import { db } from "../firebase";

export default function AssignTeamLeader({ teamLeaders, onAssignTeamLeader }) {
  const [selectedUnitHead, setSelectedUnitHead] = useState("");
  const [selectedTeamleaders, setSelectedTeamleaders] = useState([]); 
  const [unitHeads, setUnitheads] = useState([]); 
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUnitheads = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "unitheads")); 
        const unitheadsData = querySnapshot.docs.map((doc) => ({
          uid: doc.id,
          ...doc.data(),
        }));

        setUnitheads(unitheadsData);
      } catch (error) {
        console.error("Error fetching unitheads:", error);
        setError("Error fetching unitheads. Please try again later.");
      }
    };

    fetchUnitheads();
  }, []);

  const handleCheckboxChange = (event) => {
    const { value } = event.target;
    setSelectedTeamleaders((prevSelectedTeamleaders) => {
      if (prevSelectedTeamleaders.includes(value)) {
        return prevSelectedTeamleaders.filter((uid) => uid !== value);
      } else {
        return [...prevSelectedTeamleaders, value];
      }
    });
  };

  const handleSubmit = () => {
    if (selectedUnitHead && selectedTeamleaders.length > 0) {
      // Call the onAssignSupervisor callback with the selected teamleader UID and selected unithead UIDs
      onAssignTeamLeader(selectedUnitHead, selectedTeamleaders);
    } else {
      setError("Please select a unithead and at least one teamleader.");
    }
  };

  return (
    <div>
      <Form>
        <Form.Group controlId="unitheads">
          <Form.Label>Select Unithead</Form.Label>
          <Form.Control
            as="select"
            value={selectedUnitHead}
            onChange={(e) => setSelectedUnitHead(e.target.value)}
          >
            <option value="">Select a Unithead</option>
            {unitHeads.map((unithead) => (
              <option key={unithead.uid} value={unithead.uid}>
                {unithead.name}
              </option>
            ))}
          </Form.Control>
        </Form.Group>

        <Form.Group controlId="teamleaders">
          <Form.Label>Select Teamleaders</Form.Label>
          {teamLeaders.map((teamLeader) => (
            <Form.Check
              key={teamLeader.uid}
              type="checkbox"
              id={teamLeader.uid}
              label={teamLeader.name}
              value={teamLeader.uid}
              checked={selectedTeamleaders.includes(teamLeader.uid)}
              onChange={handleCheckboxChange}
            />
          ))}
        </Form.Group>

        <Button variant="primary" onClick={handleSubmit}>
          Assign Teamleaders
        </Button>

        {error && <div className="text-danger mt-2">{error}</div>}
      </Form>
    </div>
  );
}
