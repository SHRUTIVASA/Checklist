import React, { useState, useEffect } from "react";
import { Card, Button, Alert, Form } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { doc, updateDoc, collection, getDocs, getDoc, arrayUnion, query, where, } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';

export default function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [unitheads, setunitheads] = useState([]);
  const [heads, setHeads] = useState([]);
  const [TeamLeaders, setTeamLeaders] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    project: "",
    task: "",
    subtask: "",
    members: "",
    status: "",
    heads: [],
    unitheads: [],
    TeamLeaders: [],
    supervisors: [],
    employees: [],
    endDate: "",
    priority: "low",
  });


  useEffect(() => {
    const fetchHeads = async () => {
      try {
        const HeadsCollectionRef = collection(db, "heads");
        const querySnapshot = await getDocs(HeadsCollectionRef);
        const HeadsData = querySnapshot.docs.map((doc) => {
          return { id: doc.id, ...doc.data() };
        });
        setHeads(HeadsData);
      } catch (err) {
        console.error("Fetch unit heads error", err);
      }
    };

    const fetchunitheads = async () => {
      try {
        const unitheadsCollectionRef = collection(db, "unitheads");
        const querySnapshot = await getDocs(unitheadsCollectionRef);
        const unitheadsData = querySnapshot.docs.map((doc) => {
          return { id: doc.id, ...doc.data() };
        });
        setunitheads(unitheadsData);
      } catch (err) {
        console.error("Fetch unit heads error", err);
      }
    };

    const fetchTeamLeaders = async () => {
      try {
        const TeamLeadersCollectionRef = collection(db, "teamleaders");
        const querySnapshot = await getDocs(TeamLeadersCollectionRef);
        const TeamLeadersData = querySnapshot.docs.map((doc) => {
          return { id: doc.id, ...doc.data() };
        });
        setTeamLeaders(TeamLeadersData);
      } catch (err) {
        console.error("Fetch team leaders error", err);
      }
    };

    const fetchSupervisors = async () => {
      try {
        const supervisorsCollectionRef = collection(db, "supervisors");
        const querySnapshot = await getDocs(supervisorsCollectionRef);
        const supervisorsData = querySnapshot.docs.map((doc) => {
          return { id: doc.id, ...doc.data() };
        });
        setSupervisors(supervisorsData);
      } catch (err) {
        console.error("Fetch supervisors error", err);
      }
    };

    const fetchEmployees = async () => {
      try {
        const employeesCollectionRef = collection(db, "employees");
        const querySnapshot = await getDocs(employeesCollectionRef);
        const employeesData = querySnapshot.docs.map((doc) => {
          return { id: doc.id, ...doc.data() };
        });
        setEmployees(employeesData);
      } catch (err) {
        console.error("Fetch employees error", err);
      }
    };

    fetchHeads();
    fetchunitheads();
    fetchTeamLeaders();
    fetchSupervisors();
    fetchEmployees();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "heads" || name === "unitheads" || name === "TeamLeaders" || name === "supervisors" || name === "employees") {
      // If the input name is one of these arrays, update it with an array of names
      setFormData({
        ...formData,
        [name]: [...formData[name], value], // Concatenate the selected names
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    const taskId = uuidv4();
    // Create a new task object with the form data
    const newTask = {
      taskId,
      project: formData.project,
      task: formData.taskName,
      subtask: formData.subtaskName,
      members: formData.members,
      status: formData.status,
      endDate: formData.endDate,
      priority: formData.priority,
    };
  
    try {

      // Update the selected Heads' documents
for (const headName of formData.heads) {  
  const headQuery = query(collection(db, "heads"), where("name", "==", headName));
  const headQuerySnapshot = await getDocs(headQuery);
  headQuerySnapshot.forEach(async (doc) => {
    const headDocRef = doc.ref; // Use doc.ref to get the document reference
    await updateDoc(headDocRef, {
      tasks: arrayUnion(newTask),
    });
  });
}
     
      // Update the selected Unit Heads' documents
for (const unitheadName of formData.unitheads) {
  const unitheadQuery = query(collection(db, "unitheads"), where("name", "==", unitheadName));
  const unitheadQuerySnapshot = await getDocs(unitheadQuery);
  unitheadQuerySnapshot.forEach(async (doc) => {
    const unitheadDocRef = doc.ref; // Use doc.ref to get the document reference
    await updateDoc(unitheadDocRef, {
      tasks: arrayUnion(newTask),
    });
  });
}
  
// Update the selected TeamLeaders' documents
for (const TeamLeaderName of formData.TeamLeaders) {
  const TeamLeaderQuery = query(collection(db, "teamleaders"), where("name", "==", TeamLeaderName));
  const TeamLeaderQuerySnapshot = await getDocs(TeamLeaderQuery);
  TeamLeaderQuerySnapshot.forEach(async (doc) => {
    const TeamLeaderDocRef = doc.ref; // Use doc.ref to get the document reference
    await updateDoc(TeamLeaderDocRef, {
      tasks: arrayUnion(newTask),
    });
  });
}

// Update the selected Supervisors' documents
for (const SupervisorName of formData.supervisors) {
  const SupervisorQuery = query(collection(db, "supervisors"), where("name", "==", SupervisorName));
  const SupervisorQuerySnapshot = await getDocs(SupervisorQuery);
  SupervisorQuerySnapshot.forEach(async (doc) => {
    const SupervisorDocRef = doc.ref; // Use doc.ref to get the document reference
    await updateDoc(SupervisorDocRef, {
      tasks: arrayUnion(newTask),
    });
  });
}

// Update the selected Employees' documents
for (const EmployeeName of formData.employees) {
  const EmployeeQuery = query(collection(db, "employees"), where("name", "==", EmployeeName));
  const EmployeeQuerySnapshot = await getDocs(EmployeeQuery);
  EmployeeQuerySnapshot.forEach(async (doc) => {
    const EmployeeDocRef = doc.ref; // Use doc.ref to get the document reference
    await updateDoc(EmployeeDocRef, {
      tasks: arrayUnion(newTask),
    });
  });
}
  
      // Clear the form and display a success message
      setFormData({
        project: "",
        task: "",
        subtask: "",
        members: "",
        status: "",
        TeamLeaders: [],
        supervisors: [],
        employees: [],
        unitheads: [],
        heads: [],
        endDate: "",
        priority: "low",
      });
      setSuccessMessage("Task added successfully");
      setError("");
    } catch (err) {
      setError("Failed to add task: " + err.message);
      console.error("Add task error", err);
    }
  };
  
  

  const handleLogout = async () => {
    setError("");
    try {
      await logout();
      // Redirect to the login page or any other page as needed
    } catch (err) {
      setError("Failed to log out");
      console.error("Logout error", err);
    }
  };

  return (
    <div>
      <Card>
        <Card.Body>
          <h2 className="text-center mb-4">Admin Dashboard</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {successMessage && <Alert variant="success">{successMessage}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="project">
              <Form.Label>Project</Form.Label>
              <Form.Control
                type="text"
                name="project"
                value={formData.project}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group controlId="taskName">
              <Form.Label>Task Name</Form.Label>
              <Form.Control
                type="text"
                name="taskName"
                value={formData.taskName}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group controlId="subtaskName">
              <Form.Label>Subtask Name</Form.Label>
              <Form.Control
                type="text"
                name="subtaskName"
                value={formData.subtaskName}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group controlId="members">
            <Form.Label>Members</Form.Label>
            <Form.Control
              type="number"
              name="members"
              value={formData.members}
              onChange={handleInputChange}
              required
            />
          </Form.Group>
          <Form.Group controlId="status">
          <Form.Label>Status</Form.Label>
          <Form.Control
            as="select"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            required
          >
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="WorkinProgress">Work in Progress</option>
          </Form.Control>
        </Form.Group>

        <Form.Group controlId="heads">
        <Form.Label>Heads</Form.Label>
        {heads.map((head) => (
          <Form.Check
            key={head.id}
            type="checkbox"
            id={head.id}
            label={head.name}
            value={head.name}
            onChange={handleInputChange}
            name="heads"
          />
        ))}
      </Form.Group>

        <Form.Group controlId="unitheads">
        <Form.Label>Unit Heads</Form.Label>
        {unitheads.map((unithead) => (
          <Form.Check
            key={unithead.id}
            type="checkbox"
            id={unithead.id}
            label={unithead.name}
            value={unithead.name}
            onChange={handleInputChange}
            name="unitheads"
          />
        ))}
      </Form.Group>

            <Form.Group controlId="TeamLeaders">
              <Form.Label>Team Leaders</Form.Label>
              {TeamLeaders.map((TeamLeader) => (
                <Form.Check
                  key={TeamLeader.id}
                  type="checkbox"
                  id={TeamLeader.id}
                  label={TeamLeader.name}
                  value={TeamLeader.name}
                  onChange={handleInputChange}
                  name="TeamLeaders"
                />
              ))}
            </Form.Group>

            <Form.Group controlId="supervisors">
              <Form.Label>Supervisors</Form.Label>
              {supervisors.map((supervisor) => (
                <Form.Check
                  key={supervisor.id}
                  type="checkbox"
                  id={supervisor.id}
                  label={supervisor.name}
                  value={supervisor.name}
                  onChange={handleInputChange}
                  name="supervisors"
                />
              ))}
            </Form.Group>

            <Form.Group controlId="employees">
              <Form.Label>Employees</Form.Label>
              {employees.map((employee) => (
                <Form.Check
                  key={employee.id}
                  type="checkbox"
                  id={employee.id}
                  label={employee.name}
                  value={employee.name}
                  onChange={handleInputChange}
                  name="employees"
                />
              ))}
            </Form.Group>

            <Form.Group controlId="endDate">
              <Form.Label>End Date</Form.Label>
              <Form.Control
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group controlId="priority">
              <Form.Label>Priority</Form.Label>
              <Form.Control
                as="select"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Form.Control>
            </Form.Group>
            <Button type="submit" className="w-100">
              Add Task
            </Button>
          </Form>
        </Card.Body>
      </Card>
      <div className="w-100 text-center mt-2">
        <Button variant="link" onClick={handleLogout}>
          Log Out
        </Button>
      </div>
    </div>
  );
}
