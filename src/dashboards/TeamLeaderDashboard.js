import React, { useState, useEffect } from "react";
import { Card, Button, Alert, Table, Form, Modal, Container, Row, Col, Navbar, Nav } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import SupervisorList from "../SupervisorList";
import {
  doc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  getDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { v4 as uuidv4 } from "uuid";
import EmployeeList from "../EmployeeList";
import TaskRow from "../TaskRow";

export default function TeamLeaderDashboard() {
  const [selectedSupervisorId, setSelectedSupervisorId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { currentUser, logout } = useAuth();
  const [userData, setUserData] = useState(null);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisorTasks, setSelectedSupervisorTasks] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedsupervisorUIDs, setSelectedsupervisorUIDs] = useState([]); // Track selected Supervisors' UIDs
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [employees, setEmployees] = useState([]); // Store employee data
  const [projectNames, setProjectNames] = useState([]);
  const [taskNames, setTaskNames] = useState([]);
  const [subtaskNames, setSubtaskNames] = useState([]);
  const [selectedEmployeeTasks, setSelectedEmployeeTasks] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedSupervisorInfo, setSelectedSupervisorInfo] = useState(null);
  const [showEmployeeBoxes, setShowEmployeeBoxes] = useState(false);
  const [selectedTeamLeaderTasks, setSelectedTeamLeaderTasks] = useState([]); // Updated state for team leader tasks

  const [numTasksCompleted, setNumTasksCompleted] = useState(0);
  const [numTasksPending, setNumTasksPending] = useState(0);
  const [numTasksAssigned, setNumTasksAssigned] = useState(0);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [inProgressTasks, setInProgressTasks] = useState([]);
  const [teamLeaderTasks, setTeamLeaderTasks] = useState([]);
  const [showEmployeeList, setShowEmployeeList] = useState(false);
  const [filteredTasks, setFilteredTasks] = useState([]);

  const [assignedEmployees, setAssignedEmployees] = useState([]);


  const onFilterTasks = (status) => {
    const filteredTasks = tasks.filter((task) => task.status === status);
    setFilteredTasks(filteredTasks);
  };
  const filterTasks = (status) => {
    onFilterTasks(status);
  };

  const fetchTasks = async () => {
    try {
      const TeamLeaderDocRef = doc(db, "teamleaders", currentUser.uid);
      const TeamLeaderDocSnapshot = await getDoc(TeamLeaderDocRef);

      if (TeamLeaderDocSnapshot.exists()) {
        const TeamLeaderDocData = TeamLeaderDocSnapshot.data();
        const TeamLeaderTasks = TeamLeaderDocData.tasks || [];

        setTasks(TeamLeaderTasks);

        // Calculate task statistics
        const completedTasks = TeamLeaderTasks.filter(
          (task) => task.status === "completed"
        ).length;
        const pendingTasks = TeamLeaderTasks.filter(
          (task) => task.status === "pending"
        ).length;
        const inProgressTasks = TeamLeaderTasks.filter(
          (task) => task.status === "Work in Progress"
        ).length;
        const assignedTasks = TeamLeaderTasks.length;

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

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const teamleadersDocRef = doc(db, "teamleaders", currentUser.uid);
        const teamleadersDocSnapshot = await getDoc(teamleadersDocRef);

        if (teamleadersDocSnapshot.exists()) {
          const teamleadersData = teamleadersDocSnapshot.data();
          setUserData(teamleadersData);
        }
      }

      catch (err) {
        setError("Failed to fetch user data: " + err.message);
        console.error("Fetch user data error", err);
      }
    }

    fetchUserData();
  }, [currentUser]);

  useEffect(() => {
    const fetchProjectAndTaskNames = async () => {
      try {
        const teamleadersDocRef = doc(db, "teamleaders", currentUser.uid);
        const teamleadersDocSnapshot = await getDoc(teamleadersDocRef);

        if (teamleadersDocSnapshot.exists()) {
          const teamleadersData = teamleadersDocSnapshot.data();

          if (teamleadersData.tasks && teamleadersData.tasks.length > 0) {
            // Extract project names from tasks
            const extractedProjectNames = teamleadersData.tasks.map(
              (task) => task.project
            );
            // Remove duplicates using Set
            const uniqueProjectNames = [...new Set(extractedProjectNames)];
            setProjectNames(uniqueProjectNames);
          }

          if (teamleadersData.tasks && teamleadersData.tasks.length > 0) {
            // Extract task names from tasks
            const extractedTaskNames = teamleadersData.tasks.map(
              (task) => task.task
            );
            // Remove duplicates using Set
            const uniqueTaskNames = [...new Set(extractedTaskNames)];
            setTaskNames(uniqueTaskNames);
          }

          if (teamleadersData.tasks && teamleadersData.tasks.length > 0) {
            // Extract subtask names from tasks
            const extractedSubtaskNames = teamleadersData.tasks.map(
              (task) => task.subtask
            );
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

  const handleEmployeeClick = (employeeId) => {
    setSelectedEmployeeId(employeeId);
  };

  useEffect(() => {
    if (currentUser) {
      currentUser.role = "Team_Leader";
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
      // Check if the user is authenticated
      if (!currentUser) {
        setError("Please log in to assign tasks.");
        return;
      }
      console.log("currentUser:", currentUser);
      console.log("currentUser.role:", currentUser.role);
      // Check if the user has the required role (e.g., supervisor)
      if (currentUser.role !== "Team_Leader") {
        setError("You do not have the required permissions to assign tasks.");
        return;
      }

      if (selectedsupervisorUIDs.length === 0) {
        setError(
          "Please select at least one supervisor to assign the task to."
        );
        return;
      }

      const newTask = {
        taskId: uuidv4(),
        project: taskFormData.project,
        task: taskFormData.task,
        subtask: taskFormData.subtask,
        members: taskFormData.members,
        status: "pending",
        endDate: taskFormData.endDate,
        priority: taskFormData.priority,
      };
      console.log("New Task Data:", newTask);
      // An array to store updates for each supervisor
      const supervisorUpdates = [];

      // Create a new task and collect updates for each selected supervisor
      for (const supervisorUID of selectedsupervisorUIDs) {
        const supervisorDocRef = doc(db, "supervisors", supervisorUID); // Assuming you have an "Supervisors" collection
        const supervisorDoc = await getDoc(supervisorDocRef);
        if (supervisorDoc.exists()) {
          const supervisorData = supervisorDoc.data();
          const updatedTasks = [...(supervisorData.tasks || []), newTask]; // Use an empty array if tasks field is initially undefined

          // Collect updates for this supervisor
          supervisorUpdates.push({
            docRef: supervisorDocRef,
            data: {
              tasks: updatedTasks,
            },
          });
        }
      }

      // Batch update all selected Supervisors' documents
      const batch = writeBatch(db);
      supervisorUpdates.forEach((update) => {
        batch.set(update.docRef, update.data, { merge: true }); // Use merge to update the tasks array
      });
      console.log("supervisor Updates:", supervisorUpdates);
      // Commit the batch write
      await batch.commit();

      setSuccessMessage("Task assigned to Supervisors successfully");
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
      console.error("Firebase Error:", error.message);
      console.error("Firebase Error Details:", error.details);
    }
  };

  const fetchSupervisors = async (teamLeaderId) => {
    try {
      // Step 1: Get the team leader's document data
      const teamLeaderDocRef = doc(db, "teamleaders", teamLeaderId);
      const teamLeaderDocSnapshot = await getDoc(teamLeaderDocRef);

      if (teamLeaderDocSnapshot.exists()) {
        const teamLeaderData = teamLeaderDocSnapshot.data();

        // Step 2: Access the "assigned" array in the team leader's document data
        if (teamLeaderData.assigned && teamLeaderData.assigned.length > 0) {
          // Step 3: Use the supervisor UIDs from the "assigned" array
          const supervisorUIDs = teamLeaderData.assigned;

          // Step 4: Fetch the corresponding supervisor data from the "supervisors" collection
          const supervisorsCollection = collection(db, "supervisors");
          const supervisorsSnapshot = await getDocs(supervisorsCollection);
          const supervisorsData = supervisorsSnapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .filter((supervisor) => supervisorUIDs.includes(supervisor.uid));

          setSupervisors(supervisorsData);
        }
      }
    } catch (error) {
      setError("Failed to fetch supervisor: " + error.message);
      console.error("Fetch Supervisor error", error);
    }
  };
  useEffect(() => {
    if (currentUser) {
      fetchSupervisors(currentUser.uid);
    }
  }, [currentUser]);

  const handleSupervisorClick = async (supervisorId) => {
    setSelectedSupervisorId(supervisorId);

    const selectedSupervisor = supervisors.find(
      (supervisor) => supervisor.uid === supervisorId
    );
    setSelectedSupervisor(selectedSupervisor);

    try {
      const supervisorDocRef = doc(db, "supervisors", supervisorId);
      const supervisorDocSnapshot = await getDoc(supervisorDocRef);

      if (supervisorDocSnapshot.exists()) {
        const supervisorData = supervisorDocSnapshot.data();
        setSelectedSupervisorTasks(supervisorData.tasks || []);
      }
    } catch (err) {
      setError("Failed to fetch supervisor's tasks: " + err.message);
      console.error("Fetch supervisor tasks error", err);
    }
  };

  // Function to fetch employees
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
    fetchEmployees();
  };

  const handleFilterTasks = (filteredTasks) => {
    // Update the state with the filtered tasks
    setSelectedSupervisorTasks(filteredTasks);
  };

  const handleSupervisorBoxClick = async (supervisorId, event) => {
    if (event) {
      // Check if the click target has the class "big-box"
      const clickedElement = event.target;
      if (clickedElement.classList.contains("bigbox")) {
        setSelectedSupervisorId(supervisorId);
  
        try {
          // Fetch the supervisor's UID based on supervisorId
          const supervisorDocRef = doc(db, "supervisors", supervisorId);
          const supervisorDocSnapshot = await getDoc(supervisorDocRef);
  
          if (supervisorDocSnapshot.exists()) {
            const supervisorData = supervisorDocSnapshot.data();
            const supervisorUid = supervisorData.uid;
  
            // Now, you have the supervisor's UID (supervisorUid) to use in further conditions
  
            // Example: Fetch assigned employees for this supervisor
            const assignedEmployeeUids = supervisorData.assigned || [];
            const assignedEmployees = [];
  
            for (const employeeUid of assignedEmployeeUids) {
              const employeeDocRef = doc(db, "employees", employeeUid);
              const employeeDocSnapshot = await getDoc(employeeDocRef);
  
              if (employeeDocSnapshot.exists()) {
                const employeeData = employeeDocSnapshot.data();
                assignedEmployees.push(employeeData);
              }
            }
  
            // Set the assigned employees in the component state
            setAssignedEmployees(assignedEmployees);
          }
        } catch (err) {
          setError("Failed to fetch supervisor's data: " + err.message);
          console.error("Fetch supervisor data error", err);
        }
  
        toggleEmployeeList();
      }
    }
  };  

  const toggleEmployeeBoxes = () => {
    setShowEmployeeBoxes(!showEmployeeBoxes);
  };
  const toggleEmployeeList = () => {
    console.log('Toggling employee list');
    setShowEmployeeList(!showEmployeeList);
  };

  const sortTasksByPriority = (taskA, taskB) => {
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    return priorityOrder[taskA.priority] - priorityOrder[taskB.priority];
  };

  const handleMarkAsCompleted = async (taskId, newStatus) => {
    const collectionsToUpdate = [
      "supervisors",
      "employees",
      "teamleaders",
      "unitheads",
      "heads",
    ];

    try {
      for (const collectionName of collectionsToUpdate) {
        const querySnapshot = await getDocs(collection(db, collectionName));

        const batch = writeBatch(db);
        let updateOccurred = false;

        querySnapshot.forEach((docSnapshot) => {
          const docData = docSnapshot.data();

          if (docData.tasks && Array.isArray(docData.tasks)) {
            const taskIndex = docData.tasks.findIndex(
              (task) => task.taskId === taskId
            );
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
      const collectionsToUpdate = [
        "teamleaders",
        "supervisors",
        "employees",
        "unitheads",
        "heads",
      ];
      const batch = writeBatch(db);
      let updateOccurred = false;

      for (const collectionName of collectionsToUpdate) {
        const querySnapshot = await getDocs(collection(db, collectionName));

        querySnapshot.forEach((docSnapshot) => {
          const docData = docSnapshot.data();

          if (docData.tasks && Array.isArray(docData.tasks)) {
            const taskIndex = docData.tasks.findIndex(
              (task) => task.taskId === taskId
            );
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
          <Navbar expand="lg" variant="dark" className="flex-column vh-100" style={{ backgroundColor: '#001D44'}}>
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
        <Container className="border p-4" style={{ marginTop: '80px' }}>
          <Row>
            <Col>
          <h2 className="text-center mb-4">
            Welcome, {userData && userData.name}
          </h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {successMessage && <Alert variant="success">{successMessage}</Alert>}
          {showEmployeeList ? (
            <div>
              <Button
                type="button"
                variant="primary"
                onClick={toggleEmployeeList}
              >
                Go Back to Supervisor List
              </Button>
              <EmployeeList
                employees={assignedEmployees}
                onFilterTasks={filterTasks}
                onEmployeeClick={handleEmployeeClick}
              />
            </div>
          ) : (
            <div>
              <SupervisorList
                supervisors={supervisors}
                onSupervisorClick={(supervisorId, event) =>
                  handleSupervisorBoxClick(supervisorId, event)
                }
                onFilterTasks={handleFilterTasks}
                onSupervisorBoxClick={handleSupervisorBoxClick}
                toggleEmployeeBoxes={toggleEmployeeBoxes}
              />

              <Button
                type="button"
                variant="primary"
                onClick={() => setShowTaskForm(true)}
              >
                Assign Task
              </Button>
            </div>
          )}
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
                    setTaskFormData({
                      ...taskFormData,
                      project: e.target.value,
                    })
                  }
                >
                  <option value="">Select a project</option>
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
                >
                  <option value="">Select a task</option>
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
                    setTaskFormData({
                      ...taskFormData,
                      subtask: e.target.value,
                    })
                  }
                >
                  <option value="">Select a subtask</option>
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
                    setTaskFormData({
                      ...taskFormData,
                      members: e.target.value,
                    })
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
                    setTaskFormData({
                      ...taskFormData,
                      endDate: e.target.value,
                    })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="priority">
                <Form.Label>Priority</Form.Label>
                <Form.Control
                  as="select"
                  name="priority"
                  required
                  value={taskFormData.priority}
                  onChange={(e) =>
                    setTaskFormData({
                      ...taskFormData,
                      priority: e.target.value,
                    })
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </Form.Control>
              </Form.Group>
              <Form.Group className="mb-3" controlId="assignedTo">
                <Form.Label>Assign to Supervisors</Form.Label>
                {supervisors.map((supervisor) => (
                  <Form.Check
                    key={supervisor.uid}
                    type="checkbox"
                    id={supervisor.uid}
                    label={supervisor.name + " (" + supervisor.email + ")"}
                    value={supervisor.uid}
                    checked={selectedsupervisorUIDs.includes(supervisor.uid)}
                    onChange={() => {
                      setSelectedsupervisorUIDs((prevSelectedUIDs) => {
                        if (prevSelectedUIDs.includes(supervisor.uid)) {
                          // Remove the UID if already selected
                          return prevSelectedUIDs.filter(
                            (uid) => uid !== supervisor.uid
                          );
                        } else {
                          // Add the UID if not selected
                          return [...prevSelectedUIDs, supervisor.uid];
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
        <h4>Task Statistics</h4>
        <div>
          <div>
            <strong>No. of Tasks Assigned: </strong>
            {numTasksAssigned}
          </div>
          <div>
            <strong>No. of Tasks Pending: </strong>
            {pendingTasks}
          </div>
          <div>
            <strong>No. of Tasks in Progress: </strong>
            {inProgressTasks}
          </div>
          <div>
            <strong>No. of Tasks Completed: </strong>
            {completedTasks}
          </div>
        </div>
        <h4>Task Table</h4>
        <Table striped bordered hover>
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
              .map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onMarkAsCompleted={handleMarkAsCompleted}
                  onChangeStatus={handleChangeStatusToInProgress}
                />
              ))}
          </tbody>
        </Table>
        <div className="w-100 text-center mt-2">
          <Button variant="link" onClick={handleLogout}>
            Log Out
          </Button>
        </div>
        </Col>
      </Row>
      </Container>
      </Col>
      </Row>
    </Container>
  );
}
