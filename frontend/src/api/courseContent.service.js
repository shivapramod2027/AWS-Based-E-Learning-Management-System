import api from "./api";

async function request(action) {
  try {
    const { data } = await action();
    return { success: true, data };
  } catch (error) {
    console.error("Course content request failed:", error);
    return { success: false, error: error.response?.data?.message || "Unable to load course content" };
  }
}

export const courseContentService = {
  getModules: (courseId) => request(() => api.get(`/api/courses/${courseId}/modules`)),
  getProgress: (courseId) => request(() => api.get(`/api/courses/${courseId}/lesson-progress`)),
  createModule: (courseId, module) => request(() => api.post(`/api/courses/${courseId}/modules`, module)),
  updateModule: (moduleId, module) => request(() => api.put(`/api/modules/${moduleId}`, module)),
  deleteModule: (moduleId) => request(() => api.delete(`/api/modules/${moduleId}`)),
  createLesson: (moduleId, lesson) => request(() => api.post(`/api/modules/${moduleId}/lessons`, lesson)),
  updateLesson: (lessonId, lesson) => request(() => api.put(`/api/lessons/${lessonId}`, lesson)),
  deleteLesson: (lessonId) => request(() => api.delete(`/api/lessons/${lessonId}`)),
  completeLesson: (lessonId) => request(() => api.post(`/api/lessons/${lessonId}/complete`)),
};
