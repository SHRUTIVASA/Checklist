import React, { useState, useEffect } from "react";
import { Card, Button, Alert, Table } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { doc, updateDoc, collection, addDoc, getDocs, getDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import TaskRow from "../TaskRow";

export default function EmployeeDashboard() {
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { currentUser, logout } = useAuth();
  const Navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [numTasksCompleted, setNumTasksCompleted] = useState(0);
  const [numTasksPending, setNumTasksPending] = useState(0);
  const [numTasksAssigned, setNumTasksAssigned] = useState(0);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [inProgressTasks, setInProgressTasks] = useState([]);


  const sortTasksByPriority = (taskA, taskB) => {
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    return priorityOrder[taskA.priority] - priorityOrder[taskB.priority];
  };

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

  const fetchTasks = async () => {
    try {
      const employeeDocRef = doc(db, "employees", currentUser.uid);
      const employeeDocSnapshot = await getDoc(employeeDocRef);

      if (employeeDocSnapshot.exists()) {
        const employeeDocData = employeeDocSnapshot.data();
        const employeeTasks = employeeDocData.tasks || [];

        setTasks(employeeTasks);

        // Calculate task statistics
        const completedTasks = employeeTasks.filter((task) => task.status === "completed").length;
        const pendingTasks = employeeTasks.filter((task) => task.status === "pending").length;
        const inProgressTasks = employeeTasks.filter((task) => task.status === "Work in Progress").length;
        const assignedTasks = employeeTasks.length;

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
  
  const handleDeleteTask = async (taskId) => {
    try {
      // Create a copy of the tasks array without the task to be deleted
      const updatedTasks = tasks.filter((task) => task.id !== taskId);

      // Update the frontend state by removing the task
      setTasks(updatedTasks);
      setNumTasksAssigned(numTasksAssigned - 1);

      const userDocRef = doc(db, "employees", currentUser.uid);
      await updateDoc(userDocRef, {
        tasks: updatedTasks,
      });

      setSuccessMessage("Task deleted successfully");
      setError("");
      setTimeout(() => {
        setSuccessMessage("");
      }, 1000); 
      fetchTasks();
    } catch (err) {
      setError("Failed to delete task");
      console.error("Delete task error", err);
    }
  };

  const handleMarkAsCompleted = async (taskId, newStatus) => {
    const collectionsToUpdate = ["employees", "supervisors", "teamleaders", "unitheads", "heads"];
  
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
                { merge: true } 
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
      const collectionsToUpdate = ["supervisors", "employees", "teamleaders", "unitheads", "heads"];
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
  
  return (
    <container>
      <Card>
        <Card.Body>
          <h2 className="text-center mb-4">Welcome, {currentUser.displayName}</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {successMessage && <Alert variant="success">{successMessage}</Alert>}
          <div className="mt-4">
            <div className="d-flex justify-content-between">
              <div>
                <h4>Task Statistics</h4>
              </div>
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
          </div>
        </Card.Body>
      </Card>
      <div className="w-100 text-center mt-2">
        <Button variant="link" onClick={handleLogout}>
          Log Out
        </Button>
      </div>
    </container>
  );
}
