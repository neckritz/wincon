import type { CSSProperties } from 'react';

export interface RankedCurrentWarMember {
  rank: number;
  name: string;
  tag: string;
  fame: number;
}

export interface RankedAverageFameMember {
  rank: number;
  name: string;
  tag: string;
  averageFame: number;
}

interface MemberPerformanceSectionProps {
  hasActiveClanWar: boolean;
  currentWarRankings: RankedCurrentWarMember[];
  averageFameRankings: RankedAverageFameMember[];
}

const listStyle: CSSProperties = {
  maxHeight: '260px',
  overflowY: 'auto',
  border: '1px solid #ddd',
  padding: '8px',
};

export default function MemberPerformanceSection({
  hasActiveClanWar,
  currentWarRankings,
  averageFameRankings,
}: MemberPerformanceSectionProps) {
  return (
    <section style={{ border: '1px solid #ddd', padding: '16px' }}>
      <h2>Member Performance</h2>

      <h3>Current War Fame Ranking</h3>
      {!hasActiveClanWar ? (
        <p>no active clan war at the moment</p>
      ) : currentWarRankings.length === 0 ? (
        <p>No current war participant data available.</p>
      ) : (
        <div style={listStyle}>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {currentWarRankings.map((member) => (
              <li key={member.tag}>
                {member.rank}. {member.name} ({member.fame} fame)
              </li>
            ))}
          </ol>
        </div>
      )}

      <h3>Average Fame Across Clan War Logs</h3>
      {averageFameRankings.length === 0 ? (
        <p>No clan war log member data available.</p>
      ) : (
        <div style={listStyle}>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {averageFameRankings.map((member) => (
              <li key={member.tag}>
                {member.rank}. {member.name} ({member.averageFame.toFixed(1)} avg fame)
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
