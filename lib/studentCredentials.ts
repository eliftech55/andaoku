export function normalizeStudentUsername(value: string): string {
  return value.trim().toLocaleLowerCase("tr-TR").replace(/[^a-z0-9._-]/g, "");
}

export function studentLoginEmail(classId: string, username: string): string {
  return `student+${classId}-${normalizeStudentUsername(username)}@andaoku.students`;
}
