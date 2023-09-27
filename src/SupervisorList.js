import React, { useEffect, useState } from "react";
import { doc, updateDoc, collection, addDoc, getDocs, getDoc, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { Table } from "react-bootstrap";
import { useAuth } from "./contexts/AuthContext";

const SupervisorList = ({ supervisors, onFilterTasks, onSupervisorClick,  onSupervisorBoxClick }) => {
  const [taskStatistics, setTaskStatistics] = useState([]);
  const [activeFilter, setActiveFilter] = useState({});
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState(null);
  const [selectedSupervisorTasks, setSelectedSupervisorTasks] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [tasks, setTasks] = useState([]);
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    const fetchTaskStatistics = async (supervisorId) => {
      try {
        const SupervisorDocRef = doc(db, "supervisors", supervisorId);
        const SupervisorDocSnapshot = await getDoc(SupervisorDocRef);

        if (SupervisorDocSnapshot.exists()) {
          const SupervisorData = SupervisorDocSnapshot.data();
          const tasksArray = SupervisorData.tasks || [];

          const numTasksCompleted = tasksArray.filter(
            (task) => task.status === "completed"
          ).length;
          const numTasksPending = tasksArray.filter(
            (task) => task.status === "pending"
          ).length;
          const numTasksInProgress = tasksArray.filter(
            (task) => task.status === "Work in Progress"
          ).length;

          const supervisorStatistics = {
            supervisorId,
            numTasksCompleted,
            numTasksPending,
            numTasksAssigned: tasksArray.length,
            numTasksInProgress,
          };

          setTaskStatistics((prevStatistics) => [...prevStatistics, supervisorStatistics]);
        } else {
          console.error("Supervisor document does not exist");
        }
      } catch (err) {
        console.error("Error fetching task statistics:", err);
      }
    };

    supervisors.forEach((supervisor) => {
      fetchTaskStatistics(supervisor.uid);
    });
  }, [supervisors]);

  const filterTasks = async (supervisorId, status) => {
    setActiveFilter(status);
    setSelectedSupervisorId(supervisorId);

    const selectedSupervisor = supervisors.find((supervisor) => supervisor.uid === supervisorId);

    if (selectedSupervisor && selectedSupervisor.tasks) {
      const tasksArray = selectedSupervisor.tasks || [];

      const sortedTasks = tasksArray.sort((taskA, taskB) => {
        // Assign numerical values to priorities (high: 3, medium: 2, low: 1)
        const priorityValues = { high: 3, medium: 2, low: 1 };
        const priorityA = priorityValues[taskA.priority] || 0;
        const priorityB = priorityValues[taskB.priority] || 0;

        // Compare the priority values
        return priorityB - priorityA;
      });
      const filteredTasks = tasksArray.filter((task) => task.status === status);

      onFilterTasks(filteredTasks);

      // Set the selected supervisor's tasks
      setSelectedSupervisorTasks(filteredTasks);
    }
  };

  const filterAssignedTasks = async (supervisorId) => {
    setActiveFilter("assigned");
    setSelectedSupervisorId(supervisorId);

    const selectedSupervisor = supervisors.find((supervisor) => supervisor.uid === supervisorId);

    if (selectedSupervisor && selectedSupervisor.tasks) {
      const tasksArray = selectedSupervisor.tasks || [];

      const sortedTasks = tasksArray.sort((taskA, taskB) => {
        // Assign numerical values to priorities (high: 3, medium: 2, low: 1)
        const priorityValues = { high: 3, medium: 2, low: 1 };
        const priorityA = priorityValues[taskA.priority] || 0;
        const priorityB = priorityValues[taskB.priority] || 0;

        // Compare the priority values
        return priorityB - priorityA;
      });

      onFilterTasks(tasksArray);

      // Set the selected supervisor's tasks
      setSelectedSupervisorTasks(tasksArray);
    }
  };

  const clearFilter = () => {
    setActiveFilter(null);
    setSelectedSupervisorId(null);
    onFilterTasks([]);
    setSelectedSupervisorTasks([]);
  };

  const handleDeleteTask = async (taskId) => {
    try {
      // Create a copy of the tasks array without the task to be deleted
      const updatedTasks = tasks.filter((task) => task.id !== taskId);

      // Update the frontend state by removing the task
      setTasks(updatedTasks);

      // Update the tasks in Firestore
      const supervisorDocRef = doc(db, "supervisors", currentUser.uid);
      await updateDoc(supervisorDocRef, {
        tasks: updatedTasks,
      });

      setSuccessMessage("Task deleted successfully");
      setError(""); // Clear any previous error messages
      setTimeout(() => {
        setSuccessMessage("");
      }, 1000);
    } catch (err) {
      setError("Failed to delete task: " + err.message);
      console.error("Delete task error", err);
      setTimeout(() => {
        setSuccessMessage("");
      }, 1000);
    }
  };

  return (
    <div>
      <h2>Supervisor List</h2>
      {supervisors && supervisors.length > 0 ? (
        supervisors.map((supervisor) => {
          const supervisorStatistics = taskStatistics.find(
            (stats) => stats.supervisorId === supervisor.uid
          );

          return (
            <div
              key={supervisor.uid}
              style={{
                border: "1px solid #ccc",
                padding: "10px",
                marginBottom: "10px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
              className="bigbox"
              onClick={(event) =>{console.log("Supervisor box clicked with ID:", supervisor.uid); onSupervisorBoxClick(supervisor.uid, event)}}
            >
              <p>Name: {supervisor.name}</p>
              <p>Email: {supervisor.email}</p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    border: "1px solid #ccc",
                    padding: "5px",
                    marginRight: "5px",
                    cursor: "pointer",
                    backgroundColor:
                      selectedSupervisorId === supervisor.uid && activeFilter === "assigned"
                        ? "lightblue"
                        : "white",
                  }}
                  onClick={() => {
                    if (selectedSupervisorId === supervisor.uid && activeFilter === "assigned") {
                      // Clear the filter if the same box is clicked again
                      clearFilter();
                    } else {
                      // Set the filter for the new supervisor
                      filterAssignedTasks(supervisor.uid);
                    }
                  }}
                >
                  <p>No. of Tasks Assigned:</p>
                  <p>{supervisorStatistics?.numTasksAssigned}</p>
                </div>
                <div
                  style={{
                    border: "1px solid #ccc",
                    padding: "5px",
                    marginRight: "5px",
                    cursor: "pointer",
                    backgroundColor:
                      selectedSupervisorId === supervisor.uid && activeFilter === "pending"
                        ? "lightblue"
                        : "white",
                  }}
                  onClick={() => {
                    if (selectedSupervisorId === supervisor.uid && activeFilter === "pending") {
                      // Clear the filter if the same box is clicked again
                      clearFilter();
                    } else {
                      // Set the filter for the new supervisor
                      filterTasks(supervisor.uid, "pending");
                    }
                  }}
                >
                  <p>No. of Tasks Pending:</p>
                  <p>{supervisorStatistics?.numTasksPending}</p>
                </div>

                <div
                style={{
                  border: "1px solid #ccc",
                  padding: "5px",
                  marginRight: "5px",
                  cursor: "pointer",
                  backgroundColor:
                    selectedSupervisorId === supervisor.uid && activeFilter === "Work in Progress"
                      ? "lightblue"
                      : "white",
                }}
                onClick={() => {
                  if (selectedSupervisorId === supervisor.uid && activeFilter === "Work in Progress") {
                    // Clear the filter if the same box is clicked again
                    clearFilter();
                  } else {
                    // Set the filter for the new Supervisor
                    filterTasks(supervisor.uid, "Work in Progress"); // Change the status to match your data
                  }
                }}
              >
                <p>No. of Tasks in Progress:</p>
                <p>{supervisorStatistics?.numTasksInProgress}</p>
              </div>

                <div
                  style={{
                    border: "1px solid #ccc",
                    padding: "5px",
                    cursor: "pointer",
                    backgroundColor:
                      selectedSupervisorId === supervisor.uid && activeFilter === "completed"
                        ? "lightblue"
                        : "white",
                  }}
                  onClick={() => {
                    if (selectedSupervisorId === supervisor.uid && activeFilter === "completed") {
                      // Clear the filter if the same box is clicked again
                      clearFilter();
                    } else {
                      // Set the filter for the new supervisor
                      filterTasks(supervisor.uid, "completed");
                    }
                  }}
                >
                  <p>No. of Tasks Completed:</p>
                  <p>{supervisorStatistics?.numTasksCompleted}</p>
                </div>
              </div>
              {selectedSupervisorId === supervisor.uid && (
                <div>
                  {selectedSupervisorTasks.length > 0 ? (
                    <div>
                      <h2>Tasks</h2>
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
                          </tr>
                        </thead>
                        <tbody>
                          {selectedSupervisorTasks.map((task) => (
                            <tr key={task.id}>
                              <td>{task.project}</td>
                              <td>{task.task}</td>
                              <td>{task.subtask}</td>
                              <td>{task.members}</td>
                              <td>
                                {task.status === "completed" ? (
                                  <span>Completed</span>
                                ) : task.status === "pending" ? (
                                  <span>Pending</span>
                                ) : (
                                  <span>Work in Progress</span>
                                )}
                              </td>
                              <td>{task.endDate}</td>
                              <td>{task.priority}</td>
                              <td>
                                <button onClick={() => handleDeleteTask(task.id)}>Delete</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <p>No tasks available for the selected supervisor.</p>
                  )}
                </div>
              )}
            </div>
          );
        })
      ) : (
        <p>No supervisors available</p>
      )}
    </div>
  );
};

export default SupervisorList;
