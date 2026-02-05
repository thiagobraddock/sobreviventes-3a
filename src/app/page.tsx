import { getRanking, getPastMeetings, getMeetingAttendees } from "@/lib/queries";
import { RankingList } from "@/components/ranking-list";
import { MeetingSelector } from "@/components/meeting-selector";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ meeting?: string }>;
}) {
  const params = await searchParams;
  const [ranking, meetings] = await Promise.all([
    getRanking(),
    getPastMeetings(),
  ]);

  const selectedMeetingId = params.meeting;
  const selectedMeetingAttendees = selectedMeetingId
    ? await getMeetingAttendees(selectedMeetingId)
    : null;

  const selectedMeeting = selectedMeetingId
    ? meetings.find((m) => m.id === selectedMeetingId)
    : null;

  return (
    <main className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
            Sobreviventes 3A
          </h1>
          <p className="text-[var(--text-muted)] text-sm uppercase tracking-widest">
            Ranking de frequência
          </p>
        </header>

        {/* Meeting Selector */}
        <MeetingSelector
          meetings={meetings}
          selectedMeetingId={selectedMeetingId}
        />

        {/* Content */}
        {selectedMeeting && selectedMeetingAttendees ? (
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
            {selectedMeetingAttendees.length > 0 ? (
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
