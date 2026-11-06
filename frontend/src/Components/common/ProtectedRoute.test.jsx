import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

function renderAdminRoute() {
  render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route path="/login" element={<p>Sign in</p>} />
        <Route path="/courses" element={<p>Course catalog</p>} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="ROLE_ADMIN">
              <p>Admin dashboard</p>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
});

test("redirects unauthenticated visitors to sign in", () => {
  renderAdminRoute();

  expect(screen.getByText("Sign in")).toBeInTheDocument();
});

test("redirects students away from the admin dashboard", () => {
  localStorage.setItem("token", "student-token");
  localStorage.setItem("role", "ROLE_USER");

  renderAdminRoute();

  expect(screen.getByText("Course catalog")).toBeInTheDocument();
});

test("allows an authenticated administrator to open the admin dashboard", () => {
  localStorage.setItem("token", "admin-token");
  localStorage.setItem("role", "ROLE_ADMIN");

  renderAdminRoute();

  expect(screen.getByText("Admin dashboard")).toBeInTheDocument();
});
