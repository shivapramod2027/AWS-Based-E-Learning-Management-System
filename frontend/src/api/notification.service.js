import api from "./api";

export const notificationService = {
  async getAll() {
    try {
      const { data } = await api.get("/api/notifications");
      return { success: true, data };
    } catch (error) {
      console.error("Unable to fetch notifications:", error);
      return { success: false, error: error.response?.data?.message || "Unable to load notifications" };
    }
  },
  async markRead(notificationId) {
    try {
      await api.put(`/api/notifications/${notificationId}/read`);
      return { success: true };
    } catch (error) {
      console.error("Unable to update notification:", error);
      return { success: false, error: error.response?.data?.message || "Unable to update notification" };
    }
  },
  async getUnreadCount() {
    try {
      const { data } = await api.get("/api/notifications/unread-count");
      return { success: true, data };
    } catch (error) {
      console.error("Unable to fetch unread notifications:", error);
      return { success: false, error: error.response?.data?.message || "Unable to load notification count" };
    }
  },
  async getPreferences() {
    try {
      const { data } = await api.get("/api/notifications/preferences");
      return { success: true, data };
    } catch (error) {
      console.error("Unable to fetch reminder preferences:", error);
      return { success: false, error: error.response?.data?.message || "Unable to load reminder settings" };
    }
  },
  async updatePreferences(preferences) {
    try {
      const { data } = await api.put("/api/notifications/preferences", preferences);
      return { success: true, data };
    } catch (error) {
      console.error("Unable to save reminder preferences:", error);
      return { success: false, error: error.response?.data?.message || "Unable to save reminder settings" };
    }
  },
};
