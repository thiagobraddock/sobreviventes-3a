import { withTransaction, query } from "./db";
import type { Member, Meeting, MemberWithRank } from "./types";

function getToday() {
  return new Date().toISOString().split("T")[0];
}

export async function getRanking(): Promise<MemberWithRank[]> {
  const { rows } = await query<MemberWithRank>(
    `
      WITH total_meetings AS (
        SELECT COUNT(*)::int AS total
        FROM meetings
        WHERE meeting_date <= $1
      ),
      member_stats AS (
        SELECT
          members.id,
          members.name,
          members.created_at::text AS created_at,
          COUNT(meetings.id)::int AS attendance_count
        FROM members
        LEFT JOIN attendance
          ON attendance.member_id = members.id
        LEFT JOIN meetings
          ON meetings.id = attendance.meeting_id
          AND meetings.meeting_date <= $1
        GROUP BY members.id, members.name, members.created_at
      )
      SELECT
        member_stats.id,
        member_stats.name,
        member_stats.created_at,
        member_stats.attendance_count,
        CASE
          WHEN total_meetings.total > 0
            THEN ROUND(
              (member_stats.attendance_count::numeric / total_meetings.total) * 100
            )::int
          ELSE 0
        END AS percentage,
        DENSE_RANK() OVER (ORDER BY member_stats.attendance_count DESC)::int AS rank
      FROM member_stats
      CROSS JOIN total_meetings
      ORDER BY member_stats.attendance_count DESC, member_stats.name ASC
    `,
    [getToday()]
  );

  return rows;
}

export async function getAllMeetings(): Promise<Meeting[]> {
  const { rows } = await query<Meeting>(`
    SELECT
      id,
      meeting_date::text AS meeting_date,
      photo_url,
      created_at::text AS created_at
    FROM meetings
    ORDER BY meeting_date DESC
  `);

  return rows;
}

export async function getMeetingById(meetingId: string): Promise<Meeting | null> {
  const { rows } = await query<Meeting>(
    `
      SELECT
        id,
        meeting_date::text AS meeting_date,
        photo_url,
        created_at::text AS created_at
      FROM meetings
      WHERE id = $1
      LIMIT 1
    `,
    [meetingId]
  );

  return rows[0] ?? null;
}

export async function getMeetingAttendees(meetingId: string): Promise<Member[]> {
  const { rows } = await query<Member>(
    `
      SELECT
        members.id,
        members.name,
        members.created_at::text AS created_at
      FROM attendance
      INNER JOIN members
        ON members.id = attendance.member_id
      WHERE attendance.meeting_id = $1
      ORDER BY members.name ASC
    `,
    [meetingId]
  );

  return rows;
}

export async function getAllMembers(): Promise<Member[]> {
  const { rows } = await query<Member>(`
    SELECT
      id,
      name,
      created_at::text AS created_at
    FROM members
    ORDER BY name ASC
  `);

  return rows;
}

export async function getAttendanceForMeeting(
  meetingId: string
): Promise<string[]> {
  const { rows } = await query<{ member_id: string }>(
    `
      SELECT member_id
      FROM attendance
      WHERE meeting_id = $1
      ORDER BY member_id ASC
    `,
    [meetingId]
  );

  return rows.map((row) => row.member_id);
}

export async function replaceAttendanceForMeeting(
  meetingId: string,
  memberIds: string[]
) {
  await withTransaction(async (client) => {
    await client.query("DELETE FROM attendance WHERE meeting_id = $1", [
      meetingId,
    ]);

    if (memberIds.length === 0) {
      return;
    }

    await client.query(
      `
        INSERT INTO attendance (meeting_id, member_id)
        SELECT $1::uuid, UNNEST($2::uuid[])
      `,
      [meetingId, memberIds]
    );
  });
}

export async function updateMeetingPhotoUrl(
  meetingId: string,
  photoUrl: string | null
) {
  await query("UPDATE meetings SET photo_url = $1 WHERE id = $2", [
    photoUrl,
    meetingId,
  ]);
}
