import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface ClanProgressPoint {
  label: string;
  fame: number;
  placement: number | null;
}

export interface ClanTrophyPoint {
  label: string;
  clanWarTrophies: number;
  trophyChange: number;
}

interface ClanWarProgressSectionProps {
  progression: ClanProgressPoint[];
  trophyProgression: ClanTrophyPoint[];
  averagePlacement: number | null;
}

function getTrophyDomain(trophyProgression: ClanTrophyPoint[]): [number, number] {
  if (trophyProgression.length === 0) return [0, 1];

  const trophyValues = trophyProgression.map((point) => point.clanWarTrophies);
  const minTrophies = Math.min(...trophyValues);
  const maxTrophies = Math.max(...trophyValues);

  if (minTrophies === maxTrophies) {
    return [Math.max(0, minTrophies - 50), maxTrophies + 50];
  }

  const range = maxTrophies - minTrophies;
  const padding = Math.max(10, Math.round(range * 0.2));
  return [Math.max(0, minTrophies - padding), maxTrophies + padding];
}

export default function ClanWarProgressSection({
  progression,
  trophyProgression,
  averagePlacement,
}: ClanWarProgressSectionProps) {
  const trophyDomain = getTrophyDomain(trophyProgression);

  return (
    <section style={{ border: '1px solid #ddd', padding: '16px' }}>
      <h2>Clan War Performance</h2>
      <p>
        Average Placement:{' '}
        {averagePlacement === null ? 'N/A' : averagePlacement.toFixed(2)}
      </p>

      <h3>Clan War Trophies</h3>
      {trophyProgression.length === 0 ? (
        <p>No clan war trophy data available.</p>
      ) : (
        <div style={{ width: '100%', height: '280px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trophyProgression}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" interval={0} minTickGap={0} />
              <YAxis allowDecimals={false} domain={trophyDomain} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="clanWarTrophies"
                stroke="#0f766e"
                name="Clan War Trophies"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <h3>Fame And Placement</h3>
      {progression.length === 0 ? (
        <p>No clan war progression data available.</p>
      ) : (
        <div style={{ width: '100%', height: '280px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progression}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis yAxisId="fame" allowDecimals={false} />
              <YAxis
                yAxisId="placement"
                orientation="right"
                allowDecimals={false}
                reversed
              />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="fame"
                type="monotone"
                dataKey="fame"
                stroke="#222"
                name="Fame"
              />
              <Line
                yAxisId="placement"
                type="monotone"
                dataKey="placement"
                stroke="#2b6cb0"
                name="Placement"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
