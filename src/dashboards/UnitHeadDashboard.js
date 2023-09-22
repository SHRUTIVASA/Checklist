import React, { useState, useEffect } from "react";
import { Card, Button, Alert, Table, Form, Modal } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import TeamLeaderList from "./TeamLeaderList"; 
import { doc, updateDoc, collection, addDoc, getDocs, getDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { v4 as uuidv4 } from "uuid";
import SupervisorList from "./SupervisorList"; 
import EmployeeList from "./EmployeeList";
import TaskRow from "./TaskRow";

export default function UnitHeadDashboard() {
  const [selectedTeamLeaderId, setSelectedTeamLeaderId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { currentUser, logout } = useAuth();
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
  const [selectedUnitHeadTasks, setSelectedUnitHeadTasks] = useState([]);
  const [showSupervisorList, setShowSupervisorList] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [numTasksCompleted, setNumTasksCompleted] = useState(0);
  const [numTasksPending, setNumTasksPending] = useState(0);
  const [numTasksAssigned, setNumTasksAssigned] = useState(0);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [inProgressTasks, setInProgressTasks] = useState([]);
  const [selectedSupervisorInfo, setSelectedSupervisorInfo] = useState(null);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [showEmployeeBoxes, setShowEmployeeBoxes] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [employees, setEmployees] = useState([]); // Store employee data
  const [showEmployeeList, setShowEmployeeList] = useState(false);
  const unitheadUid = currentUser ? currentUser.uid : null;
  const [numTasksinProgress, setNumTasksinProgress] = useState(0);
  const [selectedTeamLeaderInfo, setSelectedTeamLeaderInfo] = useState(null);
  const [showTeamLeaderBoxes, setShowTeamLeaderBoxes] = useState(false);
  const [showTeamLeaderList, setShowTeamLeaderList] = useState(false);

    const fetchTasks = async () => {
      try {
        const unitHeadDocRef = doc(db, "unitheads", currentUser.uid);
        const unitHeadDocSnapshot = await getDoc(unitHeadDocRef);
  
        if (unitHeadDocSnapshot.exists()) {
          const unitHeadDocData = unitHeadDocSnapshot.data();
          const unitHeadTasks = unitHeadDocData.tasks || [];
  
          setTasks(unitHeadTasks);
  
          // Calculate task statistics
          const completedTasks = unitHeadTasks.filter((task) => task.status === "completed").length;
          const pendingTasks = unitHeadTasks.filter((task) => task.status === "pending").length;
          const inProgressTasks = unitHeadTasks.filter((task) => task.status === "Work in Progress").length;
          const assignedTasks = unitHeadTasks.length;

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
    const fetchProjectAndTaskNames = async () => {
      try {
        const unitHeadsDocRef = doc(db, "unitheads", currentUser.uid);
        const unitHeadsDocSnapshot = await getDoc(unitHeadsDocRef);

        if (unitHeadsDocSnapshot.exists()) {
          const unitHeadsData = unitHeadsDocSnapshot.data();

          if (unitHeadsData.tasks && unitHeadsData.tasks.length > 0) {
            const extractedProjectNames = unitHeadsData.tasks.map((task) => task.project);
            const uniqueProjectNames = [...new Set(extractedProjectNames)];
            setProjectNames(uniqueProjectNames);
          }

          if (unitHeadsData.tasks && unitHeadsData.tasks.length > 0) {
            const extractedTaskNames = unitHeadsData.tasks.map((task) => task.task);
            const uniqueTaskNames = [...new Set(extractedTaskNames)];
            setTaskNames(uniqueTaskNames);
          }

          if (unitHeadsData.tasks && unitHeadsData.tasks.length > 0) {
            const extractedSubtaskNames = unitHeadsData.tasks.map((task) => task.subtask);
            const uniqueSubtaskNames = [...new Set(extractedSubtaskNames)];
            setSubtaskNames(uniqueSubtaskNames);
          }
        }
      } catch (err) {
        setError("Failed to fetch project and task names: " + err.message);
        console.error("Fetch project and task names error", err);
      }
    };

    if (currentUser) {
      fetchProjectAndTaskNames();
    }
  }, [currentUser]);

  const onFilterTasks = (status) => {
    const filteredTasks = tasks.filter((task) => task.status === status);
    setFilteredTasks(filteredTasks);
  };

  const filterTasks = (status) => {
    onFilterTasks(status);
  };

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
      currentUser.role = "UnitHead";
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

  const toggleSupervisorBoxes = () => {
    setShowSupervisorBoxes(!showSupervisorBoxes);
  };

  const handleDeleteTask = async (taskId) => {
    try {
      // Create a copy of the tasks array without the task to be deleted
      const updatedTasks = tasks.filter((task) => task.id !== taskId);

      // Update the frontend state by removing the task
      setTasks(updatedTasks);

      // Update the tasks in Firestore
      const UnitHeadDocRef = doc(db, "unitheads", currentUser.uid);
      await updateDoc(UnitHeadDocRef, {
        tasks: updatedTasks,
      });

      setSuccessMessage("Task deleted successfully");
      setError(""); // Clear any previous error messages
      setTimeout(() => {
        setSuccessMessage("");
      }, 1000);
      fetchTasks();
    } catch (err) {
      setError("Failed to delete task: " + err.message);
      console.error("Delete task error", err);
      setTimeout(() => {
        setSuccessMessage("");
      }, 1000);
    }
  };

  const sortTasksByPriority = (taskA, taskB) => {
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    return priorityOrder[taskA.priority] - priorityOrder[taskB.priority];
  };

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
      const collectionsToUpdate = ["unitheads", "teamleaders", "supervisors", "employees", "heads"];
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
     
  const toggleteamLeaderBoxes = () => {
    setShowTeamLeaderBoxes(!showTeamLeaderBoxes);
  };

  return (
    <div>
      <Card>
        <Card.Body>
          <h2 className="text-center mb-4">Welcome, {currentUser.displayName}</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {successMessage && <Alert variant="success">{successMessage}</Alert>}
          {showEmployeeList ? (
            <div>
              <EmployeeList
                employees={employees}
                onFilterTasks={filterTasks}
                onEmployeeClick={handleEmployeeClick}
              />
              <Button
              type="button"
              variant="primary"
              onClick={toggleEmployeeList}
            >
              Go Back to Supervisor List
            </Button>
            </div>
          ) : showSupervisorList ? (
            <div>
              <SupervisorList
                supervisors={supervisors}
                onFilterTasks={handleFilterTasks}
                onSupervisorBoxClick={handleSupervisorBoxClick}
                toggleEmployeeBoxes={toggleEmployeeBoxes}
                handleSupervisorClick={toggleEmployeeBoxes}
              />
              <Button variant="primary" onClick={() => setShowSupervisorList(false)}>
              Go Back to Team Leaders
              </Button>
            </div>
          ) : (
            <div>
              <TeamLeaderList
                teamLeaders={teamLeaders}
                onTeamLeaderBoxClick={(teamLeaderId, event) => handleTeamLeaderBoxClick(teamLeaderId, event)}
                onFilterTasks={handleFilterTasks}
                toggleSupervisorBoxes={toggleSupervisorBoxes}
              />
            </div>
          )}
        </Card.Body>
      </Card>

      <div className="w-100 text-center mt-2">
        <Button variant="link" onClick={handleLogout}>
          Log Out
        </Button>
      </div>
      <div>
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
              <th>Delete</th>
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
                onDeleteTask={handleDeleteTask}
                onMarkAsCompleted={handleMarkAsCompleted}
                onChangeStatus={handleChangeStatusToInProgress}
              />
            ))}
        </tbody>
        </Table>
      </div>
    </div>
  );
}
