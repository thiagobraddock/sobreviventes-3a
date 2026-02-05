"use client";

import type { MemberWithRank } from "@/lib/supabase";

type Props = {
  ranking: MemberWithRank[];
  totalMeetings: number;
};

function getRankStyle(rank: number) {
  switch (rank) {
    case 1:
      return {
        badge: "bg-[var(--gold)] text-black",
        border: "border-[var(--gold)]/40",
        bg: "bg-gradient-to-r from-[var(--gold)]/10 to-transparent",
      };
    case 2:
      return {
        badge: "bg-[var(--silver)] text-black",
        border: "border-[var(--silver)]/30",
        bg: "bg-gradient-to-r from-[var(--silver)]/10 to-transparent",
      };
    case 3:
      return {
        badge: "bg-[var(--bronze)] text-black",
        border: "border-[var(--bronze)]/30",
        bg: "bg-gradient-to-r from-[var(--bronze)]/10 to-transparent",
      };
    default:
      return {
        badge: "bg-[var(--ash)] text-[var(--text-secondary)]",
        border: "border-[var(--ash)]",
        bg: "bg-[var(--slate)]",
      };
  }
}

function getInitials(name: string): string {
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].charAt(0);
  return parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
}

export function RankingList({ ranking, totalMeetings }: Props) {
  return (
    <div className="space-y-3">
      {ranking.map((member) => {
        const style = getRankStyle(member.rank);
        return (
          <div
            key={member.id}
            className={`flex items-center gap-4 p-4 rounded-xl border ${style.border} ${style.bg} transition-all duration-150 hover:scale-[1.01]`}
          >
            {/* Rank Badge */}
            <div
              className={`w-9 h-9 rounded-full ${style.badge} flex items-center justify-center font-bold text-sm shadow-sm`}
            >
              {member.rank}º
            </div>

            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-[var(--electric)] text-white flex items-center justify-center font-medium text-sm">
              {getInitials(member.name)}
            </div>

            {/* Name & Stats */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[var(--text-primary)] truncate">
                {member.name}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {member.attendance_count} de {totalMeetings} encontro
                {totalMeetings !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="hidden sm:flex items-center gap-2 w-32">
              <div className="flex-1 h-2 bg-[var(--ash)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--electric)] rounded-full transition-all duration-300"
                  style={{ width: `${member.percentage}%` }}
                />
              </div>
              <span className="text-xs text-[var(--text-muted)] w-10 text-right">
                {member.percentage}%
              </span>
            </div>
          </div>
        );
      })}

      {ranking.length === 0 && (
        <p className="text-center text-[var(--text-muted)] py-8 italic">
          Nenhum dado disponível ainda
        </p>
      )}
    </div>
  );
}
