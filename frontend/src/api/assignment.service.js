import api from "./api";

async function request(action) {
  try {
    const { data } = await action();
    return { success: true, data };
  } catch (error) {
    console.error("Assignment request failed:", error);
    return { success: false, error: error.response?.data?.message || "Assignment request failed" };
  }
}

export const assignmentService = {
  getStudentAssignments: () => request(() => api.get("/api/assignments")),
  getAllAssignments: () => request(() => api.get("/api/assignments/admin")),
  create: (assignment) => request(() => api.post("/api/assignments", assignment)),
  submit: (assignmentId, submission) =>
    request(() => api.put(`/api/assignments/${assignmentId}/submit`, submission)),
  getSubmissions: (assignmentId) => request(() => api.get(`/api/assignments/${assignmentId}/submissions`)),
  grade: (submissionId, grade) =>
    request(() => api.put(`/api/assignments/submissions/${submissionId}/grade`, grade)),
  delete: (assignmentId) => request(() => api.delete(`/api/assignments/${assignmentId}`)),
};
