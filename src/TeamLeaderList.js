import React, { useEffect, useState } from "react";
import {
  doc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  getDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { Card, Table, Container, Row, Col } from "react-bootstrap";
import { useAuth } from "./contexts/AuthContext";
import "./styles/EmployeeDashboard.css";

const TeamLeaderList = ({
  teamLeaders,
  onFilterTasks,
  onTeamLeaderClick,
  onTeamLeaderBoxClick,
}) => {
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

          setTaskStatistics((prevStatistics) => [
            ...prevStatistics,
            teamLeaderStatistics,
          ]);
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

    const selectedTeamLeader = teamLeaders.find(
      (teamLeader) => teamLeader.uid === teamLeaderId
    );

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

    const selectedTeamLeader = teamLeaders.find(
      (teamLeader) => teamLeader.uid === teamLeaderId
    );

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
    const selectedTeamLeader = teamLeaders.find(
      (teamLeader) => teamLeader.uid === teamLeaderId
    );

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
    <Container className="employee-list">
      <h2 className="text-center mb-4">Team Leader List</h2>
      {teamLeaders && teamLeaders.length > 0 ? (
        teamLeaders.map((teamLeader) => {
          const teamLeaderStatistics = taskStatistics.find(
            (stats) => stats.teamLeaderId === teamLeader.uid
          );

          return (
            <Container
              fluid
              key={teamLeader.uid}
              style={{
                // border: "1px solid #ccc",
                padding: "10px",
                marginBottom: "20px",
                // display: "flex",
                // flexDirection: "column",
                // alignItems: "flex-start",
              }}
              className="bigbox employee-card"
              onClick={(event) => {
                console.log("Team Leader box clicked with ID:", teamLeader.uid);
                onTeamLeaderBoxClick(teamLeader.uid, event);
              }}
            >
              {/* <p>Name: {teamLeader.name}</p> */}
              {/* <p>Email: {teamLeader.email}</p> */}
              {/* <div className="justify-content-between w-100"> */}
              {/* <div
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
                </div> */}
              <Row className="mt-4">
                <Col style={{ paddingLeft: 0, paddingRight: 0 }}>
                  <Card
                    className="formal-card-new"
                    style={{
                      border: 0,
                      backgroundColor: "transparent",
                    }}
                  >
                    <Card.Body style={{ paddingLeft: 0, paddingRight: 0 }}>
                      <div className="stat-card">
                        <div className="stat-card-info">
                          <Card.Title>Name:</Card.Title>
                          <Card.Text>{teamLeader.name}</Card.Text>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col style={{ paddingLeft: 0, paddingRight: 0 }}>
                  <Card
                    className="formal-card-new"
                    style={{
                      cursor: "pointer",
                      backgroundColor:
                        selectedTeamLeaderId === teamLeader.uid &&
                        activeFilter === "assigned"
                          ? ""
                          : "#003DAA",
                      color:
                        selectedTeamLeaderId === teamLeader.uid &&
                        activeFilter === "assigned"
                          ? "#000"
                          : "#fff",
                      borderColor:
                        selectedTeamLeaderId === teamLeader.uid &&
                        activeFilter === "assigned"
                          ? "#003DAA"
                          : "#fff",
                    }}
                    onClick={() => {
                      if (activeFilter === "assigned") {
                        // Clear the filter if the same box is clicked again
                        clearFilter();
                      } else {
                        // Set the filter for the new supervisor
                        filterAssignedTasks(teamLeader.uid);
                      }
                    }}
                  >
                    <Card.Body style={{ paddingLeft: 0, paddingRight: 0 }}>
                      <div className="stat-card">
                        {/* <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAeElEQVR4nO3XwQnAIAwFULf7o+kITmQuncCLK3SBNr1JW3oVfsp/8PHgJYQQMSURkfVQzN9JTFDM63bM0BaI2/m4z61/dRkrk1uP1UEwz6CIRAf2NYMIi7rqqfvzDIpIdGBfMyjmYz9nwhUIhl/dYO8gmGdQRAK7AK47wM6aFldyAAAAAElFTkSuQmCC" alt="Assigned Tasks" /> */}
                        <div className="stat-card-info">
                          <Card.Title>Assigned Tasks</Card.Title>
                          <Card.Text className="text-center">
                            {teamLeaderStatistics?.numTasksAssigned}
                          </Card.Text>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col style={{ paddingLeft: 0, paddingRight: 0 }}>
                  <Card
                    className="formal-card-new"
                    style={{
                      cursor: "pointer",
                      backgroundColor:
                        selectedTeamLeaderId === teamLeader.uid &&
                        activeFilter === "pending"
                          ? ""
                          : "#B32222",
                      color:
                        selectedTeamLeaderId === teamLeader.uid &&
                        activeFilter === "pending"
                          ? "#000"
                          : "#fff",
                      borderColor:
                        selectedTeamLeaderId === teamLeader.uid &&
                        activeFilter === "pending"
                          ? "#B32222"
                          : "#fff",
                    }}
                    onClick={() => {
                      if (activeFilter === "pending") {
                        // Clear the filter if the same box is clicked again
                        clearFilter();
                      } else {
                        // Set the filter for the new supervisor
                        filterTasks(teamLeader.uid, "pending");
                      }
                    }}
                  >
                    <Card.Body style={{ paddingLeft: 0, paddingRight: 0 }}>
                      <div className="stat-card">
                        {/* <img src={process.env.PUBLIC_URL + '/pending.svg'} alt="Pending Tasks" /> */}
                        <div className="stat-card-info">
                          <Card.Title>Pending Tasks</Card.Title>
                          <Card.Text className="text-center">
                            {teamLeaderStatistics?.numTasksPending}
                          </Card.Text>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col style={{ paddingLeft: 0, paddingRight: 0 }}>
                  <Card
                    className="formal-card-new"
                    style={{
                      cursor: "pointer",
                      backgroundColor:
                        selectedTeamLeaderId === teamLeader.uid &&
                        activeFilter === "Work in Progress"
                          ? ""
                          : "#DAA520",
                      color:
                        selectedTeamLeaderId === teamLeader.uid &&
                        activeFilter === "Work in Progress"
                          ? "#000"
                          : "#fff",
                      borderColor:
                        selectedTeamLeaderId === teamLeader.uid &&
                        activeFilter === "Work in Progress"
                          ? "#DAA520"
                          : "#fff",
                    }}
                    onClick={() => {
                      if (activeFilter === "Work in Progress") {
                        // Clear the filter if the same box is clicked again
                        clearFilter();
                      } else {
                        // Set the filter for the new supervisor
                        filterTasks(teamLeader.uid, "Work in Progress");
                      }
                    }}
                  >
                    <Card.Body style={{ paddingLeft: 0, paddingRight: 0 }}>
                      <div className="stat-card">
                        {/* <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAEtUlEQVR4nO1ZSWwcRRQt9jXswbE9vzoyBiMjBUL/33asIAMHxBFEwnYBwYFAuCCByAFlDhyI45n/Z8AQHOCAEBLbCQFKDixiuRCBEBGgEBBIhMUhkQhbYgIY/Z4Z01PuyXTPtO0c5klzKZer36v+exvTQQcdZIIeKlwExOiuA8qUJd4LyJ8BycuW5KFeX4bM2peOM0cTLMouIP5r2WXlpXXrJDNxPyD5waI80ueX7IKT7Q/KZ1jk9bnh4jkRAduVWA6LNycREBEybVG2uMLnFTks3hMSQHkxIuCBCiF+Jo0AW/sh7/OoeOvCCBgu9lqS36s3Pqpry4PipdUb/Ti6V23fEv+bXIhs8f3JEzIl7I3mTwaS23vosXNraxZlY/WBO2bJEq+zAV/t/n9/f/kkzy9cnAvkOov8LCAfOLJZ8evd/uSpmQlQ8pXDeWffqvHzdS03XDzFkuwG5G9auRAP5Y7QkRuLeMOM5o/PRIDevJJ3Regtda0YP63Vc5cOTpwOKGOW5J94IfykyQpKuiYCUJ7K7GBjjPV5jUX5M06EG9XShUq/dG8PFiAqApC3er5caTKGFxSHLfFvMU69v9svnJf6QCC5u/oa/7DI+UydqgFsUFobH7FaMCW7+omzLfELkQN3q/OZeQYQb45LdlFLSHdgwFdY4g812mjkyZLscpQBNwNrUIiNTsibzNEEIL7RohwGlB81R8Rm+noz+j5RAai3ooVZWNsg368ZNmvy1ahzeNZEUKaA+JLa3wcH8yeq87oiwiq2GbQk1qrSSSrrsr75mJD5tbPvuZjktiHRQ9Quc77cooUZkHzkBcWr5pn8jEXeNmfvXAGvmMWCazaOfb83MDK2JLq/NyjnYvZ+mikpjRjqKxqhXEdsh3wFM8cAykG35DbNAMQfODH4/bh9mtgA5a1Gjtge+QoA+Sc3H5hm0EOdVP5u7D7kbXNs1AmJ7ZBvWUBSaNSILYOrItolb1o1oTRTCE0uDUT8YpH/bp28ac+J68IoyidxXVYzEY3Iaw+QhAOg3NRSGM1hieYkMl/uarQ/uYjk5BWA8nzMOQ+aRAMq5M/TlBJafgDx3iMIeCdN5zbYTinRKryVsiq2NUTZn7bttMjrY87ZY0z+2NbKaZQdQPJts6amO+BrLP3vvEB8wKOJZWme15VVOa1Tt7qGBvnLJA2NR+VrgUR96OeuFZXmPw2AZDzGeQ/pLKqNllI2Zt3MpGsp5fHUh2msVlvUeFxb6189Pgg+7/ICvm/hmnreFx2otYyQPHGYGYH4C5MhLJZuCN90TATLZF7aO1S6MEL+oIqpvaV2BlsDI2NLKk18/OwUSCZMFgCUp13ylRG77NH2M+154VgyKN2pdVOj3AEor2U2WvRG82fZIZmEkc0XREQVqqLerq2pzzTq3nQs4lHxem0VAeXXJpn71XkNGpXPSTKticvDwsqQvM+Xu9PqitDw09J00noJUB7N7OYbYfZjBvLWWaLEG6okJuv2Jic+pWHULAT6/E1nAvFt0eIMUN4Myfi8Jo0AID6ktx79XLUosMRfKRk3Zjckj/wdID8czTOLCq1Ia/7gtoXVT6079ZtaaGpDZV87LtNBBx2YdvEfR+5N6Sog5CwAAAAASUVORK5CYII=" alt="In Progress Tasks" /> */}
                        <div className="stat-card-info">
                          <Card.Title>In Progress Tasks</Card.Title>
                          <Card.Text className="text-center">
                            {teamLeaderStatistics?.numTasksInProgress}
                          </Card.Text>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col style={{ paddingLeft: 0, paddingRight: 0 }}>
                  <Card
                    className="formal-card-new"
                    style={{
                      cursor: "pointer",
                      backgroundColor:
                        selectedTeamLeaderId === teamLeader.uid &&
                        activeFilter === "completed"
                          ? ""
                          : "#228B22",
                      color:
                        selectedTeamLeaderId === teamLeader.uid &&
                        activeFilter === "completed"
                          ? "#000"
                          : "#fff",
                      borderColor:
                        selectedTeamLeaderId === teamLeader.uid &&
                        activeFilter === "completed"
                          ? "#228B22"
                          : "#fff",
                    }}
                    onClick={() => {
                      if (activeFilter === "completed") {
                        // Clear the filter if the same box is clicked again
                        clearFilter();
                      } else {
                        // Set the filter for the new supervisor
                        filterTasks(teamLeader.uid, "completed");
                      }
                    }}
                  >
                    <Card.Body style={{ paddingLeft: 0, paddingRight: 0 }}>
                      <div className="stat-card">
                        {/* <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAEtUlEQVR4nO2Zy08TQRzHOeg/U2gL+AR8HTVeVDx4MB4oT9/1ARE9mKgHH/GgRq3RiFFAKMj2/aYvSqGKilBUDGhbo1ESY90/4Gf2x8wCZdtgZ9mqYZLPabc738/MZL6HFhWtjP9wGAyG1W2d3LW2LsvMo27rzOMe21W/37+q6F8ZT4y2K+29duh45oTOPhc85dzQxbkvFyTMUMu2ndHmrZ+jLdtgsHmrJE96bNDe61gY2OQBo9VX2W32b+qx+aHXHoBnjiD0OUPAuQbA5I5A+OSmBYQoJ6ogpK9KhU9W7WAWiJzeksoMHBE4vUXkqckNXWYPdFt8YLT2Aw1s73iw29b+sJoGNnsHweKLgq1/GOz+2OLQ8wieqIKAvjLJLEBDf3sbA57nJZlb4RD0OcNgcg+A2RMBi3cQrL4hMbAj8BycwRfgCo2AO/wq6/e+xocgqK9E5NgBXOVskwnMBY5mCfwS3AOvwBN5Dd7BUfBF30D/0HjObwb0lYgiAuHY2Fzg0Ai4wpmBxzCwfzgOwdgEhJ6/hZcTH3MLHK9AmAUGTm0GgVyTLQf+4xXIvytwbCPCLBA+tRlvC6UF+o9tRNgFyDWnuMDRDQizAL2jlRbwHd2AsAuQUimEgPfIenYBIbxQKEoLeI+sl0mAFEohBDyH17ELBAok4Dm8TiYBUiiFEHAfWssuQBtR7oDXHSnQd0zDzI+05HMhvCwCtFDkDH+BS4Dq3Biozr2B2ocfsgq4/kaBi0L4s2OiwL67k5LvuQ6uQZgFaKHIEf6yJQnFQngisOvmO/j8XfoIOQ+uQZZV4MtMGnSGaThvTEA6nTv8JS6B4anAnluT+Pts7zubyhFmAVooUpMcuD0F2jMToD0Th5bOT1klLnFJKCHhBapv5g7P8zw4msqRZRVouj8tCmhb49AsITEbflwUWEp4XhBoLEOYBWihSE0iXIHCEaICmtY46B9/hJ/pX/j8ioWGnxXYc+N91jPPZ2BvLEOWVYBK1BimRAEN2YmLfUlQt9Lw47B3iSvPU4GGUoRZgBZKrslwJ+5NiQJqZFwUqL4xueSV5wm2hlJEEQFxJ4jEfIF8wvOCQL0WYRaghbKUSakEFcg3PM/zYK3XIooKUImGB1Ow/86HPzrzfKZAnQZhFsBGbCrPO0i+WOo0CLsAaUTFBWrVCLMANmJjmeIC5lo1wi5ACqUgAroSdgFsxIZSxQVMuhKEXYAUSiEEuJpidgFsxHqt4gJcTbFMAqRQEomEYuETiU/yCdBGjEajisLJJkAKJeY0wujoqCIM27vkEzDXaVLYiqRYzFKQG2MRJET+qNj/5DPXqXeYdCWpzNCSgcnNIQ+qpEmn2s4ssDJWxn8+fgOR9jh2p0beawAAAABJRU5ErkJggg==" alt="Completed Tasks" /> */}
                        <div className="stat-card-info">
                          <Card.Title>Completed Tasks</Card.Title>
                          <Card.Text className="text-center">
                            {teamLeaderStatistics?.numTasksCompleted}
                          </Card.Text>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              {/* </div> */}
              {selectedTeamLeaderId === teamLeader.uid && (
                <Row className="mt-4">
                  {selectedTeamLeaderTasks.length > 0 ? (
                    <Col xs={12} md={12}>
                      <h2 className="text-center mb-4">Tasks</h2>
                      <div className="table-responsive">
                        <Table striped bordered hover className="formal-table">
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
                                  ) : task.status === "Work in Progress" ? (
                                    <span>Work in Progress</span>
                                  ) : task.status === "pending" &&
                                    task.priority === "high" ? (
                                    <span className="high-priority-pending">
                                      Pending
                                    </span>
                                  ) : (
                                    <span>Pending</span>
                                  )}
                                </td>
                                <td>{task.endDate}</td>
                                <td>{task.priority}</td>
                                <td>
                                  <button
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="btn btn-danger btn-sm"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </Col>
                  ) : (
                    <p>No tasks available for the selected team leader.</p>
                  )}
                </Row>
              )}
            </Container>
          );
        })
      ) : (
        <p>No team leaders available</p>
      )}
    </Container>
  );
};

export default TeamLeaderList;
