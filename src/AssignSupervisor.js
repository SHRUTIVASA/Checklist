import React, { useState, useEffect } from "react";
import { Form, Button } from "react-bootstrap";
import { getDocs, collection } from "firebase/firestore"; // Import Firestore functions
import { db } from "./firebase";

export default function AssignSupervisor({ supervisors, onAssignSupervisor }) {
  const [selectedTeamleader, setSelectedTeamleader] = useState("");
  const [selectedSupervisors, setSelectedSupervisors] = useState([]);
  const [teamLeaders, setTeamLeaders] = useState([]); // State to store teamleaders
  const [error, setError] = useState(""); // State to display an error message if needed

  // Fetch teamleaders from Firestore when the component mounts
  useEffect(() => {
    const fetchTeamleaders = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "teamleaders"));

        const teamleadersData = querySnapshot.docs.map((doc) => ({
          uid: doc.id,
          ...doc.data(),
        }));

        setTeamLeaders(teamleadersData);
      } catch (error) {
        console.error("Error fetching teamleaders:", error);
        setError("Error fetching teamleaders. Please try again later.");
      }
    };

    fetchTeamleaders();
  }, []);

  const handleCheckboxChange = (event) => {
    const { value } = event.target;
    setSelectedSupervisors((prevSelectedSupervisors) => {
      if (prevSelectedSupervisors.includes(value)) {
        return prevSelectedSupervisors.filter((uid) => uid !== value);
      } else {
        return [...prevSelectedSupervisors, value];
      }
    });
  };

  const handleSubmit = () => {
    if (selectedTeamleader && selectedSupervisors.length > 0) {
      // Call the onAssignSupervisor callback with the selected teamleader UID and selected supervisor UIDs
      onAssignSupervisor(selectedTeamleader, selectedSupervisors);
    } else {
      setError("Please select a teamleader and at least one supervisor.");
    }
  };

  return (
    <div>
      <Form>
        <Form.Group controlId="teamleaders">
          <Form.Label>Select Teamleader</Form.Label>
          <Form.Control
            as="select"
            value={selectedTeamleader}
            onChange={(e) => setSelectedTeamleader(e.target.value)}
          >
            <option value="">Select a Teamleader</option>
            {teamLeaders.map((teamLeader) => (
              <option key={teamLeader.uid} value={teamLeader.uid}>
                {teamLeader.name}
              </option>
            ))}
          </Form.Control>
        </Form.Group>

        <Form.Group controlId="supervisors">
          <Form.Label>Select Supervisors</Form.Label>
          {supervisors.map((supervisor) => (
            <Form.Check
              key={supervisor.uid}
              type="checkbox"
              id={supervisor.uid}
              label={supervisor.name}
              value={supervisor.uid}
              checked={selectedSupervisors.includes(supervisor.uid)}
              onChange={handleCheckboxChange}
            />
          ))}
        </Form.Group>

        <Button variant="primary" onClick={handleSubmit}>
          Assign Supervisors
        </Button>

        {error && <div className="text-danger mt-2">{error}</div>}
      </Form>
    </div>
  );
}
