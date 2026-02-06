"use client";

import { useState, useEffect } from "react";
import { getRanking, getPastMeetings, getMeetingAttendees } from "@/lib/queries";
import { RankingList } from "@/components/ranking-list";
import { MeetingSelector } from "@/components/meeting-selector";
import type { MemberWithRank, Meeting, Member } from "@/lib/supabase";

export default function Home() {
  const [ranking, setRanking] = useState<MemberWithRank[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [attendeesCache, setAttendeesCache] = useState<Record<string, Member[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  // Load ranking + meetings once on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [rankingData, meetingsData] = await Promise.all([
          getRanking(),
          getPastMeetings(),
        ]);
        setRanking(rankingData);
        setMeetings(meetingsData);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Handle meeting selection — instant UI switch + fetch attendees if needed
  const handleSelectMeeting = async (meetingId: string | null) => {
    setSelectedMeetingId(meetingId);

    if (!meetingId || attendeesCache[meetingId]) return;

    setLoadingAttendees(true);
    try {
      const attendees = await getMeetingAttendees(meetingId);
      setAttendeesCache((prev) => ({ ...prev, [meetingId]: attendees }));
    } catch (error) {
      console.error("Failed to load attendees:", error);
    } finally {
      setLoadingAttendees(false);
    }
  };

  const selectedMeeting = selectedMeetingId
    ? meetings.find((m) => m.id === selectedMeetingId) ?? null
    : null;

  const selectedMeetingAttendees = selectedMeetingId
    ? attendeesCache[selectedMeetingId] ?? null
    : null;

  if (loading) {
    return (
      <main className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <header className="text-center mb-10">
            <div className="mx-auto mb-5 h-52 sm:h-64 w-52 sm:w-64 rounded-full bg-[var(--slate)] animate-pulse" />
            <div className="h-5 w-48 mx-auto bg-[var(--slate)] rounded animate-pulse" />
          </header>
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 w-20 bg-[var(--slate)] rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-[var(--slate)] rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="text-center mb-10">
          <img
            src="/logo-sobreviventes.png"
            alt="Sobreviventes 3A"
            className="mx-auto mb-5 h-52 sm:h-64 w-auto"
          />
          <p className="text-[var(--text-muted)] text-base sm:text-lg uppercase tracking-widest">
            Ranking de frequência
          </p>
        </header>

        {/* Meeting Selector */}
        <MeetingSelector
          meetings={meetings}
          selectedMeetingId={selectedMeetingId}
          onSelect={handleSelectMeeting}
        />

        {/* Content */}
        {selectedMeeting ? (
          <div className="mb-8">
            {/* Photo */}
            {selectedMeeting.photo_url && (
              <div className="mb-6 rounded-xl overflow-hidden border border-[var(--ash)]">
                <img
                  src={selectedMeeting.photo_url}
                  alt={`Encontro de ${new Date(selectedMeeting.meeting_date + "T12:00:00").toLocaleDateString("pt-BR")}`}
                  className="w-full h-auto"
                />
              </div>
            )}

            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Presentes em{" "}
              {new Date(selectedMeeting.meeting_date + "T12:00:00").toLocaleDateString(
                "pt-BR",
                {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }
              )}
            </h2>

            {loadingAttendees || !selectedMeetingAttendees ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[var(--slate)] rounded-lg border border-[var(--ash)]">
                    <div className="w-8 h-8 rounded-full bg-[var(--ash)] animate-pulse" />
                    <div className="h-4 w-32 bg-[var(--ash)] rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : selectedMeetingAttendees.length > 0 ? (
              <ul className="space-y-2">
                {selectedMeetingAttendees.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center gap-3 p-3 bg-[var(--slate)] rounded-lg border border-[var(--ash)]"
                  >
                    <span className="w-8 h-8 rounded-full bg-[var(--electric)] text-white flex items-center justify-center text-sm font-medium">
                      {member.name.charAt(0)}
                    </span>
                    <span className="text-[var(--text-primary)]">{member.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[var(--text-muted)] italic">
                Nenhuma presença registrada
              </p>
            )}
          </div>
        ) : (
          <RankingList ranking={ranking} totalMeetings={meetings.length} />
        )}
      </div>
    </main>
  );
}
