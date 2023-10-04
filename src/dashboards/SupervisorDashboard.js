import React, { useState, useEffect } from "react";
import { Card, Button, Alert, Table, Form, Modal, Container, Row, Col, Navbar, Nav } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { doc, updateDoc, collection, addDoc, getDocs, getDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { v4 as uuidv4 } from "uuid";
import EmployeeList from "../EmployeeList";
import TaskRow from "../TaskRow";
import '../styles/EmployeeDashboard.css'

export default function SupervisorDashboard() {
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { currentUser, logout } = useAuth();
  const [userData, setUserData] = useState({}); // Store user data
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]); // Store employee data
  const [selectedEmployeeUIDs, setSelectedEmployeeUIDs] = useState([]); // Track selected employees' UIDs
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [numTasksCompleted, setNumTasksCompleted] = useState(0);
  const [numTasksPending, setNumTasksPending] = useState(0);
  const [numTasksAssigned, setNumTasksAssigned] = useState(0);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [inProgressTasks, setInProgressTasks] = useState([]);
  const [selectedEmployeeTasks, setSelectedEmployeeTasks] = useState([]);
  const [projectNames, setProjectNames] = useState([]);
  const [taskNames, setTaskNames] = useState([]);
  const [subtaskNames, setSubtaskNames] = useState([]);

  const [filteredTasks, setFilteredTasks] = useState([]); 

  const onFilterTasks = (status) => {
    const filteredTasks = tasks.filter((task) => task.status === status);
    setFilteredTasks(filteredTasks);
  };

  const filterTasks = (status) => {
    onFilterTasks(status);
  };

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDocRef = doc(db, "supervisors", currentUser.uid);
        const userDocSnapshot = await getDoc(userDocRef);

        if (userDocSnapshot.exists()) {
          const userData = userDocSnapshot.data();
          setUserData(userData);
        }
      } catch (err) {
        setError("Failed to fetch user data: " + err.message);
        console.error("Fetch user data error", err);
      }
    };

    fetchUserData();
  }, [currentUser]);
    
  // Fetch project names and task names from the supervisors collection
  useEffect(() => {
    const fetchProjectAndTaskNames = async () => {
      try {
        const supervisorsDocRef = doc(db, "supervisors", currentUser.uid);
        const supervisorsDocSnapshot = await getDoc(supervisorsDocRef);

        if (supervisorsDocSnapshot.exists()) {
          const supervisorsData = supervisorsDocSnapshot.data();

          if (supervisorsData.tasks && supervisorsData.tasks.length > 0) {
            // Extract project names from tasks
            const extractedProjectNames = supervisorsData.tasks.map((task) => task.project);
            // Remove duplicates using Set
            const uniqueProjectNames = [...new Set(extractedProjectNames)];
            setProjectNames(uniqueProjectNames);
          }

          if (supervisorsData.tasks && supervisorsData.tasks.length > 0) {
            // Extract task names from tasks
            const extractedTaskNames = supervisorsData.tasks.map((task) => task.task);
            // Remove duplicates using Set
            const uniqueTaskNames = [...new Set(extractedTaskNames)];
            setTaskNames(uniqueTaskNames);
          }

          if (supervisorsData.tasks && supervisorsData.tasks.length > 0) {
            // Extract subtask names from tasks
            const extractedSubtaskNames = supervisorsData.tasks.map((task) => task.subtask);
            // Remove duplicates using Set
            const uniqueSubtaskNames = [...new Set(extractedSubtaskNames)];
            setSubtaskNames(uniqueSubtaskNames);
          }

        }
      } catch (err) {
        setError("Failed to fetch project and task names: " + err.message);
        console.error("Fetch project and task names error", err);
      }
    };

    fetchProjectAndTaskNames();
  }, [currentUser]);


  const sortTasksByPriority = (taskA, taskB) => {
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    return priorityOrder[taskA.priority] - priorityOrder[taskB.priority];
  };

  const handleEmployeeClick = (employeeId) => {
    setSelectedEmployeeId(employeeId);
  };

  // Set the role to "Supervisor" when the user logs in
  useEffect(() => {
    if (currentUser) {
      currentUser.role = "Supervisor";
    }
  }, [currentUser]);

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

  const [taskFormData, setTaskFormData] = useState({
    project: "",
    task: "",
    subtask: "",
    members: "",
    endDate: "",
    priority: "low",
  });

  const handleAddTask = async (e) => {
    try {
      e.preventDefault();
      const taskId = uuidv4();
      const priority = taskFormData.priority;
      console.log("Selected Priority:", priority);
      if (!["low", "medium", "high"].includes(priority)) {
        setError("Invalid priority selected");
        return;
      }
      // Check if the user is authenticated
      if (!currentUser) {
        setError("Please log in to assign tasks.");
        return;
      }
      console.log("currentUser:", currentUser);
      console.log("currentUser.role:", currentUser.role);
      // Check if the user has the required role (e.g., supervisor)
      if (currentUser.role !== "Supervisor") {
        setError("You do not have the required permissions to assign tasks.");
        return;
      }

      if (selectedEmployeeUIDs.length === 0) {
        setError("Please select at least one employee to assign the task to.");
        return;
      }

      const newTask = {
        taskId: uuidv4(),
        project: taskFormData.project,
        task: taskFormData.task,
        subtask: taskFormData.subtask,
        members: taskFormData.members,
        assignedTo: selectedEmployeeUIDs, // Use the selected employees' UIDs
        status: "pending",
        endDate: taskFormData.endDate,
        priority: priority,
      };
      

      console.log("New Task Data:", newTask);
      // An array to store updates for each employee
      const employeeUpdates = [];

      // Create a new task and collect updates for each selected employee
      for (const employeeUID of selectedEmployeeUIDs) {
        const employeeDocRef = doc(db, "employees", employeeUID); // Assuming you have an "employees" collection
        const employeeDoc = await getDoc(employeeDocRef);
        if (employeeDoc.exists()) {
          const employeeData = employeeDoc.data();
          const updatedTasks = [...(employeeData.tasks || []), newTask]; // Use an empty array if tasks field is initially undefined

          // Collect updates for this employee
          employeeUpdates.push({
            docRef: employeeDocRef,
            data: {
              tasks: updatedTasks,
            },
          });
        }
      }

      // Batch update all selected employees' documents
      const batch = writeBatch(db);
      employeeUpdates.forEach((update) => {
        batch.set(update.docRef, update.data, { merge: true }); // Use merge to update the tasks array
      });
      console.log("Employee Updates:", employeeUpdates);
      // Commit the batch write
      await batch.commit();

      setSuccessMessage("Task assigned to employees successfully");
      setError(""); // Clear any previous error messages
            // Clear the form and display a success message
            setTaskFormData({
              project: "",
              task: "",
              subtask: "",
              members: "",
              TeamLeaders: [],
              supervisors: [],
              employees: [],
              endDate: "",
              priority: "low",
            });
    } catch (error) {
      setError("Failed to assign task");
      console.error("Firebase Error:", error.message); // Log the error message
      console.error("Firebase Error Details:", error.details);
    }
  };
  
  const fetchTasks = async () => {
      try {
        const SupervisorDocRef = doc(db, "supervisors", currentUser.uid);
        const SupervisorDocSnapshot = await getDoc(SupervisorDocRef);
  
        if (SupervisorDocSnapshot.exists()) {
          const SupervisorDocData = SupervisorDocSnapshot.data();
          const SupervisorTasks = SupervisorDocData.tasks || [];
  
          setTasks(SupervisorTasks);
  
          // Calculate task statistics
          const completedTasks = SupervisorTasks.filter((task) => task.status === "completed").length;
          const pendingTasks = SupervisorTasks.filter((task) => task.status === "pending").length;
          const inProgressTasks = SupervisorTasks.filter((task) => task.status === "Work in Progress").length;
          const assignedTasks = SupervisorTasks.length;

          // Update the state with the final values
          setNumTasksCompleted(completedTasks);
          setNumTasksPending(pendingTasks);
          setNumTasksAssigned(assignedTasks);
          setCompletedTasks(completedTasks);
          setPendingTasks(pendingTasks);
          setInProgressTasks(inProgressTasks);
        }
      } catch (err) {
        setError("Failed to fetch tasks");
        console.error("Fetch tasks error", err);
      }
    };
  
    useEffect(() => {
      if (currentUser) {
        fetchTasks();
      }
    }, [currentUser]);

    const fetchEmployees = async (supervisorId) => {
      try {
        // Step 1: Get the supervisor's document data
        const supervisorDocRef = doc(db, "supervisors", supervisorId);
        const supervisorDocSnapshot = await getDoc(supervisorDocRef);
    
        if (supervisorDocSnapshot.exists()) {
          const supervisorData = supervisorDocSnapshot.data();
    
          // Step 2: Access the "assigned" array in the supervisor's document data
          if (supervisorData.assigned && supervisorData.assigned.length > 0) {
            // Step 3: Use the employee UIDs from the "assigned" array
            const employeeUIDs = supervisorData.assigned;
    
            // Step 4: Fetch the corresponding employee data from the "employees" collection
            const employeesCollection = collection(db, "employees");
            const employeesSnapshot = await getDocs(employeesCollection);
            const employeesData = employeesSnapshot.docs
              .map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }))
              .filter((employee) => employeeUIDs.includes(employee.uid));
    
            setEmployees(employeesData);
          }
        }
      } catch (error) {
        setError("Failed to fetch employees: " + error.message);
        console.error("Fetch employees error", error);
      }
    };

    useEffect(() => {
      if (currentUser) {
        fetchEmployees(currentUser.uid);
      }
    }, [currentUser]);
    

  const handleMarkAsCompleted = async (taskId, newStatus) => {
    const collectionsToUpdate = ["supervisors", "employees", "teamleaders", "unitheads", "heads"];
  
    try {
      for (const collectionName of collectionsToUpdate) {
        const querySnapshot = await getDocs(collection(db, collectionName));
        
        const batch = writeBatch(db);
        let updateOccurred = false;
  
        querySnapshot.forEach((docSnapshot) => {
          const docData = docSnapshot.data();
  
          if (docData.tasks && Array.isArray(docData.tasks)) {
            const taskIndex = docData.tasks.findIndex((task) => task.taskId === taskId);
            if (taskIndex !== -1) {
              docData.tasks[taskIndex].status = newStatus;
              batch.set(
                doc(db, collectionName, docSnapshot.id),
                { tasks: docData.tasks },
                { merge: true } // Merge changes into the existing document
              );
              updateOccurred = true;
            }
          }
        });
  
        if (updateOccurred) {
          await batch.commit();
        }
      }
  
      setSuccessMessage("Task status updated successfully");
      setError("");
      setTimeout(() => {
        setSuccessMessage("");
      }, 1000);
      fetchTasks();
    } catch (err) {
      setError("Failed to update task status");
      console.error("Update task status error", err);
    }
  };
  
  const handleChangeStatusToInProgress = async (taskId) => {
    try {
      const collectionsToUpdate = ["supervisors", "employees", "teamleaders", "unitheads", "heads"];
      const batch = writeBatch(db);
      let updateOccurred = false;
  
      for (const collectionName of collectionsToUpdate) {
        const querySnapshot = await getDocs(collection(db, collectionName));
  
        querySnapshot.forEach((docSnapshot) => {
          const docData = docSnapshot.data();
  
          if (docData.tasks && Array.isArray(docData.tasks)) {
            const taskIndex = docData.tasks.findIndex((task) => task.taskId === taskId);
            if (taskIndex !== -1) {
              docData.tasks[taskIndex].status = "Work in Progress";
              batch.set(
                doc(db, collectionName, docSnapshot.id),
                { tasks: docData.tasks },
                { merge: true } // Merge changes into the existing document
              );
              updateOccurred = true;
            }
          }
        });
      }
  
      if (updateOccurred) {
        await batch.commit();
      }
  
      setSuccessMessage("Task status updated to Work in Progress");
      setError("");
      setTimeout(() => {
        setSuccessMessage("");
      }, 1000);
      fetchTasks();
    } catch (err) {
      setError("Failed to update task status");
      console.error("Update task status error", err);
    }
  };  

  return (
    <Container fluid>
      <Row>
      <Col sm={2} className="bg-primary text-white p-0">
          <Navbar expand="lg" variant="dark" className="flex-column h-100" style={{ backgroundColor: '#001D44'}}>
            <Navbar.Brand>
              <img
                src={process.env.PUBLIC_URL + '/Logo.jpeg'}
                width="150"
                height="150"
                className="d-inline-block align-top"
              />
              <h4>Checklist App</h4>
            </Navbar.Brand>
            <Nav className="flex-column d-flex justify-content-center flex-grow-1">
              <Nav.Link active href="#">User Profile</Nav.Link>
              <Nav.Link active href="#">Change Password</Nav.Link>
            </Nav>
          </Navbar>
      </Col>
      <Col sm={10}>
        <Container className="border p-4" style={{ marginTop: "80px" }}>
          <Row>
            <Col>
          <h2 className="text-center mb-4 border-bottom pb-2">Welcome, {userData.name}</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {successMessage && <Alert variant="success">{successMessage}</Alert>}
          <EmployeeList
          employees={employees}
          onFilterTasks={filterTasks}
          onEmployeeClick={handleEmployeeClick}
          setSelectedEmployeeTasks={setSelectedEmployeeTasks}
        />
      <Button
      type="button"
      variant="primary"
      onClick={() => setShowTaskForm(true)}
    >
          Assign Task
        </Button>
        </Col>
        </Row>
        {/* Task Assignment Form Modal */}
        <Modal show={showTaskForm} onHide={() => setShowTaskForm(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Assign Task</Modal.Title>
          </Modal.Header>
          <Modal.Body>
          <div className="mb-3">
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          handleAddTask(e);
        }}
      >
        <Form.Group className="mb-3" controlId="project">
          <Form.Label>Project</Form.Label>
          
          <Form.Control
            as="select"
            name="project"
            required
            value={taskFormData.project}
            onChange={(e) =>
              setTaskFormData({ ...taskFormData, project: e.target.value })
            }
          ><option value="">Select a project</option>
          {projectNames.map((projectName) => (
            <option key={projectName} value={projectName}>
              {projectName}
            </option>
          ))}
        </Form.Control>
        </Form.Group>

          <Form.Group className="mb-3" controlId="task">
            <Form.Label>Task</Form.Label>
            <Form.Control
              as="select"
              name="task"
              value={taskFormData.task}
              required
            onChange={(e) =>
              setTaskFormData({ ...taskFormData, task: e.target.value })
            }
            ><option value="">Select a task</option>
            {taskNames.map((taskName) => (
              <option key={taskName} value={taskName}>
                {taskName}
              </option>
            ))}
          </Form.Control>
          </Form.Group>
          <Form.Group className="mb-3" controlId="subtask">
            <Form.Label>Subtask</Form.Label>
            <Form.Control
              as="select"
              name="subtask"
              required
              value={taskFormData.subtask}
            onChange={(e) =>
              setTaskFormData({ ...taskFormData, subtask: e.target.value })
            }
            ><option value="">Select a subtask</option>
            {subtaskNames.map((subtaskName) => (
              <option key={subtaskName} value={subtaskName}>
                {subtaskName}
              </option>
            ))}
          </Form.Control>
          </Form.Group>
          <Form.Group className="mb-3" controlId="members">
            <Form.Label>Members</Form.Label>
            <Form.Control
              type="text"
              name="members"
              required
              value={taskFormData.members}
            onChange={(e) =>
              setTaskFormData({ ...taskFormData, members: e.target.value })
            }
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="endDate">
            <Form.Label>End Date</Form.Label>
            <Form.Control
              type="date"
              name="endDate"
              required
              value={taskFormData.endDate}
            onChange={(e) =>
              setTaskFormData({ ...taskFormData, endDate: e.target.value })
            }
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="priority">
            <Form.Label>Priority</Form.Label>
            <Form.Control as="select" name="priority" required value={taskFormData.priority}
            onChange={(e) =>
              setTaskFormData({ ...taskFormData, priority: e.target.value })
            }>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Form.Control>
          </Form.Group>
          <Form.Group className="mb-3" controlId="assignedTo">
          <Form.Label>Assign to Employees</Form.Label>
          {employees.map((employee) => (
            <Form.Check
              key={employee.uid}
              type="checkbox"
              id={employee.uid}
              label={employee.name + " (" + employee.email + ")"}
              value={employee.uid}
              checked={selectedEmployeeUIDs.includes(employee.uid)}
              onChange={() => {
                setSelectedEmployeeUIDs((prevSelectedUIDs) => {
                  if (prevSelectedUIDs.includes(employee.uid)) {
                    // Remove the UID if already selected
                    return prevSelectedUIDs.filter((uid) => uid !== employee.uid);
                  } else {
                    // Add the UID if not selected
                    return [...prevSelectedUIDs, employee.uid];
                  }
                });
              }}
            />
          ))}
        </Form.Group>
        
        <Button type="submit" variant="primary">
        Assign Task
      </Button>
    </Form>
  </div>
  </Modal.Body>
</Modal>
<Row className="mt-4">
              <Col>
                <h4 className="text-dark text-center">Task Statistics</h4>
                <Row className="mt-4">
                  <Col xs={12} md={3}>
                    <Card className="formal-card">
                      <Card.Body>
                        <div className="stat-card">
                          <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAeElEQVR4nO3XwQnAIAwFULf7o+kITmQuncCLK3SBNr1JW3oVfsp/8PHgJYQQMSURkfVQzN9JTFDM63bM0BaI2/m4z61/dRkrk1uP1UEwz6CIRAf2NYMIi7rqqfvzDIpIdGBfMyjmYz9nwhUIhl/dYO8gmGdQRAK7AK47wM6aFldyAAAAAElFTkSuQmCC" alt="Assigned Tasks" />
                          <div className="stat-card-info">
                            <Card.Title>Assigned Tasks</Card.Title>
                            <Card.Text>
                              {numTasksAssigned}
                            </Card.Text>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col xs={12} md={3}>
                    <Card className="formal-card">
                      <Card.Body>
                        <div className="stat-card">
                          <img src={process.env.PUBLIC_URL + '/pending.svg'} alt="Pending Tasks" />
                          <div className="stat-card-info">
                            <Card.Title>Pending Tasks</Card.Title>
                            <Card.Text>
                              {numTasksPending}
                            </Card.Text>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col xs={12} md={3}>
                    <Card className="formal-card">
                      <Card.Body>
                        <div className="stat-card">
                          <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAEtUlEQVR4nO1ZSWwcRRQt9jXswbE9vzoyBiMjBUL/33asIAMHxBFEwnYBwYFAuCCByAFlDhyI45n/Z8AQHOCAEBLbCQFKDixiuRCBEBGgEBBIhMUhkQhbYgIY/Z4Z01PuyXTPtO0c5klzKZer36v+exvTQQcdZIIeKlwExOiuA8qUJd4LyJ8BycuW5KFeX4bM2peOM0cTLMouIP5r2WXlpXXrJDNxPyD5waI80ueX7IKT7Q/KZ1jk9bnh4jkRAduVWA6LNycREBEybVG2uMLnFTks3hMSQHkxIuCBCiF+Jo0AW/sh7/OoeOvCCBgu9lqS36s3Pqpry4PipdUb/Ti6V23fEv+bXIhs8f3JEzIl7I3mTwaS23vosXNraxZlY/WBO2bJEq+zAV/t/n9/f/kkzy9cnAvkOov8LCAfOLJZ8evd/uSpmQlQ8pXDeWffqvHzdS03XDzFkuwG5G9auRAP5Y7QkRuLeMOM5o/PRIDevJJ3Regtda0YP63Vc5cOTpwOKGOW5J94IfykyQpKuiYCUJ7K7GBjjPV5jUX5M06EG9XShUq/dG8PFiAqApC3er5caTKGFxSHLfFvMU69v9svnJf6QCC5u/oa/7DI+UydqgFsUFobH7FaMCW7+omzLfELkQN3q/OZeQYQb45LdlFLSHdgwFdY4g812mjkyZLscpQBNwNrUIiNTsibzNEEIL7RohwGlB81R8Rm+noz+j5RAai3ooVZWNsg368ZNmvy1ahzeNZEUKaA+JLa3wcH8yeq87oiwiq2GbQk1qrSSSrrsr75mJD5tbPvuZjktiHRQ9Quc77cooUZkHzkBcWr5pn8jEXeNmfvXAGvmMWCazaOfb83MDK2JLq/NyjnYvZ+mikpjRjqKxqhXEdsh3wFM8cAykG35DbNAMQfODH4/bh9mtgA5a1Gjtge+QoA+Sc3H5hm0EOdVP5u7D7kbXNs1AmJ7ZBvWUBSaNSILYOrItolb1o1oTRTCE0uDUT8YpH/bp28ac+J68IoyidxXVYzEY3Iaw+QhAOg3NRSGM1hieYkMl/uarQ/uYjk5BWA8nzMOQ+aRAMq5M/TlBJafgDx3iMIeCdN5zbYTinRKryVsiq2NUTZn7bttMjrY87ZY0z+2NbKaZQdQPJts6amO+BrLP3vvEB8wKOJZWme15VVOa1Tt7qGBvnLJA2NR+VrgUR96OeuFZXmPw2AZDzGeQ/pLKqNllI2Zt3MpGsp5fHUh2msVlvUeFxb6189Pgg+7/ICvm/hmnreFx2otYyQPHGYGYH4C5MhLJZuCN90TATLZF7aO1S6MEL+oIqpvaV2BlsDI2NLKk18/OwUSCZMFgCUp13ylRG77NH2M+154VgyKN2pdVOj3AEor2U2WvRG82fZIZmEkc0XREQVqqLerq2pzzTq3nQs4lHxem0VAeXXJpn71XkNGpXPSTKticvDwsqQvM+Xu9PqitDw09J00noJUB7N7OYbYfZjBvLWWaLEG6okJuv2Jic+pWHULAT6/E1nAvFt0eIMUN4Myfi8Jo0AID6ktx79XLUosMRfKRk3Zjckj/wdID8czTOLCq1Ia/7gtoXVT6079ZtaaGpDZV87LtNBBx2YdvEfR+5N6Sog5CwAAAAASUVORK5CYII=" alt="In Progress Tasks" />
                          <div className="stat-card-info">
                            <Card.Title>In Progress Tasks</Card.Title>
                            <Card.Text>
                              {inProgressTasks}
                            </Card.Text>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col xs={12} md={3}>
                    <Card className="formal-card">
                      <Card.Body>
                        <div className="stat-card">
                          <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAD/UlEQVR4nO2Zy08TQRzHOeg/U2gL+AR8HTVeVDx4MB4oT9/1ARE9mKgHH/GgRq3RiFFAKMj2/aYvSqGKilBUDGhbo1ESY90/4Gf2x8wCZdtgZ9mqYZLPabc738/MZL6HFhWtjP9wGAyG1W2d3LW2LsvMo27rzOMe21W/37+q6F8ZT4y2K+29duh45oTOPhc85dzQxbkvFyTMUMu2ndHmrZ+jLdtgsHmrJE96bNDe61gY2OQBo9VX2W32b+qx+aHXHoBnjiD0OUPAuQbA5I5A+OSmBYQoJ6ogpK9KhU9W7WAWiJzeksoMHBE4vUXkqckNXWYPdFt8YLT2Aw1s73iw29b+sJoGNnsHweKLgq1/GOz+2OLQ8wieqIKAvjLJLEBDf3sbA57nJZlb4RD0OcNgcg+A2RMBi3cQrL4hMbAj8BycwRfgCo2AO/wq6/e+xocgqK9E5NgBXOVskwnMBY5mCfwS3AOvwBN5Dd7BUfBF30D/0HjObwb0lYgiAuHY2Fzg0Ai4wpmBxzCwfzgOwdgEhJ6/hZcTH3MLHK9AmAUGTm0GgVyTLQf+4xXIvytwbCPCLBA+tRlvC6UF+o9tRNgFyDWnuMDRDQizAL2jlRbwHd2AsAuQUimEgPfIenYBIbxQKEoLeI+sl0mAFEohBDyH17ELBAok4Dm8TiYBUiiFEHAfWssuQBtR7oDXHSnQd0zDzI+05HMhvCwCtFDkDH+BS4Dq3Biozr2B2ocfsgq4/kaBi0L4s2OiwL67k5LvuQ6uQZgFaKHIEf6yJQnFQngisOvmO/j8XfoIOQ+uQZZV4MtMGnSGaThvTEA6nTv8JS6B4anAnluT+Pts7zubyhFmAVooUpMcuD0F2jMToD0Th5bOT1klLnFJKCHhBapv5g7P8zw4msqRZRVouj8tCmhb49AsITEbflwUWEp4XhBoLEOYBWihSE0iXIHCEaICmtY46B9/hJ/pX/j8ioWGnxXYc+N91jPPZ2BvLEOWVYBK1BimRAEN2YmLfUlQt9Lw47B3iSvPU4GGUoRZgBZKrslwJ+5NiQJqZFwUqL4xueSV5wm2hlJEEQFxJ4jEfIF8wvOCQL0WYRaghbKUSakEFcg3PM/zYK3XIooKUImGB1Ow/86HPzrzfKZAnQZhFsBGbCrPO0i+WOo0CLsAaUTFBWrVCLMANmJjmeIC5lo1wi5ACqUgAroSdgFsxIZSxQVMuhKEXYAUSiEEuJpidgFsxHqt4gJcTbFMAqRQEomEYuETiU/yCdBGjEajisLJJkAKJeY0wujoqCIM27vkEzDXaVLYiqRYzFKQG2MRJET+qNj/5DPXqXeYdCWpzNCSgcnNIQ+qpEmn2s4ssDJWxn8+fgOR9jh2p0beawAAAABJRU5ErkJggg==" alt="Completed Tasks" />
                          <div className="stat-card-info">
                            <Card.Title>Completed Tasks</Card.Title>
                            <Card.Text>
                              {numTasksCompleted}
                            </Card.Text>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Col>
            </Row>
            <Row className="mt-4">
              <Col>
                <h4 className="text-dark text-center">Task Table</h4>
                <Table className="formal-table" striped bordered hover> {/* Apply the formal-table class */}
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Task</th>
                      <th>Subtask</th>
                      <th>Members</th>
                      <th>Status</th>
                      <th>End Date</th>
                      <th>Priority</th>
                      <th>Mark as Completed</th>
                      <th>Change Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks
                      .slice()
                      .sort(sortTasksByPriority)
                      .map((task, index) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          onMarkAsCompleted={handleMarkAsCompleted}
                          onChangeStatus={handleChangeStatusToInProgress}
                          style={{ backgroundColor: index % 2 === 0 ? "#f5f5f5" : "" }}
                        />
                      ))}
                  </tbody>
                </Table>
              </Col>
            </Row>
      <div className="w-100 text-center mt-2">
      <Button variant="link" onClick={handleLogout}>
        Log Out
      </Button>
    </div>
    </Container>
    </Col>
    </Row>
    </Container>
);
}

