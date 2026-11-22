import "dotenv/config";
import { getCollection, COLLECTIONS } from "./config/db.js";

// ---------- Demo tutors No password ----------
const tutors = [
  { name: "Rahim Uddin", email: "rahim.tutor@example.com" },
  { name: "Nusrat Jahan", email: "nusrat.tutor@example.com" },
  { name: "Tanvir Ahmed", email: "tanvir.tutor@example.com" },
  { name: "Sadia Islam", email: "sadia.tutor@example.com" },
];

// ---------- Demo students ( No pass, Don't be login, Just see the data) ----------
const students = [
  { name: "Arif Hasan", email: "arif.student@example.com", phone: "01711000001" },
  { name: "Mehnaz Akter", email: "mehnaz.student@example.com", phone: "01711000002" },
  { name: "Sakib Rahman", email: "sakib.student@example.com", phone: "01711000003" },
  { name: "Tasnim Jahan", email: "tasnim.student@example.com", phone: "01711000004" },
  { name: "Rafi Chowdhury", email: "rafi.student@example.com", phone: "01711000005" },
];

const img = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=70`;

const base = [
  ["SSC Mathematics Crash Batch", "Math", "Class 9-10", "Offline", "Agrabad, Chittagong", 2500, 4, "photo-1596495578065-6e0763fa1178"],
  ["HSC Physics Concept Builder", "Physics", "Class 11-12", "Online", "Zoom", 3000, 3, "photo-1636466497217-26a8cbeaf0aa"],
  ["Python Programming for Beginners", "Programming", "University", "Online", "Google Meet", 4000, 3, "photo-1515879218367-8466d910aaa4"],
  ["IELTS Band 7+ Preparation", "IELTS", "Any Level", "Online", "Zoom", 5000, 4, "photo-1456513080510-7bf3a84b82f8"],
  ["Class 8 English Grammar & Writing", "English", "Class 6-8", "Offline", "Khulshi, Chittagong", 2000, 3, "photo-1503676260728-1c00da094a0b"],
  ["HSC Chemistry Organic Mastery", "Chemistry", "Class 11-12", "Offline", "GEC Circle, Chittagong", 3200, 3, "photo-1532094349884-543bc11b234d"],
  ["Web Development with React", "Programming", "University", "Online", "Zoom", 4500, 3, "photo-1461749280684-dccba630e2f6"],
  ["Class 5 All Subjects Home Tutor", "General", "Class 1-5", "Offline", "Nasirabad, Chittagong", 1800, 5, "photo-1427504494785-3a9ca7044f45"],
  ["SSC Biology Made Easy", "Biology", "Class 9-10", "Online", "Google Meet", 2200, 3, "photo-1530026405186-ed1f139313f8"],
  ["Higher Math Problem Solving", "Math", "Class 11-12", "Offline", "Panchlaish, Chittagong", 3500, 4, "photo-1635070041078-e363dbe005cb"],
  ["Spoken English Fluency Course", "English", "Any Level", "Online", "Zoom", 2800, 3, "photo-1543269865-cbf427effbad"],
  ["Data Structures & Algorithms", "Programming", "University", "Online", "Google Meet", 5000, 3, "photo-1555066931-4365d14bab8c"],
];

const tuitions = base.map(([title, subject, classLevel, mode, location, monthlyFee, daysPerWeek, photo], i) => {
  const tutor = tutors[i % tutors.length];
  return {
    title, subject, classLevel, mode, location, monthlyFee, daysPerWeek,
    bannerImage: img(photo),
    description: `${title} led by an experienced tutor. Small groups, weekly practice tests and personal feedback so every learner keeps improving. Flexible schedule, parents get regular progress updates.`,
    tutorName: tutor.name,
    tutorEmail: tutor.email,
    approvalStatus: "approved",
    isActive: true,
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  };
});

const users = await getCollection(COLLECTIONS.USERS);
const tuitionsCol = await getCollection(COLLECTIONS.TUITIONS);
const applicationsCol = await getCollection(COLLECTIONS.APPLICATIONS);

// ---------- Tutors ----------
for (const t of tutors) {
  await users.updateOne(
    { email: t.email },
    { $setOnInsert: { name: t.name, email: t.email, role: "tutor", plan: "free", bio: "Experienced and passionate tutor.", createdAt: new Date().toISOString() } },
    { upsert: true }
  );
}

// ---------- Students ----------
for (const s of students) {
  await users.updateOne(
    { email: s.email },
    { $setOnInsert: { name: s.name, email: s.email, role: "student", plan: "free", phone: s.phone, bio: "", createdAt: new Date().toISOString() } },
    { upsert: true }
  );
}

// ---------- Tuitions (Previus demo data finish) ----------
await tuitionsCol.deleteMany({ tutorEmail: { $in: tutors.map((t) => t.email) } });
const insertedTuitions = await tuitionsCol.insertMany(tuitions);
const tuitionIds = Object.values(insertedTuitions.insertedIds).map((id) => id.toString());

// ---------- Applications (demo student- previous application data finish ) ----------
const statuses = ["pending", "accepted", "rejected"];
const apps = [];
for (let i = 0; i < 8; i++) {
  const t = tuitions[i % tuitions.length];
  const s = students[i % students.length];
  apps.push({
    tuitionId: tuitionIds[i % tuitionIds.length],
    tuitionTitle: t.title,
    subject: t.subject,
    monthlyFee: t.monthlyFee,
    tutorName: t.tutorName,
    tutorEmail: t.tutorEmail,
    studentName: s.name,
    studentEmail: s.email,
    studentPhone: s.phone,
    preferredSchedule: "Sat, Mon, Wed - 6 PM",
    studentNote: "Looking for regular practice and feedback.",
    status: statuses[i % statuses.length],
    appliedAt: new Date(Date.now() - i * 3600000).toISOString(),
  });
}

await applicationsCol.deleteMany({ studentEmail: { $in: students.map((s) => s.email) } });
await applicationsCol.insertMany(apps);

console.log(`Seeded ${tuitions.length} tuitions, ${students.length} students, ${apps.length} applications`);
process.exit(0);