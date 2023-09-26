import React, { useEffect, useState } from "react";
import { doc, updateDoc, collection, addDoc, getDocs, getDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { Table } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";

const HeadList = ({ heads, onFilterTasks, onHeadClick, onHeadBoxClick }) => {
  const [taskStatistics, setTaskStatistics] = useState([]);
  const [activeFilter, setActiveFilter] = useState({});
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedHeadId, setSelectedHeadId] = useState(null);
  const [selectedHeadTasks, setSelectedHeadTasks] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [tasks, setTasks] = useState([]);
  const { currentUser, logout } = useAuth();

  const handleClick = (headId, event) => {
    if (onHeadClick) {
      onHeadClick(headId, event);
    }
  };

  useEffect(() => {
    const fetchTaskStatistics = async (headId) => {
      try {
        const HeadDocRef = doc(db, "heads", headId);
        const HeadDocSnapshot = await getDoc(HeadDocRef);

        if (HeadDocSnapshot.exists()) {
          const HeadData = HeadDocSnapshot.data();
          const tasksArray = HeadData.tasks || [];

          const numTasksCompleted = tasksArray.filter(
            (task) => task.status === "completed"
          ).length;
          const numTasksPending = tasksArray.filter(
            (task) => task.status === "pending"
          ).length;
          const numTasksInProgress = tasksArray.filter(
            (task) => task.status === "Work in Progress"
          ).length;

          const headStatistics = {
            headId,
            numTasksCompleted,
            numTasksPending,
            numTasksAssigned: tasksArray.length,
            numTasksInProgress,
          };

          setTaskStatistics((prevStatistics) => [...prevStatistics, headStatistics]);
        } else {
          console.error("Head document does not exist");
        }
      } catch (err) {
        console.error("Error fetching task statistics:", err);
      }
    };

    heads.forEach((head) => {
      fetchTaskStatistics(head.uid);
    });
  }, [heads]);

  const filterTasks = async (headId, status) => {
    setActiveFilter(status);
    setSelectedHeadId(headId);

    const selectedHead = heads.find((head) => head.uid === headId);

    if (selectedHead && selectedHead.tasks) {
      const tasksArray = selectedHead.tasks || [];

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

      // Set the selected head's tasks
      setSelectedHeadTasks(filteredTasks);
    }
  };

  const filterAssignedTasks = async (headId) => {
    setActiveFilter("assigned");
    setSelectedHeadId(headId);

    const selectedHead = heads.find((head) => head.uid === headId);

    if (selectedHead && selectedHead.tasks) {
      const tasksArray = selectedHead.tasks || [];

      const sortedTasks = tasksArray.sort((taskA, taskB) => {
        // Assign numerical values to priorities (high: 3, medium: 2, low: 1)
        const priorityValues = { high: 3, medium: 2, low: 1 };
        const priorityA = priorityValues[taskA.priority] || 0;
        const priorityB = priorityValues[taskB.priority] || 0;

        // Compare the priority values
        return priorityB - priorityA;
      });

      onFilterTasks(tasksArray);

      // Set the selected head's tasks
      setSelectedHeadTasks(tasksArray);
    }
  };

  const clearFilter = () => {
    setActiveFilter(null);
    setSelectedHeadId(null);
    onFilterTasks([]);
    setSelectedHeadTasks([]);
  };

  const handleDeleteTask = async (taskId) => {
    try {
      // Create a copy of the tasks array without the task to be deleted
      const updatedTasks = tasks.filter((task) => task.id !== taskId);

      // Update the frontend state by removing the task
      setTasks(updatedTasks);

      // Update the tasks in Firestore
      const headDocRef = doc(db, "heads", currentUser.uid);
      await updateDoc(headDocRef, {
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
      <h2>Head List</h2>
      {heads && heads.length > 0 ? (
        heads.map((head) => {
          const headStatistics = taskStatistics.find(
            (stats) => stats.headId === head.uid
          );

          return (
            <div
              key={head.uid}
              style={{
                border: "1px solid #ccc",
                padding: "10px",
                marginBottom: "10px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
              className="bigbox"
              onClick={(event) => { console.log("Head box clicked with ID:", head.uid); onHeadClick(head.uid, event) }}
            >
              <p>Name: {head.name}</p>
              <p>Email: {head.email}</p>
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
                      selectedHeadId === head.uid && activeFilter === "assigned"
                        ? "lightblue"
                        : "white",
                  }}
                  onClick={() => {
                    if (selectedHeadId === head.uid && activeFilter === "assigned") {
                      // Clear the filter if the same box is clicked again
                      clearFilter();
                    } else {
                      // Set the filter for the new head
                      filterAssignedTasks(head.uid);
                    }
                  }}
                >
                  <p>No. of Tasks Assigned:</p>
                  <p>{headStatistics?.numTasksAssigned}</p>
                </div>
                <div
                  style={{
                    border: "1px solid #ccc",
                    padding: "5px",
                    marginRight: "5px",
                    cursor: "pointer",
                    backgroundColor:
                      selectedHeadId === head.uid && activeFilter === "pending"
                        ? "lightblue"
                        : "white",
                  }}
                  onClick={() => {
                    if (selectedHeadId === head.uid && activeFilter === "pending") {
                      // Clear the filter if the same box is clicked again
                      clearFilter();
                    } else {
                      // Set the filter for the new head
                      filterTasks(head.uid, "pending");
                    }
                  }}
                >
                  <p>No. of Tasks Pending:</p>
                  <p>{headStatistics?.numTasksPending}</p>
                </div>

                <div
                  style={{
                    border: "1px solid #ccc",
                    padding: "5px",
                    marginRight: "5px",
                    cursor: "pointer",
                    backgroundColor:
                      selectedHeadId === head.uid && activeFilter === "Work in Progress"
                        ? "lightblue"
                        : "white",
                  }}
                  onClick={() => {
                    if (selectedHeadId === head.uid && activeFilter === "Work in Progress") {
                      // Clear the filter if the same box is clicked again
                      clearFilter();
                    } else {
                      // Set the filter for the new head
                      filterTasks(head.uid, "Work in Progress"); // Change the status to match your data
                    }
                  }}
                >
                  <p>No. of Tasks in Progress:</p>
                  <p>{headStatistics?.numTasksInProgress}</p>
                </div>

                <div
                  style={{
                    border: "1px solid #ccc",
                    padding: "5px",
                    cursor: "pointer",
                    backgroundColor:
                      selectedHeadId === head.uid && activeFilter === "completed"
                        ? "lightblue"
                        : "white",
                  }}
                  onClick={() => {
                    if (selectedHeadId === head.uid && activeFilter === "completed") {
                      // Clear the filter if the same box is clicked again
                      clearFilter();
                    } else {
                      // Set the filter for the new head
                      filterTasks(head.uid, "completed");
                    }
                  }}
                >
                  <p>No. of Tasks Completed:</p>
                  <p>{headStatistics?.numTasksCompleted}</p>
                </div>
              </div>
              {selectedHeadId === head.uid && (
                <div>
                  {selectedHeadTasks.length > 0 ? (
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
                          {selectedHeadTasks.map((task) => (
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
                    <p>No tasks available for the selected head.</p>
                  )}
                </div>
              )}
            </div>
          );
        })
      ) : (
        <p>No heads available</p>
      )}
    </div>
  );
};

export default HeadList;
