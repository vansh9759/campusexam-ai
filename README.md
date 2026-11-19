# CampusExam AI
### College Online Examination & Automatic Grading Platform

**CampusExam AI** is an enterprise-grade, secure, full-stack College Online Examination and Automatic Grading Platform. It enables universities, academic departments, and colleges to conduct secure online assessments, automatically grade objective and coding submissions, streamline faculty rubric evaluations for descriptive questions, monitor examinations live with real-time Socket telemetry, and generate institutional analytics with downloadable PDF and Excel grade transcripts.

---

## 1. System Architecture & Tech Stack

```
CampusExam-AI/
├── backend/                        # Node.js + Express + TypeScript + Prisma ORM
│   ├── prisma/
│   │   ├── schema.prisma           # 22 Relational Database Entities with constraints
│   │   ├── seed.ts                 # Realistic university seed dataset
│   │   └── dev.db                  # Instant local zero-setup database
│   ├── src/
│   │   ├── controllers/            # Auth, Admin, Faculty, Student, Exam, Reports
│   │   ├── middleware/             # JWT Auth, Role-Based Access Control (RBAC), Error Handler
│   │   ├── routes/                 # REST endpoints with security middleware
│   │   ├── services/
│   │   │   ├── auth.service.ts     # Bcrypt password hashing & JWT token issuance
│   │   │   ├── grading.service.ts  # MCQ, True/False, Short Answer, Rubric autograder
│   │   │   ├── coding.service.ts   # Isolated sandbox runner (Python, C++, Java)
│   │   │   ├── socket.service.ts   # Real-time WebSocket exam monitoring & proctoring
│   │   │   ├── report.service.ts   # Excel (ExcelJS) & PDF (PDFKit) transcript engines
│   │   │   └── audit.service.ts    # Tamper-evident academic audit logger
│   │   └── index.ts                # Express server + Socket.IO server initialization
│   └── test/
│       └── run-tests.ts            # Automated verification test suite (17/17 PASS)
├── frontend/                       # Vite + React 18 + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── api/client.ts           # Axios client with JWT auto-injection & interceptors
│   │   ├── context/
│   │   │   ├── AuthContext.tsx     # Role state, token persistence, user credentials
│   │   │   └── SocketContext.tsx   # Real-time WebSocket connection
│   │   ├── components/             # Reusable Navbar, Sidebar, Modals, Badges
│   │   ├── pages/
│   │   │   ├── auth/LoginPage.tsx  # Login with 1-click Quick Demo Accounts
│   │   │   ├── admin/              # Institutional Dashboard, Departments, Subjects, Users, Live Proctoring, Audit
│   │   │   ├── faculty/            # Overview, Exam Wizard, Question Bank, Submissions & Rubrics, Class Analytics
│   │   │   ├── student/            # Enrolled Exams Dashboard, Scorecards & PDF Download
│   │   │   └── exam/ExamRoom.tsx   # Distraction-free live exam room with server timer & autosave
│   │   └── App.tsx                 # Route declarations & role guards
├── execution-service/              # Containerized Sandbox definitions
│   └── Dockerfile.sandbox          # Non-root unprivileged runner with resource limits
├── docker-compose.yml              # Production Compose (PostgreSQL, Redis, Backend, Frontend)
└── README.md                       # Complete documentation & user guide
```

---

## 2. Pre-Configured Demo Accounts

For immediate evaluation and demonstration, the platform comes pre-seeded with realistic university data:

| Portal Role | College Email | Password | Access & Responsibilities |
|---|---|---|---|
| **Admin / Dean** | `admin@campusexam.edu` | `Admin@123` | Institutional analytics, departments, courses, subjects, faculty/student directory, live proctoring, audit logs |
| **Faculty** | `prof.sharma@campusexam.edu` | `Faculty@123` | Data Structures & Algorithms faculty: Exam authoring, Question Bank, descriptive rubric grading, class analytics |
| **Faculty** | `prof.gupta@campusexam.edu` | `Faculty@123` | Database Management Systems faculty |
| **Student** | `student1@campusexam.edu` | `Student@123` | Candidate (Vansh Sharma, Roll No: 24CSE01): Attempt active exam, autosave answers, view published results & PDF |
| **Student** | `student2@campusexam.edu` | `Student@123` | Candidate (Priya Verma, Roll No: 24CSE02) |
| **Student** | `student3@campusexam.edu` | `Student@123` | Candidate (Rahul Sen, Roll No: 24CSE03) |

*Tip: The Login Page includes quick 1-click buttons to instantly pre-fill any of these accounts.*

---

## 3. Key Modules & Features

### A. Admin Portal (`/admin`)
- **Institutional Analytics Dashboard**: Total students, faculty, departments, active exams, college pass rate, and average scores.
- **Department Performance Benchmarking**: Interactive Recharts bar visualization comparing academic averages across departments.
- **Department & Degree Management**: CRUD for academic faculties (CSE, ECE, IT) and degree courses (B.Tech, M.Tech).
- **Subject & Credit Allocation**: Manage course codes (CS401, CS402, CS403), semester mappings, and faculty assignments.
- **Faculty & Student Directory**: User roster with enrollment numbers, roll numbers, search, and filtering.
- **Live Proctoring Room (`/admin/proctoring`)**: Real-time Socket.IO monitoring showing connected candidates, question progress bars, red pulse alerts for tab-switches, and official announcement broadcast.
- **Audit Logs (`/admin/audit`)**: Security logs with timestamps, IP addresses, and metadata.

