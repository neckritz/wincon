import HelpHint from '../ui/HelpHint';

export interface AwardPlacementMember {
  name: string;
  tag: string;
  scoreLabel: string;
}

export interface AwardPlacement {
  place: number;
  members: AwardPlacementMember[];
}

export interface MemberAward {
  title: string;
  placements: AwardPlacement[];
  emptyMessage: string;
}

interface MemberAwardsSectionProps {
  awards: MemberAward[];
  battleTypesHelpText: string;
}

function getPlacementMembers(award: MemberAward, place: number): AwardPlacementMember[] {
  return award.placements.find((placement) => placement.place === place)?.members ?? [];
}

function formatPlacementMembers(members: AwardPlacementMember[]): string {
  return members.map((member) => member.name).join(', ');
}

function formatPlacementScores(members: AwardPlacementMember[]): string {
  const uniqueScoreLabels = [...new Set(members.map((member) => member.scoreLabel))];
  return uniqueScoreLabels.join(', ');
}

function getFirstPlaceDensityClass(members: AwardPlacementMember[]): string {
  const winnerNames = formatPlacementMembers(members);
  const tieCount = members.length;
  const charCount = winnerNames.length;

  if (tieCount >= 4 || charCount > 44) return 'award-podium__first--dense';
  if (tieCount >= 3 || charCount > 28) return 'award-podium__first--compact';
  return '';
}

export default function MemberAwardsSection({
  awards,
  battleTypesHelpText,
}: MemberAwardsSectionProps) {
  return (
    <section className="clan-section">
      <h2 className="clan-section__heading">
        <span className="clan-section__heading-label">
          Member Awards
          <HelpHint
            size="large"
            tone="blue"
            text={battleTypesHelpText}
            ariaLabel="Member awards calculation battle types"
          />
        </span>
      </h2>

      <div className="awards-grid">
        {awards.map((award, index) => {
          const titleOnTop = index % 2 === 0;

          return (
            <article
              key={award.title}
              className={`award-card ${titleOnTop ? 'award-card--title-top' : 'award-card--title-bottom'}`}
            >
              {titleOnTop ? (
                <h3 className="award-card__title">{award.title}</h3>
              ) : null}

              <div className="award-card__body">
                {award.placements.length === 0 || !award.placements.some((p) => p.place === 1) ? (
                  <p className="award-card__empty">{award.emptyMessage}</p>
                ) : (
                  (() => {
                    const firstPlaceMembers = getPlacementMembers(award, 1);
                    const secondPlaceMembers = getPlacementMembers(award, 2);
                    const thirdPlaceMembers = getPlacementMembers(award, 3);
                    const firstPlaceDensityClass =
                      getFirstPlaceDensityClass(firstPlaceMembers);

                    return (
                      <div className="award-podium">
                        <section
                          className={`award-podium__first ${firstPlaceDensityClass}`.trim()}
                        >
                          <p className="award-podium__winner">
                            {formatPlacementMembers(firstPlaceMembers)}
                          </p>
                          <p className="award-podium__score">
                            {formatPlacementScores(firstPlaceMembers)}
                          </p>
                        </section>

                        <div className="award-podium__runners">
                          <section className="award-podium__runner award-podium__runner--second">
                            <p className="award-podium__rank">#2</p>
                            <p className="award-podium__runner-name">
                              {secondPlaceMembers.length > 0
                                ? formatPlacementMembers(secondPlaceMembers)
                                : 'No runner-up'}
                            </p>
                            {secondPlaceMembers.length > 0 ? (
                              <p className="award-podium__runner-score">
                                {formatPlacementScores(secondPlaceMembers)}
                              </p>
                            ) : null}
                          </section>

                          <section className="award-podium__runner award-podium__runner--third">
                            <p className="award-podium__rank">#3</p>
                            <p className="award-podium__runner-name">
                              {thirdPlaceMembers.length > 0
                                ? formatPlacementMembers(thirdPlaceMembers)
                                : 'No third place'}
                            </p>
                            {thirdPlaceMembers.length > 0 ? (
                              <p className="award-podium__runner-score">
                                {formatPlacementScores(thirdPlaceMembers)}
                              </p>
                            ) : null}
                          </section>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>

              {!titleOnTop ? (
                <h3 className="award-card__title">{award.title}</h3>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
