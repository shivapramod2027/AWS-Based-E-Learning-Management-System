import api from "./api";

async function createCheckoutSession(courseId, customerPhone) {
  try {
    const { data } = await api.post("/api/payments/checkout-session", { courseId, customerPhone });
    return { success: true, data };
  } catch (error) {
    console.error("Could not start Cashfree checkout:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Could not start secure checkout",
    };
  }
}

async function confirmCheckout(orderId) {
  try {
    const { data } = await api.post("/api/payments/confirm", { orderId });
    return { success: true, data };
  } catch (error) {
    console.error("Could not verify Cashfree checkout:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Could not verify your payment",
    };
  }
}

export const paymentService = {
  createCheckoutSession,
  confirmCheckout,
};
