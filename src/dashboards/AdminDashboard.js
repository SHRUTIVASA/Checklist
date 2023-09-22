import React, { useState, useEffect } from "react";
import { Card, Button, Alert, Table, Form, Modal } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import TeamLeaderList from "./TeamLeaderList"; 
import { doc, updateDoc, collection, addDoc, getDocs, getDoc, writeBatch, arrayUnion, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { v4 as uuidv4 } from "uuid";
import SupervisorList from "./SupervisorList"; 
import EmployeeList from "./EmployeeList";
import UnitHeadList from "./UnitHeadList";
import HeadList from "./HeadList";

export default function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [unitHeads, setUnitHeads] = useState([]);
  const [heads, setHeads] = useState([]);
  const [teamLeaders, setTeamLeaders] = useState([]);
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
  const [selectedsupervisorUIDs, setSelectedsupervisorUIDs] = useState([]); 
  const [selectedTeamLeaderId, setSelectedTeamLeaderId] = useState(null);
  const [selectedTeamLeaderTasks, setSelectedTeamLeaderTasks] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedTeamLeader, setSelectedTeamLeader] = useState(null);
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
  const [selectedUnitHeadId, setSelectedUnitHeadId] = useState(null);
  const [selectedUnitHead, setSelectedUnitHead] = useState(null);
  const [selectedUnitHeadTasks, setSelectedUnitHeadTasks] = useState([]);
  const [showUnitHeadList, setShowUnitHeadList] = useState(true);
  const [showTeamLeaderList, setShowTeamLeaderList] = useState(false);
  const [showSupervisorList, setShowSupervisorList] = useState(false);
  const [showEmployeeList, setShowEmployeeList] = useState(false);
  const [showUnitHeadBoxes, setShowUnitHeadBoxes] = useState(false);
  const [selectedTeamLeaderInfo, setSelectedTeamLeaderInfo] = useState(null);
  const [showTeamLeaderBoxes, setShowTeamLeaderBoxes] = useState(false);
  const [selectedHeadId, setSelectedHeadId] = useState(null);
  const [selectedHeadInfo, setSelectedHeadInfo] = useState(null);
  const [showHeadBoxes, setShowHeadBoxes] = useState(false);
  const [showHeadList, setShowHeadList] = useState(true);

  const onFilterTasks = (status) => {
    // Implement your filtering logic here and update the filteredTasks state
    // Example: Filter tasks based on the selected status
    const filteredTasks = tasks.filter((task) => task.status === status);
    setFilteredTasks(filteredTasks);
  };
  const filterTasks = (status) => {
    onFilterTasks(status);
  };

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
        setUnitHeads(unitheadsData);
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

    const fetchTasks = async () => {
      try {
        const HeadsDocRef = doc(db, "heads", currentUser.uid);
        const HeadsDocSnapshot = await getDoc(HeadsDocRef);
  
        if (HeadsDocSnapshot.exists()) {
          const HeadsDocData = HeadsDocSnapshot.data();
          const HeadsTasks = HeadsDocData.tasks || [];
  
          setTasks(HeadsTasks);
  
          // Calculate task statistics
          const completedTasks = HeadsTasks.filter((task) => task.status === "completed").length;
          const pendingTasks = HeadsTasks.filter((task) => task.status === "pending").length;
          const inProgressTasks = HeadsTasks.filter((task) => task.status === "Work in Progress").length;
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
      if (currentUser) {
        fetchTasks();
      }
    }, [currentUser]);

  const handleEmployeeClick = (employeeId) => {
    setSelectedEmployeeId(employeeId);
  };

  useEffect(() => {
    const fetchSupervisors = async () => {
      try {
        const SupervisorsCollectionRef = collection(db, "supervisors");
        const querySnapshot = await getDocs(SupervisorsCollectionRef);

        const SupervisorsData = [];

        querySnapshot.forEach((doc) => {
          const supervisorData = doc.data();
          SupervisorsData.push({
            uid: doc.id,
            name: supervisorData.name,
            email: supervisorData.email,
          });
        });

        setSupervisors(SupervisorsData);
      } catch (err) {
        setError("Failed to fetch Supervisors");
        console.error("Fetch Supervisors error", err);
      }
    };

    if (currentUser) {
      fetchSupervisors();
    }
  }, [currentUser]);


 // Function to fetch supervisors and update the state
 const fetchSupervisors = async () => {
  try {
    // Assuming you have a "supervisors" collection in your Firestore
    const supervisorsCollection = collection(db, "supervisors");
    const supervisorsSnapshot = await getDocs(supervisorsCollection);
    const supervisorsData = supervisorsSnapshot.docs.map((doc) => doc.data());
    
    setSupervisors(supervisorsData); // Update the supervisors state
  } catch (err) {
    setError("Failed to fetch supervisors: " + err.message);
    console.error("Fetch supervisors error", err);
  }
};

  // Function to fetch employees
  const fetchEmployees = async () => {
    const employeesCollection = collection(db, "employees");
    const employeesSnapshot = await getDocs(employeesCollection);
    const employeesData = employeesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setEmployees(employeesData);
  };

  useEffect(() => {
    if (currentUser) {
      fetchEmployees();
    }
  }, [currentUser]);


useEffect(() => {
  // Call the fetchSupervisors function when the component mounts
  fetchSupervisors();
}, []);

const handleFilterTasks = (filteredTasks) => {
  // Update the state with the filtered tasks
  setSelectedSupervisorTasks(filteredTasks);
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
    if (currentUser.role !== "admin") {
      setError("You do not have the required permissions to assign tasks.");
      return;
    }

    const newTask = {
      taskId: uuidv4(),
      project: formData.project,
      task: formData.taskName, // Use the correct field name
      subtask: formData.subtaskName, // Use the correct field name
      members: formData.members,
      status: formData.status,
      endDate: formData.endDate,
      priority: formData.priority,
    };
    console.log("New Task Data:", newTask);
    // An array to store updates for each supervisor
    const supervisorUpdates = [];

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

    // Batch update all selected Supervisors' documents
    const batch = writeBatch(db);
    supervisorUpdates.forEach((update) => {
      batch.set(update.docRef, update.data, { merge: true }); // Use merge to update the tasks array
    });
    // Commit the batch write
    await batch.commit();

    setSuccessMessage("Task assigned successfully");
    setError(""); // Clear any previous error messages
                // Clear the form and display a success message
                setFormData({
                  project: "",
                  taskName: "", // Use the correct field name
                  subtaskName: "", // Use the correct field name
                  members: "",
                  status: "completed", // Set the default status as per your requirements
                  endDate: "",
                  priority: "low",
                });
  } catch (error) {
    setError("Failed to assign task");
    console.error("Firebase Error:", error.message);
    console.error("Firebase Error Details:", error.details);
  }
};

