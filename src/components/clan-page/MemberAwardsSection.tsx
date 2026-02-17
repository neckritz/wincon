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
}

export default function MemberAwardsSection({ awards }: MemberAwardsSectionProps) {
  return (
    <section style={{ border: '1px solid #ddd', padding: '16px' }}>
      <h2>Member Awards</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {awards.map((award) => (
          <article key={award.title} style={{ border: '1px solid #eee', padding: '12px' }}>
            <h3>{award.title}</h3>
            {award.placements.length === 0 ? (
              <p>{award.emptyMessage}</p>
            ) : (
              award.placements.map((placement) => (
                <p key={`${award.title}-${placement.place}`}>
                  {placement.place}.{' '}
                  {placement.members
                    .map((member) => `${member.name} (${member.scoreLabel})`)
                    .join(', ')}
                </p>
              ))
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
