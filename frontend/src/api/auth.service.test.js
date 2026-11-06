import { authService } from "./auth.service";
import { API_BASE_URL } from "./constant";

beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("clears the current session immediately and notifies the backend", () => {
  localStorage.setItem("token", "admin-token");
  localStorage.setItem("email", "admin@example.com");
  localStorage.setItem("name", "Admin");
  localStorage.setItem("id", "admin-id");
  localStorage.setItem("role", "ROLE_ADMIN");

  authService.logout();

  expect(authService.getCurrentUser()).toEqual({
    token: null,
    email: null,
    name: null,
    id: null,
    role: null,
  });
  expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: { Authorization: expect.any(String) },
  });
});

test("logout remains local when the backend cannot be reached", async () => {
  global.fetch.mockRejectedValueOnce(new Error("Network unavailable"));
  localStorage.setItem("token", "admin-token");
  localStorage.setItem("role", "ROLE_ADMIN");
  jest.spyOn(console, "error").mockImplementation(() => {});

  authService.logout();
  await Promise.resolve();

  expect(authService.isAdminAuthenticated()).toBe(false);
  expect(localStorage.getItem("token")).toBeNull();
});
