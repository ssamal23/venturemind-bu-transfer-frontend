export type Role = "student" | "evaluator" | "credit_office";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: string;
}

export type CourseStatus =
  | "MATCHED"
  | "DECIDED"
  | "AWAITING_SYLLABUS"
  | "IN_REVIEW"
  | "NOT_ELIGIBLE"
  | "POSTED";

export interface TimelineEvent {
  date: string;
  label: string;
}

export interface TransferCourse {
  id: string;
  sourceCode: string;
  sourceSchool: string;
  grade: string;
  buResult: string | null;
  credits: number | null;
  status: CourseStatus;
  note?: string;
  timeline: TimelineEvent[];
}

export interface TranscriptNotice {
  id: string;
  school: string;
  status: "PENDING" | "FAILED";
  error?: string | null;
}

export interface Institution {
  id: string;
  name: string;
  calendarType: "SEMESTER" | "QUARTER";
}

export interface StudentSummary {
  daysLeft: number | null;
  courses: TransferCourse[];
  transcripts: TranscriptNotice[];
}

export type DecisionOutcome = "BU_EQUIVALENT" | "ELECTIVE" | "NO_CREDIT" | "REQUEST_INFO";

export interface AiSuggestion {
  outcome: "BU_EQUIVALENT" | "ELECTIVE" | "NO_CREDIT";
  buCourse: string | null;
  confidence: number;
  evidence: string[];
  gaps: string;
  model: string;
}

export interface RuleCheck {
  label: string;
  pass: boolean;
  note?: boolean;
}

export interface ReviewCase {
  id: string;
  studentRef: string;
  courseCode: string;
  courseTitle: string;
  sourceSchool: string;
  department: string;
  credits: number;
  grade: string;
  waitingDays: number;
  syllabusOutcomes: string[];
  syllabusNotes: string;
  buCourse: { code: string; title: string; credits: number; outcomes: string[] } | null;
  ai: AiSuggestion | null;
  rules: RuleCheck[];
}

export interface PostingCandidate {
  courseId: string;
  studentRef: string;
  courseCode: string;
  courseTitle: string;
  sourceSchool: string;
  grade: string;
  result: string;
  outcome: "BU_EQUIVALENT" | "ELECTIVE" | "NO_CREDIT";
  credits: number;
  source: "DEPARTMENT_DECISION" | "EXISTING_EQUIVALENCY";
  decidedBy?: string | null;
  decidedOn?: string | null;
  reason?: string | null;
  blockers: string[];
}

export interface PostedRecord {
  postingId: string;
  courseId: string;
  studentRef: string;
  courseCode: string;
  result: string;
  creditsPosted: number;
  gradePosted: string;
  postedAt: string;
  postedBy: string;
}

export interface BatchItem {
  courseId: string;
  result: "posted" | "already_posted" | "failed";
  detail?: string | null;
  creditsPosted?: number | null;
}

export interface BatchResult {
  items: BatchItem[];
  postedCount: number;
  failedCount: number;
  creditsPosted: number;
}
