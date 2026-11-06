import api from "./api";

async function getAllCourses() {
  try {
    const { data } = await api.get("/api/courses");
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching courses:", error);
    return {
      success: false,
      error: error.code === "ERR_NETWORK"
        ? "Cannot connect to the course service. Make sure the backend is running on port 8080."
        : error.response?.data?.message || "Could not fetch courses",
    };
  }
}

async function getCourseById(courseId) {
  try {
    const { data } = await api.get(`/api/courses/${courseId}`);
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching course:", error);
    return { success: false, error: "Could not fetch course details" };
  }
}

async function createCourse(courseData) {
  try {
    const { data } = await api.post("/api/courses", courseData);
    return { success: true, data };
  } catch (error) {
    console.error("Error creating course:", error);
    return { success: false, error: "Could not create course" };
  }
}

async function updateCourse(courseId, courseData) {
  try {
    const { data } = await api.put(`/api/courses/${courseId}`, courseData);
    return { success: true, data };
  } catch (error) {
    console.error("Error updating course:", error);
    return { success: false, error: "Could not update course" };
  }
}

async function deleteCourse(courseId) {
  try {
    const { data } = await api.delete(`/api/courses/${courseId}`);
    return { success: true, data };
  } catch (error) {
    console.error("Error deleting course:", error);
    return { success: false, error: "Could not delete course" };
  }
}

async function getAllUsers() {
  try {
    const { data } = await api.get("/api/users");
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, error: "Could not fetch users" };
  }
}

async function getAllLearning() {
  try {
    const { data } = await api.get("/api/learning");
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    return { success: false, error: "Could not fetch enrollments" };
  }
}

async function updateUser(userId, updatedData) {
  try {
    const { data } = await api.put(`/api/users/admin/${userId}`, updatedData);
    return { success: true, data };
  } catch (err) {
    console.error("Error updating user:", err);
    return { success: false, error: err.response?.data?.message || "Unable to update user" };
  }
}

async function getCourseEnrollmentSummary() {
  try {
    const { data } = await api.get("/api/learning/stats/by-course");
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching enrollment summary:", error);
    return { success: false, error: error.response?.data?.message || "Could not fetch enrollment summary" };
  }
}

async function getCompletedCourseCount() {
  try {
    const { data } = await api.get("/api/progress/stats/completed");
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching completed course count:", error);
    return { success: false, error: error.response?.data?.message || "Could not fetch completion statistics" };
  }
}

async function getActiveLearnerCount() {
  try {
    const { data } = await api.get("/api/progress/stats/active-learners");
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching active learner count:", error);
    return { success: false, error: error.response?.data?.message || "Could not fetch active learners" };
  }
}

async function getProgressMetrics() {
  try {
    const { data } = await api.get("/api/progress/stats");
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching learning progress metrics:", error);
    return { success: false, error: error.response?.data?.message || "Could not fetch learning progress" };
  }
}

async function getCourseProgressSummaries() {
  try {
    const { data } = await api.get("/api/progress/stats/by-course");
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching course progress analytics:", error);
    return { success: false, error: error.response?.data?.message || "Could not fetch course progress analytics" };
  }
}

async function createQuestion(questionData) {
  try {
    const { data } = await api.post("/api/questions", questionData);
    return { success: true, data };
  } catch (err) {
    console.error("Error creating question:", err);
    return { success: false, error: err.response?.data?.message || "Unable to create question" };
  }
}

async function updateQuestion(questionId, questionData) {
  try {
    const { data } = await api.put(`/api/questions/${questionId}`, questionData);
    return { success: true, data };
  } catch (err) {
    console.error("Error updating question:", err);
    return { success: false, error: err.response?.data?.message || "Unable to update question" };
  }
}

async function deleteQuestion(questionId) {
  try {
    await api.delete(`/api/questions/${questionId}`);
    return { success: true };
  } catch (err) {
    console.error("Error deleting question:", err);
    return { success: false, error: err.response?.data?.message || "Unable to delete question" };
  }
}

export const adminService = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getAllUsers,
  updateUser,
  getAllLearning,
  getCourseEnrollmentSummary,
  getCompletedCourseCount,
  getActiveLearnerCount,
  getProgressMetrics,
  getCourseProgressSummaries,
};
