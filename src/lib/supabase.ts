import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Member = {
  id: string;
  name: string;
  created_at: string;
};

export type Meeting = {
  id: string;
  meeting_date: string;
  photo_url: string | null;
  created_at: string;
};

export type Attendance = {
  id: string;
  member_id: string;
  meeting_id: string;
  created_at: string;
};

export type MemberWithRank = Member & {
  attendance_count: number;
  rank: number;
  percentage: number;
};
