import type {
  BatchResult, DecisionOutcome, Institution, PostedRecord, PostingCandidate, ReviewCase, StudentSummary, User,
} from "../types";
import { DEMO_PASSWORD, demoUsers, reviewQueue, studentSummary } from "./mock";

// The real API is the default. Set VITE_USE_MOCK=true to run the screens on built-in sample data.
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const BASE = import.meta.env.VITE_API_BASE ?? "/api";
const TOKEN_KEY = "bu-transfer-token";
const wait = (ms = 350) => new Promise((r) => setTimeout(r, ms));

export function getToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable: the session lasts until reload */
  }
}

async function errorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail) && body.detail[0]?.msg) return String(body.detail[0].msg);
  } catch {
    /* not JSON */
  }
  return `Something went wrong (${res.status}). Try again.`;
}

async function http<T>(path: string, init: RequestInit = {}, auth = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const token = getToken();
  if (auth && token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (res.status === 401 && auth) {
    // The token expired or is invalid: start again from the login page.
    setToken(null);
    try {
      sessionStorage.removeItem("bu-transfer-user");
    } catch {
      /* ignore */
    }
    window.location.assign("/login");
    throw new Error("Your session expired. Sign in again.");
  }
  if (!res.ok) throw new Error(await errorMessage(res));
  return res.json() as Promise<T>;
}

let queue: ReviewCase[] = [...reviewQueue];
let summary: StudentSummary = structuredClone(studentSummary);

export async function login(email: string, password: string): Promise<User> {
  if (!USE_MOCK) {
    const body = await http<{ token: string; user: User }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
      false,
    );
    setToken(body.token);
    return body.user;
  }
  await wait();
  const found = demoUsers.find((u) => u.email === email.trim().toLowerCase());
  if (!found || password !== DEMO_PASSWORD) throw new Error("Email or password is incorrect.");
  const { password: _pw, ...user } = found;
  return user;
}

export async function getStudentSummary(userId: string): Promise<StudentSummary> {
  if (!USE_MOCK) return http<StudentSummary>(`/students/${userId}/dashboard`);
  await wait();
  return structuredClone(summary);
}

export async function uploadSyllabus(userId: string, courseId: string, file: File): Promise<StudentSummary> {
  if (!USE_MOCK) {
    const form = new FormData();
    form.append("file", file);
    await http(`/transcript-courses/${courseId}/syllabus`, { method: "POST", body: form });
    return getStudentSummary(userId);
  }
  await wait(600);
  summary = {
    ...summary,
    courses: summary.courses.map((c) =>
      c.id === courseId
        ? {
            ...c,
            status: "IN_REVIEW",
            note: "Syllabus received. Evaluation has started.",
            timeline: [...c.timeline, { date: "Today", label: `Syllabus uploaded (${file.name})` }],
          }
        : c,
    ),
  };
  return structuredClone(summary);
}

export async function getReviewQueue(): Promise<ReviewCase[]> {
  if (!USE_MOCK) return http<ReviewCase[]>("/review-queue");
  await wait();
  return structuredClone(queue);
}

export async function submitDecision(
  caseId: string,
  outcome: DecisionOutcome,
  reason: string,
  buCourseCode?: string,
): Promise<void> {
  if (!USE_MOCK) {
    await http(`/transcript-courses/${caseId}/decision`, {
      method: "POST",
      body: JSON.stringify({ outcome, reason, buCourseCode }),
    });
    return;
  }
  await wait(500);
  queue = queue.filter((c) => c.id !== caseId);
}

const mockInstitutions: Institution[] = [
  { id: "m1", name: "Community College X", calendarType: "SEMESTER" },
  { id: "m2", name: "Lakeview College", calendarType: "QUARTER" },
  { id: "m3", name: "New York University", calendarType: "SEMESTER" },
  { id: "m4", name: "Northeastern University", calendarType: "SEMESTER" },
];

export async function getInstitutions(): Promise<Institution[]> {
  if (!USE_MOCK) return http<Institution[]>("/institutions");
  await wait(150);
  return mockInstitutions;
}

export async function uploadTranscript(institutionId: string, file: File): Promise<void> {
  if (!USE_MOCK) {
    const form = new FormData();
    form.append("institutionId", institutionId);
    form.append("file", file);
    await http("/transcripts", { method: "POST", body: form });
    return;
  }
  await wait(600);
}

// ---- credit office
const mockQueue: PostingCandidate[] = [
  { courseId: "p1", studentRef: "STU-0001", courseCode: "CS 2000", courseTitle: "Introduction to Program Design", sourceSchool: "Northeastern University",
    grade: "A", result: "CAS CS 111", outcome: "BU_EQUIVALENT", credits: 4, source: "EXISTING_EQUIVALENCY", blockers: [] },
  { courseId: "p2", studentRef: "STU-0001", courseCode: "ENG 110", courseTitle: "College Writing", sourceSchool: "New York University",
    grade: "B", result: "Elective credit", outcome: "ELECTIVE", credits: 3, source: "DEPARTMENT_DECISION", decidedBy: "Dr. Rivera",
    decidedOn: "Oct 9", reason: "No single BU course fits.", blockers: [] },
];
let mockPosted: PostedRecord[] = [];

export async function getPostingQueue(): Promise<PostingCandidate[]> {
  if (!USE_MOCK) return http<PostingCandidate[]>("/postings/queue");
  await wait();
  return structuredClone(mockQueue.filter((q) => !mockPosted.some((p) => p.courseId === q.courseId)));
}

export async function getPostingHistory(): Promise<PostedRecord[]> {
  if (!USE_MOCK) return http<PostedRecord[]>("/postings?limit=50");
  await wait(200);
  return structuredClone(mockPosted);
}

export async function postCourses(courseIds: string[]): Promise<BatchResult> {
  if (!USE_MOCK) {
    return http<BatchResult>("/postings/batch", { method: "POST", body: JSON.stringify({ courseIds }) });
  }
  await wait(600);
  const done = mockQueue.filter((q) => courseIds.includes(q.courseId));
  mockPosted = [
    ...done.map((q) => ({ postingId: q.courseId, courseId: q.courseId, studentRef: q.studentRef, courseCode: q.courseCode,
      result: q.result, creditsPosted: q.credits, gradePosted: "T", postedAt: new Date().toISOString(), postedBy: "Credit Office Staff" })),
    ...mockPosted,
  ];
  return {
    items: done.map((q) => ({ courseId: q.courseId, result: "posted" as const, creditsPosted: q.credits })),
    postedCount: done.length, failedCount: 0, creditsPosted: done.reduce((n, q) => n + q.credits, 0),
  };
}
