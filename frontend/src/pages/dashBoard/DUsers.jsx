import { useEffect, useMemo, useState } from "react";
import { Button, Form, Input, message, Modal, Select } from "antd";
import { Search, UsersRound } from "lucide-react";
import { adminService } from "../../api/admin.service";

const PAGE_SIZE = 10;
const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const loadUsers = async () => {
    setLoading(true);
    setLoadError("");
    const result = await adminService.getAllUsers();
    if (result.success) {
      setUsers(result.data);
    } else {
      const error = result.error || "Could not load users.";
      setLoadError(error);
      message.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return users
      .filter((user) => {
        const matchesText = !normalizedQuery
          || user.username?.toLowerCase().includes(normalizedQuery)
          || user.email?.toLowerCase().includes(normalizedQuery)
          || user.id?.toLowerCase().includes(normalizedQuery);
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        const matchesStatus = statusFilter === "all"
          || String(Boolean(user.isActive)) === statusFilter;
        return matchesText && matchesRole && matchesStatus;
      })
      .sort((first, second) => {
        if (sort === "name") return (first.username || "").localeCompare(second.username || "");
        if (sort === "email") return (first.email || "").localeCompare(second.email || "");
        return new Date(second.createdAt || 0) - new Date(first.createdAt || 0);
      });
  }, [users, query, roleFilter, statusFilter, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const visibleUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const studentsCount = users.filter((user) => user.role === "USER").length;
  const adminsCount = users.filter((user) => user.role === "ADMIN").length;
  const activeCount = users.filter((user) => user.isActive).length;

  useEffect(() => {
    setPage(1);
  }, [query, roleFilter, statusFilter, sort]);

  const openDetails = (user) => {
    setSelectedUser(user);
    setDetailsOpen(true);
  };

  const openEdit = (user) => {
    setSelectedUser(user);
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      mobileNumber: user.mobileNumber || "",
      role: user.role,
      isActive: Boolean(user.isActive),
      dob: user.dob || "",
      gender: user.gender || "",
      location: user.location || "",
      profession: user.profession || "",
      linkedin_url: user.linkedin_url || "",
      github_url: user.github_url || "",
    });
    setEditOpen(true);
  };

  const saveUser = async (values) => {
    setSaving(true);
    const result = await adminService.updateUser(selectedUser.id, values);
    if (result.success) {
      message.success("User account updated.");
      setEditOpen(false);
      await loadUsers();
    } else {
      message.error(result.error || "Could not update this user.");
    }
    setSaving(false);
  };

  const confirmSubmit = (values) => {
    const roleChanged = values.role !== selectedUser.role;
    const statusChanged = values.isActive !== Boolean(selectedUser.isActive);
    if (roleChanged || (statusChanged && !values.isActive)) {
      Modal.confirm({
        title: "Confirm account permissions",
        content: `This will ${roleChanged ? `change the role to ${values.role}` : "deactivate the account"}. Continue?`,
        okText: "Confirm change",
        cancelText: "Cancel",
        onOk: () => saveUser(values),
      });
      return;
    }
    saveUser(values);
  };

  const displayDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : dateFormat.format(date);
  };

  return (
    <main className="mx-auto max-w-7xl space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">LearnSphere administration</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">User management</h1>
        <p className="mt-2 text-slate-600">Search accounts, review profiles, and manage platform access.</p>
      </header>

      <section aria-label="User statistics" className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total accounts", value: users.length },
          { label: "Students", value: studentsCount },
          { label: "Active accounts", value: activeCount },
        ].map((stat) => (
          <article key={stat.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{loading ? "…" : loadError ? "—" : stat.value}</p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-700"><UsersRound size={21} aria-hidden="true" /></span>
            <div>
              <h2 className="font-bold text-slate-900">Platform accounts</h2>
              <p className="text-sm text-slate-500">{adminsCount} administrator{adminsCount === 1 ? "" : "s"}</p>
            </div>
          </div>
          <p className="text-sm text-slate-500" aria-live="polite">
            {loading ? "Loading accounts…" : `${filteredUsers.length} of ${users.length} accounts`}
          </p>
        </div>

        <div className="grid gap-3 border-b border-slate-100 p-5 sm:grid-cols-2 xl:grid-cols-4">
          <label className="relative block xl:col-span-2">
            <span className="sr-only">Search by name, email, or user ID</span>
            <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email, or user ID"
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <label>
            <span className="sr-only">Filter by role</span>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100">
              <option value="all">All roles</option>
              <option value="USER">Student</option>
              <option value="ADMIN">Administrator</option>
              <option value="INSTRUCTOR">Instructor</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Filter by account status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100">
              <option value="all">All statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>
          <label className="sm:col-span-2 xl:col-span-4">
            <span className="mr-3 text-sm font-medium text-slate-600">Sort by</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100">
              <option value="newest">Registration date (newest)</option>
              <option value="name">Name (A–Z)</option>
              <option value="email">Email (A–Z)</option>
            </select>
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">User</th>
                <th scope="col" className="px-5 py-3 font-semibold">User ID</th>
                <th scope="col" className="px-5 py-3 font-semibold">Role</th>
                <th scope="col" className="px-5 py-3 font-semibold">Registered</th>
                <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                <th scope="col" className="px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!loading && visibleUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">{user.username || "Unnamed user"}</p>
                    <p className="mt-0.5 text-slate-500">{user.email}</p>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-500">{user.id}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.role === "ADMIN" ? "bg-violet-100 text-violet-800" : user.role === "INSTRUCTOR" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-700"}`}>
                      {user.role === "USER" ? "Student" : user.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{displayDate(user.createdAt)}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${user.isActive ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? "bg-emerald-600" : "bg-red-600"}`} />
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openDetails(user)} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">View</button>
                      <button type="button" onClick={() => openEdit(user)} className="rounded-md border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-800 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">Edit access</button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading && <tr><td colSpan="6" className="px-5 py-12 text-center text-slate-500" role="status">Loading user records…</td></tr>}
              {!loading && loadError && <tr><td colSpan="6" className="px-5 py-12 text-center text-red-700" role="alert">{loadError}</td></tr>}
              {!loading && !loadError && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center">
                    <p className="font-semibold text-slate-800">No users found</p>
                    <p className="mt-1 text-sm text-slate-500">Try changing your search or filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredUsers.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
            <p className="text-sm text-slate-500">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length}</p>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
              <span className="px-2 text-sm text-slate-600" aria-live="polite">Page {page} of {pageCount}</span>
              <button type="button" disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </section>

      <Modal title="User details" open={detailsOpen} onCancel={() => setDetailsOpen(false)} footer={<Button onClick={() => setDetailsOpen(false)}>Close</Button>} width={600}>
        {selectedUser && (
          <dl className="grid grid-cols-1 gap-4 py-3 sm:grid-cols-2">
            {[
              ["Name", selectedUser.username],
              ["Email", selectedUser.email],
              ["User ID", selectedUser.id],
              ["Role", selectedUser.role === "USER" ? "Student" : selectedUser.role],
              ["Account status", selectedUser.isActive ? "Active" : "Inactive"],
              ["Registered", displayDate(selectedUser.createdAt)],
              ["Phone", selectedUser.mobileNumber || "—"],
              ["Location", selectedUser.location || "—"],
              ["Profession", selectedUser.profession || "—"],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0 rounded-lg bg-slate-50 p-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
                <dd className="mt-1 break-words text-sm font-medium text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Modal>

      <Modal
        title="Edit user account"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={confirmSubmit} className="pt-3">
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Form.Item label="Name" name="username" rules={[{ required: true, whitespace: true, message: "Enter a name." }]}>
              <Input autoComplete="name" />
            </Form.Item>
            <Form.Item label="Email" name="email" rules={[{ required: true }, { type: "email", message: "Enter a valid email." }]}>
              <Input autoComplete="email" />
            </Form.Item>
            <Form.Item label="Role" name="role" rules={[{ required: true }]}>
              <Select options={[
                { value: "USER", label: "Student" },
                { value: "INSTRUCTOR", label: "Instructor" },
                { value: "ADMIN", label: "Administrator" },
              ]} />
            </Form.Item>
            <Form.Item label="Account status" name="isActive" rules={[{ required: true }]}>
              <Select options={[
                { value: true, label: "Active" },
                { value: false, label: "Inactive" },
              ]} />
            </Form.Item>
            <Form.Item label="Phone" name="mobileNumber"><Input autoComplete="tel" /></Form.Item>
            <Form.Item label="Date of birth" name="dob"><Input placeholder="YYYY-MM-DD" /></Form.Item>
            <Form.Item label="Gender" name="gender"><Input /></Form.Item>
            <Form.Item label="Location" name="location"><Input autoComplete="address-level2" /></Form.Item>
            <Form.Item label="Profession" name="profession"><Input /></Form.Item>
            <Form.Item label="LinkedIn URL" name="linkedin_url" rules={[{ type: "url", warningOnly: true, message: "Enter a complete URL." }]}><Input /></Form.Item>
            <Form.Item label="GitHub URL" name="github_url" rules={[{ type: "url", warningOnly: true, message: "Enter a complete URL." }]}><Input /></Form.Item>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={saving}>Save changes</Button>
          </div>
        </Form>
      </Modal>
    </main>
  );
}

export default Users;
