import React, { useState, useEffect } from "react";
import { Alert, Table, Container, Row, Col, Button, Nav, Navbar, Card } from "react-bootstrap";
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
  const [deleteTaskLoading, setDeleteTaskLoading] = useState(false);
  const [markAsCompletedLoading, setMarkAsCompletedLoading] = useState(false);
  const [changeStatusToInProgressLoading, setChangeStatusToInProgressLoading] = useState(false);
  const [userData, setUserData] = useState({});

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

  const fetchUserData = async () => {
    try {
      const userDocRef = doc(db, "employees", currentUser.uid);
      const userDocSnapshot = await getDoc(userDocRef);

      if (userDocSnapshot.exists()) {
        const userDocData = userDocSnapshot.data();
        setUserData(userDocData);
      }
    } catch (err) {
      setError("Failed to fetch user data");
      console.error("Fetch user data error", err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchUserData();
    }
  }, [currentUser]);

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
      setMarkAsCompletedLoading(true);
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
    } finally {
      setMarkAsCompletedLoading(false);
    }
  };

  const handleChangeStatusToInProgress = async (taskId) => {
    try {
      setChangeStatusToInProgressLoading(true);
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
                { merge: true }
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
    } finally {
      setChangeStatusToInProgressLoading(false);
    }
  };

  return (
    <Container fluid>
      <Row>
        {/* Side Navigation */}
        <Col sm={2} className="bg-primary text-white p-0">
          <Navbar expand="lg" variant="dark" className="flex-column vh-100">
            <Navbar.Brand>
              {/* <img
                src="https://www.adobe.com/content/dam/cc/us/en/creativecloud/design/discover/mascot-logo-design/mascot-logo-design_fb-img_1200x800.jpg"
                width="300"
                height="200"
                className="d-inline-block align-top"
                alt="Company Logo"
              /> */}
              <h4>Company Logo</h4>
            </Navbar.Brand>
            <Nav className="flex-column d-flex justify-content-center flex-grow-1">
              <Nav.Link active href="#">User Profile</Nav.Link>
              <Nav.Link active href="#">Change Password</Nav.Link>
            </Nav>
          </Navbar>
        </Col>
        {/* Main Content */}
        <Col sm={9}>
    <Container className="border p-4" style={{ marginTop: "80px"}}>
      <Row className="w-100 text-center mb-4">
        <Col>
          <h2 className="text-primary">Welcome, {userData.name}</h2>
        </Col>
      </Row>
      {error && (
        <Row>
          <Col>
            <Alert variant="danger">{error}</Alert>
          </Col>
        </Row>
      )}
      {successMessage && (
        <Row>
          <Col>
            <Alert variant="success">{successMessage}</Alert>
          </Col>
        </Row>
      )}
      <Row className="mt-4">
        <Col>
          <h4 className="text-dark text-center">Task Statistics</h4>
          <Row className="mt-4">
            <Card style={{ width: '18rem' }}>
              <Card.Body>
                <Card.Title>Assigned Tasks</Card.Title>
                <Card.Text>
                  {numTasksAssigned}
                </Card.Text>
              </Card.Body>
            </Card>
            <Card style={{ width: '18rem' }}>
              <Card.Body>
                <Card.Title>Pending Tasks</Card.Title>
                <Card.Text>
                  {numTasksPending}
                </Card.Text>
              </Card.Body>
            </Card>
            <Card style={{ width: '18rem' }}>
              <Card.Body>
                <Card.Title>In Progress Tasks</Card.Title>
                <Card.Text>
                  {inProgressTasks}
                </Card.Text>
              </Card.Body>
            </Card>
            <Card style={{ width: '18rem' }}>
              <Card.Body>
                <Card.Title>Completed Tasks</Card.Title>
                <Card.Text>
                  {numTasksCompleted}
                </Card.Text>
              </Card.Body>
            </Card>
          </Row>
        </Col>
      </Row>
      <Row className="mt-4">
        <Col>
          <h4 className="text-dark text-center">Task Table</h4>
          {/* <div className="table-responsive"> */}
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
                  .map((task, index) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onMarkAsCompleted={handleMarkAsCompleted}
                      onChangeStatus={handleChangeStatusToInProgress}
                      style={{ backgroundColor: index % 2 === 0 ? "#3A6EFD" : "" }}
                    />
                  ))}
              </tbody>
            </Table>
          {/* </div> */}
        </Col>
      </Row>
      <Row className="w-100 text-center mt-2">
        <Col>
          <Button variant="primary" onClick={handleLogout}>
            Log Out
          </Button>
        </Col>
      </Row>
    </Container>
    </Col>
      </Row>
    </Container>
  );
}
