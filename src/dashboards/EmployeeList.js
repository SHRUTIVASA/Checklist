import React, { useEffect, useState } from "react";
import { doc, updateDoc, collection, addDoc, getDocs, getDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { Table } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";

const EmployeeList = ({ employees, onFilterTasks, onEmployeeClick}) => {
  const [taskStatistics, setTaskStatistics] = useState([]);
  const [activeFilter, setActiveFilter] = useState({});
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedEmployeeTasks, setSelectedEmployeeTasks] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [tasks, setTasks] = useState([]);
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    const fetchTaskStatistics = async (employeeId) => {
      try {
        const EmployeeDocRef = doc(db, "employees", employeeId);
        const EmployeeDocSnapshot = await getDoc(EmployeeDocRef);
    
        if (EmployeeDocSnapshot.exists()) {
          const EmployeeData = EmployeeDocSnapshot.data();
          const tasksArray = EmployeeData.tasks || [];
    
          const numTasksCompleted = tasksArray.filter(
            (task) => task.status === "completed"
          ).length;
          const numTasksPending = tasksArray.filter(
            (task) => task.status === "pending"
          ).length;
          const numTasksInProgress = tasksArray.filter(
            (task) => task.status === "Work in Progress"
          ).length; // Calculate the number of tasks in progress
    
          const employeeStatistics = {
            employeeId,
            numTasksCompleted,
            numTasksPending,
            numTasksAssigned: tasksArray.length,
            numTasksInProgress, // Include the number of tasks in progress
          };
    
          setTaskStatistics((prevStatistics) => [...prevStatistics, employeeStatistics]);
        } else {
          console.error("Employee document does not exist");
        }
      } catch (err) {
        console.error("Error fetching task statistics:", err);
      }
    };    

    employees.forEach((employee) => {
      fetchTaskStatistics(employee.uid);
    });
  }, [employees]);

  const filterTasks = async (employeeId, status) => {
    setActiveFilter(status);
    setSelectedEmployeeId(employeeId);

    const selectedEmployee = employees.find((employee) => employee.uid === employeeId);

    if (selectedEmployee && selectedEmployee.tasks) {
      const tasksArray = selectedEmployee.tasks || [];

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

      // Set the selected employee's tasks
      setSelectedEmployeeTasks(filteredTasks);
    }
  };

  const filterAssignedTasks = async (employeeId) => {
    setActiveFilter("assigned");
    setSelectedEmployeeId(employeeId);
  
    const selectedEmployee = employees.find((employee) => employee.uid === employeeId);
  
    if (selectedEmployee && selectedEmployee.tasks) {
      const tasksArray = selectedEmployee.tasks || [];
  
      const sortedTasks = tasksArray.sort((taskA, taskB) => {
        // Assign numerical values to priorities (high: 3, medium: 2, low: 1)
        const priorityValues = { high: 3, medium: 2, low: 1 };
        const priorityA = priorityValues[taskA.priority] || 0;
        const priorityB = priorityValues[taskB.priority] || 0;
  
        // Compare the priority values
        return priorityB - priorityA;
      });

      onFilterTasks(tasksArray);
  
      // Set the selected employee's tasks
      setSelectedEmployeeTasks(tasksArray);
    }
  };
  

  const clearFilter = () => {
    setActiveFilter(null);
    setSelectedEmployeeId(null);
    onFilterTasks([]);
    setSelectedEmployeeTasks([]);
  };
    
  const handleEmployeeClick = (employeeId) => {
    onEmployeeClick(employeeId);
    const selectedEmployee = employees.find((employee) => employee.uid === employeeId);

    if (selectedEmployee) {
      setSelectedEmployeeTasks(selectedEmployee.tasks || []);
    }
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
      <h2>Employee List</h2>
      {employees && employees.length > 0 ? (
        employees.map((employee) => {
          const employeeStatistics = taskStatistics.find(
            (stats) => stats.employeeId === employee.uid
          );

          return (
            <div
              key={employee.uid}
              style={{
                border: "1px solid #ccc",
                padding: "10px",
                marginBottom: "10px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
            >
              <p>Name: {employee.name}</p>
              <p>Email: {employee.email}</p>
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
                      selectedEmployeeId === employee.uid && activeFilter === "assigned"
                        ? "lightblue"
                        : "white",
                  }}
                  onClick={() => {
                    if (selectedEmployeeId === employee.uid && activeFilter === "assigned") {
                      // Clear the filter if the same box is clicked again
                      clearFilter();
                    } else {
                      // Set the filter for the new employee
                      filterAssignedTasks(employee.uid);
                    }
                  }}
                >
                  <p>No. of Tasks Assigned:</p>
                  <p>{employeeStatistics?.numTasksAssigned}</p>
                </div>

                <div
                  style={{
                    border: "1px solid #ccc",
                    padding: "5px",
                    marginRight: "5px",
                    cursor: "pointer",
                    backgroundColor:
                      selectedEmployeeId === employee.uid && activeFilter === "pending"
                        ? "lightblue"
                        : "white",
                  }}
                  onClick={() => {
                    if (selectedEmployeeId === employee.uid && activeFilter === "pending") {
                      // Clear the filter if the same box is clicked again
                      clearFilter();
                    } else {
                      // Set the filter for the new employee
                      filterTasks(employee.uid, "pending");
                    }
                  }}
                >
                  <p>No. of Tasks Pending:</p>
                  <p>{employeeStatistics?.numTasksPending}</p>
                </div>
                <div
                style={{
                  border: "1px solid #ccc",
                  padding: "5px",
                  marginRight: "5px",
                  cursor: "pointer",
                  backgroundColor:
                    selectedEmployeeId === employee.uid && activeFilter === "Work in Progress"
                      ? "lightblue"
                      : "white",
                }}
                onClick={() => {
                  if (selectedEmployeeId === employee.uid && activeFilter === "Work in Progress") {
                    // Clear the filter if the same box is clicked again
                    clearFilter();
                  } else {
                    // Set the filter for the new employee
                    filterTasks(employee.uid, "Work in Progress"); // Change the status to match your data
                  }
                }}
              >
                <p>No. of Tasks in Progress:</p>
                <p>{employeeStatistics?.numTasksInProgress}</p>
              </div>

                <div
                  style={{
                    border: "1px solid #ccc",
                    padding: "5px",
                    cursor: "pointer",
                    backgroundColor:
                      selectedEmployeeId === employee.uid && activeFilter === "completed"
                        ? "lightblue"
                        : "white",
                  }}
                  onClick={() => {
                    if (selectedEmployeeId === employee.uid && activeFilter === "completed") {
                      // Clear the filter if the same box is clicked again
                      clearFilter();
                    } else {
                      // Set the filter for the new employee
                      filterTasks(employee.uid, "completed");
                    }
                  }}
                >
                  <p>No. of Tasks Completed:</p>
                  <p>{employeeStatistics?.numTasksCompleted}</p>
                </div>
              </div>
              {selectedEmployeeId === employee.uid && (
                <div>
                  {selectedEmployeeTasks.length > 0 ? (
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
                          {selectedEmployeeTasks.map((task) => (
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
                    <p>No tasks available for the selected employee.</p>
                  )}
                </div>
              )}

            </div>
          );
        })
      ) : (
        <p>No employees available</p>
      )}
    </div>
  );
};

export default EmployeeList;
