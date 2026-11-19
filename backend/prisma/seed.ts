import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting CampusExam AI Seed ---');

  // Clear existing data in reverse order of foreign keys
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.resultPublication.deleteMany();
  await prisma.manualEvaluation.deleteMany();
  await prisma.gradingResult.deleteMany();
  await prisma.codingSubmission.deleteMany();
  await prisma.studentAnswer.deleteMany();
  await prisma.examAttempt.deleteMany();
  await prisma.codingTestCase.deleteMany();
  await prisma.questionOption.deleteMany();
  await prisma.examinationQuestion.deleteMany();
  await prisma.questionBank.deleteMany();
  await prisma.examination.deleteMany();
  await prisma.facultySubject.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.facultyProfile.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.semester.deleteMany();
  await prisma.course.deleteMany();
  await prisma.academicSession.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('Admin@123', salt);
  const facultyPasswordHash = await bcrypt.hash('Faculty@123', salt);
  const studentPasswordHash = await bcrypt.hash('Student@123', salt);

  // 1. Create Users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@campusexam.edu',
      name: 'Dr. Arthur Mitchell (Dean of Academics)',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const faculty1User = await prisma.user.create({
    data: {
      email: 'prof.sharma@campusexam.edu',
      name: 'Prof. Rajesh Sharma',
      passwordHash: facultyPasswordHash,
      role: 'FACULTY',
      isActive: true,
    },
  });

  const faculty2User = await prisma.user.create({
    data: {
      email: 'prof.gupta@campusexam.edu',
      name: 'Dr. Ananya Gupta',
      passwordHash: facultyPasswordHash,
      role: 'FACULTY',
      isActive: true,
    },
  });

  const student1User = await prisma.user.create({
    data: {
      email: 'student1@campusexam.edu',
      name: 'Vansh Sharma',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
      isActive: true,
    },
  });

  const student2User = await prisma.user.create({
    data: {
      email: 'student2@campusexam.edu',
      name: 'Priya Verma',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
      isActive: true,
    },
  });

  const student3User = await prisma.user.create({
    data: {
      email: 'student3@campusexam.edu',
      name: 'Rahul Sen',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
      isActive: true,
    },
  });

  // 2. Departments
  const deptCSE = await prisma.department.create({
    data: {
      code: 'CSE',
      name: 'Computer Science & Engineering',
      description: 'Department of Computer Science and Software Engineering',
    },
  });

  const deptECE = await prisma.department.create({
    data: {
      code: 'ECE',
      name: 'Electronics & Communication Engineering',
      description: 'Department of Electronics and Communications',
    },
  });

  const deptIT = await prisma.department.create({
    data: {
      code: 'IT',
      name: 'Information Technology',
      description: 'Department of Information Technology & Cybersecurity',
    },
  });

  // 3. Courses
  const courseBTechCSE = await prisma.course.create({
    data: {
      code: 'BTECH_CSE',
      name: 'Bachelor of Technology (Computer Science & Engineering)',
      departmentId: deptCSE.id,
      durationYears: 4,
    },
  });

  // 4. Semesters
  const sem4 = await prisma.semester.create({
    data: {
      number: 4,
      courseId: courseBTechCSE.id,
    },
  });

  const sem6 = await prisma.semester.create({
    data: {
      number: 6,
      courseId: courseBTechCSE.id,
    },
  });

  // 5. Academic Sessions
  const session2026 = await prisma.academicSession.create({
    data: {
      name: '2025-2026 (Even Semester)',
      isCurrent: true,
      startDate: new Date('2026-01-05T00:00:00Z'),
      endDate: new Date('2026-06-30T23:59:59Z'),
    },
  });

  // 6. Profiles
  const faculty1Profile = await prisma.facultyProfile.create({
    data: {
      userId: faculty1User.id,
      employeeId: 'FAC-CSE-001',
      departmentId: deptCSE.id,
      designation: 'Associate Professor & HOD',
    },
  });

  const faculty2Profile = await prisma.facultyProfile.create({
    data: {
      userId: faculty2User.id,
      employeeId: 'FAC-CSE-002',
      departmentId: deptCSE.id,
      designation: 'Assistant Professor',
    },
  });

  const student1Profile = await prisma.studentProfile.create({
    data: {
      userId: student1User.id,
      enrollmentNumber: 'EN2024CSE0101',
      rollNumber: '24CSE01',
      departmentId: deptCSE.id,
      courseId: courseBTechCSE.id,
      currentSemesterId: sem4.id,
    },
  });

  const student2Profile = await prisma.studentProfile.create({
    data: {
      userId: student2User.id,
      enrollmentNumber: 'EN2024CSE0102',
      rollNumber: '24CSE02',
      departmentId: deptCSE.id,
      courseId: courseBTechCSE.id,
      currentSemesterId: sem4.id,
    },
  });

  const student3Profile = await prisma.studentProfile.create({
    data: {
      userId: student3User.id,
      enrollmentNumber: 'EN2024CSE0103',
      rollNumber: '24CSE03',
      departmentId: deptCSE.id,
      courseId: courseBTechCSE.id,
      currentSemesterId: sem4.id,
    },
  });

  // 7. Subjects
  const subjectDSA = await prisma.subject.create({
    data: {
      code: 'CS401',
      name: 'Data Structures and Algorithms',
      credits: 4,
      departmentId: deptCSE.id,
      semesterId: sem4.id,
    },
  });

  const subjectDBMS = await prisma.subject.create({
    data: {
      code: 'CS402',
      name: 'Database Management Systems',
      credits: 4,
      departmentId: deptCSE.id,
      semesterId: sem4.id,
    },
  });

  const subjectCN = await prisma.subject.create({
    data: {
      code: 'CS403',
      name: 'Computer Networks',
      credits: 3,
      departmentId: deptCSE.id,
      semesterId: sem4.id,
    },
  });

  const subjectProg = await prisma.subject.create({
    data: {
      code: 'CS201',
      name: 'Principles of Programming Languages (Python, C++, Java)',
      credits: 4,
      departmentId: deptCSE.id,
      semesterId: sem4.id,
    },
  });

  // Assign Faculty to Subjects
  await prisma.facultySubject.create({
    data: {
      facultyId: faculty1Profile.id,
      subjectId: subjectDSA.id,
      sessionId: session2026.id,
    },
  });

  await prisma.facultySubject.create({
    data: {
      facultyId: faculty2Profile.id,
      subjectId: subjectDBMS.id,
      sessionId: session2026.id,
    },
  });

  await prisma.facultySubject.create({
    data: {
      facultyId: faculty1Profile.id,
      subjectId: subjectProg.id,
      sessionId: session2026.id,
    },
  });

  // Enroll students
  for (const stu of [student1Profile, student2Profile, student3Profile]) {
    await prisma.enrollment.create({
      data: {
        studentId: stu.id,
        subjectId: subjectDSA.id,
        sessionId: session2026.id,
      },
    });
    await prisma.enrollment.create({
      data: {
        studentId: stu.id,
        subjectId: subjectDBMS.id,
        sessionId: session2026.id,
      },
    });
    await prisma.enrollment.create({
      data: {
        studentId: stu.id,
        subjectId: subjectProg.id,
        sessionId: session2026.id,
      },
    });
  }

  // 8. Question Bank for DSA (CS401)
  // Question 1: MCQ Single
  const q1 = await prisma.questionBank.create({
    data: {
      subjectId: subjectDSA.id,
      facultyId: faculty1Profile.id,
      type: 'MCQ_SINGLE',
      title: 'Time Complexity of Binary Search',
      content: 'What is the worst-case time complexity of standard Binary Search on a sorted array of size N?',
      marks: 2.0,
      negativeMarks: 0.5,
      difficulty: 'EASY',
      explanation: 'Binary Search reduces the search space by half in each iteration, resulting in O(log N) time complexity.',
      options: {
        create: [
          { text: 'O(1)', isCorrect: false, orderIndex: 0 },
          { text: 'O(log N)', isCorrect: true, orderIndex: 1 },
          { text: 'O(N)', isCorrect: false, orderIndex: 2 },
          { text: 'O(N log N)', isCorrect: false, orderIndex: 3 },
        ],
      },
    },
  });

  // Question 2: MCQ Multiple Select
  const q2 = await prisma.questionBank.create({
    data: {
      subjectId: subjectDSA.id,
      facultyId: faculty1Profile.id,
      type: 'MCQ_MULTIPLE',
      title: 'Properties of Balanced Binary Search Trees (AVL / Red-Black)',
      content: 'Which of the following statements are TRUE regarding AVL Trees and Red-Black Trees?',
      marks: 3.0,
      negativeMarks: 1.0,
      difficulty: 'MEDIUM',
      explanation: 'Both AVL and Red-Black trees guarantee O(log N) operations. AVL trees are more strictly balanced than Red-Black trees.',
      options: {
        create: [
          { text: 'AVL trees maintain a balance factor between -1 and +1 for all nodes', isCorrect: true, orderIndex: 0 },
          { text: 'Worst-case search in both structures is O(log N)', isCorrect: true, orderIndex: 1 },
          { text: 'Red-Black tree root node must always be Red', isCorrect: false, orderIndex: 2 },
          { text: 'AVL trees are typically faster for lookup-intensive workloads than Red-Black trees', isCorrect: true, orderIndex: 3 },
        ],
      },
    },
  });

  // Question 3: MCQ Single
  const q3 = await prisma.questionBank.create({
    data: {
      subjectId: subjectDSA.id,
      facultyId: faculty1Profile.id,
      type: 'MCQ_SINGLE',
      title: 'Queue Data Structure Operating Principle',
      content: 'Which fundamental access principle governs the insertion and deletion of elements in a standard linear Queue?',
      marks: 2.0,
      negativeMarks: 0.5,
      difficulty: 'EASY',
      explanation: 'Queues strictly follow First-In First-Out (FIFO) ordering.',
      options: {
        create: [
          { text: 'Last-In First-Out (LIFO)', isCorrect: false, orderIndex: 0 },
          { text: 'First-In First-Out (FIFO)', isCorrect: true, orderIndex: 1 },
          { text: 'First-In Last-Out (FILO)', isCorrect: false, orderIndex: 2 },
          { text: 'Random Access by index position', isCorrect: false, orderIndex: 3 },
        ],
      },
    },
  });

  // Question 4: MCQ Single
  const q4 = await prisma.questionBank.create({
    data: {
      subjectId: subjectDSA.id,
      facultyId: faculty1Profile.id,
      type: 'MCQ_SINGLE',
      title: 'Shortest Path in Weighted Graphs with Non-Negative Edges',
      content: 'Which algorithm is optimal for finding the single-source shortest path in a directed graph where all edge weights are strictly non-negative?',
      marks: 3.0,
      negativeMarks: 0.75,
      difficulty: 'MEDIUM',
      explanation: "Dijkstra's greedy algorithm finds the single-source shortest path in O((V + E) log V) with a binary heap.",
      options: {
        create: [
          { text: 'Bellman-Ford Algorithm', isCorrect: false, orderIndex: 0 },
          { text: "Dijkstra's Algorithm", isCorrect: true, orderIndex: 1 },
          { text: "Kruskal's Algorithm", isCorrect: false, orderIndex: 2 },
          { text: "Floyd-Warshall Algorithm", isCorrect: false, orderIndex: 3 },
        ],
      },
    },
  });

  // Question 5: MCQ Single
  const q5 = await prisma.questionBank.create({
    data: {
      subjectId: subjectDSA.id,
      facultyId: faculty1Profile.id,
      type: 'MCQ_SINGLE',
      title: 'Hash Table Collision Resolution',
      content: 'Which of the following techniques resolves hash collisions by maintaining a linked list of entries for each bucket index?',
      marks: 2.0,
      negativeMarks: 0.5,
      difficulty: 'EASY',
      explanation: 'Separate Chaining maintains a linked list of collided key-value pairs at each bucket.',
      options: {
        create: [
          { text: 'Separate Chaining', isCorrect: true, orderIndex: 0 },
          { text: 'Linear Probing', isCorrect: false, orderIndex: 1 },
          { text: 'Quadratic Probing', isCorrect: false, orderIndex: 2 },
          { text: 'Double Hashing', isCorrect: false, orderIndex: 3 },
        ],
      },
    },
  });

  // Question 6: MCQ Multiple Select
  const q6 = await prisma.questionBank.create({
    data: {
      subjectId: subjectDSA.id,
      facultyId: faculty1Profile.id,
      type: 'MCQ_MULTIPLE',
      title: 'Comparison-Based Sorting Algorithms with O(N log N) Average Time',
      content: 'Which of the following sorting algorithms have an average-case time complexity of O(N log N)? (Select all that apply)',
      marks: 4.0,
      negativeMarks: 1.0,
      difficulty: 'HARD',
      explanation: 'Merge Sort, Heap Sort, and Quick Sort all possess O(N log N) average-case time complexity.',
      options: {
        create: [
          { text: 'Merge Sort', isCorrect: true, orderIndex: 0 },
          { text: 'Heap Sort', isCorrect: true, orderIndex: 1 },
          { text: 'Quick Sort', isCorrect: true, orderIndex: 2 },
          { text: 'Bubble Sort', isCorrect: false, orderIndex: 3 },
        ],
      },
    },
  });

  // 8B. Question Bank for Programming Languages (CS201) - Python, C++, Java, OOP
  // Q1 (Python): Mutable Default Arguments
  const progQ1 = await prisma.questionBank.create({
    data: {
      subjectId: subjectProg.id,
      facultyId: faculty1Profile.id,
      type: 'MCQ_SINGLE',
      title: 'Python: Mutable Default Argument Evaluation',
      content: `Consider the following Python code snippet:

\`\`\`python
def extend_list(val, list_arg=[]):
    list_arg.append(val)
    return list_arg

list1 = extend_list(10)
list2 = extend_list(123, [])
list3 = extend_list('a')

print(list1, list2, list3)
\`\`\`

What is the exact output printed when this script runs?`,
      marks: 3.0,
      negativeMarks: 0.5,
      difficulty: 'MEDIUM',
      explanation: 'In Python, default parameter expressions are evaluated once when the function definition is executed. Therefore, list_arg references the same persistent list across invocations where an argument is not supplied. Both list1 and list3 reference this same list.',
      options: {
        create: [
          { text: "[10] [123] ['a']", isCorrect: false, orderIndex: 0 },
          { text: "[10, 'a'] [123] [10, 'a']", isCorrect: true, orderIndex: 1 },
          { text: "[10] [123] [10, 'a']", isCorrect: false, orderIndex: 2 },
          { text: "TypeError: unsupported operand type for append", isCorrect: false, orderIndex: 3 },
        ],
      },
    },
  });

  // Q2 (Python): LEGB Scope Rule
  const progQ2 = await prisma.questionBank.create({
    data: {
      subjectId: subjectProg.id,
      facultyId: faculty1Profile.id,
      type: 'MCQ_SINGLE',
      title: 'Python: Scope Resolution and the LEGB Hierarchy',
      content: 'In Python, in what exact order are namespaces searched when resolving an unqualified variable name (the LEGB rule)?',
      marks: 3.0,
      negativeMarks: 0.5,
      difficulty: 'EASY',
      explanation: 'Python resolves names using the LEGB rule: Local (innermost def/lambda), Enclosing (enclosing def/lambda), Global (module level), and Built-in (builtins module).',
      options: {
        create: [
          { text: 'Local -> Enclosing -> Global -> Built-in', isCorrect: true, orderIndex: 0 },
          { text: 'Local -> Global -> Enclosing -> Built-in', isCorrect: false, orderIndex: 1 },
          { text: 'Global -> Local -> Enclosing -> Built-in', isCorrect: false, orderIndex: 2 },
          { text: 'Local -> Explicit -> Global -> Binary', isCorrect: false, orderIndex: 3 },
        ],
      },
    },
  });

  // Q3 (Python): Shallow vs Deep Copy
  const progQ3 = await prisma.questionBank.create({
    data: {
      subjectId: subjectProg.id,
      facultyId: faculty1Profile.id,
      type: 'MCQ_MULTIPLE',
      title: 'Python: Shallow Copy vs Deep Copy Semantics',
      content: 'Given a nested list matrix = [[1, 2, 3], [4, 5, 6]], which of the following statements regarding Python copy semantics are TRUE? (Select all that apply)',
      marks: 3.0,
      negativeMarks: 0.5,
      difficulty: 'MEDIUM',
      explanation: 'copy.copy() creates a new outer collection but leaves inner elements referencing the original objects. copy.deepcopy() recursively clones all compound objects.',
      options: {
        create: [
          { text: 'copy.copy(matrix) creates a new outer list but copies references to the child sublists.', isCorrect: true, orderIndex: 0 },
          { text: 'copy.deepcopy(matrix) constructs a new list and recursively duplicates all nested sublists.', isCorrect: true, orderIndex: 1 },
          { text: 'Mutating matrix[0][0] = 99 will reflect inside a shallow copy made with copy.copy(matrix).', isCorrect: true, orderIndex: 2 },
          { text: 'Shallow copy duplicates nested objects if their types are lists or dictionaries.', isCorrect: false, orderIndex: 3 },
        ],
      },
    },
  });

  // Q4 (C++): Virtual Destructor
  const progQ4 = await prisma.questionBank.create({
    data: {
      subjectId: subjectProg.id,
      facultyId: faculty1Profile.id,
      type: 'MCQ_SINGLE',
      title: 'C++: Polymorphic Deletion and Virtual Destructors',
      content: `Consider the following C++ polymorphic code:

\`\`\`cpp
class Base {
public:
    Base() { std::cout << "Base "; }
    ~Base() { std::cout << "~Base "; }
};

class Derived : public Base {
public:
    Derived() { std::cout << "Derived "; }
    ~Derived() { std::cout << "~Derived "; }
};

int main() {
    Base* ptr = new Derived();
    delete ptr;
    return 0;
}
\`\`\`

What is the consequence of deleting the Derived object through a Base pointer without a virtual destructor?`,
      marks: 3.0,
      negativeMarks: 0.5,
      difficulty: 'HARD',
      explanation: 'Deleting an object through a base pointer when the base class does not have a virtual destructor invokes Undefined Behavior according to the C++ standard. In standard practice, only ~Base() runs and ~Derived() is bypassed, leaking any resources held by Derived.',
      options: {
        create: [
          { text: 'Undefined behavior / resource leak: ~Derived() is not invoked because ~Base() is not virtual.', isCorrect: true, orderIndex: 0 },
          { text: 'Compilation error: cannot point to Derived with Base pointer without dynamic_cast.', isCorrect: false, orderIndex: 1 },
          { text: 'Both destructors execute cleanly in reverse order (~Derived then ~Base) automatically.', isCorrect: false, orderIndex: 2 },
          { text: 'Double free segmentation fault because the Base sub-object is freed twice.', isCorrect: false, orderIndex: 3 },
        ],
      },
    },
  });

  // Q5 (C++): Smart Pointers
  const progQ5 = await prisma.questionBank.create({
    data: {
      subjectId: subjectProg.id,
      facultyId: faculty1Profile.id,
      type: 'MCQ_MULTIPLE',
      title: 'C++: Modern Smart Pointers (unique_ptr, shared_ptr, weak_ptr)',
      content: 'Which of the following statements regarding modern C++ smart pointers and RAII are CORRECT? (Select all that apply)',
      marks: 4.0,
      negativeMarks: 0.5,
      difficulty: 'MEDIUM',
      explanation: 'std::unique_ptr has exclusive ownership and cannot be copied (move-only). std::shared_ptr maintains atomic reference counts. std::weak_ptr provides non-owning observer access to prevent cyclic reference memory leaks.',
      options: {
        create: [
          { text: 'std::unique_ptr enforces exclusive ownership; its copy constructor is deleted and ownership transfers via std::move().', isCorrect: true, orderIndex: 0 },
          { text: 'std::shared_ptr uses reference counting to deallocate the managed resource when the last owner is destroyed.', isCorrect: true, orderIndex: 1 },
          { text: 'std::weak_ptr observes a shared_ptr without incrementing the strong reference count, preventing cyclic memory leaks.', isCorrect: true, orderIndex: 2 },
          { text: 'std::unique_ptr incurs severe runtime performance overhead compared to raw pointers due to atomic synchronization.', isCorrect: false, orderIndex: 3 },
        ],
      },
    },
  });

  // Q6 (Java): String Constant Pool vs Heap
  const progQ6 = await prisma.questionBank.create({
    data: {
      subjectId: subjectProg.id,
      facultyId: faculty1Profile.id,
      type: 'MCQ_SINGLE',
      title: 'Java: String Constant Pool Reference Equality vs Value Equality',
      content: `Consider the following Java code:

\`\`\`java
String s1 = "CampusExam";
String s2 = "CampusExam";
String s3 = new String("CampusExam");

System.out.println((s1 == s2) + " " + (s1 == s3) + " " + s1.equals(s3));
\`\`\`

What is printed to standard output?`,
      marks: 3.0,
      negativeMarks: 0.5,
      difficulty: 'EASY',
      explanation: 's1 and s2 both point to the same interned object in the String Constant Pool (s1 == s2 is true). s3 creates a new distinct object on the heap, so s1 == s3 is false (different references). However, s1.equals(s3) tests character sequence content equality, returning true.',
      options: {
        create: [
          { text: 'true false true', isCorrect: true, orderIndex: 0 },
          { text: 'true true true', isCorrect: false, orderIndex: 1 },
          { text: 'false false true', isCorrect: false, orderIndex: 2 },
          { text: 'true false false', isCorrect: false, orderIndex: 3 },
        ],
      },
    },
  });

  // Q7 (Java): Modern Interface Evolution
  const progQ7 = await prisma.questionBank.create({
    data: {
      subjectId: subjectProg.id,
      facultyId: faculty1Profile.id,
      type: 'MCQ_MULTIPLE',
      title: 'Java: Modern Interface Capabilities (Java 8+)',
      content: 'In modern Java (Java 8 and later), which of the following members can be defined inside an interface? (Select all that apply)',
      marks: 3.0,
      negativeMarks: 0.5,
      difficulty: 'MEDIUM',
      explanation: 'Java interfaces can have default methods (with bodies), static methods (with bodies), and private methods (Java 9+ for internal code reuse). They cannot contain non-static, non-final instance fields.',
      options: {
        create: [
          { text: 'default methods providing concrete default implementations for implementing classes.', isCorrect: true, orderIndex: 0 },
          { text: 'static methods with concrete method implementation bodies.', isCorrect: true, orderIndex: 1 },
          { text: 'private methods used to share common logic between default methods (Java 9+).', isCorrect: true, orderIndex: 2 },
          { text: 'Instance variables that maintain mutable per-instance state (e.g., protected int count).', isCorrect: false, orderIndex: 3 },
        ],
      },
    },
  });

  // Q8 (OOP): Dynamic Dispatch & VTables
  const progQ8 = await prisma.questionBank.create({
    data: {
      subjectId: subjectProg.id,
      facultyId: faculty1Profile.id,
      type: 'MCQ_SINGLE',
      title: 'OOP: Runtime Polymorphism & Virtual Table (vtable) Mechanics',
      content: 'How do compiled object-oriented languages such as C++ and Java resolve overridden virtual methods at runtime?',
      marks: 3.0,
      negativeMarks: 0.5,
      difficulty: 'MEDIUM',
      explanation: 'Runtime polymorphism is implemented via a compiler-generated Virtual Method Table (vtable) for each polymorphic class and a hidden virtual table pointer (vptr) inside each object instance pointing to its class vtable.',
      options: {
        create: [
          { text: 'Through a Virtual Method Table (vtable) per class and a hidden virtual table pointer (vptr) per object instance.', isCorrect: true, orderIndex: 0 },
          { text: 'By looking up method name strings in an unindexed global hash map on each invocation.', isCorrect: false, orderIndex: 1 },
          { text: 'By embedding all subclasses into a single static switch-case block during compilation.', isCorrect: false, orderIndex: 2 },
          { text: 'By scanning recursive call stack frames at runtime.', isCorrect: false, orderIndex: 3 },
        ],
      },
    },
  });

  // 9. Examinations
  // Exam 1: ACTIVE (Current open exam for students to attempt)
  const now = new Date();
  const examActive = await prisma.examination.create({
    data: {
      title: 'CS401: Mid-Term Examination - Data Structures & Algorithms',
      description: 'Comprehensive mid-semester examination evaluating Algorithm Complexity, Tree Traversals, Shortest Paths, and Algorithmic Implementation.',
      subjectId: subjectDSA.id,
      sessionId: session2026.id,
      facultyId: faculty1Profile.id,
      status: 'ACTIVE',
      startTime: new Date(now.getTime() - 30 * 60 * 1000), // Started 30 mins ago
      endTime: new Date(now.getTime() + 4 * 60 * 60 * 1000), // Ends in 4 hours
      durationMinutes: 60,
      totalMarks: 16.0,
      passingMarks: 6.0,
      negativeMarking: true,
      negativeMarkValue: 0.5,
      randomizeQuestions: false,
      randomizeOptions: false,
      maxAttempts: 1,
      isPublished: true,
      resultsPublished: false,
      questions: {
        create: [
          { questionBankId: q1.id, orderIndex: 0, marksOverride: 2.0 },
          { questionBankId: q2.id, orderIndex: 1, marksOverride: 3.0 },
          { questionBankId: q3.id, orderIndex: 2, marksOverride: 2.0 },
          { questionBankId: q4.id, orderIndex: 3, marksOverride: 3.0 },
          { questionBankId: q5.id, orderIndex: 4, marksOverride: 2.0 },
          { questionBankId: q6.id, orderIndex: 5, marksOverride: 4.0 },
        ],
      },
    },
  });

  // Exam 1B: ACTIVE - Programming Languages Assessment (CS201)
  const examProg = await prisma.examination.create({
    data: {
      title: 'CS201: Programming Languages Proficiency Assessment (Python, C++, Java)',
      description: 'Comprehensive MCQ assessment evaluating core concepts across modern programming languages: Python mutability, scopes & copy semantics; C++ virtual destructors, smart pointers & memory layout; Java object references, interfaces & exceptions.',
      subjectId: subjectProg.id,
      sessionId: session2026.id,
      facultyId: faculty1Profile.id,
      status: 'ACTIVE',
      startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // Active since 2 hours ago
      endTime: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Open for 24 hours
      durationMinutes: 40,
      totalMarks: 25.0,
      passingMarks: 10.0,
      negativeMarking: true,
      negativeMarkValue: 0.5,
      randomizeQuestions: false,
      randomizeOptions: false,
      maxAttempts: 1,
      isPublished: true,
      resultsPublished: false,
      questions: {
        create: [
          { questionBankId: progQ1.id, orderIndex: 0, marksOverride: 3.0 },
          { questionBankId: progQ2.id, orderIndex: 1, marksOverride: 3.0 },
          { questionBankId: progQ3.id, orderIndex: 2, marksOverride: 3.0 },
          { questionBankId: progQ4.id, orderIndex: 3, marksOverride: 3.0 },
          { questionBankId: progQ5.id, orderIndex: 4, marksOverride: 4.0 },
          { questionBankId: progQ6.id, orderIndex: 5, marksOverride: 3.0 },
          { questionBankId: progQ7.id, orderIndex: 6, marksOverride: 3.0 },
          { questionBankId: progQ8.id, orderIndex: 7, marksOverride: 3.0 },
        ],
      },
    },
  });

  // Exam 2: COMPLETED with graded attempts & published results
  const examCompleted = await prisma.examination.create({
    data: {
      title: 'CS402: Mid-Term Examination - Database Management Systems',
      description: 'SQL Joins, Relational Algebra, ACID properties, Normalization (1NF to BCNF), and Concurrency Control.',
      subjectId: subjectDBMS.id,
      sessionId: session2026.id,
      facultyId: faculty2Profile.id,
      status: 'COMPLETED',
      startTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      durationMinutes: 45,
      totalMarks: 50.0,
      passingMarks: 20.0,
      negativeMarking: true,
      negativeMarkValue: 0.25,
      maxAttempts: 1,
      isPublished: true,
      resultsPublished: true,
    },
  });

  // Add questions for Exam 2
  const dbQ1 = await prisma.questionBank.create({
    data: {
      subjectId: subjectDBMS.id,
      facultyId: faculty2Profile.id,
      type: 'MCQ_SINGLE',
      title: 'ACID Property for Atomicity',
      content: 'Which component of a DBMS transaction manager is primarily responsible for ensuring Atomicity in ACID properties?',
      marks: 2.0,
      negativeMarks: 0.5,
      difficulty: 'EASY',
      explanation: 'The Recovery Manager / Write-Ahead Logging (WAL) ensures atomic transaction rollback or redo.',
      options: {
        create: [
          { text: 'Recovery Manager / Undo-Redo Log', isCorrect: true, orderIndex: 0 },
          { text: 'Concurrency Control Manager', isCorrect: false, orderIndex: 1 },
          { text: 'Query Optimizer', isCorrect: false, orderIndex: 2 },
          { text: 'Catalog Manager', isCorrect: false, orderIndex: 3 },
        ],
      },
    },
  });

  await prisma.examinationQuestion.create({
    data: {
      examinationId: examCompleted.id,
      questionBankId: dbQ1.id,
      orderIndex: 0,
      marksOverride: 2.0,
    },
  });

  // Create Exam Attempt for student1 (Vansh) on Completed Exam
  const attemptStu1 = await prisma.examAttempt.create({
    data: {
      examinationId: examCompleted.id,
      studentId: student1Profile.id,
      attemptNumber: 1,
      startedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 10000),
      submittedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 35 * 60 * 1000),
      expiresAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
      status: 'SUBMITTED',
      tabSwitchCount: 0,
    },
  });

  // Student 1 answer: correctly selected option
  const dbQ1Options = await prisma.questionOption.findMany({ where: { questionId: dbQ1.id } });
  const correctOpt = dbQ1Options.find((o) => o.isCorrect);

  await prisma.studentAnswer.create({
    data: {
      attemptId: attemptStu1.id,
      questionId: dbQ1.id,
      selectedOptionIds: JSON.stringify([correctOpt?.id]),
      marksAwarded: 2.0,
      evaluationComment: 'Correct answer.',
    },
  });

  // Grading Result for student1
  await prisma.gradingResult.create({
    data: {
      attemptId: attemptStu1.id,
      totalObtained: 46.0,
      totalPossible: 50.0,
      percentage: 92.0,
      isPassed: true,
      gradedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      isModerated: true,
      moderatedBy: faculty2User.name,
      auditNotes: 'Automated evaluation verified and approved by faculty.',
    },
  });

  // Create Exam Attempt for student2 (Priya) on Completed Exam
  const attemptStu2 = await prisma.examAttempt.create({
    data: {
      examinationId: examCompleted.id,
      studentId: student2Profile.id,
      attemptNumber: 1,
      startedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 15000),
      submittedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 40 * 60 * 1000),
      expiresAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
      status: 'SUBMITTED',
      tabSwitchCount: 1,
    },
  });

  await prisma.gradingResult.create({
    data: {
      attemptId: attemptStu2.id,
      totalObtained: 38.0,
      totalPossible: 50.0,
      percentage: 76.0,
      isPassed: true,
      gradedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      isModerated: true,
      moderatedBy: faculty2User.name,
    },
  });

  // Result Publication record
  await prisma.resultPublication.create({
    data: {
      examinationId: examCompleted.id,
      publishedBy: faculty2User.name,
      publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      releaseAnswersToStudents: true,
    },
  });

  // Notifications
  await prisma.notification.create({
    data: {
      userId: student1User.id,
      title: 'Active Examination: CS401 Mid-Term',
      message: 'The Mid-Term Examination for Data Structures & Algorithms is now active. Please ensure you are in a quiet room.',
      type: 'EXAM_REMINDER',
    },
  });

  await prisma.notification.create({
    data: {
      userId: student1User.id,
      title: 'Result Published: CS402 DBMS Mid-Term',
      message: 'Your results for CS402 Mid-Term have been officially published. You secured 92.0% (Grade A+).',
      type: 'RESULT_PUBLISHED',
    },
  });

  await prisma.notification.create({
    data: {
      userId: student1User.id,
      title: 'Active Assessment: CS201 Programming Languages',
      message: 'CS201 Programming Languages Proficiency Assessment (Python, C++, Java) is now open for submissions.',
      type: 'EXAM_REMINDER',
    },
  });

  // Audit Logs
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'SYSTEM_INITIALIZATION',
      resource: 'AcademicSession',
      resourceId: session2026.id,
      metadataJson: JSON.stringify({ note: 'Initial academic session created' }),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: faculty1User.id,
      action: 'EXAM_PUBLISHED',
      resource: 'Examination',
      resourceId: examActive.id,
      metadataJson: JSON.stringify({ title: examActive.title }),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: faculty1User.id,
      action: 'EXAM_PUBLISHED',
      resource: 'Examination',
      resourceId: examProg.id,
      metadataJson: JSON.stringify({ title: examProg.title }),
    },
  });

  console.log('--- Seed Completed Successfully! ---');
  console.log('Admin:    admin@campusexam.edu    | Admin@123');
  console.log('Faculty:  prof.sharma@campusexam.edu | Faculty@123');
  console.log('Student1: student1@campusexam.edu | Student@123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
