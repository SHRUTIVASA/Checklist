import React, { useEffect, useState } from "react";
import { doc, updateDoc, collection, addDoc, getDocs, getDoc, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { Table } from "react-bootstrap";
import { useAuth } from "./contexts/AuthContext";

const TeamLeaderList = ({ teamLeaders, onFilterTasks, onTeamLeaderClick, onTeamLeaderBoxClick }) => {
  const [taskStatistics, setTaskStatistics] = useState([]);
  const [activeFilter, setActiveFilter] = useState({});
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedTeamLeaderId, setSelectedTeamLeaderId] = useState(null);
  const [selectedTeamLeaderTasks, setSelectedTeamLeaderTasks] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [tasks, setTasks] = useState([]);
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    const fetchTaskStatistics = async (teamLeaderId) => {
      try {
        const TeamLeaderDocRef = doc(db, "teamleaders", teamLeaderId);
        const TeamLeaderDocSnapshot = await getDoc(TeamLeaderDocRef);

        if (TeamLeaderDocSnapshot.exists()) {
          const TeamLeaderData = TeamLeaderDocSnapshot.data();
          const tasksArray = TeamLeaderData.tasks || [];

          const numTasksCompleted = tasksArray.filter(
            (task) => task.status === "completed"
          ).length;
          const numTasksPending = tasksArray.filter(
            (task) => task.status === "pending"
          ).length;
          const numTasksInProgress = tasksArray.filter(
            (task) => task.status === "Work in Progress"
          ).length;

          const teamLeaderStatistics = {
            teamLeaderId,
            numTasksCompleted,
            numTasksPending,
            numTasksAssigned: tasksArray.length,
            numTasksInProgress,
          };

          setTaskStatistics((prevStatistics) => [...prevStatistics, teamLeaderStatistics]);
        } else {
          console.error("Team Leader document does not exist");
        }
      } catch (err) {
        console.error("Error fetching task statistics:", err);
      }
    };

    teamLeaders.forEach((teamLeader) => {
      fetchTaskStatistics(teamLeader.uid);
    });
  }, [teamLeaders]);

  const filterTasks = async (teamLeaderId, status) => {
    setActiveFilter(status);
    setSelectedTeamLeaderId(teamLeaderId);

    const selectedTeamLeader = teamLeaders.find((teamLeader) => teamLeader.uid === teamLeaderId);

    if (selectedTeamLeader && selectedTeamLeader.tasks) {
      const tasksArray = selectedTeamLeader.tasks || [];

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

      // Set the selected team leader's tasks
      setSelectedTeamLeaderTasks(filteredTasks);
    }
  };

  const filterAssignedTasks = async (teamLeaderId) => {
    setActiveFilter("assigned");
    setSelectedTeamLeaderId(teamLeaderId);

    const selectedTeamLeader = teamLeaders.find((teamLeader) => teamLeader.uid === teamLeaderId);

    if (selectedTeamLeader && selectedTeamLeader.tasks) {
      const tasksArray = selectedTeamLeader.tasks || [];

      const sortedTasks = tasksArray.sort((taskA, taskB) => {
        // Assign numerical values to priorities (high: 3, medium: 2, low: 1)
        const priorityValues = { high: 3, medium: 2, low: 1 };
        const priorityA = priorityValues[taskA.priority] || 0;
        const priorityB = priorityValues[taskB.priority] || 0;

        // Compare the priority values
        return priorityB - priorityA;
      });

      onFilterTasks(tasksArray);

      // Set the selected team leader's tasks
      setSelectedTeamLeaderTasks(tasksArray);
    }
  };

  const clearFilter = () => {
    setActiveFilter(null);
    setSelectedTeamLeaderId(null);
    onFilterTasks([]);
    setSelectedTeamLeaderTasks([]);
  };

  const handleTeamLeaderClick = (teamLeaderId) => {
    const selectedTeamLeader = teamLeaders.find((teamLeader) => teamLeader.uid === teamLeaderId);

    if (selectedTeamLeader) {
      setSelectedTeamLeaderTasks(selectedTeamLeader.tasks || []);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      // Create a copy of the tasks array without the task to be deleted
      const updatedTasks = tasks.filter((task) => task.id !== taskId);

      // Update the frontend state by removing the task
      setTasks(updatedTasks);

      // Update the tasks in Firestore
      const teamLeaderDocRef = doc(db, "teamLeaders", currentUser.uid);
      await updateDoc(teamLeaderDocRef, {
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
      <h2>Team Leader List</h2>
      {teamLeaders && teamLeaders.length > 0 ? (
        teamLeaders.map((teamLeader) => {
          const teamLeaderStatistics = taskStatistics.find(
            (stats) => stats.teamLeaderId === teamLeader.uid
          );

          return (
            <div
              key={teamLeader.uid}
              style={{
                border: "1px solid #ccc",
                padding: "10px",
                marginBottom: "10px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
              className="bigbox"
              onClick={(event) =>{console.log("Team Leader box clicked with ID:", teamLeader.uid); onTeamLeaderBoxClick(teamLeader.uid, event)}}
            >
              <p>Name: {teamLeader.name}</p>
              <p>Email: {teamLeader.email}</p>
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
                      selectedTeamLeaderId === teamLeader.uid && activeFilter === "assigned"
                        ? "lightblue"
                        : "white",
                  }}
                  onClick={() => {
                    if (selectedTeamLeaderId === teamLeader.uid && activeFilter === "assigned") {
                      // Clear the filter if the same box is clicked again
                      clearFilter();
                    } else {
                      // Set the filter for the new team leader
                      filterAssignedTasks(teamLeader.uid);
                    }
                  }}
                >
                  <p>No. of Tasks Assigned:</p>
                  <p>{teamLeaderStatistics?.numTasksAssigned}</p>
                </div>
                <div
                  style={{
                    border: "1px solid #ccc",
                    padding: "5px",
                    marginRight: "5px",
                    cursor: "pointer",
                    backgroundColor:
                      selectedTeamLeaderId === teamLeader.uid && activeFilter === "pending"
                        ? "lightblue"
                        : "white",
                  }}
                  onClick={() => {
                    if (selectedTeamLeaderId === teamLeader.uid && activeFilter === "pending") {
                      // Clear the filter if the same box is clicked again
                      clearFilter();
                    } else {
                      // Set the filter for the new team leader
                      filterTasks(teamLeader.uid, "pending");
                    }
                  }}
                >
                  <p>No. of Tasks Pending:</p>
                  <p>{teamLeaderStatistics?.numTasksPending}</p>
                </div>

                <div
                style={{
                  border: "1px solid #ccc",
                  padding: "5px",
                  marginRight: "5px",
                  cursor: "pointer",
                  backgroundColor:
                    selectedTeamLeaderId === teamLeader.uid && activeFilter === "Work in Progress"
                      ? "lightblue"
                      : "white",
                }}
                onClick={() => {
                  if (selectedTeamLeaderId === teamLeader.uid && activeFilter === "Work in Progress") {
                    // Clear the filter if the same box is clicked again
                    clearFilter();
                  } else {
                    // Set the filter for the new Team Leader
                    filterTasks(teamLeader.uid, "Work in Progress"); // Change the status to match your data
                  }
                }}
              >
                <p>No. of Tasks in Progress:</p>
                <p>{teamLeaderStatistics?.numTasksInProgress}</p>
              </div>

                <div
                  style={{
                    border: "1px solid #ccc",
                    padding: "5px",
                    cursor: "pointer",
                    backgroundColor:
                      selectedTeamLeaderId === teamLeader.uid && activeFilter === "completed"
                        ? "lightblue"
                        : "white",
                  }}
                  onClick={() => {
                    if (selectedTeamLeaderId === teamLeader.uid && activeFilter === "completed") {
                      // Clear the filter if the same box is clicked again
                      clearFilter();
                    } else {
                      // Set the filter for the new team leader
                      filterTasks(teamLeader.uid, "completed");
                    }
                  }}
                >
                  <p>No. of Tasks Completed:</p>
                  <p>{teamLeaderStatistics?.numTasksCompleted}</p>
                </div>
              </div>
              {selectedTeamLeaderId === teamLeader.uid && (
                <div>
                  {selectedTeamLeaderTasks.length > 0 ? (
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
                          {selectedTeamLeaderTasks.map((task) => (
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
                    <p>No tasks available for the selected team leader.</p>
                  )}
                </div>
              )}
            </div>
          );
        })
      ) : (
        <p>No team leaders available</p>
      )}
    </div>
  );
};

export default TeamLeaderList;
