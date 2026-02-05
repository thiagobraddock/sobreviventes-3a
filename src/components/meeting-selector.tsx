"use client";

import type { Meeting } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Props = {
  meetings: Meeting[];
  selectedMeetingId?: string;
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export function MeetingSelector({ meetings, selectedMeetingId }: Props) {
  const router = useRouter();

  const handleSelect = (meetingId: string | null) => {
    if (meetingId) {
      router.push(`/?meeting=${meetingId}`);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-2 justify-center">
        {/* All/Ranking button */}
        <button
          onClick={() => handleSelect(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
            !selectedMeetingId
              ? "bg-[var(--electric)] text-white shadow-lg shadow-[var(--electric)]/25"
              : "bg-[var(--slate)] text-[var(--text-secondary)] border border-[var(--ash)] hover:bg-[var(--smoke)] hover:text-[var(--text-primary)] hover:border-[var(--electric)]/50"
          }`}
        >
          Ranking
        </button>

        {/* Meeting date buttons */}
        {meetings.map((meeting) => (
          <button
            key={meeting.id}
            onClick={() => handleSelect(meeting.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
              selectedMeetingId === meeting.id
                ? "bg-[var(--electric)] text-white shadow-lg shadow-[var(--electric)]/25"
                : "bg-[var(--slate)] text-[var(--text-secondary)] border border-[var(--ash)] hover:bg-[var(--smoke)] hover:text-[var(--text-primary)] hover:border-[var(--electric)]/50"
            }`}
          >
            {formatDate(meeting.meeting_date)}
          </button>
        ))}
      </div>
    </div>
  );
}
