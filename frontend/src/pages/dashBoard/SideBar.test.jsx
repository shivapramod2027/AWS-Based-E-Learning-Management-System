import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SideBar from "./SideBar";

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("token", "admin-token");
  localStorage.setItem("role", "ROLE_ADMIN");
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
});

test("admin logout clears the session and navigates to sign in", async () => {
  render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route path="/admin" element={<SideBar current="dashboard" onSelect={() => {}} />} />
        <Route path="/login" element={<p>Sign in page</p>} />
      </Routes>
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole("button", { name: "Log out of the admin dashboard" }));

  expect(await screen.findByText("Sign in page")).toBeInTheDocument();
  await waitFor(() => {
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("role")).toBeNull();
  });
  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining("/api/auth/logout"),
    expect.objectContaining({ method: "POST" })
  );
});