### B. Faculty Portal (`/faculty`)
- **Teaching Overview**: Assigned courses, authored exams, pending grading evaluations count.
- **Examination Management**: Create exams with draft/published state, duration in minutes, positive/negative marking rules, question randomization, and attempt limits.
- **Question Bank Repository**: Multi-format question creator supporting:
  1. *MCQ Single Correct*
  2. *MCQ Multiple Select*
  3. *True / False*
  4. *Short Answer (Keyword matching)*
  5. *Descriptive Questions (with faculty marking rubric criteria)*
  6. *Coding Problems (with language templates, sample test cases, and hidden test cases)*
- **Submissions & Manual Evaluation**: Review candidate responses, view rubric breakdown, award marks, write feedback, and trigger grade recalculation.
- **Publish Results**: Release grades to students with toggle to reveal answer keys.
- **Class Performance Analytics**: Class average, highest/lowest marks, pass rate, score distribution chart, and Excel export.

### C. Student Portal (`/student`)
- **Personalized Exam Dashboard**: Enrolled subjects, active exams ready to attempt, upcoming schedules, and notifications.
- **Grade Transcripts (`/student/results`)**: Published results, percentage, pass/fail status, question scorecard breakdown, and **one-click downloadable official PDF transcript**.

### D. Distraction-Free Real-Time Examination Room (`/exam/:attemptId`)
- **Server-Authoritative Timer**: Synchronized with server expiry; client clock cannot be manipulated. Automatic submission when time reaches zero.
- **Debounced Answer Autosave**: Every selection, text answer, and code change is automatically saved to the backend with live status badge (`Saving...` / `All changes autosaved`).
- **Integrity Telemetry**: Window blur and tab-switching events are instantly captured and transmitted via WebSocket to the proctor console with in-exam warning.
- **Coding Sandbox Workspace**: In-browser code editor with Python 3, C++17, and Java selectors, sample test case preview, and live execution runner showing stdout/stderr and execution time.
- **Question Navigation Palette**: Quick jumping with color codes (Answered: Green, Marked for Review: Amber, Unanswered: Slate, Current: Blue ring).
- **Pre-Submission Checklist**: Modal summarizing answered vs unanswered questions before final lock.

---

## 4. Automatic Grading & Security Engine

1. **Objective Autograding**:
   - Single MCQ: Compared against correct option ID; awards full marks or applies negative penalty.
   - Multiple MCQ: Validates exact set of correct options; applies penalty for incorrect combinations.
   - True/False: Instant boolean verification.
   - Short Answer: Case-insensitive keyword and synonym matching.
2. **Descriptive Rubric Grading**:
   - Stored criteria with individual maximum mark thresholds.
   - Faculty marks and remarks recorded in `ManualEvaluation` table with tamper-evident audit log.
3. **Coding Autograder & Security Sandbox**:
   - **Isolation**: Executed in a dedicated sandbox environment with strict timeouts (2 seconds) and memory limits.
   - **Test Case Masking**: Hidden test cases are executed on the backend, but their inputs and expected outputs are strictly masked from student responses (`[HIDDEN]`) to prevent reverse-engineering.
   - **Status Reporting**: Detailed execution classification (`ACCEPTED`, `WRONG_ANSWER`, `TIME_LIMIT_EXCEEDED`, `COMPILATION_ERROR`, `RUNTIME_ERROR`).

---

## 5. Verification Test Suite Results

CampusExam AI includes an automated verification test suite in `backend/test/run-tests.ts`:

```bash
cd backend
npm test
```

### Test Suite Execution Output:
```
====================================================
🧪 Starting CampusExam AI Automated Verification Suite
====================================================

[Test Suite 1: Authentication & RBAC]
  ✔ PASS: Admin login successful and role verified
  ✔ PASS: JWT token correctly generated
  ✔ PASS: Faculty login successful and role verified
  ✔ PASS: Student login successful and role verified
  ✔ PASS: Invalid password correctly rejected with 401 Unauthorized

[Test Suite 2: Database Schema & Relational Integrity]
  ✔ PASS: Departments seeded properly (Found: 3)
  ✔ PASS: Active examination found in database
  ✔ PASS: Active exam has all 6 question types configured (Found: 6)

[Test Suite 3: Autograding Engine & Negative Marking]
  ✔ PASS: Completed examination found with historical results
  ✔ PASS: Candidate attempts populated for completed exam
  ✔ PASS: Student percentage evaluated correctly (76%)

[Test Suite 4: Coding Autograder Sandbox]
  ✔ PASS: Python sandbox execution status: ACCEPTED
  ✔ PASS: All 3 test cases passed (3/3)

[Test Suite 5: Security & Hidden Test Case Masking]
  ✔ PASS: Hidden test case input strictly masked from student output
  ✔ PASS: Hidden test case expectedOutput strictly masked from student output

[Test Suite 6: PDF & Excel Academic Report Engines]
  ✔ PASS: Excel report generated successfully (Size: 7909 bytes)
  ✔ PASS: Student PDF transcript generated successfully (Size: 2736 bytes)

====================================================
📊 Test Summary: 17 Passed, 0 Failed (100% Success)
====================================================
```

---

## 6. How to Run Locally

### 1. Start the Backend API & WebSocket Server
```bash
cd CampusExam-AI/backend
npm install
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```
*Backend runs on: `http://localhost:5000`*

### 2. Start the Frontend Application
```bash
cd CampusExam-AI/frontend
npm install
npm run dev
```
*Frontend runs on: `http://localhost:5173`*

Open **http://localhost:5173** in your browser and log in with any demo account.

---

## 7. Production Deployment (Docker Compose)

For production deployment with PostgreSQL, Redis, and Sandbox execution:

```bash
docker-compose up --build -d
```
This spins up:
- PostgreSQL 16 on port 5432
- Redis 7 on port 6379
- CampusExam Backend on port 5000
- CampusExam Frontend on port 5173
