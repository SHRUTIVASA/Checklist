import React, { useState } from "react";
import './styles/EmployeeDashboard.css';

function TaskRow({ task, onDeleteTask, onMarkAsCompleted, onChangeStatus, style, className }) {
  // Initialize the status state for each task with its taskId
  const [status, setStatus] = useState(task.status);
  const [deleteTaskLoading, setDeleteTaskLoading] = useState(false);
  const [markAsCompletedLoading, setMarkAsCompletedLoading] = useState(false);
  const [changeStatusToInProgressLoading, setChangeStatusToInProgressLoading] = useState(false);
  const handleStatusChange = async () => {
    const newStatus = status === "completed" ? "pending" : "completed";
    setStatus(newStatus);

    try {
      await onMarkAsCompleted(task.taskId, newStatus);
    } catch (err) {
      console.error("Error updating task status", err);
    }
  };

  const handleWorkInProgress = async () => {
    setStatus("Work in Progress");

    try {
      await onChangeStatus(task.taskId);
    } catch (err) {
      console.error("Error updating task status", err);
    }
  };

  return (
    <tr style={style} key={task.taskId}>
      <td>{task.project}</td>
      <td>{task.task}</td>
      <td>{task.subtask}</td>
      <td>{task.members}</td>
      <td>
      {status === "completed" ? (
  <span>Completed</span>
) : status === "Work in Progress" ? (
  <span>Work in Progress</span>
) : status === "pending" && task.priority === "high" ? (
  <span className="high-priority-pending">Pending</span>
) : (
  <span>Pending</span>
)}

      </td>
      <td>{task.endDate}</td>
      <td>{task.priority}</td>
      <td>
        <input
          type="checkbox"
          checked={status === "completed"}
          onChange={handleStatusChange}
          disabled={markAsCompletedLoading}
        />
      </td>
      <td>
        {status === "completed" ? (
          <span>Completed</span>
        ) : (
          <button onClick={handleWorkInProgress}
          disabled={changeStatusToInProgressLoading}>{changeStatusToInProgressLoading ? "Changing Status..." : "Work in Progress"}</button>
        )}
      </td>
    </tr>
  );
}

export default TaskRow;
