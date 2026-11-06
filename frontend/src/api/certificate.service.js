import api from "./api";

export const certificateService = {
  async issue(courseId) {
    try {
      const { data } = await api.post(`/api/certificates/issue/${courseId}`);
      return { success: true, data };
    } catch (error) {
      console.error("Unable to issue certificate:", error);
      return { success: false, error: error.response?.data?.message || "Unable to issue certificate" };
    }
  },
  async verify(code) {
    try {
      const { data } = await api.get(`/api/certificates/verify/${encodeURIComponent(code)}`);
      return { success: true, data };
    } catch (error) {
      console.error("Unable to verify certificate:", error);
      return { success: false, error: error.response?.data?.message || "Certificate not found" };
    }
  },
};
