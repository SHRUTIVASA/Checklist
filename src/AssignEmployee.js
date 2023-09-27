import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";

export default function AssignEmployee({ supervisors, employees, onAssignEmployee }) {
  const [selectedSupervisor, setSelectedSupervisor] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [error, setError] = useState(""); // State to display an error message if needed

  const handleCheckboxChange = (event) => {
    const { value } = event.target;
    setSelectedEmployees((prevSelectedEmployees) => {
      if (prevSelectedEmployees.includes(value)) {
        return prevSelectedEmployees.filter((uid) => uid !== value);
      } else {
        return [...prevSelectedEmployees, value];
      }
    });
  };

  const handleSubmit = () => {
    if (selectedSupervisor && selectedEmployees.length > 0) {
      // Call the onAssignEmployee callback with the selected supervisor UID and selected employee UIDs
      onAssignEmployee(selectedSupervisor, selectedEmployees);
    } else {
      setError("Please select a supervisor and at least one employee.");
    }
  };

  return (
    <div>
      <Form>
        <Form.Group controlId="supervisor">
          <Form.Label>Select Supervisor</Form.Label>
          <Form.Control
            as="select"
            value={selectedSupervisor}
            onChange={(e) => setSelectedSupervisor(e.target.value)}
          >
            <option value="">Select a Supervisor</option>
            {supervisors.map((supervisor) => (
              <option key={supervisor.uid} value={supervisor.uid}>
                {supervisor.name}
              </option>
            ))}
          </Form.Control>
        </Form.Group>

        <Form.Group controlId="employees">
          <Form.Label>Select Employees</Form.Label>
          {employees.map((employee) => (
            <Form.Check
              key={employee.uid}
              type="checkbox"
              id={employee.uid}
              label={employee.name}
              value={employee.uid}
              checked={selectedEmployees.includes(employee.uid)}
              onChange={handleCheckboxChange}
            />
          ))}
        </Form.Group>

        <Button variant="primary" onClick={handleSubmit}>
          Assign Employees
        </Button>

        {error && <div className="text-danger mt-2">{error}</div>}
      </Form>
    </div>
  );
}
