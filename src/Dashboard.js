import React, { useState, useEffect } from "react";
import { Card, Button, Alert, Table } from "react-bootstrap";
import { useAuth } from "./contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  doc,
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  getDoc,
  arrayUnion, // Import arrayUnion
} from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';
import { db } from "./firebase";

export default function Dashboard() {
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { currentUser, logout } = useAuth();
  const Navigate = useNavigate();

  const [tasks, setTasks] = useState([]);

  const handleLogout = async () => {
    setError("");
    try {
      await logout();
      Navigate("/login");
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

  const handleAddTask = async (e, taskFormData) => {
    try {
      e.preventDefault();
      console.log("Current User UID:", currentUser.uid);
      const newTask = {
        id: uuidv4(),
        project: taskFormData.project,
        task: taskFormData.task,
        subtask: taskFormData.subtask,
        members: taskFormData.members,
        status: "pending",
        endDate: taskFormData.endDate,
        priority: taskFormData.priority,
      };

      setTasks((prevTasks) => [...prevTasks, newTask]);

      const userDocRef = doc(db, "users", currentUser.uid);
      const userDocSnapshot = await getDoc(userDocRef);
      console.log("User Doc Snapshot:", userDocSnapshot.exists());

      if (userDocSnapshot.exists()) {
        const userDocData = userDocSnapshot.data();
        console.log("User Doc Data:", userDocData);
        // Get the existing tasks array or initialize it as an empty array
        const userTasks = userDocData.tasks || [];
  
        // Add the new task to the tasks array
        userTasks.push(newTask);
  
        // Update the 'tasks' array in the user's document
        await updateDoc(userDocRef, {
          tasks: userTasks,
        });
  
        setTaskFormData({
          project: "",
          task: "",
          subtask: "",
          members: "",
          endDate: "",
          priority: "low",
        });
  
        console.log("Task added to user's document");
        setSuccessMessage("Task added successfully");
        setError(""); // Clear any previous error messages
      } else {
        setError("User document does not exist.");
      }
    } catch (err) {
      setError("Failed to add task");
      console.error("Add task error", err);
    }
  };
  const handleToggleStatus = async (taskId) => {
    try {
      const updatedTasks = tasks.map((task) => {
        if (task.id === taskId) {
          // Toggle the status between "completed" and "pending"
          return {
            ...task,
            status: task.status === "completed" ? "pending" : "completed",
          };
        }
        return task;
      });

      // Update the frontend state
      setTasks(updatedTasks);

      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        tasks: updatedTasks,
      });

      setSuccessMessage("Task status updated successfully");
      setError(""); // Clear any previous error messages
    } catch (err) {
      setError("Failed to update task status");
      console.error("Update task status error", err);
    }
  };
  

  // const handleEditTask = async (taskId, updatedtaskFormData) => {
  //   try {
  //     const userDocRef = doc(db, "users", currentUser.uid);
  //     const userDocSnapshot = await getDoc(userDocRef);

  //     if (userDocSnapshot.exists()) {
  //       const userDocData = userDocSnapshot.data();

  //       // Find the task to update within the 'tasks' array
  //       const updatedTasks = userDocData.tasks.map((task) => {
  //         if (task.id === taskId) {
  //           return {
  //             ...task,
  //             ...updatedtaskFormData,
  //           };
  //         }
  //         return task;
  //       });

  //       // Update the 'tasks' array with the modified array
  //       await updateDoc(userDocRef, {
  //         tasks: updatedTasks,
  //       });
  //     }
  //   } catch (err) {
  //     setError("Failed to edit task");
  //     console.error("Edit task error", err);
  //   }
  // };

  const handleDeleteTask = async (taskId) => {
    try {
      // Create a copy of the tasks array without the task to be deleted
      const updatedTasks = tasks.filter((task) => task.id !== taskId);
  
      // Update the frontend state by removing the task
      setTasks(updatedTasks);
  
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        tasks: updatedTasks,
      });
  
      setSuccessMessage("Task deleted successfully");
      setError(""); // Clear any previous error messages
    } catch (err) {
      setError("Failed to delete task");
      console.error("Delete task error", err);
    }
  };
  

  // Fetch tasks and populate the 'tasks' state

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnapshot = await getDoc(userDocRef);

        if (userDocSnapshot.exists()) {
          const userDocData = userDocSnapshot.data();
          const userTasks = userDocData.tasks || [];

          setTasks(userTasks);
        }
      } catch (err) {
        setError("Failed to fetch tasks");
        console.error("Fetch tasks error", err);
      }
    };

    if (currentUser) {
      fetchTasks();
    }
  }, [currentUser]);

  const sortTasksByPriority = (taskA, taskB) => {
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    return priorityOrder[taskA.priority] - priorityOrder[taskB.priority];
  };

  const numTasksCompleted = tasks.filter((task) => task.status === "completed").length;
  const numTasksPending = tasks.filter((task) => task.status === "pending").length;
  const numTasksAssigned = tasks.length;

  return (
    <container>
      <Card>
        <Card.Body>
          <h2 className="text-center mb-4">Welcome, {currentUser.displayName}</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {successMessage && <Alert variant="success">{successMessage}</Alert>}
          <div className="mb-3">
            <h4>Add Task</h4>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const taskFormData = {
                  project: formData.get("project"),
                  task: formData.get("task"),
                  subtask: formData.get("subtask"),
                  members: formData.get("members"),
                  endDate: formData.get("endDate"),
                  priority: formData.get("priority"),
                };
                handleAddTask(e, taskFormData);
              }}
            >
              <div className="mb-3">
                <label htmlFor="project" className="form-label">
                  Project
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="project"
                  name="project"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="task" className="form-label">
                  Task
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="task"
                  name="task"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="subtask" className="form-label">
                  Subtask
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="subtask"
                  name="subtask"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="members" className="form-label">
                  Members
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="members"
                  name="members"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="endDate" className="form-label">
                  End Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  id="endDate"
                  name="endDate"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="priority" className="form-label">
                  Priority
                </label>
                <select
                  className="form-select"
                  id="priority"
                  name="priority"
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary">
                Add Task
              </button>
            </form>
          </div>
        </Card.Body>
      </Card>
      <div className="w-100 text-center mt-2">
        <Button variant="link" onClick={handleLogout}>
          Log Out
        </Button>
      </div>
      <div className="mt-4">
      <div className="d-flex justify-content-between">
      <div>
        <h4>Task Statistics</h4>
      </div>
      <div>
        <div>
          <strong>No. of Tasks Completed: </strong>
          {numTasksCompleted}
        </div>
        <div>
          <strong>No. of Tasks Pending: </strong>
          {numTasksPending}
        </div>
        <div>
          <strong>No. of Tasks Assigned: </strong>
          {numTasksAssigned}
        </div>
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
            </tr>
          </thead>
          <tbody>
            {tasks.slice()
            .sort(sortTasksByPriority).map((task) => (
              <tr key={task.id}>
                <td>{task.project}</td>
                <td>{task.task}</td>
                <td>{task.subtask}</td>
                <td>{task.members}</td>
                <td>
                {task.status === "completed" ? (
                  <span>Completed</span>
                ) : (
                  <span>Pending</span>
                )}
              </td>
              <td>{task.endDate}</td>
              <td>{task.priority}</td>
                {/*<td>
                  <button onClick={() => handleEditTask(task.id, { subtask: "new value" })}>Edit</button>
                </td>*/}
                <td>
                  <button onClick={() => handleDeleteTask(task.id)}>Delete</button>
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={task.status === "completed"}
                    onChange={() => handleToggleStatus(task.id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </container>
  );
}
