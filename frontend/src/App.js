import './App.css';
import {BrowserRouter , Routes , Route} from 'react-router-dom';
import Login from './pages/auth/login';
import Register from './pages/auth/register'
import Courses from './pages/course/Courses';
import Profile from './pages/profile/profile';
import Learnings from './pages/learning/learnings';
import Home from './pages/landing/Home';
import DUsers from './pages/dashBoard/DUsers';
import DCourses from './pages/dashBoard/DCourses';
import Assessment from './pages/assessment/Assessment';
import ErrorPage from './pages/error/ErrorPage';
import AddQuestions from './pages/dashBoard/AddQuestions';
import Performance from './pages/profile/Performance';
import Certificate from './pages/assessment/certificate';
import Forum from './pages/course/forum';
import AdminDashboard from './pages/dashBoard/AdminDashboard';
import ProtectedRoute from './Components/common/ProtectedRoute';
import StudentDashboard from './pages/dashBoard/StudentDashboard';
import Assignments from './pages/learning/Assignments';
import Notifications from './pages/learning/Notifications';
import VerifyCertificate from './pages/assessment/VerifyCertificate';
import CourseLearning from './pages/learning/CourseLearning';
import CourseDetails from './pages/course/CourseDetails';
import PaymentSuccess from './pages/payment/PaymentSuccess';
import DemoPayment from './pages/payment/DemoPayment';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/addquestions/:id" element={<ProtectedRoute role="ROLE_ADMIN"><AddQuestions /></ProtectedRoute>} />
          <Route path='/admin' element={<ProtectedRoute role="ROLE_ADMIN"><AdminDashboard /></ProtectedRoute>} />
          <Route path='/dashboard' element={<ProtectedRoute role="ROLE_USER"><StudentDashboard /></ProtectedRoute>} />
          <Route path='/login' Component={Login}></Route>
          <Route path='/register' Component={Register}></Route>
          <Route path='/' Component={Home}></Route>
          <Route path='/courses' Component={Courses}></Route>
          <Route path='/course/:id' Component={CourseDetails} />
          <Route path='/payment/success' element={<ProtectedRoute role="ROLE_USER"><PaymentSuccess /></ProtectedRoute>} />
          <Route path='/payment/demo' element={<ProtectedRoute role="ROLE_USER"><DemoPayment /></ProtectedRoute>} />
          <Route path='/discussion/:id' element={<ProtectedRoute role="ROLE_USER"><Forum /></ProtectedRoute>} />
          <Route path='/certificate/:courseId' element={<ProtectedRoute role="ROLE_USER"><Certificate /></ProtectedRoute>} />
          <Route path='/assessment/:id' element={<ProtectedRoute role="ROLE_USER"><Assessment /></ProtectedRoute>} />
          <Route path='/profile' element={<ProtectedRoute role="ROLE_USER"><Profile /></ProtectedRoute>} />
          <Route path='/Learnings' element={<ProtectedRoute role="ROLE_USER"><Learnings /></ProtectedRoute>} />
          <Route path='/learn/:courseId' element={<ProtectedRoute role="ROLE_USER"><CourseLearning /></ProtectedRoute>} />
          <Route path='/Dcourses' element={<ProtectedRoute role="ROLE_ADMIN"><DCourses /></ProtectedRoute>} />
          <Route path='/Dusers' element={<ProtectedRoute role="ROLE_ADMIN"><DUsers /></ProtectedRoute>} />
          <Route path='/Performance' element={<ProtectedRoute role="ROLE_USER"><Performance /></ProtectedRoute>} />
          <Route path='/assignments' element={<ProtectedRoute role="ROLE_USER"><Assignments /></ProtectedRoute>} />
          <Route path='/notifications' element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path='/verify/:code' element={<VerifyCertificate />} />
          <Route path='*' Component={ErrorPage}></Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
