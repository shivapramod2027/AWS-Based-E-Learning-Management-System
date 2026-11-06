import { Navigate } from "react-router-dom";
import { authService } from "../../api/auth.service";

function ProtectedRoute({ children, role }) {
  const user = authService.getCurrentUser();

  if (!user.token) {
    return <Navigate to="/login" replace />;
  }

  if (role === "ROLE_ADMIN" && !authService.isAdminAuthenticated()) {
    return <Navigate to="/courses" replace />;
  }

  if (role === "ROLE_USER" && !authService.isUserAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
