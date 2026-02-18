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
  const clanDescription = clanData.description?.trim() || 'No clan description provided.';

  return (
    <section className="clan-hero">
      <h1 className="clan-hero__name">{clanData.name}</h1>

      <article className="clan-hero__details-card">
        <p className="clan-hero__description">{clanDescription}</p>

        <div className="clan-hero__stats">
          <p className="clan-hero__stat">
            <span>Tag</span>
            <strong>{clanData.tag}</strong>
          </p>
          <p className="clan-hero__stat">
            <span>Members</span>
            <strong>{clanData.members}/50</strong>
          </p>
          <p className="clan-hero__stat">
            <span>Clan Score</span>
            <strong>{clanData.clanScore}</strong>
          </p>
          <p className="clan-hero__stat">
            <span>War Trophies</span>
            <strong>{clanData.clanWarTrophies}</strong>
          </p>
        </div>

        <section className="clan-hero__mvp" aria-label="Current overall MVP">
          <h2 className="clan-hero__mvp-heading">Current Overall MVP</h2>

          {mvpMember ? (
            <div className="clan-hero__mvp-content">
              <div className="clan-hero__mvp-identity">
                <p className="clan-hero__mvp-name">{mvpMember.name}</p>
                <p className="clan-hero__mvp-tag">{mvpMember.tag}</p>
              </div>

              <div className="clan-hero__mvp-stats">
                <p className="clan-hero__mvp-stat">
                  <span>MVP Score</span>
                  <strong>{mvpMember.mvpScore.toFixed(3)}</strong>
                </p>
                <p className="clan-hero__mvp-stat">
                  <span>Avg Fame</span>
                  <strong>{mvpMember.averageWarFame.toFixed(1)}</strong>
                </p>
                <p className="clan-hero__mvp-stat">
                  <span>Avg Winrate</span>
                  <strong>{formatPercent(mvpMember.winRate)}</strong>
                </p>
                <p className="clan-hero__mvp-stat">
                  <span>Donations</span>
                  <strong>{mvpMember.donations}</strong>
                </p>
              </div>
            </div>
          ) : (
            <p className="clan-hero__empty">No MVP data available.</p>
          )}
        </section>
      </article>
    </section>
  );
}
