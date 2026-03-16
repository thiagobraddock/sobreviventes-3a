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
