import React, { useEffect, useState } from "react";
import { doc, updateDoc, collection, addDoc, getDocs, getDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { Table } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";

const UnitHeadList = ({ unitHeads, onFilterTasks, onUnitHeadClick, onUnitHeadBoxClick }) => {
  const [taskStatistics, setTaskStatistics] = useState([]);
  const [activeFilter, setActiveFilter] = useState({});
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedUnitHeadId, setSelectedUnitHeadId] = useState(null);
  const [selectedUnitHeadTasks, setSelectedUnitHeadTasks] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [tasks, setTasks] = useState([]);
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    const fetchTaskStatistics = async (unitHeadId) => {
      try {
        const UnitHeadDocRef = doc(db, "unitheads", unitHeadId);
        const UnitHeadDocSnapshot = await getDoc(UnitHeadDocRef);

        if (UnitHeadDocSnapshot.exists()) {
          const UnitHeadData = UnitHeadDocSnapshot.data();
          const tasksArray = UnitHeadData.tasks || [];

          const numTasksCompleted = tasksArray.filter(
            (task) => task.status === "completed"
          ).length;
          const numTasksPending = tasksArray.filter(
            (task) => task.status === "pending"
          ).length;
          const numTasksInProgress = tasksArray.filter(
            (task) => task.status === "Work in Progress"
          ).length;

          const unitHeadStatistics = {
            unitHeadId,
            numTasksCompleted,
            numTasksPending,
            numTasksAssigned: tasksArray.length,
            numTasksInProgress,
          };

          setTaskStatistics((prevStatistics) => [...prevStatistics, unitHeadStatistics]);
        } else {
          console.error("Unit Head document does not exist");
        }
      } catch (err) {
        console.error("Error fetching task statistics:", err);
      }
    };

    unitHeads.forEach((unitHead) => {
      fetchTaskStatistics(unitHead.uid);
    });
  }, [unitHeads]);

  const filterTasks = async (unitHeadId, status) => {
    setActiveFilter(status);
    setSelectedUnitHeadId(unitHeadId);

    const selectedUnitHead = unitHeads.find((unitHead) => unitHead.uid === unitHeadId);

    if (selectedUnitHead && selectedUnitHead.tasks) {
      const tasksArray = selectedUnitHead.tasks || [];

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

      // Set the selected unit head's tasks
      setSelectedUnitHeadTasks(filteredTasks);
    }
  };

  const filterAssignedTasks = async (unitHeadId) => {
    setActiveFilter("assigned");
    setSelectedUnitHeadId(unitHeadId);

    const selectedUnitHead = unitHeads.find((unitHead) => unitHead.uid === unitHeadId);

    if (selectedUnitHead && selectedUnitHead.tasks) {
      const tasksArray = selectedUnitHead.tasks || [];

      const sortedTasks = tasksArray.sort((taskA, taskB) => {
        // Assign numerical values to priorities (high: 3, medium: 2, low: 1)
        const priorityValues = { high: 3, medium: 2, low: 1 };
        const priorityA = priorityValues[taskA.priority] || 0;
        const priorityB = priorityValues[taskB.priority] || 0;

        // Compare the priority values
        return priorityB - priorityA;
      });

      onFilterTasks(tasksArray);

      // Set the selected unit head's tasks
      setSelectedUnitHeadTasks(tasksArray);
    }
  };

  const clearFilter = () => {
    setActiveFilter(null);
    setSelectedUnitHeadId(null);
    onFilterTasks([]);
    setSelectedUnitHeadTasks([]);
  };

  const handleDeleteTask = async (taskId) => {
    try {
      // Create a copy of the tasks array without the task to be deleted
      const updatedTasks = tasks.filter((task) => task.id !== taskId);

      // Update the frontend state by removing the task
      setTasks(updatedTasks);

      // Update the tasks in Firestore
      const unitHeadDocRef = doc(db, "unitHeads", currentUser.uid);
      await updateDoc(unitHeadDocRef, {
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
      <h2>Unit Head List</h2>
      {unitHeads && unitHeads.length > 0 ? (
        unitHeads.map((unitHead) => {
          const unitHeadStatistics = taskStatistics.find(
            (stats) => stats.unitHeadId === unitHead.uid
          );

          return (
            <div
              key={unitHead.uid}
              style={{
                border: "1px solid #ccc",
                padding: "10px",
                marginBottom: "10px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
              className="bigbox"
              onClick={(event) => { console.log("Unit Head box clicked with ID:", unitHead.uid); onUnitHeadClick(unitHead.uid, event) }}
            >
              <p>Name: {unitHead.name}</p>
              <p>Email: {unitHead.email}</p>
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
                      selectedUnitHeadId === unitHead.uid && activeFilter === "assigned"
                        ? "lightblue"
                        : "white",
                  }}
                  onClick={() => {
                    if (selectedUnitHeadId === unitHead.uid && activeFilter === "assigned") {
                      // Clear the filter if the same box is clicked again
                      clearFilter();
                    } else {
                      // Set the filter for the new unit head
                      filterAssignedTasks(unitHead.uid);
                    }
                  }}
                >
                  <p>No. of Tasks Assigned:</p>
                  <p>{unitHeadStatistics?.numTasksAssigned}</p>
                </div>
                <div
                  style={{
                    border: "1px solid #ccc",
                    padding: "5px",
                    marginRight: "5px",
                    cursor: "pointer",
                    backgroundColor:
                      selectedUnitHeadId === unitHead.uid && activeFilter === "pending"
                        ? "lightblue"
                        : "white",
                  }}
                  onClick={() => {
                    if (selectedUnitHeadId === unitHead.uid && activeFilter === "pending") {
                      // Clear the filter if the same box is clicked again
                      clearFilter();
                    } else {
                      // Set the filter for the new unit head
                      filterTasks(unitHead.uid, "pending");
                    }
                  }}
                >
                  <p>No. of Tasks Pending:</p>
                  <p>{unitHeadStatistics?.numTasksPending}</p>
                </div>

                <div
                  style={{
                    border: "1px solid #ccc",
                    padding: "5px",
                    marginRight: "5px",
                    cursor: "pointer",
                    backgroundColor:
                      selectedUnitHeadId === unitHead.uid && activeFilter === "Work in Progress"
                        ? "lightblue"
                        : "white",
                  }}
                  onClick={() => {
                    if (selectedUnitHeadId === unitHead.uid && activeFilter === "Work in Progress") {
                      // Clear the filter if the same box is clicked again
                      clearFilter();
                    } else {
                      // Set the filter for the new unit head
                      filterTasks(unitHead.uid, "Work in Progress"); // Change the status to match your data
                    }
                  }}
                >
                  <p>No. of Tasks in Progress:</p>
                  <p>{unitHeadStatistics?.numTasksInProgress}</p>
                </div>

                <div
                  style={{
                    border: "1px solid #ccc",
                    padding: "5px",
                    cursor: "pointer",
                    backgroundColor:
                      selectedUnitHeadId === unitHead.uid && activeFilter === "completed"
                        ? "lightblue"
                        : "white",
                  }}
                  onClick={() => {
                    if (selectedUnitHeadId === unitHead.uid && activeFilter === "completed") {
                      // Clear the filter if the same box is clicked again
                      clearFilter();
                    } else {
                      // Set the filter for the new unit head
                      filterTasks(unitHead.uid, "completed");
                    }
                  }}
                >
                  <p>No. of Tasks Completed:</p>
                  <p>{unitHeadStatistics?.numTasksCompleted}</p>
                </div>
              </div>
              {selectedUnitHeadId === unitHead.uid && (
                <div>
                  {selectedUnitHeadTasks.length > 0 ? (
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
                          {selectedUnitHeadTasks.map((task) => (
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
                    <p>No tasks available for the selected unit head.</p>
                  )}
                </div>
              )}
            </div>
          );
        })
      ) : (
        <p>No unit heads available</p>
      )}
    </div>
  );
};

export default UnitHeadList;
