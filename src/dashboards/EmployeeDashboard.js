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
          <Navbar expand="lg" variant="dark" className="flex-column vh-100" style={{ backgroundColor: '#001D44'}}>
            <Navbar.Brand>
              <img
                src={process.env.PUBLIC_URL + '/Logo.jpeg'}
                width="150"
                height="150"
                className="d-inline-block align-top"
              />
              <h4>Checklist App</h4>
            </Navbar.Brand>
            <Nav className="flex-column d-flex justify-content-center flex-grow-1">
              <Nav.Link active href="#">User Profile</Nav.Link>
              <Nav.Link active href="#">Change Password</Nav.Link>
            </Nav>
          </Navbar>
        </Col>
        {/* Main Content */}
        <Col sm={10}>
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
          <Col xs={12} md={3}>
          <Card style={{ width: '18rem' }}>
            <Card.Body>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img width="60" height="60" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAeElEQVR4nO3XwQnAIAwFULf7o+kITmQuncCLK3SBNr1JW3oVfsp/8PHgJYQQMSURkfVQzN9JTFDM63bM0BaI2/m4z61/dRkrk1uP1UEwz6CIRAf2NYMIi7rqqfvzDIpIdGBfMyjmYz9nwhUIhl/dYO8gmGdQRAK7AK47wM6aFldyAAAAAElFTkSuQmCC" alt="checklist"/>
                <div style={{ marginLeft: '20px' }}>
                  <Card.Title>Assigned Tasks</Card.Title>
                  <Card.Text>
                    {numTasksAssigned}
                  </Card.Text>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>        
        
          <Col xs={12} md={3}>
            <Card style={{ width: '18rem' }}>
              <Card.Body>
              <div style={{ display: 'flex', alignItems: 'center' }}>
              <img width="60" height="60" src={process.env.PUBLIC_URL + '/pending.svg'}></img>
              <div style={{ marginLeft: '20px' }}>
                <Card.Title>Pending Tasks</Card.Title>
                <Card.Text>
                  {numTasksPending}
                </Card.Text>
                </div>  
                </div>  
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} md={3}>
            <Card style={{ width: '18rem' }}>
              <Card.Body>
              <div style={{ display: 'flex', alignItems: 'center' }}>
              <img width="60" height="60" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAEtUlEQVR4nO1ZSWwcRRQt9jXswbE9vzoyBiMjBUL/33asIAMHxBFEwnYBwYFAuCCByAFlDhyI45n/Z8AQHOCAEBLbCQFKDixiuRCBEBGgEBBIhMUhkQhbYgIY/Z4Z01PuyXTPtO0c5klzKZer36v+exvTQQcdZIIeKlwExOiuA8qUJd4LyJ8BycuW5KFeX4bM2peOM0cTLMouIP5r2WXlpXXrJDNxPyD5waI80ueX7IKT7Q/KZ1jk9bnh4jkRAduVWA6LNycREBEybVG2uMLnFTks3hMSQHkxIuCBCiF+Jo0AW/sh7/OoeOvCCBgu9lqS36s3Pqpry4PipdUb/Ti6V23fEv+bXIhs8f3JEzIl7I3mTwaS23vosXNraxZlY/WBO2bJEq+zAV/t/n9/f/kkzy9cnAvkOov8LCAfOLJZ8evd/uSpmQlQ8pXDeWffqvHzdS03XDzFkuwG5G9auRAP5Y7QkRuLeMOM5o/PRIDevJJ3Regtda0YP63Vc5cOTpwOKGOW5J94IfykyQpKuiYCUJ7K7GBjjPV5jUX5M06EG9XShUq/dG8PFiAqApC3er5caTKGFxSHLfFvMU69v9svnJf6QCC5u/oa/7DI+UydqgFsUFobH7FaMCW7+omzLfELkQN3q/OZeQYQb45LdlFLSHdgwFdY4g812mjkyZLscpQBNwNrUIiNTsibzNEEIL7RohwGlB81R8Rm+noz+j5RAai3ooVZWNsg368ZNmvy1ahzeNZEUKaA+JLa3wcH8yeq87oiwiq2GbQk1qrSSSrrsr75mJD5tbPvuZjktiHRQ9Quc77cooUZkHzkBcWr5pn8jEXeNmfvXAGvmMWCazaOfb83MDK2JLq/NyjnYvZ+mikpjRjqKxqhXEdsh3wFM8cAykG35DbNAMQfODH4/bh9mtgA5a1Gjtge+QoA+Sc3H5hm0EOdVP5u7D7kbXNs1AmJ7ZBvWUBSaNSILYOrItolb1o1oTRTCE0uDUT8YpH/bp28ac+J68IoyidxXVYzEY3Iaw+QhAOg3NRSGM1hieYkMl/uarQ/uYjk5BWA8nzMOQ+aRAMq5M/TlBJafgDx3iMIeCdN5zbYTinRKryVsiq2NUTZn7bttMjrY87ZY0z+2NbKaZQdQPJts6amO+BrLP3vvEB8wKOJZWme15VVOa1Tt7qGBvnLJA2NR+VrgUR96OeuFZXmPw2AZDzGeQ/pLKqNllI2Zt3MpGsp5fHUh2msVlvUeFxb6189Pgg+7/ICvm/hmnreFx2otYyQPHGYGYH4C5MhLJZuCN90TATLZF7aO1S6MEL+oIqpvaV2BlsDI2NLKk18/OwUSCZMFgCUp13ylRG77NH2M+154VgyKN2pdVOj3AEor2U2WvRG82fZIZmEkc0XREQVqqLerq2pzzTq3nQs4lHxem0VAeXXJpn71XkNGpXPSTKticvDwsqQvM+Xu9PqitDw09J00noJUB7N7OYbYfZjBvLWWaLEG6okJuv2Jic+pWHULAT6/E1nAvFt0eIMUN4Myfi8Jo0AID6ktx79XLUosMRfKRk3Zjckj/wdID8czTOLCq1Ia/7gtoXVT6079ZtaaGpDZV87LtNBBx2YdvEfR+5N6Sog5CwAAAAASUVORK5CYII="></img>
              <div style={{ marginLeft: '20px' }}>
              <Card.Title>In Progress Tasks</Card.Title>
                <Card.Text>
                  {inProgressTasks}
                </Card.Text>
                </div>  
                </div>  
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} md={3}>
            <Card style={{ width: '18rem' }}>
              <Card.Body>
              <div style={{ display: 'flex', alignItems: 'center' }}>
              <img width="60" height="60" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAD/UlEQVR4nO2Zy08TQRzHOeg/U2gL+AR8HTVeVDx4MB4oT9/1ARE9mKgHH/GgRq3RiFFAKMj2/aYvSqGKilBUDGhbo1ESY90/4Gf2x8wCZdtgZ9mqYZLPabc738/MZL6HFhWtjP9wGAyG1W2d3LW2LsvMo27rzOMe21W/37+q6F8ZT4y2K+29duh45oTOPhc85dzQxbkvFyTMUMu2ndHmrZ+jLdtgsHmrJE96bNDe61gY2OQBo9VX2W32b+qx+aHXHoBnjiD0OUPAuQbA5I5A+OSmBYQoJ6ogpK9KhU9W7WAWiJzeksoMHBE4vUXkqckNXWYPdFt8YLT2Aw1s73iw29b+sJoGNnsHweKLgq1/GOz+2OLQ8wieqIKAvjLJLEBDf3sbA57nJZlb4RD0OcNgcg+A2RMBi3cQrL4hMbAj8BycwRfgCo2AO/wq6/e+xocgqK9E5NgBXOVskwnMBY5mCfwS3AOvwBN5Dd7BUfBF30D/0HjObwb0lYgiAuHY2Fzg0Ai4wpmBxzCwfzgOwdgEhJ6/hZcTH3MLHK9AmAUGTm0GgVyTLQf+4xXIvytwbCPCLBA+tRlvC6UF+o9tRNgFyDWnuMDRDQizAL2jlRbwHd2AsAuQUimEgPfIenYBIbxQKEoLeI+sl0mAFEohBDyH17ELBAok4Dm8TiYBUiiFEHAfWssuQBtR7oDXHSnQd0zDzI+05HMhvCwCtFDkDH+BS4Dq3Biozr2B2ocfsgq4/kaBi0L4s2OiwL67k5LvuQ6uQZgFaKHIEf6yJQnFQngisOvmO/j8XfoIOQ+uQZZV4MtMGnSGaThvTEA6nTv8JS6B4anAnluT+Pts7zubyhFmAVooUpMcuD0F2jMToD0Th5bOT1klLnFJKCHhBapv5g7P8zw4msqRZRVouj8tCmhb49AsITEbflwUWEp4XhBoLEOYBWihSE0iXIHCEaICmtY46B9/hJ/pX/j8ioWGnxXYc+N91jPPZ2BvLEOWVYBK1BimRAEN2YmLfUlQt9Lw47B3iSvPU4GGUoRZgBZKrslwJ+5NiQJqZFwUqL4xueSV5wm2hlJEEQFxJ4jEfIF8wvOCQL0WYRaghbKUSakEFcg3PM/zYK3XIooKUImGB1Ow/86HPzrzfKZAnQZhFsBGbCrPO0i+WOo0CLsAaUTFBWrVCLMANmJjmeIC5lo1wi5ACqUgAroSdgFsxIZSxQVMuhKEXYAUSiEEuJpidgFsxHqt4gJcTbFMAqRQEomEYuETiU/yCdBGjEajisLJJkAKJeY0wujoqCIM27vkEzDXaVLYiqRYzFKQG2MRJET+qNj/5DPXqXeYdCWpzNCSgcnNIQ+qpEmn2s4ssDJWxn8+fgOR9jh2p0beawAAAABJRU5ErkJggg=="></img>
              <div style={{ marginLeft: '20px' }}>
              <Card.Title>Completed Tasks</Card.Title>
                <Card.Text>
                  {numTasksCompleted}
                </Card.Text>
                </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
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