const handleSupervisorBoxClick = async (supervisorId, event) => {
  if (event) {
    // Check if the click target has the class "big-box"
    const clickedElement = event.target;
    if (clickedElement.classList.contains("bigbox")) {
      setSelectedSupervisorId(supervisorId);

      const selectedSupervisor = supervisors.find((supervisor) => supervisor.uid === supervisorId);
      setSelectedSupervisor(selectedSupervisor);

      // Store the selected supervisor's information in the state
      setSelectedSupervisorInfo(selectedSupervisor);

      // Fetch and set the selected supervisor's tasks
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
      currentUser.role = "admin";
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

  useEffect(() => {
    const fetchTeamLeaders = async () => {
      try {
        const teamLeadersCollectionRef = collection(db, "teamleaders");
        const querySnapshot = await getDocs(teamLeadersCollectionRef);

        const teamLeadersData = [];

        querySnapshot.forEach((doc) => {
          const teamLeaderData = doc.data();
          teamLeadersData.push({
            uid: doc.id,
            name: teamLeaderData.name,
            email: teamLeaderData.email,
          });
        });

        setTeamLeaders(teamLeadersData);
      } catch (err) {
        setError("Failed to fetch Team Leaders");
        console.error("Fetch Team Leaders error", err);
      }
    };

    if (currentUser) {
      fetchTeamLeaders();
    }
  }, [currentUser]);

  const fetchUnitHeads = async () => {
    try {
      // Assuming you have a "unitheads" collection in your Firestore
      const unitHeadsCollection = collection(db, "unitheads");
      const unitHeadsSnapshot = await getDocs(unitHeadsCollection);
      const unitHeadsData = unitHeadsSnapshot.docs.map((doc) => doc.data());
      
      setUnitHeads(unitHeadsData); // Update the unit heads state
    } catch (err) {
      setError("Failed to fetch unit heads: " + err.message);
      console.error("Fetch unit heads error", err);
    }
  };

  useEffect(() => {
    fetchUnitHeads();
  }, []);

  const handleUnitHeadBoxClick = async (unitHeadId, event) => {
    if (event) {
      // Check if the click target has the class "big-box"
      const clickedElement = event.target;
      if (clickedElement.classList.contains("bigbox")) {
        setSelectedUnitHeadId(unitHeadId);

        const selectedUnitHead = unitHeads.find((unitHead) => unitHead.uid === unitHeadId);
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
        setShowTeamLeaderList(true);
        setShowUnitHeadList(false);
      }
    }
  };
     
  const toggleunitHeadBoxes = () => {
    setShowUnitHeadBoxes(!showUnitHeadBoxes);
  };

  const fetchTeamLeaders= async () => {
    try {
      const teamLeadersCollection = collection(db, "teamleaders");
      const teamLeadersSnapshot = await getDocs(teamLeadersCollection);
      const teamLeadersData = teamLeadersSnapshot.docs.map((doc) => doc.data());
      
      setTeamLeaders(teamLeadersData);
    } catch (err) {
      setError("Failed to fetch Team Leaders: " + err.message);
      console.error("Fetch unit Team Leaders error", err);
    }
  };

  useEffect(() => {
    fetchTeamLeaders();
  }, []);

  const handleTeamLeaderBoxClick = async (teamLeaderId, event) => {
    if (event) {
      // Check if the click target has the class "big-box"
      const clickedElement = event.target;
      if (clickedElement.classList.contains("bigbox")) {
        setSelectedTeamLeaderId(teamLeaderId);

        const selectedTeamLeader = teamLeaders.find((teamLeader) => teamLeader.uid === teamLeaderId);
        setSelectedTeamLeaderInfo(selectedTeamLeader);

        try {
          const teamLeaderDocRef = doc(db, "teamleaders", teamLeaderId);
          const teamLeaderDocSnapshot = await getDoc(teamLeaderDocRef);

          if (teamLeaderDocSnapshot.exists()) {
            const teamLeaderData = teamLeaderDocSnapshot.data();
            setSelectedTeamLeaderTasks(teamLeaderData.tasks || []);
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

  const toggleSupervisorBoxes = () => {
    setShowSupervisorBoxes(!showSupervisorBoxes);
  };

  const fetchHeads = async () => {
    try {
      // Assuming you have a "heads" collection in your Firestore
      const headsCollection = collection(db, "heads");
      const headsSnapshot = await getDocs(headsCollection);
      const headsData = headsSnapshot.docs.map((doc) => doc.data());
      
      setHeads(headsData); // Update the heads state
    } catch (err) {
      setError("Failed to fetch heads: " + err.message);
      console.error("Fetch heads error", err);
    }
  };
  
  useEffect(() => {
    fetchHeads();
  }, []);
  
  const handleHeadBoxClick = async (headId, event) => {
    if (event) {
      // Check if the click target has the class "big-box"
      const clickedElement = event.target;
      if (clickedElement.classList.contains("bigbox")) {
        setSelectedHeadId(headId);
  
        const selectedHead = heads.find((head) => head.uid === headId);
        setSelectedHeadInfo(selectedHead);
  
        // Fetch and set the selected head's tasks
        try {
          const headDocRef = doc(db, "heads", headId);
          const headDocSnapshot = await getDoc(headDocRef);
  
          if (headDocSnapshot.exists()) {
            const headData = headDocSnapshot.data();
            setSelectedHeadTasks(headData.tasks || []);
          }
        } catch (err) {
          setError("Failed to fetch head's tasks: " + err.message);
          console.error("Fetch head tasks error", err);
        }
        setShowHeadList(false);
        setShowUnitHeadList(true);
      }
    }
  };
  
  const toggleHeadBoxes = () => {
    setShowHeadBoxes(!showHeadBoxes);
  };
  

  return (
    <div>
      <Card>
        <Card.Body>
          <h2 className="text-center mb-4">Admin Dashboard</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {successMessage && <Alert variant="success">{successMessage}</Alert>}
          {showHeadList && (
            <div>
              <HeadList
                heads={heads}
                onHeadClick={(headId, event) => handleHeadBoxClick(headId, event)}
                toggleHeadBoxes={toggleHeadBoxes}
                onFilterTasks={handleFilterTasks}
              />
            </div>
          )}
          {showUnitHeadList && !showHeadList && (
            <div>
            <UnitHeadList
            unitHeads={unitHeads}
            onUnitHeadClick={(unitHeadId, event) => handleUnitHeadBoxClick(unitHeadId, event)}
            toggleunitHeadBoxes={toggleunitHeadBoxes}
            onFilterTasks={handleFilterTasks}
          />
          <Button
          variant="primary"
          onClick={() => {
            setShowUnitHeadList(false);
            setShowHeadList(true);
          }}
        >
          Go Back to Heads
        </Button>
      </div>
          )}

          {showTeamLeaderList && (
            <div>
              <TeamLeaderList
                teamLeaders={teamLeaders}
                onFilterTasks={handleFilterTasks}
                toggleSupervisorBoxes={toggleSupervisorBoxes}
                onTeamLeaderBoxClick={(teamLeaderId, event) => handleTeamLeaderBoxClick(teamLeaderId, event)}
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
                supervisors={supervisors}
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
                employees={employees}
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
          <Button
          type="button"
          variant="primary"
          onClick={() => setShowTaskForm(true)}
        >
              Assign Task
            </Button>
        </Card.Body>
      </Card>
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
            <option value="Work in Progress">Work in Progress</option>
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
        {unitHeads.map((unithead) => (
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
              {teamLeaders.map((TeamLeader) => (
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
          </div>
          </Modal.Body>
        </Modal>
      <div className="w-100 text-center mt-2">
        <Button variant="link" onClick={handleLogout}>
          Log Out
        </Button>
      </div>
    </div>
  );
}
