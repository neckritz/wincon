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

export default function MemberPerformanceSection({
  hasActiveClanWar,
  currentWarRankings,
  averageFameRankings,
}: MemberPerformanceSectionProps) {
  const currentWarEmpty = !hasActiveClanWar
    ? 'No active clan war at the moment :/'
    : 'No current war participant data available';

  return (
    <section className="clan-section">
      <h2 className="clan-section__heading">Member Performance</h2>

      <div className="member-performance-grid">
        <article className="rank-card rank-card--title-bottom">
          <div className="rank-card__body">
            {!hasActiveClanWar || currentWarRankings.length === 0 ? (
              <p className="rank-card__empty">{currentWarEmpty}</p>
            ) : (
              <ol className="rank-list" aria-label="Current war fame rankings">
                {currentWarRankings.map((member) => (
                  <li className="rank-list__item" key={member.tag}>
                    <span className="rank-list__name">
                      {member.rank}. {member.name}
                    </span>
                    <span className="rank-list__value">{member.fame} fame</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <h3 className="rank-card__title">Current War Fame</h3>
        </article>

        <article className="rank-card rank-card--title-top rank-card--offset">
          <h3 className="rank-card__title">Average Clan War Fame</h3>
          <div className="rank-card__body">
            {averageFameRankings.length === 0 ? (
              <p className="rank-card__empty">No clan war log member data available.</p>
            ) : (
              <ol className="rank-list" aria-label="Average fame rankings">
                {averageFameRankings.map((member) => (
                  <li className="rank-list__item" key={member.tag}>
                    <span className="rank-list__name">
                      {member.rank}. {member.name}
                    </span>
                    <span className="rank-list__value">
                      {member.averageFame.toFixed(1)} avg
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
