export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type ScoreStatus = "PENDING" | "PASSED" | "FAILED";
export type Gender = "MALE" | "FEMALE";

export interface Student {
  id: string;
  user_id: string;
  registration_number: string;
  full_name: string;
  national_id: string;
  phone: string;
  email: string;
  governorate: string;
  city: string;
  date_of_birth: string;
  gender: Gender;
  memorization_level: string;
  educational_stage: string;
  institute: string;
  approval_status: ApprovalStatus;
  rejection_reason: string | null;
  exam_date: string | null;
  exam_time: string | null;
  exam_place: string | null;
  created_at: string;
  updated_at: string;
}

export interface Score {
  id: string;
  student_id: string;
  tajweed: number;
  memorization: number;
  voice: number;
  performance: number;
  final: number;
  status: ScoreStatus;
  rank: number | null;
  updated_at: string;
}

export interface Settings {
  id: "singleton";
  registration_open: boolean;
  results_published: boolean;
  announcement: string;
  about_text: string;
  updated_at: string;
}

// Minimal Database type for supabase-js's generic client. Hand-written
// rather than generated (no network access to run `supabase gen types`
// against your real project) — regenerate this from your project for full
// type safety once it's live: see README "Regenerating types".
export interface Database {
  public: {
    Tables: {
      admins: { Row: { user_id: string; created_at: string }; Insert: never; Update: never };
      students: {
        Row: Student;
        Insert: Partial<Student> & Pick<Student, "full_name" | "national_id" | "phone" | "email" | "governorate" | "city" | "date_of_birth" | "gender" | "memorization_level" | "educational_stage" | "institute" | "registration_number">;
        Update: Partial<Student>;
      };
      scores: {
        Row: Score;
        Insert: Partial<Score> & Pick<Score, "student_id">;
        Update: Partial<Score>;
      };
      settings: { Row: Settings; Insert: Partial<Settings>; Update: Partial<Settings> };
    };
    Functions: {
      next_registration_number: { Args: Record<string, never>; Returns: string };
    };
  };
}
