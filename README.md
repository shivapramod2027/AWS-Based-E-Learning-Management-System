# LearnSphere – Cloud-Based Learning Management System

## Overview

LearnSphere is a cloud-based Learning Management System (LMS) built with React.js, Spring Boot, and MySQL. It provides a platform for managing online courses, user profiles, assessments, progress tracking, and more.

---

## Features

### User Management
- User registration and login functionality.
- User profiles with the ability to update information.

### Course Management
- Admin can add, edit, and manage courses.
- Course details include topic, difficulty, estimated duration, learning objectives, and ratings.
- Optional external catalog synchronization imports courses into MySQL; the database remains the source used by the app.
- Admins can build a course syllabus from ordered modules, lessons, and learning resources.

### Assessment
- Users can take assessments related to courses.
- Admin can create and manage assessment questions.

### Progress Tracking
- Monitor user progress and completion status.
- Visual representation of user progress.
- Students can mark lessons complete and continue from their course-learning page.

### Certificate Generation
- Automatic certificate generation when the learner completes the final course lesson (or finishes video progress for a course without lessons).
- Personalized certificates with user details.

### Discussion Forum
- Course-specific discussion forums for users.
- Interaction between users and instructors.

### Authentication & Security
- JWT token-based authentication.
- Role-based access control (**ADMIN**, **USER**).
- Secure password encryption.
- Optional initial admin account configured through environment variables.
- Administrators can assign the existing **INSTRUCTOR** role.

### LearnSphere dashboards
- Students land on a learning-focused dashboard with their own enrolled courses.
- Administrators land on a separate protected management dashboard.
- The public home page displays courses from the backend catalog.
- In-app notifications, unread counts, reminder preferences, and optional SMTP email delivery.
- Assignment creation, submission, review, and grading.

### Admin Dashboard
- Live student, course, enrollment, completion, and progress statistics.
- Enrollment charts and recent course activity use saved database records.
- Search, filter, sort, and paginate user accounts; update account details, role, and status.
- Review course enrollments and manage courses and assessment questions.
- Role and status changes are restricted to admins on the backend; the last active admin cannot be disabled or demoted.

--- 

## Technologies Used

### Frontend
- **Core Framework:** React, React DOM, React Router  
- **UI Components:** Ant Design, Lucide Icons, FontAwesome
- **Styling:** Tailwind CSS  
- **API Communication:** Axios
- **Additional Libraries:** React Player, jsPDF, html2canvas, Moment.js, React DOM Confetti

### Backend
- **Framework:** Spring Boot  
- **Language:** Java  
- **Security:** Spring Security with JWT
- **Authentication:** Role-Based Access Control
- **Database Integration:** Spring Data JPA
- **Architecture:** RESTful API
- **Build Tool:** Maven

### Database
- **MySQL**
- **Tables:** course, learning, progress, discussion, feedback, question, user, assessment

---

## Setup


### Prerequisites
- Java 17 or higher  
- Maven 3.6+  
- MySQL 8.0+  
- Node.js and npm


## Backend

Create a MySQL database user and configure these variables in the backend terminal. Generate the JWT secret once and keep it stable across backend restarts; changing it invalidates all existing login tokens. This command stores it in your Windows user environment if it has not already been set:

```powershell
Set-Location backend
$env:DB_URL = "jdbc:mysql://localhost:3306/lms?createDatabaseIfNotExist=true"
$env:DB_USERNAME = "your_mysql_username"
$env:DB_PASSWORD = "your_mysql_password"
$jwtSecret = [Environment]::GetEnvironmentVariable("JWT_SECRET", "User")
if (-not $jwtSecret) {
  $bytes = New-Object byte[] 64
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  $rng.GetBytes($bytes)
  $jwtSecret = [Convert]::ToBase64String($bytes)
  [Environment]::SetEnvironmentVariable("JWT_SECRET", $jwtSecret, "User")
}
$env:JWT_SECRET = $jwtSecret
$env:ADMIN_USERNAME = "admin"
$env:ADMIN_EMAIL = "admin@example.com"
$env:ADMIN_PASSWORD = "choose-a-unique-password"
# Optional SMTP delivery; leave unset to use in-app notifications only.
$env:MAIL_HOST = "smtp.example.com"
$env:MAIL_PORT = "587"
$env:MAIL_USERNAME = "your_smtp_username"
$env:MAIL_PASSWORD = "your_smtp_password"
$env:MAIL_FROM = "learnsphere@example.com"
# Optional compatible catalog endpoint returning a JSON array or results/courses/items/data array.
$env:COURSE_CATALOG_URL = ""
# Optional bearer token for the external catalog.
$env:COURSE_CATALOG_API_KEY = ""
# The default is a local simulated payment flow for college-project demos.
$env:PAYMENT_MODE = "demo"
# Set PAYMENT_MODE to cashfree only when you have merchant credentials:
$env:CASHFREE_CLIENT_ID = "your_cashfree_app_id"
$env:CASHFREE_CLIENT_SECRET = "your_cashfree_secret_key"
$env:CASHFREE_ENVIRONMENT = "sandbox"
# Public frontend origin used for Checkout success/cancel redirects.
$env:FRONTEND_URL = "http://localhost:3000"
.\mvnw.cmd spring-boot:run
```

