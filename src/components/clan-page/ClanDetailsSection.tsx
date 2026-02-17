import type { ClanResponse } from '../types';

export interface MvpMemberSummary {
  name: string;
  tag: string;
  mvpScore: number;
  averageWarFame: number;
  winRate: number | null;
  donations: number;
}

interface ClanDetailsSectionProps {
  clanData: ClanResponse;
  mvpMember: MvpMemberSummary | null;
}

function formatPercent(value: number | null): string {
  if (value === null) return 'N/A';
  return `${(value * 100).toFixed(1)}%`;
}

export default function ClanDetailsSection({
  clanData,
  mvpMember,
}: ClanDetailsSectionProps) {
  return (
    <section style={{ border: '1px solid #ddd', padding: '16px' }}>
      <h2>Clan Details</h2>
      <h1>{clanData.name}</h1>
      <p>{clanData.tag}</p>
      <p>{clanData.description || 'No clan description provided.'}</p>
      <p>Members: {clanData.members}</p>
      <p>Clan Score: {clanData.clanScore}</p>
      <p>War Trophies: {clanData.clanWarTrophies}</p>

      <h3>Current Overall MVP</h3>
      {mvpMember ? (
        <>
          <p>
            {mvpMember.name} ({mvpMember.tag})
          </p>
          <p>MVP Score: {mvpMember.mvpScore.toFixed(3)}</p>
          <p>Average War Fame: {mvpMember.averageWarFame.toFixed(1)}</p>
          <p>Average Winrate: {formatPercent(mvpMember.winRate)}</p>
          <p>Donations: {mvpMember.donations}</p>
        </>
      ) : (
        <p>No MVP data available.</p>
      )}
    </section>
  );
}
