import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../Components/common/Navbar";
import { notificationService } from "../../api/notification.service";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [preferences, setPreferences] = useState({ dailyRemindersEnabled: true, preferredReminderTime: "09:00:00" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadNotifications = async () => {
    const [notificationsResult, preferencesResult] = await Promise.all([
      notificationService.getAll(),
      notificationService.getPreferences(),
    ]);
    if (notificationsResult.success) setNotifications(notificationsResult.data);
    else setError(notificationsResult.error);
    if (preferencesResult.success) {
      setPreferences({
        ...preferencesResult.data,
        preferredReminderTime: preferencesResult.data.preferredReminderTime?.slice(0, 5) || "09:00",
      });
    } else setError((current) => current || preferencesResult.error);
    setLoading(false);
  };

  useEffect(() => { loadNotifications(); }, []);

  const markRead = async (notification) => {
    const result = await notificationService.markRead(notification.id);
    if (result.success) {
      setNotifications((items) => items.map((item) =>
        item.id === notification.id ? { ...item, read: true } : item));
    } else {
      setError(result.error);
    }
  };

  const savePreferences = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const result = await notificationService.updatePreferences(preferences);
    setSaving(false);
    if (result.success) {
      setPreferences({ ...result.data, preferredReminderTime: result.data.preferredReminderTime.slice(0, 5) });
      setNotice("Reminder preferences saved.");
    } else setError(result.error);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">Updates</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Notifications</h1>
          <p className="mt-2 text-slate-600">Course news, assignment alerts, and your daily learning reminders.</p>
        </header>

        <form onSubmit={savePreferences} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Daily learning reminders</h2>
          <p className="mt-1 text-sm text-slate-600">Reminders are created in-app and emailed when SMTP delivery is configured.</p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={preferences.dailyRemindersEnabled} onChange={(event) => setPreferences((current) => ({ ...current, dailyRemindersEnabled: event.target.checked }))} className="h-4 w-4 accent-indigo-700" />
              Remind me to continue unfinished courses
            </label>
            <label className="text-sm font-medium text-slate-700">
              Preferred time
              <input type="time" value={preferences.preferredReminderTime} onChange={(event) => setPreferences((current) => ({ ...current, preferredReminderTime: event.target.value }))} disabled={!preferences.dailyRemindersEnabled} className="ml-2 rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-100" />
            </label>
            <button type="submit" disabled={saving} className="rounded-lg bg-indigo-700 px-4 py-2.5 font-semibold text-white hover:bg-indigo-800 disabled:opacity-60">{saving ? "Saving…" : "Save preferences"}</button>
          </div>
          <p className="mt-3 text-xs text-slate-500">The reminder time follows the backend server’s local time zone.</p>
        </form>

        {error && <p className="rounded-lg bg-red-50 p-3 text-red-800" role="alert">{error}</p>}
        {notice && <p className="rounded-lg bg-green-50 p-3 text-green-800" role="status">{notice}</p>}
        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900">Notification history</h2>
          {loading ? <p className="mt-6" role="status">Loading notifications…</p> : notifications.length === 0 ? (
            <p className="rounded-xl bg-white p-8 text-center text-slate-600">You are all caught up.</p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {notifications.map((item) => (
                <li key={item.id} className={`flex flex-wrap items-start justify-between gap-4 p-5 ${item.read ? "" : "bg-indigo-50/60"}`}>
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                    <p className="mt-2 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                    {item.assignmentId && <Link to="/assignments" className="mt-2 inline-block text-sm font-semibold text-indigo-700">View assignments</Link>}
                    {!item.assignmentId && item.courseId && <Link to={`/learn/${item.courseId}`} className="mt-2 inline-block text-sm font-semibold text-indigo-700">Open course</Link>}
                  </div>
                  {!item.read && (
                    <button type="button" onClick={() => markRead(item)} className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">Mark as read</button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default Notifications;
