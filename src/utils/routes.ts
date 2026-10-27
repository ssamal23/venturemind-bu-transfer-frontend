import type { Role } from "../types";

const HOME: Record<Role, string> = { student: "/student", evaluator: "/evaluator", credit_office: "/office" };

export const homeFor = (role: Role): string => HOME[role];
