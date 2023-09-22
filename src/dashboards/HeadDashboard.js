import React, { useState, useEffect } from "react";
import { Card, Button, Alert, Table, Form, Modal } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import TeamLeaderList from "./TeamLeaderList"; 
import { doc, updateDoc, collection, addDoc, getDocs, getDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { v4 as uuidv4 } from "uuid";
import SupervisorList from "./SupervisorList"; 
import EmployeeList from "./EmployeeList";
import UnitHeadList from "./UnitHeadList";
import TaskRow from "./TaskRow";

export default function HeadDashboard() {
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
      currentUser.role = "Head";
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

  const handleTeamLeaderClick = async (teamLeaderId) => {
    setSelectedTeamLeaderId(teamLeaderId);
  
    const selectedTeamLeader = teamLeaders.find((teamLeader) => teamLeader.uid === teamLeaderId);
    setSelectedTeamLeader(selectedTeamLeader);
  
    try {
      const teamLeaderDocRef = doc(db, "teamleaders", teamLeaderId);
      const teamLeaderDocSnapshot = await getDoc(teamLeaderDocRef);
  
      if (teamLeaderDocSnapshot.exists()) {
        const teamLeaderData = teamLeaderDocSnapshot.data();
        setSelectedTeamLeaderTasks(teamLeaderData.tasks || []);
      }
    } catch (err) {
      setError("Failed to fetch team leader's tasks: " + err.message);
      console.error("Fetch team leader tasks error", err);
    }
  
    // Add the logic to display the SupervisorList
    setShowSupervisorList(true);
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
      const HeadDocRef = doc(db, "heads", currentUser.uid);
      await updateDoc(HeadDocRef, {
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

  return (
    <div>
      <Card>
        <Card.Body>
          <h2 className="text-center mb-4">Welcome, {currentUser.displayName}</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {successMessage && <Alert variant="success">{successMessage}</Alert>}

          {showUnitHeadList && (
            <div>
            <UnitHeadList
            unitHeads={unitHeads}
            onUnitHeadClick={(unitHeadId, event) => handleUnitHeadBoxClick(unitHeadId, event)}
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
          
          
        </Card.Body>
      </Card>
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
        <div className="w-100 text-center mt-2">
        <Button variant="link" onClick={handleLogout}>
          Log Out
        </Button>
      </div>
      </div>
    </div>
  );
}
