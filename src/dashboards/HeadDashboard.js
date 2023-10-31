import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Alert,
  Table,
  Form,
  Modal,
  Container,
  Row,
  Col,
  Navbar,
  Nav,
} from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import TeamLeaderList from "../TeamLeaderList";
import {
  doc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  getDoc,
  writeBatch,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { v4 as uuidv4 } from "uuid";
import SupervisorList from "../SupervisorList";
import EmployeeList from "../EmployeeList";
import UnitHeadList from "../UnitHeadList";
import TaskRow from "../TaskRow";
import "../styles/EmployeeDashboard.css";
import { AiOutlineUser, AiOutlineLogout } from "react-icons/ai";
import { RiLockPasswordFill } from "react-icons/ri";

export default function HeadDashboard() {
  const [selectedTeamLeaderId, setSelectedTeamLeaderId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { currentUser, logout } = useAuth();
  const [userData, setUserData] = useState(null);
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [selectedTeamLeaderTasks, setSelectedTeamLeaderTasks] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedTeamLeader, setSelectedTeamLeader] = useState(null);
  const [supervisors, setSupervisors] = useState([]); // Store supervisor data
  const [projectNames, setProjectNames] = useState([]);
  const [taskNames, setTaskNames] = useState([]);
  const [subtaskNames, setSubtaskNames] = useState([]);
  const [selectedSupervisorTasks, setSelectedSupervisorTasks] = useState([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState(null);
  const [showSupervisorBoxes, setShowSupervisorBoxes] = useState(false);
  const [selectedHeadTasks, setSelectedHeadTasks] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [numTasksCompleted, setNumTasksCompleted] = useState(0);
  const [numTasksPending, setNumTasksPending] = useState(0);
  const [numTasksAssigned, setNumTasksAssigned] = useState(0);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [inProgressTasks, setInProgressTasks] = useState([]);
  const [selectedSupervisorInfo, setSelectedSupervisorInfo] = useState(null);
  const [selectedUnitHeadInfo, setSelectedUnitHeadInfo] = useState(null);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [showEmployeeBoxes, setShowEmployeeBoxes] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [unitHeads, setUnitHeads] = useState([]); // Store unit head data
  const [selectedUnitHeadId, setSelectedUnitHeadId] = useState(null);
  const [selectedUnitHead, setSelectedUnitHead] = useState(null);
  const [selectedUnitHeadTasks, setSelectedUnitHeadTasks] = useState([]);
  const [currentView, setCurrentView] = useState("unitHeads");
  const [showUnitHeadList, setShowUnitHeadList] = useState(true);
  const [showTeamLeaderList, setShowTeamLeaderList] = useState(false);
  const [showSupervisorList, setShowSupervisorList] = useState(false);
  const [showEmployeeList, setShowEmployeeList] = useState(false);
  const [showUnitHeadBoxes, setShowUnitHeadBoxes] = useState(false);
  const [selectedTeamLeaderInfo, setSelectedTeamLeaderInfo] = useState(null);
  const [showTeamLeaderBoxes, setShowTeamLeaderBoxes] = useState(false);
  const [assignedEmployees, setAssignedEmployees] = useState([]);
  const [filteredSupervisors, setFilteredSupervisors] = useState([]);

  const onFilterTasks = (status) => {
    // Implement your filtering logic here and update the filteredTasks state
    // Example: Filter tasks based on the selected status
    const filteredTasks = tasks.filter((task) => task.status === status);
    setFilteredTasks(filteredTasks);
  };
  const filterTasks = (status) => {
    onFilterTasks(status);
  };

  const fetchTasks = async () => {
    try {
      const HeadsDocRef = doc(db, "heads", currentUser.uid);
      const HeadsDocSnapshot = await getDoc(HeadsDocRef);

      if (HeadsDocSnapshot.exists()) {
        const HeadsDocData = HeadsDocSnapshot.data();
        const HeadsTasks = HeadsDocData.tasks || [];

        setTasks(HeadsTasks);

        // Calculate task statistics
        const completedTasks = HeadsTasks.filter(
          (task) => task.status === "completed"
        ).length;
        const pendingTasks = HeadsTasks.filter(
          (task) => task.status === "pending"
        ).length;
        const inProgressTasks = HeadsTasks.filter(
          (task) => task.status === "Work in Progress"
        ).length;
        const assignedTasks = HeadsTasks.length;

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
    const fetchUserData = async () => {
      try {
        const docRef = doc(db, "heads", currentUser.uid);
        const docSnapshot = await getDoc(docRef);

        if (docSnapshot.exists()) {
          const docData = docSnapshot.data();
          setUserData(docData);
        }
      } catch (err) {
        setError("Failed to fetch user data");
        console.error("Fetch user data error", err);
      }
    };

    if (currentUser) {
      fetchUserData();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchTasks();
    }
  }, [currentUser]);

  const handleEmployeeClick = (employeeId) => {
    setSelectedEmployeeId(employeeId);
  };

  // Function to fetch supervisors and update the state
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
    setShowEmployeeList(!showEmployeeList);
  };

  useEffect(() => {
    if (currentUser) {
      currentUser.role = "Head";
    }
  }, [currentUser]);

  const handleLogout = async () => {
    setError("");
    try {
      await logout();
      Navigate("/");
      // Redirect to the login page or any other page as needed
    } catch (err) {
      setError("Failed to log out");
      console.error("Logout error", err);
    }
  };

  useEffect(() => {
    const fetchTeamLeaders = async (unitHeadId) => {
      try {
        // Step 1: Get the unit head's document data
        const unitHeadDocRef = doc(db, "unitheads", unitHeadId);
        const unitHeadDocSnapshot = await getDoc(unitHeadDocRef);

        if (unitHeadDocSnapshot.exists()) {
          const unitHeadData = unitHeadDocSnapshot.data();

          // Step 2: Access the "assigned" array in the unit head's document data
          if (unitHeadData.assigned && unitHeadData.assigned.length > 0) {
            // Step 3: Use the team leader UIDs from the "assigned" array
            const teamLeaderUIDs = unitHeadData.assigned;

            // Step 4: Fetch the corresponding team leader data from the "teamleaders" collection
            const teamLeadersCollection = collection(db, "teamleaders");
            const teamLeadersSnapshot = await getDocs(teamLeadersCollection);
            const teamLeadersData = teamLeadersSnapshot.docs
              .map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }))
              .filter((teamLeader) => teamLeaderUIDs.includes(teamLeader.uid));

            setTeamLeaders(teamLeadersData);
          }
        }
      } catch (error) {
        setError("Failed to fetch team leader: " + error.message);
        console.error("Fetch Team Leader error", error);
      }
    };

    if (currentUser) {
      fetchTeamLeaders(currentUser.uid);
    }
  }, [currentUser]);

  const toggleSupervisorBoxes = () => {
    setShowSupervisorBoxes(!showSupervisorBoxes);
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
        "unitheads",
        "teamleaders",
        "supervisors",
        "employees",
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

  const fetchUnitHeads = async (headId) => {
    try {
      // Step 1: Get the head's document data
      const headDocRef = doc(db, "heads", headId);
      const headDocSnapshot = await getDoc(headDocRef);

      if (headDocSnapshot.exists()) {
        const headData = headDocSnapshot.data();

        // Step 2: Access the "assigned" array in the head's document data
        if (headData.assigned && headData.assigned.length > 0) {
          // Step 3: Use the unit head UIDs from the "assigned" array
          const unitHeadUIDs = headData.assigned;

          // Step 4: Fetch the corresponding unit head data from the "unitheads" collection
          const unitHeadsCollection = collection(db, "unitheads");
          const unitHeadsSnapshot = await getDocs(unitHeadsCollection);
          const unitHeadsData = unitHeadsSnapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .filter((unitHead) => unitHeadUIDs.includes(unitHead.uid));

          setUnitHeads(unitHeadsData);
        }
      }
    } catch (error) {
      setError("Failed to fetch unit heads: " + error.message);
      console.error("Fetch Unit Heads error", error);
    }
  };

  useEffect(() => {
    fetchUnitHeads(currentUser.uid);
  }, []);

  const handleUnitHeadBoxClick = async (unitHeadId, event) => {
    if (event) {
      // Check if the click target has the class "big-box"
      const clickedElement = event.target;
      if (clickedElement.classList.contains("bigbox")) {
        setSelectedUnitHeadId(unitHeadId);

        const selectedUnitHead = unitHeads.find(
          (unitHead) => unitHead.uid === unitHeadId
        );
        setSelectedUnitHeadInfo(selectedUnitHead);

        // Fetch and set the selected unit head's tasks
        try {
          const unitHeadDocRef = doc(db, "unitheads", unitHeadId);
          const unitHeadDocSnapshot = await getDoc(unitHeadDocRef);

          if (unitHeadDocSnapshot.exists()) {
            const unitHeadData = unitHeadDocSnapshot.data();
            setSelectedUnitHeadTasks(unitHeadData.tasks || []);
          }
        } catch (err) {
          setError("Failed to fetch unit head's tasks: " + err.message);
          console.error("Fetch unit head tasks error", err);
        }

        // Fetch TeamLeaders based on the 'assigned' array in the Unit Head document
        try {
          const unitHeadDocRef = doc(db, "unitheads", unitHeadId);
          const unitHeadDocSnapshot = await getDoc(unitHeadDocRef);

          if (unitHeadDocSnapshot.exists()) {
            const unitHeadData = unitHeadDocSnapshot.data();
            const assignedTeamLeaderUids = unitHeadData.assigned || [];

            // Fetch TeamLeaders from 'teamleaders' collection based on the UIDs
            const teamLeadersCollection = collection(db, "teamleaders");
            const teamLeadersQuery = query(
              teamLeadersCollection,
              where("uid", "in", assignedTeamLeaderUids)
            );
            const teamLeadersSnapshot = await getDocs(teamLeadersQuery);

            // Map the TeamLeaders' data
            const teamLeadersData = teamLeadersSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            // Update the state with the TeamLeaders
            setTeamLeaders(teamLeadersData);
          }
        } catch (err) {
          setError("Failed to fetch TeamLeaders: " + err.message);
          console.error("Fetch TeamLeaders error", err);
        }

        // Show the TeamLeader List
        setShowTeamLeaderList(true);
        setShowUnitHeadList(false);
      }
    }
  };

  const toggleunitHeadBoxes = () => {
    setShowUnitHeadBoxes(!showUnitHeadBoxes);
  };

  const fetchTeamLeaders = async (unitHeadId) => {
    try {
      // Step 1: Get the unit head's document data
      const unitHeadDocRef = doc(db, "unitheads", unitHeadId);
      const unitHeadDocSnapshot = await getDoc(unitHeadDocRef);

      if (unitHeadDocSnapshot.exists()) {
        const unitHeadData = unitHeadDocSnapshot.data();

        // Step 2: Access the "assigned" array in the unit head's document data
        if (unitHeadData.assigned && unitHeadData.assigned.length > 0) {
          // Step 3: Use the team leader UIDs from the "assigned" array
          const teamLeaderUIDs = unitHeadData.assigned;

          // Step 4: Fetch the corresponding team leader data from the "teamleaders" collection
          const teamLeadersCollection = collection(db, "teamleaders");
          const teamLeadersSnapshot = await getDocs(teamLeadersCollection);
          const teamLeadersData = teamLeadersSnapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .filter((teamLeader) => teamLeaderUIDs.includes(teamLeader.uid));

          setTeamLeaders(teamLeadersData);
        }
      }
    } catch (error) {
      setError("Failed to fetch team leader: " + error.message);
      console.error("Fetch Team Leader error", error);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchTeamLeaders(currentUser.uid);
    }
  }, [currentUser]);

  const handleTeamLeaderBoxClick = async (teamLeaderId, event) => {
    if (event) {
      // Check if the click target has the class "big-box"
      const clickedElement = event.target;
      if (clickedElement.classList.contains("bigbox")) {
        setSelectedTeamLeaderId(teamLeaderId);

        try {
          // Fetch the team leader's data
          const teamLeaderDocRef = doc(db, "teamleaders", teamLeaderId);
          const teamLeaderDocSnapshot = await getDoc(teamLeaderDocRef);

          if (teamLeaderDocSnapshot.exists()) {
            const teamLeaderData = teamLeaderDocSnapshot.data();

            // Get the assigned supervisor UIDs from the team leader's data
            const supervisorUIDs = teamLeaderData.assigned || [];

            // Array to store supervisor data
            const supervisorsData = [];

            // Fetch supervisor data for each UID
            for (const supervisorUid of supervisorUIDs) {
              const supervisorDocRef = doc(db, "supervisors", supervisorUid);
              const supervisorDocSnapshot = await getDoc(supervisorDocRef);

              if (supervisorDocSnapshot.exists()) {
                const supervisorData = supervisorDocSnapshot.data();
                supervisorsData.push(supervisorData);
              }
            }

            // Update the state with the filtered supervisors
            setFilteredSupervisors(supervisorsData);
          }
        } catch (err) {
          setError("Failed to fetch Team Leader's tasks: " + err.message);
          console.error("Fetch Team Leader tasks error", err);
        }

        setShowSupervisorList(true);
        setShowTeamLeaderList(false);
      }
    }
  };

  return (
    <Container fluid>
      <Row>
        <Col sm={2} className="bg-primary text-white p-0">
          <Navbar
            expand="lg"
            variant="dark"
            className="flex-column vh-100"
            style={{ backgroundColor: "#001D44" }}
          >
            <Navbar.Brand>
              <img
                src={process.env.PUBLIC_URL + "/Logo.png"}
                width="150"
                height="150"
                className="d-inline-block align-top"
              />
              <h4>Checklist App</h4>
            </Navbar.Brand>
            <Row className="w-100 mt-4 flex-grow-1">
              <Col className="d-flex flex-column align-items-center justify-content-end">
                <Nav className="flex-column d-flex justify-content-center">
                  <Nav.Link
                    active
                    href="/supervisor-dashboard"
                    className="mb-3 fs-5 d-flex align-items-center"
                  >
                    <AiOutlineUser style={{ marginRight: "10px" }} /> User
                    Profile
                  </Nav.Link>
                  <Nav.Link
                    active
                    href="/supervisor-change-password"
                    className="mb-3 fs-5 d-flex align-items-center"
                  >
                    <RiLockPasswordFill style={{ marginRight: "10px" }} />{" "}
                    Change Password
                  </Nav.Link>
                  <Nav.Link
                    active
                    onClick={handleLogout}
                    className="mb-3 fs-5 d-flex align-items-center"
                  >
                    <AiOutlineLogout style={{ marginRight: "10px" }} /> Logout
                  </Nav.Link>
                </Nav>
              </Col>
            </Row>
          </Navbar>
        </Col>
        <Col sm={10} className="max-height">
          <Container className="border p-4" style={{ marginTop: "80px" }}>
            <Row>
              <Col>
                <h2 className="text-center mb-4 border-bottom pb-2">
                  Welcome, {userData && userData.name}
                </h2>
                {error && <Alert variant="danger">{error}</Alert>}
                {successMessage && (
                  <Alert variant="success">{successMessage}</Alert>
                )}

                {showUnitHeadList && (
                  <div>
                    <UnitHeadList
                      unitHeads={unitHeads}
                      onUnitHeadClick={(unitHeadId, event) =>
                        handleUnitHeadBoxClick(unitHeadId, event)
                      }
                      toggleunitHeadBoxes={toggleunitHeadBoxes}
                      onFilterTasks={handleFilterTasks}
                    />
                  </div>
                )}

                {showTeamLeaderList && (
                  <div>
                    <TeamLeaderList
                      teamLeaders={teamLeaders}
                      onFilterTasks={handleFilterTasks}
                      toggleSupervisorBoxes={toggleSupervisorBoxes}
                      onTeamLeaderBoxClick={(teamLeaderId, event) =>
                        handleTeamLeaderBoxClick(teamLeaderId, event)
                      }
                    />
                    <Button
                      variant="primary"
                      onClick={() => {
                        setShowTeamLeaderList(false);
                        setShowUnitHeadList(true);
                      }}
                    >
                      Go Back to Unit Heads
                    </Button>
                  </div>
                )}
                {showSupervisorList && !showEmployeeList && (
                  <div>
                    <SupervisorList
                      supervisors={filteredSupervisors}
                      onFilterTasks={handleFilterTasks}
                      onSupervisorClick={(supervisorId, event) =>
                        handleSupervisorBoxClick(supervisorId, event)
                      }
                      toggleEmployeeBoxes={toggleEmployeeBoxes}
                      onSupervisorBoxClick={handleSupervisorBoxClick}
                    />
                    <Button
                      variant="primary"
                      onClick={() => {
                        setShowSupervisorList(false);
                        setShowTeamLeaderList(true);
                      }}
                    >
                      Go Back to Team Leaders
                    </Button>
                  </div>
                )}

                {showEmployeeList && (
                  <div>
                    <EmployeeList
                      employees={assignedEmployees}
                      onFilterTasks={filterTasks}
                      onEmployeeClick={handleEmployeeClick}
                    />
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => {
                        setShowEmployeeList(false);
                        setShowSupervisorList(true);
                      }}
                    >
                      Go Back to Supervisors
                    </Button>
                  </div>
                )}
              </Col>
            </Row>
            <Row className="mt-4">
              <Col>
                <h4>Task Statistics</h4>
                <Row className="mt-4">
                  <Col xs={12} md={3}>
                    <Card className="formal-card">
                      <Card.Body>
                        <div className="stat-card">
                          <img
                            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAeElEQVR4nO3XwQnAIAwFULf7o+kITmQuncCLK3SBNr1JW3oVfsp/8PHgJYQQMSURkfVQzN9JTFDM63bM0BaI2/m4z61/dRkrk1uP1UEwz6CIRAf2NYMIi7rqqfvzDIpIdGBfMyjmYz9nwhUIhl/dYO8gmGdQRAK7AK47wM6aFldyAAAAAElFTkSuQmCC"
                            alt="Assigned Tasks"
                          />
                          <div className="stat-card-info">
                            <Card.Title>Assigned Tasks</Card.Title>
                            <Card.Text>{numTasksAssigned}</Card.Text>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col xs={12} md={3}>
                    <Card className="formal-card">
                      <Card.Body>
                        <div className="stat-card">
                          <img
                            src={process.env.PUBLIC_URL + "/pending.svg"}
                            alt="Pending Tasks"
                          />
                          <div className="stat-card-info">
                            <Card.Title>Pending Tasks</Card.Title>
                            <Card.Text>{numTasksPending}</Card.Text>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col xs={12} md={3}>
                    <Card className="formal-card">
                      <Card.Body>
                        <div className="stat-card">
                          <img
                            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAEtUlEQVR4nO1ZSWwcRRQt9jXswbE9vzoyBiMjBUL/33asIAMHxBFEwnYBwYFAuCCByAFlDhyI45n/Z8AQHOCAEBLbCQFKDixiuRCBEBGgEBBIhMUhkQhbYgIY/Z4Z01PuyXTPtO0c5klzKZer36v+exvTQQcdZIIeKlwExOiuA8qUJd4LyJ8BycuW5KFeX4bM2peOM0cTLMouIP5r2WXlpXXrJDNxPyD5waI80ueX7IKT7Q/KZ1jk9bnh4jkRAduVWA6LNycREBEybVG2uMLnFTks3hMSQHkxIuCBCiF+Jo0AW/sh7/OoeOvCCBgu9lqS36s3Pqpry4PipdUb/Ti6V23fEv+bXIhs8f3JEzIl7I3mTwaS23vosXNraxZlY/WBO2bJEq+zAV/t/n9/f/kkzy9cnAvkOov8LCAfOLJZ8evd/uSpmQlQ8pXDeWffqvHzdS03XDzFkuwG5G9auRAP5Y7QkRuLeMOM5o/PRIDevJJ3Regtda0YP63Vc5cOTpwOKGOW5J94IfykyQpKuiYCUJ7K7GBjjPV5jUX5M06EG9XShUq/dG8PFiAqApC3er5caTKGFxSHLfFvMU69v9svnJf6QCC5u/oa/7DI+UydqgFsUFobH7FaMCW7+omzLfELkQN3q/OZeQYQb45LdlFLSHdgwFdY4g812mjkyZLscpQBNwNrUIiNTsibzNEEIL7RohwGlB81R8Rm+noz+j5RAai3ooVZWNsg368ZNmvy1ahzeNZEUKaA+JLa3wcH8yeq87oiwiq2GbQk1qrSSSrrsr75mJD5tbPvuZjktiHRQ9Quc77cooUZkHzkBcWr5pn8jEXeNmfvXAGvmMWCazaOfb83MDK2JLq/NyjnYvZ+mikpjRjqKxqhXEdsh3wFM8cAykG35DbNAMQfODH4/bh9mtgA5a1Gjtge+QoA+Sc3H5hm0EOdVP5u7D7kbXNs1AmJ7ZBvWUBSaNSILYOrItolb1o1oTRTCE0uDUT8YpH/bp28ac+J68IoyidxXVYzEY3Iaw+QhAOg3NRSGM1hieYkMl/uarQ/uYjk5BWA8nzMOQ+aRAMq5M/TlBJafgDx3iMIeCdN5zbYTinRKryVsiq2NUTZn7bttMjrY87ZY0z+2NbKaZQdQPJts6amO+BrLP3vvEB8wKOJZWme15VVOa1Tt7qGBvnLJA2NR+VrgUR96OeuFZXmPw2AZDzGeQ/pLKqNllI2Zt3MpGsp5fHUh2msVlvUeFxb6189Pgg+7/ICvm/hmnreFx2otYyQPHGYGYH4C5MhLJZuCN90TATLZF7aO1S6MEL+oIqpvaV2BlsDI2NLKk18/OwUSCZMFgCUp13ylRG77NH2M+154VgyKN2pdVOj3AEor2U2WvRG82fZIZmEkc0XREQVqqLerq2pzzTq3nQs4lHxem0VAeXXJpn71XkNGpXPSTKticvDwsqQvM+Xu9PqitDw09J00noJUB7N7OYbYfZjBvLWWaLEG6okJuv2Jic+pWHULAT6/E1nAvFt0eIMUN4Myfi8Jo0AID6ktx79XLUosMRfKRk3Zjckj/wdID8czTOLCq1Ia/7gtoXVT6079ZtaaGpDZV87LtNBBx2YdvEfR+5N6Sog5CwAAAAASUVORK5CYII="
                            alt="In Progress Tasks"
                          />
                          <div className="stat-card-info">
                            <Card.Title>In Progress Tasks</Card.Title>
                            <Card.Text>{inProgressTasks}</Card.Text>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col xs={12} md={3}>
                    <Card className="formal-card">
                      <Card.Body>
                        <div className="stat-card">
                          <img
                            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAD/UlEQVR4nO2Zy08TQRzHOeg/U2gL+AR8HTVeVDx4MB4oT9/1ARE9mKgHH/GgRq3RiFFAKMj2/aYvSqGKilBUDGhbo1ESY90/4Gf2x8wCZdtgZ9mqYZLPabc738/MZL6HFhWtjP9wGAyG1W2d3LW2LsvMo27rzOMe21W/37+q6F8ZT4y2K+29duh45oTOPhc85dzQxbkvFyTMUMu2ndHmrZ+jLdtgsHmrJE96bNDe61gY2OQBo9VX2W32b+qx+aHXHoBnjiD0OUPAuQbA5I5A+OSmBYQoJ6ogpK9KhU9W7WAWiJzeksoMHBE4vUXkqckNXWYPdFt8YLT2Aw1s73iw29b+sJoGNnsHweKLgq1/GOz+2OLQ8wieqIKAvjLJLEBDf3sbA57nJZlb4RD0OcNgcg+A2RMBi3cQrL4hMbAj8BycwRfgCo2AO/wq6/e+xocgqK9E5NgBXOVskwnMBY5mCfwS3AOvwBN5Dd7BUfBF30D/0HjObwb0lYgiAuHY2Fzg0Ai4wpmBxzCwfzgOwdgEhJ6/hZcTH3MLHK9AmAUGTm0GgVyTLQf+4xXIvytwbCPCLBA+tRlvC6UF+o9tRNgFyDWnuMDRDQizAL2jlRbwHd2AsAuQUimEgPfIenYBIbxQKEoLeI+sl0mAFEohBDyH17ELBAok4Dm8TiYBUiiFEHAfWssuQBtR7oDXHSnQd0zDzI+05HMhvCwCtFDkDH+BS4Dq3Biozr2B2ocfsgq4/kaBi0L4s2OiwL67k5LvuQ6uQZgFaKHIEf6yJQnFQngisOvmO/j8XfoIOQ+uQZZV4MtMGnSGaThvTEA6nTv8JS6B4anAnluT+Pts7zubyhFmAVooUpMcuD0F2jMToD0Th5bOT1klLnFJKCHhBapv5g7P8zw4msqRZRVouj8tCmhb49AsITEbflwUWEp4XhBoLEOYBWihSE0iXIHCEaICmtY46B9/hJ/pX/j8ioWGnxXYc+N91jPPZ2BvLEOWVYBK1BimRAEN2YmLfUlQt9Lw47B3iSvPU4GGUoRZgBZKrslwJ+5NiQJqZFwUqL4xueSV5wm2hlJEEQFxJ4jEfIF8wvOCQL0WYRaghbKUSakEFcg3PM/zYK3XIooKUImGB1Ow/86HPzrzfKZAnQZhFsBGbCrPO0i+WOo0CLsAaUTFBWrVCLMANmJjmeIC5lo1wi5ACqUgAroSdgFsxIZSxQVMuhKEXYAUSiEEuJpidgFsxHqt4gJcTbFMAqRQEomEYuETiU/yCdBGjEajisLJJkAKJeY0wujoqCIM27vkEzDXaVLYiqRYzFKQG2MRJET+qNj/5DPXqXeYdCWpzNCSgcnNIQ+qpEmn2s4ssDJWxn8+fgOR9jh2p0beawAAAABJRU5ErkJggg=="
                            alt="Completed Tasks"
                          />
                          <div className="stat-card-info">
                            <Card.Title>Completed Tasks</Card.Title>
                            <Card.Text>{completedTasks}</Card.Text>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
                {/* <div>
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
        </div> */}
                <Row className="mt-4">
                  <Col>
                    <h4 className="text-dark text-center">Task Table</h4>
                    <Table striped bordered hover className="formal-table">
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
                  </Col>
                </Row>
                {/* <Row className="w-100 text-center mt-2">
              <Col>
                <Button className="formal-button" onClick={handleLogout}>
                  Log Out
                </Button>
              </Col>
            </Row> */}
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
