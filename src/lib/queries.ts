import { supabase, type Member, type Meeting, type MemberWithRank } from "./supabase";

export async function getRanking(): Promise<MemberWithRank[]> {
  // Get all members
  const { data: members, error: membersError } = await supabase
    .from("members")
    .select("*")
    .order("name");

  if (membersError) throw membersError;

  // Get past meetings count
  const { count: totalMeetings, error: meetingsError } = await supabase
    .from("meetings")
    .select("*", { count: "exact", head: true })
    .lte("meeting_date", new Date().toISOString().split("T")[0]);

  if (meetingsError) throw meetingsError;

  // Get attendance counts per member
  const { data: attendanceCounts, error: attendanceError } = await supabase
    .from("attendance")
    .select(`
      member_id,
      meetings!inner(meeting_date)
    `)
    .lte("meetings.meeting_date", new Date().toISOString().split("T")[0]);

  if (attendanceError) throw attendanceError;

  // Count attendance per member
  const countMap = new Map<string, number>();
  attendanceCounts?.forEach((a) => {
    const current = countMap.get(a.member_id) || 0;
    countMap.set(a.member_id, current + 1);
  });

  // Build ranking
  const membersWithCount = members!.map((member) => ({
    ...member,
    attendance_count: countMap.get(member.id) || 0,
    percentage: totalMeetings
      ? Math.round(((countMap.get(member.id) || 0) / totalMeetings) * 100)
      : 0,
  }));

  // Sort by attendance count desc, then name asc
  membersWithCount.sort((a, b) => {
    if (b.attendance_count !== a.attendance_count) {
      return b.attendance_count - a.attendance_count;
    }
    return a.name.localeCompare(b.name);
  });

  // Calculate ranks with tie handling
  let currentRank = 1;
  let previousCount: number | null = null;

  return membersWithCount.map((member, index) => {
    if (member.attendance_count !== previousCount) {
      currentRank = index + 1;
    }
    previousCount = member.attendance_count;
    return { ...member, rank: currentRank };
  });
}

export async function getPastMeetings(): Promise<Meeting[]> {
  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .lte("meeting_date", new Date().toISOString().split("T")[0])
    .order("meeting_date", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getAllMeetings(): Promise<Meeting[]> {
  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .order("meeting_date", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getMeetingAttendees(meetingId: string): Promise<Member[]> {
  const { data, error } = await supabase
    .from("attendance")
    .select("members(*)")
    .eq("meeting_id", meetingId);

  if (error) throw error;
  return data?.map((a) => a.members as unknown as Member) || [];
}

export async function getAllMembers(): Promise<Member[]> {
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .order("name");

  if (error) throw error;
  return data || [];
}

export async function getAttendanceForMeeting(
  meetingId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("attendance")
    .select("member_id")
    .eq("meeting_id", meetingId);

  if (error) throw error;
  return data?.map((a) => a.member_id) || [];
}

export async function saveAttendance(
  meetingId: string,
  memberIds: string[]
): Promise<void> {
  // Delete existing attendance for this meeting
  const { error: deleteError } = await supabase
    .from("attendance")
    .delete()
    .eq("meeting_id", meetingId);

  if (deleteError) throw deleteError;

  // Insert new attendance
  if (memberIds.length > 0) {
    const { error: insertError } = await supabase.from("attendance").insert(
      memberIds.map((member_id) => ({
        meeting_id: meetingId,
        member_id,
      }))
    );

    if (insertError) throw insertError;
  }
}
