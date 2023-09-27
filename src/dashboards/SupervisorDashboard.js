import React, { useState, useEffect } from "react";
import { Card, Button, Alert, Table, Form, Modal } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { doc, updateDoc, collection, addDoc, getDocs, getDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { v4 as uuidv4 } from "uuid";
import EmployeeList from "../EmployeeList";
import TaskRow from "../TaskRow";

export default function SupervisorDashboard() {
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { currentUser, logout } = useAuth();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]); // Store employee data
  const [selectedEmployeeUIDs, setSelectedEmployeeUIDs] = useState([]); // Track selected employees' UIDs
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [numTasksCompleted, setNumTasksCompleted] = useState(0);
  const [numTasksPending, setNumTasksPending] = useState(0);
  const [numTasksAssigned, setNumTasksAssigned] = useState(0);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [inProgressTasks, setInProgressTasks] = useState([]);
  const [selectedEmployeeTasks, setSelectedEmployeeTasks] = useState([]);
  const [projectNames, setProjectNames] = useState([]);
  const [taskNames, setTaskNames] = useState([]);
  const [subtaskNames, setSubtaskNames] = useState([]);

  const [filteredTasks, setFilteredTasks] = useState([]); 

  const onFilterTasks = (status) => {
    const filteredTasks = tasks.filter((task) => task.status === status);
    setFilteredTasks(filteredTasks);
  };

  const filterTasks = (status) => {
    onFilterTasks(status);
  };
    
  // Fetch project names and task names from the supervisors collection
  useEffect(() => {
    const fetchProjectAndTaskNames = async () => {
      try {
        const supervisorsDocRef = doc(db, "supervisors", currentUser.uid);
        const supervisorsDocSnapshot = await getDoc(supervisorsDocRef);

        if (supervisorsDocSnapshot.exists()) {
          const supervisorsData = supervisorsDocSnapshot.data();

          if (supervisorsData.tasks && supervisorsData.tasks.length > 0) {
            // Extract project names from tasks
            const extractedProjectNames = supervisorsData.tasks.map((task) => task.project);
            // Remove duplicates using Set
            const uniqueProjectNames = [...new Set(extractedProjectNames)];
            setProjectNames(uniqueProjectNames);
          }

          if (supervisorsData.tasks && supervisorsData.tasks.length > 0) {
            // Extract task names from tasks
            const extractedTaskNames = supervisorsData.tasks.map((task) => task.task);
            // Remove duplicates using Set
            const uniqueTaskNames = [...new Set(extractedTaskNames)];
            setTaskNames(uniqueTaskNames);
          }

          if (supervisorsData.tasks && supervisorsData.tasks.length > 0) {
            // Extract subtask names from tasks
            const extractedSubtaskNames = supervisorsData.tasks.map((task) => task.subtask);
            // Remove duplicates using Set
            const uniqueSubtaskNames = [...new Set(extractedSubtaskNames)];
            setSubtaskNames(uniqueSubtaskNames);
          }

        }
      } catch (err) {
        setError("Failed to fetch project and task names: " + err.message);
        console.error("Fetch project and task names error", err);
      }
    };

    fetchProjectAndTaskNames();
  }, [currentUser]);


  const sortTasksByPriority = (taskA, taskB) => {
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    return priorityOrder[taskA.priority] - priorityOrder[taskB.priority];
  };

  const handleEmployeeClick = (employeeId) => {
    setSelectedEmployeeId(employeeId);
  };

  // Set the role to "Supervisor" when the user logs in
  useEffect(() => {
    if (currentUser) {
      currentUser.role = "Supervisor";
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

  const [taskFormData, setTaskFormData] = useState({
    project: "",
    task: "",
    subtask: "",
    members: "",
    endDate: "",
    priority: "low",
  });

  const handleAddTask = async (e) => {
    try {
      e.preventDefault();
      const taskId = uuidv4();
      const priority = taskFormData.priority;
      console.log("Selected Priority:", priority);
      if (!["low", "medium", "high"].includes(priority)) {
        setError("Invalid priority selected");
        return;
      }
      // Check if the user is authenticated
      if (!currentUser) {
        setError("Please log in to assign tasks.");
        return;
      }
      console.log("currentUser:", currentUser);
      console.log("currentUser.role:", currentUser.role);
      // Check if the user has the required role (e.g., supervisor)
      if (currentUser.role !== "Supervisor") {
        setError("You do not have the required permissions to assign tasks.");
        return;
      }

      if (selectedEmployeeUIDs.length === 0) {
        setError("Please select at least one employee to assign the task to.");
        return;
      }

      const newTask = {
        taskId: uuidv4(),
        project: taskFormData.project,
        task: taskFormData.task,
        subtask: taskFormData.subtask,
        members: taskFormData.members,
        assignedTo: selectedEmployeeUIDs, // Use the selected employees' UIDs
        status: "pending",
        endDate: taskFormData.endDate,
        priority: priority,
      };
      

      console.log("New Task Data:", newTask);
      // An array to store updates for each employee
      const employeeUpdates = [];

      // Create a new task and collect updates for each selected employee
      for (const employeeUID of selectedEmployeeUIDs) {
        const employeeDocRef = doc(db, "employees", employeeUID); // Assuming you have an "employees" collection
        const employeeDoc = await getDoc(employeeDocRef);
        if (employeeDoc.exists()) {
          const employeeData = employeeDoc.data();
          const updatedTasks = [...(employeeData.tasks || []), newTask]; // Use an empty array if tasks field is initially undefined

          // Collect updates for this employee
          employeeUpdates.push({
            docRef: employeeDocRef,
            data: {
              tasks: updatedTasks,
            },
          });
        }
      }

      // Batch update all selected employees' documents
      const batch = writeBatch(db);
      employeeUpdates.forEach((update) => {
        batch.set(update.docRef, update.data, { merge: true }); // Use merge to update the tasks array
      });
      console.log("Employee Updates:", employeeUpdates);
      // Commit the batch write
      await batch.commit();

      setSuccessMessage("Task assigned to employees successfully");
      setError(""); // Clear any previous error messages
            // Clear the form and display a success message
            setTaskFormData({
              project: "",
              task: "",
              subtask: "",
              members: "",
              TeamLeaders: [],
              supervisors: [],
              employees: [],
              endDate: "",
              priority: "low",
            });
    } catch (error) {
      setError("Failed to assign task");
      console.error("Firebase Error:", error.message); // Log the error message
      console.error("Firebase Error Details:", error.details);
    }
  };
  
  const fetchTasks = async () => {
      try {
        const SupervisorDocRef = doc(db, "supervisors", currentUser.uid);
        const SupervisorDocSnapshot = await getDoc(SupervisorDocRef);
  
        if (SupervisorDocSnapshot.exists()) {
          const SupervisorDocData = SupervisorDocSnapshot.data();
          const SupervisorTasks = SupervisorDocData.tasks || [];
  
          setTasks(SupervisorTasks);
  
          // Calculate task statistics
          const completedTasks = SupervisorTasks.filter((task) => task.status === "completed").length;
          const pendingTasks = SupervisorTasks.filter((task) => task.status === "pending").length;
          const inProgressTasks = SupervisorTasks.filter((task) => task.status === "Work in Progress").length;
          const assignedTasks = SupervisorTasks.length;

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

    const fetchEmployees = async (supervisorId) => {
      try {
        // Step 1: Get the supervisor's document data
        const supervisorDocRef = doc(db, "supervisors", supervisorId);
        const supervisorDocSnapshot = await getDoc(supervisorDocRef);
    
        if (supervisorDocSnapshot.exists()) {
          const supervisorData = supervisorDocSnapshot.data();
    
          // Step 2: Access the "assigned" array in the supervisor's document data
          if (supervisorData.assigned && supervisorData.assigned.length > 0) {
            // Step 3: Use the employee UIDs from the "assigned" array
            const employeeUIDs = supervisorData.assigned;
    
            // Step 4: Fetch the corresponding employee data from the "employees" collection
            const employeesCollection = collection(db, "employees");
            const employeesSnapshot = await getDocs(employeesCollection);
            const employeesData = employeesSnapshot.docs
              .map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }))
              .filter((employee) => employeeUIDs.includes(employee.uid));
    
            setEmployees(employeesData);
          }
        }
      } catch (error) {
        setError("Failed to fetch employees: " + error.message);
        console.error("Fetch employees error", error);
      }
    };

    useEffect(() => {
      if (currentUser) {
        fetchEmployees(currentUser.uid);
      }
    }, [currentUser]);
    

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
    <div>
      <Card>
        <Card.Body>
          <h2 className="text-center mb-4">Welcome, {currentUser.displayName}</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {successMessage && <Alert variant="success">{successMessage}</Alert>}
          <EmployeeList
          employees={employees}
          onFilterTasks={filterTasks}
          onEmployeeClick={handleEmployeeClick}
          setSelectedEmployeeTasks={setSelectedEmployeeTasks}
        />
      <Button
      type="button"
      variant="primary"
      onClick={() => setShowTaskForm(true)}
    >
          Assign Task
        </Button>
        </Card.Body>
        </Card>
        {/* Task Assignment Form Modal */}
        <Modal show={showTaskForm} onHide={() => setShowTaskForm(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Assign Task</Modal.Title>
          </Modal.Header>
          <Modal.Body>
          <div className="mb-3">
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          handleAddTask(e);
        }}
      >
        <Form.Group className="mb-3" controlId="project">
          <Form.Label>Project</Form.Label>
          
          <Form.Control
            as="select"
            name="project"
            required
            value={taskFormData.project}
            onChange={(e) =>
              setTaskFormData({ ...taskFormData, project: e.target.value })
            }
          ><option value="">Select a project</option>
          {projectNames.map((projectName) => (
            <option key={projectName} value={projectName}>
              {projectName}
            </option>
          ))}
        </Form.Control>
        </Form.Group>

          <Form.Group className="mb-3" controlId="task">
            <Form.Label>Task</Form.Label>
            <Form.Control
              as="select"
              name="task"
              value={taskFormData.task}
              required
            onChange={(e) =>
              setTaskFormData({ ...taskFormData, task: e.target.value })
            }
            ><option value="">Select a task</option>
            {taskNames.map((taskName) => (
              <option key={taskName} value={taskName}>
                {taskName}
              </option>
            ))}
          </Form.Control>
          </Form.Group>
          <Form.Group className="mb-3" controlId="subtask">
            <Form.Label>Subtask</Form.Label>
            <Form.Control
              as="select"
              name="subtask"
              required
              value={taskFormData.subtask}
            onChange={(e) =>
              setTaskFormData({ ...taskFormData, subtask: e.target.value })
            }
            ><option value="">Select a subtask</option>
            {subtaskNames.map((subtaskName) => (
              <option key={subtaskName} value={subtaskName}>
                {subtaskName}
              </option>
            ))}
          </Form.Control>
          </Form.Group>
          <Form.Group className="mb-3" controlId="members">
            <Form.Label>Members</Form.Label>
            <Form.Control
              type="text"
              name="members"
              required
              value={taskFormData.members}
            onChange={(e) =>
              setTaskFormData({ ...taskFormData, members: e.target.value })
            }
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="endDate">
            <Form.Label>End Date</Form.Label>
            <Form.Control
              type="date"
              name="endDate"
              required
              value={taskFormData.endDate}
            onChange={(e) =>
              setTaskFormData({ ...taskFormData, endDate: e.target.value })
            }
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="priority">
            <Form.Label>Priority</Form.Label>
            <Form.Control as="select" name="priority" required value={taskFormData.priority}
            onChange={(e) =>
              setTaskFormData({ ...taskFormData, priority: e.target.value })
            }>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Form.Control>
          </Form.Group>
          <Form.Group className="mb-3" controlId="assignedTo">
          <Form.Label>Assign to Employees</Form.Label>
          {employees.map((employee) => (
            <Form.Check
              key={employee.uid}
              type="checkbox"
              id={employee.uid}
              label={employee.name + " (" + employee.email + ")"}
              value={employee.uid}
              checked={selectedEmployeeUIDs.includes(employee.uid)}
              onChange={() => {
                setSelectedEmployeeUIDs((prevSelectedUIDs) => {
                  if (prevSelectedUIDs.includes(employee.uid)) {
                    // Remove the UID if already selected
                    return prevSelectedUIDs.filter((uid) => uid !== employee.uid);
                  } else {
                    // Add the UID if not selected
                    return [...prevSelectedUIDs, employee.uid];
                  }
                });
              }}
            />
          ))}
        </Form.Group>
        
        <Button type="submit" variant="primary">
        Assign Task
      </Button>
    </Form>
  </div>
  </Modal.Body>
</Modal>
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
      <div className="w-100 text-center mt-2">
      <Button variant="link" onClick={handleLogout}>
        Log Out
      </Button>
    </div>
  </div>
);
}