An initial administrator is created only when all three `ADMIN_*` variables are set and the database has no administrator. Public registration always creates a regular user.
Demo course seeding is disabled by default (`SEED_DEMO_COURSES=false`). To generate sample records in a development database, set it to `true` and optionally set `DEMO_COURSE_TARGET` (default `300`). Existing database records are not deleted when seeding is disabled.

The optional course catalog expects a JSON array, or an array under `results`, `courses`, `items`, or `data`. Each item should include a stable ID (`id`, `key`, `course_id`, or `course`) and title (`title`, `name`, or `course_name`). Common optional fields such as description, image, category, level, instructor, duration, objectives, rating, and course URL are imported when available. External catalog data is synchronized at most once every five minutes and a failed request leaves saved MySQL courses available. Configure `COURSE_CATALOG_URL` and `COURSE_CATALOG_API_KEY` only for an endpoint you trust.

The application uses Hibernate `ddl-auto: update` to create or update new tables and columns at startup. Back up the database before deploying schema changes. Reminder emails are sent only when SMTP is configured; SMTP connection/read/write timeouts default to 10 seconds. Reminder times use the backend server's local timezone.

Empty internally managed courses receive an interactive starter syllabus on backend startup (`SEED_DEMO_CONTENT=true` by default). It includes guided exercises and a mini project; existing lessons and externally hosted courses are left unchanged. Learners can navigate lessons, mark them complete, and track progress. When the course is complete, the backend automatically creates a uniquely verifiable certificate, which learners can view and download from the course page.

### Cashfree course payments

By default, paid-course checkout uses a clearly labeled local demo payment (`PAYMENT_MODE=demo`). It makes no external payment and collects no money; a signed-in user can simulate a successful payment to complete the college-project flow. The backend creates a pending order and marks it paid only after the user confirms the simulation. Do not use demo mode for real sales or production deployments.

To use real payments instead, explicitly set `PAYMENT_MODE=cashfree`, set `CASHFREE_CLIENT_ID` and `CASHFREE_CLIENT_SECRET` from the Cashfree merchant dashboard, and choose `CASHFREE_ENVIRONMENT=sandbox` or `production`. Keep credentials on the backend; never put them in frontend configuration or source control. Cashfree Checkout requires a customer mobile number. Configure Cashfree webhooks at `POST https://your-api-host/api/payments/webhook`; webhook signatures are verified using the Cashfree client secret. The backend verifies Cashfree order status, amount, and currency before enrollment. Free courses continue to enroll without checkout.

## Frontend

In a second terminal:

```powershell
Set-Location frontend
npm install
npm start
```  

## Usage

- Visit the application on http://localhost:3000.
- Students are sent to `/dashboard` after sign-in; administrators are sent to `/admin`.
- Administrators can manage courses and users from the protected admin dashboard. Backend endpoints enforce authorization independently of the frontend route guards.

Users can register, log in, view courses, take assessments, and receive certificates.
Students can enroll in courses, use lesson-based course content, submit assignments, manage reminder preferences, and view their notifications. Admins can manage course modules and lessons from course management.

## API Documentation

- Access interactive API docs at:
  http://localhost:8080/swagger-ui/index.html
- Admin user records: `GET /api/users`; update a user securely with `PUT /api/users/admin/{id}`.
- Admin enrollment records: `GET /api/learning`; course enrollment totals: `GET /api/learning/stats/by-course`.
- Admin progress metrics: `GET /api/progress/stats`.
- Course content: `GET /api/courses/{courseId}/modules`; admins manage content under `/api/courses/{courseId}/modules`.
- Lesson completion: `POST /api/lessons/{lessonId}/complete`.
- Notifications and reminder preferences: `/api/notifications` and `/api/notifications/preferences`.
- Paid-course checkout: `POST /api/payments/checkout-session` followed by the configured demo flow or Cashfree Checkout and `POST /api/payments/confirm`.

## Contributing

- Open issues to report bugs or suggest features
- Submit pull requests to improve the project
- Feedback and contributions are highly appreciated