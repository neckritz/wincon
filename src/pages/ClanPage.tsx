import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ClanDetailsSection, {
  type MvpMemberSummary,
} from '../components/clan-page/ClanDetailsSection';
import ClanWarProgressSection, {
  type ClanProgressPoint,
  type ClanTrophyPoint,
} from '../components/clan-page/ClanWarProgressSection';
import MemberAwardsSection, {
  type AwardPlacement,
  type MemberAward,
} from '../components/clan-page/MemberAwardsSection';
import MemberPerformanceSection, {
  type RankedAverageFameMember,
  type RankedCurrentWarMember,
} from '../components/clan-page/MemberPerformanceSection';
import type {
  BattleLogEntry,
  BattleLogTeamMember,
  ClanMember,
  ClanMembersResponse,
  ClanResponse,
  ClanWarLogResponse,
  ClanWarParticipant,
  CurrentClanWarResponse,
  PlayerResponse,
} from '../components/types';
import './ClanPage.css';

const ALLOWED_BATTLE_TYPES = [
  'RIVER_RACE_PVP',
  'RIVER_RACE_DUEL',
  'RIVER_RACE_DUEL_COLOSSEUM',
  'BOAT_BATTLE',
  'PATH_OF_LEGEND',
  'PVP',
  'CHALLENGE',
  'PVP2v2',
] as const;

const ALLOWED_BATTLE_TYPE_SET = new Set<string>(
  ALLOWED_BATTLE_TYPES.map((battleType) => toCanonicalBattleType(battleType)),
);

interface MemberBattleData {
  member: ClanMember;
  player: PlayerResponse | null;
  battleLog: BattleLogEntry[];
}

interface MemberStats {
  name: string;
  tag: string;
  donations: number;
  currentTrophies: number;
  averageWarFame: number;
  currentWarFame: number;
  winRate: number | null;
  countedBattles: number;
  trophyDelta: number | null;
  hoursSinceLastBattle: number;
}

interface AwardInput {
  name: string;
  tag: string;
  value: number;
  scoreLabel: string;
}

interface RankedValue<T> {
  rank: number;
  item: T;
  value: number;
}

function normalizeTag(tag?: string): string {
  if (!tag) return '';

  const trimmedTag = tag.trim();
  let decodedTag = trimmedTag;

  try {
    decodedTag = decodeURIComponent(trimmedTag);
  } catch {
    decodedTag = trimmedTag;
  }

  return decodedTag.replace('#', '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function encodeTag(tag: string): string {
  return encodeURIComponent(`#${normalizeTag(tag)}`);
}

function toCanonicalBattleType(type?: string): string {
  return (type ?? '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

function isAllowedBattleType(type?: string): boolean {
  return ALLOWED_BATTLE_TYPE_SET.has(toCanonicalBattleType(type));
}

function parseCrBattleTime(dateString?: string): Date | null {
  if (!dateString) return null;

  const match = dateString
    .trim()
    .match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(?:\.\d+)?Z?$/);

  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match;

  const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
  const parsed = new Date(isoString);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getMostRecentBattleDate(entries: BattleLogEntry[]): Date | null {
  let mostRecentDate: Date | null = null;

  for (const entry of entries) {
    const parsed = parseCrBattleTime(entry.battleTime);
    if (!parsed) continue;
    if (!mostRecentDate || parsed.getTime() > mostRecentDate.getTime()) {
      mostRecentDate = parsed;
    }
  }

  return mostRecentDate;
}

function getTeamCrowns(team?: BattleLogTeamMember[]): number | null {
  if (!team || team.length === 0) return null;

  const crownValues = team
    .map((member) => member.crowns)
    .filter((crowns): crowns is number => typeof crowns === 'number');

  if (crownValues.length === 0) return null;
  return Math.max(...crownValues);
}

function getBattleResult(entry: BattleLogEntry): 'win' | 'loss' | 'draw' | null {
  const teamCrowns = getTeamCrowns(entry.team);
  const opponentCrowns = getTeamCrowns(entry.opponent);

  if (teamCrowns === null || opponentCrowns === null) return null;
  if (teamCrowns > opponentCrowns) return 'win';
  if (teamCrowns < opponentCrowns) return 'loss';
  return 'draw';
}

function getTeamMemberForPlayer(
  entry: BattleLogEntry,
  memberTag: string,
): BattleLogTeamMember | undefined {
  const team = Array.isArray(entry.team) ? entry.team : [];

  return team.find((teamMember) => normalizeTag(teamMember.tag) === memberTag) ?? team[0];
}

function getOldestStartingTrophies(
  entries: BattleLogEntry[],
  memberTag: string,
): number | null {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const teamMember = getTeamMemberForPlayer(entries[index], memberTag);
    if (typeof teamMember?.startingTrophies === 'number') {
      return teamMember.startingTrophies;
    }
  }

  return null;
}

function normalizeMinMax(value: number, allValues: number[]): number {
  if (allValues.length === 0) return 0;

  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);

  if (minValue === maxValue) return 1;
  return (value - minValue) / (maxValue - minValue);
}

function areNumbersEqual(a: number, b: number): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return a === b;
  return Math.abs(a - b) < 1e-9;
}

function compareNumericValues(a: number, b: number, descending: boolean): number {
  if (areNumbersEqual(a, b)) return 0;
  if (descending) return a > b ? -1 : 1;
  return a < b ? -1 : 1;
}

function buildCompetitionRanks<T>(
  items: T[],
  getValue: (item: T) => number,
  descending: boolean,
  getName: (item: T) => string,
): RankedValue<T>[] {
  const sortedItems = [...items].sort((itemA, itemB) => {
    const valueComparison = compareNumericValues(
      getValue(itemA),
      getValue(itemB),
      descending,
    );

    if (valueComparison !== 0) return valueComparison;
    return getName(itemA).localeCompare(getName(itemB));
  });

  const rankedValues: RankedValue<T>[] = [];
  let currentRank = 0;
  let previousValue: number | null = null;

  sortedItems.forEach((item, index) => {
    const value = getValue(item);

    if (index === 0 || previousValue === null || !areNumbersEqual(value, previousValue)) {
      currentRank = index + 1;
      previousValue = value;
    }

    rankedValues.push({ rank: currentRank, item, value });
  });

  return rankedValues;
}

function buildAwardPlacements(entries: AwardInput[], descending: boolean): AwardPlacement[] {
  const rankedEntries = buildCompetitionRanks(
    entries,
    (entry) => entry.value,
    descending,
    (entry) => entry.name,
  );

  const placementsByPlace = new Map<number, AwardPlacement>();
  const placeByRawRank = new Map<number, number>();
  let nextPlace = 1;

  for (const rankedEntry of rankedEntries) {
    let place = placeByRawRank.get(rankedEntry.rank);
    if (place === undefined) {
      if (nextPlace > 3) break;
      place = nextPlace;
      placeByRawRank.set(rankedEntry.rank, place);
      nextPlace += 1;
    }

    const existingPlacement = placementsByPlace.get(place);
    const placementMember = {
      name: rankedEntry.item.name,
      tag: rankedEntry.item.tag,
      scoreLabel: rankedEntry.item.scoreLabel,
    };

    if (existingPlacement) {
      existingPlacement.members.push(placementMember);
    } else {
      placementsByPlace.set(place, {
        place,
        members: [placementMember],
      });
    }
  }

  return [...placementsByPlace.values()].sort((a, b) => a.place - b.place);
}

function formatDurationFromHours(hours: number): string {
  if (!Number.isFinite(hours)) return 'No eligible battles';

  const flooredHours = Math.max(0, Math.floor(hours));
  const days = Math.floor(flooredHours / 24);
  const remainderHours = flooredHours % 24;

  if (days > 0) return `${days}d ${remainderHours}h`;
  return `${remainderHours}h`;
}

async function fetchJson<T>(
  url: string,
  headers: HeadersInit,
  signal: AbortSignal,
): Promise<T> {
  const response = await fetch(url, { headers, signal });

  if (!response.ok) {
    throw new Error(`API call failed (${response.status}) for ${url}`);
  }

  return response.json() as Promise<T>;
}

async function fetchJsonOrNullOn404<T>(
  url: string,
  headers: HeadersInit,
  signal: AbortSignal,
): Promise<T | null> {
  const response = await fetch(url, { headers, signal });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`API call failed (${response.status}) for ${url}`);
  }

  return response.json() as Promise<T>;
}

function buildFallbackCurrentClanWar(clan: ClanResponse): CurrentClanWarResponse {
  return {
    state: 'notInWar',
    sectionIndex: 0,
    periodType: 'training',
    clan: {
      tag: clan.tag,
      name: clan.name,
      fame: 0,
      repairPoints: 0,
      participants: [],
    },
    clans: [],
  };
}

function buildFallbackClanWarLog(): ClanWarLogResponse {
  return {
    items: [],
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      if (currentIndex >= items.length) return;

      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  });

  await Promise.all(workers);
  return results;
}

export default function ClanPage() {
  const { clanTag } = useParams<{ clanTag: string }>();
  const [clanData, setClanData] = useState<ClanResponse | null>(null);
  const [clanWarLog, setClanWarLog] = useState<ClanWarLogResponse | null>(null);
  const [currentClanWar, setCurrentClanWar] = useState<CurrentClanWarResponse | null>(null);
  const [memberBattleData, setMemberBattleData] = useState<MemberBattleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clanTag) {
      setError('Missing clan tag.');
      setIsLoading(false);
      return;
    }

    const encodedTag = encodeTag(clanTag);
    const headers: HeadersInit = {};

    const clanUrl = `/api/clans/${encodedTag}`;
    const clanWarLogUrl = `/api/clans/${encodedTag}/riverracelog`;
    const currentClanWarUrl = `/api/clans/${encodedTag}/currentriverrace`;
    const clanMembersUrl = `/api/clans/${encodedTag}/members`;
    const abortController = new AbortController();

    const fetchAllData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [clanJson, clanMembersJson] = await Promise.all([
          fetchJson<ClanResponse>(clanUrl, headers, abortController.signal),
          fetchJson<ClanMembersResponse>(
            clanMembersUrl,
            headers,
            abortController.signal,
          ),
        ]);

        const [clanWarLogJson, currentClanWarJson] = await Promise.all([
          fetchJsonOrNullOn404<ClanWarLogResponse>(
            clanWarLogUrl,
            headers,
            abortController.signal,
          ),
          fetchJsonOrNullOn404<CurrentClanWarResponse>(
            currentClanWarUrl,
            headers,
            abortController.signal,
          ),
        ]);

        const memberData = await mapWithConcurrency(
          clanMembersJson.items ?? [],
          8,
          async (member) => {
            const encodedMemberTag = encodeTag(member.tag);
            const playerUrl = `/api/players/${encodedMemberTag}`;
            const battleLogUrl = `/api/players/${encodedMemberTag}/battlelog`;

            try {
              const [playerJson, battleLogJson] = await Promise.all([
                fetchJson<PlayerResponse>(playerUrl, headers, abortController.signal),
                fetchJson<BattleLogEntry[] | { items?: BattleLogEntry[] }>(
                  battleLogUrl,
                  headers,
                  abortController.signal,
                ),
              ]);

              const battleLog = Array.isArray(battleLogJson)
                ? battleLogJson
                : Array.isArray(battleLogJson.items)
                  ? battleLogJson.items
                  : [];

              return {
                member,
                player: playerJson,
                battleLog,
              };
            } catch (memberError) {
              if (abortController.signal.aborted) throw memberError;

              return {
                member,
                player: null,
                battleLog: [],
              };
            }
          },
        );

        if (abortController.signal.aborted) return;

        setClanData(clanJson);
        setClanWarLog(clanWarLogJson ?? buildFallbackClanWarLog());
        setCurrentClanWar(currentClanWarJson ?? buildFallbackCurrentClanWar(clanJson));
        setMemberBattleData(memberData);
      } catch (err) {
        if (abortController.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchAllData();

    return () => abortController.abort();
  }, [clanTag]);

  const currentClanWarClan = useMemo(
    () =>
      currentClanWar?.clan ??
      currentClanWar?.clans?.find(
        (clan) => normalizeTag(clan.tag) === normalizeTag(clanData?.tag),
      ),
    [currentClanWar, clanData?.tag],
  );

  const currentClanWarParticipants = useMemo(
    () =>
      Array.isArray(currentClanWarClan?.participants)
        ? currentClanWarClan.participants
        : [],
    [currentClanWarClan],
  );

  const memberStats = useMemo<MemberStats[]>(() => {
    if (!clanWarLog) return [];

    const clanTagKey = normalizeTag(clanData?.tag);
    const warLogEntries = clanWarLog.items;
    const currentWarFameByTag = new Map<string, number>(
      currentClanWarParticipants.map((participant) => [
        normalizeTag(participant.tag),
        participant.fame,
      ]),
    );

    return memberBattleData.map((entry) => {
      const memberTag = normalizeTag(entry.member.tag);
      const eligibleBattleLog = entry.battleLog.filter((battle) =>
        isAllowedBattleType(battle.type),
      );

      let wins = 0;
      let countedBattles = 0;

      for (const battle of eligibleBattleLog) {
        const result = getBattleResult(battle);
        if (!result) continue;

        countedBattles += 1;
        if (result === 'win') wins += 1;
        if (result === 'draw') wins += 0.5;
      }

      const winRate = countedBattles > 0 ? wins / countedBattles : null;

      const mostRecentBattleDate = getMostRecentBattleDate(eligibleBattleLog);
      const hoursSinceLastBattle = mostRecentBattleDate
        ? (Date.now() - mostRecentBattleDate.getTime()) / (1000 * 60 * 60)
        : Number.POSITIVE_INFINITY;

      const oldestStartingTrophies = getOldestStartingTrophies(
        eligibleBattleLog,
        memberTag,
      );
      const currentTrophies = entry.player?.trophies ?? entry.member.trophies ?? 0;
      const trophyDelta =
        oldestStartingTrophies === null
          ? null
          : currentTrophies - oldestStartingTrophies;

      let totalWarFame = 0;

      for (const warLogEntry of warLogEntries) {
        const clanStanding = warLogEntry.standings.find(
          (standing) => normalizeTag(standing.clan.tag) === clanTagKey,
        );

        const participants = Array.isArray(clanStanding?.clan.participants)
          ? (clanStanding.clan.participants as ClanWarParticipant[])
          : [];

        const memberParticipant = participants.find(
          (participant) => normalizeTag(participant.tag) === memberTag,
        );

        totalWarFame += memberParticipant?.fame ?? 0;
      }

      const averageWarFame =
        warLogEntries.length > 0 ? totalWarFame / warLogEntries.length : 0;

      return {
        name: entry.member.name,
        tag: entry.member.tag,
        donations: entry.member.donations ?? 0,
        currentTrophies,
        averageWarFame,
        currentWarFame: currentWarFameByTag.get(memberTag) ?? 0,
        winRate,
        countedBattles,
        trophyDelta,
        hoursSinceLastBattle,
      };
    });
  }, [memberBattleData, clanData?.tag, clanWarLog, currentClanWarParticipants]);

  const memberStatsWithMvp = useMemo(() => {
    if (memberStats.length === 0) return [];

    const fameValues = memberStats.map((member) => member.averageWarFame);
    const winRateValues = memberStats.map((member) => member.winRate ?? 0);
    const donationValues = memberStats.map((member) => member.donations);

    return memberStats.map((member) => {
      const normalizedFame = normalizeMinMax(member.averageWarFame, fameValues);
      const normalizedWinRate = normalizeMinMax(
        member.winRate ?? 0,
        winRateValues,
      );
      const normalizedDonations = normalizeMinMax(
        member.donations,
        donationValues,
      );
      const mvpScore =
        normalizedFame * 0.5 +
        normalizedWinRate * 0.3 +
        normalizedDonations * 0.2;

      return {
        ...member,
        mvpScore,
      };
    });
  }, [memberStats]);

  const mvpMember = useMemo<MvpMemberSummary | null>(() => {
    if (memberStatsWithMvp.length === 0) return null;

    const sortedByMvp = [...memberStatsWithMvp].sort((memberA, memberB) => {
      const scoreComparison = compareNumericValues(
        memberA.mvpScore,
        memberB.mvpScore,
        true,
      );

      if (scoreComparison !== 0) return scoreComparison;
      return memberA.name.localeCompare(memberB.name);
    });

    const topMember = sortedByMvp[0];

    return {
      name: topMember.name,
      tag: topMember.tag,
      mvpScore: topMember.mvpScore,
      averageWarFame: topMember.averageWarFame,
      winRate: topMember.winRate,
      donations: topMember.donations,
    };
  }, [memberStatsWithMvp]);

  const clanWarProgression = useMemo<ClanProgressPoint[]>(() => {
    if (!clanWarLog || !clanData) return [];

    const clanTagKey = normalizeTag(clanData.tag);

    return [...clanWarLog.items]
      .map((logEntry) => {
        const clanStanding = logEntry.standings.find(
          (standing) => normalizeTag(standing.clan.tag) === clanTagKey,
        );

        return {
          label: `S${logEntry.seasonId} W${logEntry.sectionIndex + 1}`,
          fame: clanStanding?.clan.fame ?? 0,
          placement: clanStanding?.rank ?? null,
        };
      })
      .reverse();
  }, [clanData, clanWarLog]);

  const clanWarTrophyProgression = useMemo<ClanTrophyPoint[]>(() => {
    if (!clanWarLog || !clanData) return [];

    const clanTagKey = normalizeTag(clanData.tag);

    const chronologicalEntries = [...clanWarLog.items]
      .map((logEntry) => {
        const clanStanding = logEntry.standings.find(
          (standing) => normalizeTag(standing.clan.tag) === clanTagKey,
        );

        return {
          label: `S${logEntry.seasonId} W${logEntry.sectionIndex + 1}`,
          trophyChange: clanStanding?.trophyChange ?? 0,
        };
      })
      .reverse();

    const totalChange = chronologicalEntries.reduce(
      (sum, entry) => sum + entry.trophyChange,
      0,
    );
    let runningTrophies = clanData.clanWarTrophies - totalChange;

    return chronologicalEntries.map((entry) => {
      runningTrophies += entry.trophyChange;

      return {
        label: entry.label,
        clanWarTrophies: runningTrophies,
        trophyChange: entry.trophyChange,
      };
    });
  }, [clanData, clanWarLog]);

  const averagePlacement = useMemo(() => {
    const placements = clanWarProgression
      .map((entry) => entry.placement)
      .filter((placement): placement is number => typeof placement === 'number');

    if (placements.length === 0) return null;

    const placementSum = placements.reduce((sum, placement) => sum + placement, 0);
    return placementSum / placements.length;
  }, [clanWarProgression]);

  const hasActiveClanWar =
    currentClanWar !== null && currentClanWar.periodType.toLowerCase() !== 'training';

  const currentWarRankings = useMemo<RankedCurrentWarMember[]>(() => {
    const rankedParticipants = buildCompetitionRanks(
      currentClanWarParticipants,
      (participant) => participant.fame,
      true,
      (participant) => participant.name,
    );

    return rankedParticipants.map((rankedParticipant) => ({
      rank: rankedParticipant.rank,
      name: rankedParticipant.item.name,
      tag: rankedParticipant.item.tag,
      fame: rankedParticipant.value,
    }));
  }, [currentClanWarParticipants]);

  const averageFameRankings = useMemo<RankedAverageFameMember[]>(() => {
    const rankedMembers = buildCompetitionRanks(
      memberStats,
      (member) => member.averageWarFame,
      true,
      (member) => member.name,
    );

    return rankedMembers.map((rankedMember) => ({
      rank: rankedMember.rank,
      name: rankedMember.item.name,
      tag: rankedMember.item.tag,
      averageFame: rankedMember.value,
    }));
  }, [memberStats]);

  const memberAwards = useMemo<MemberAward[]>(() => {
    const winrateAward = buildAwardPlacements(
      memberStats
        .filter((member) => member.countedBattles > 0 && member.winRate !== null)
        .map((member) => ({
          name: member.name,
          tag: member.tag,
          value: member.winRate ?? 0,
          scoreLabel: `${((member.winRate ?? 0) * 100).toFixed(1)}%`,
        })),
      true,
    );

    const donationsAward = buildAwardPlacements(
      memberStats.map((member) => ({
        name: member.name,
        tag: member.tag,
        value: member.donations,
        scoreLabel: `${member.donations}`,
      })),
      true,
    );

    const climbedAward = buildAwardPlacements(
      memberStats
        .filter(
          (member): member is MemberStats & { trophyDelta: number } =>
            member.trophyDelta !== null,
        )
        .map((member) => ({
          name: member.name,
          tag: member.tag,
          value: member.trophyDelta,
          scoreLabel: `${member.trophyDelta > 0 ? '+' : ''}${member.trophyDelta}`,
        })),
      true,
    );

    const hardstuckAward = buildAwardPlacements(
      memberStats
        .filter(
          (member): member is MemberStats & { trophyDelta: number } =>
            member.trophyDelta !== null && member.trophyDelta <= 0,
        )
        .map((member) => ({
          name: member.name,
          tag: member.tag,
          value: member.trophyDelta,
          scoreLabel: `${member.trophyDelta}`,
        })),
      false,
    );

    const ghostAward = buildAwardPlacements(
      memberStats.map((member) => ({
        name: member.name,
        tag: member.tag,
        value: member.hoursSinceLastBattle,
        scoreLabel: formatDurationFromHours(member.hoursSinceLastBattle),
      })),
      true,
    );

    return [
      {
        title: 'Highest Recent Winrate',
        placements: winrateAward,
        emptyMessage: 'No eligible battle log data found.',
      },
      {
        title: 'Most Recent Donations',
        placements: donationsAward,
        emptyMessage: 'No donation data found.',
      },
      {
        title: 'Most Climbed',
        placements: climbedAward,
        emptyMessage: 'No trophy climb data found.',
      },
      {
        title: 'Most Hardstuck',
        placements: hardstuckAward,
        emptyMessage: 'No hardstuck members found.',
      },
      {
        title: 'Ghost',
        placements: ghostAward,
        emptyMessage: 'No battle activity data found.',
      },
    ];
  }, [memberStats]);

  if (error) {
    return (
      <div className="clan-page clan-page--status">
        <p className="clan-page__status clan-page__status--error">Error: {error}</p>
        <Link className="clan-page__status-link" to="/">
          Back to Search
        </Link>
      </div>
    );
  }

  if (isLoading || !clanData || !clanWarLog || !currentClanWar) {
    return (
      <div className="clan-page clan-page--status">
        <div className="clan-page__loader" role="status" aria-live="polite">
          <div className="clan-page__throbber" aria-hidden="true">
            <span className="clan-page__throbber-ring" />
            <span className="clan-page__throbber-shield clan-page__throbber-shield--blue" />
            <span className="clan-page__throbber-shield clan-page__throbber-shield--green" />
            <span className="clan-page__throbber-shield clan-page__throbber-shield--red" />
          </div>

          <p className="clan-page__status">
            Analyzing {clanTag ? `clan #${clanTag}` : 'clan data'}...
          </p>
          <p className="clan-page__status-hint">
            this may take a sec
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="clan-page">
      <Link className="clan-page__back-link" to="/" aria-label="Back to Search">
        <span className="clan-page__back-icon" aria-hidden="true">
          ←
        </span>
      </Link>
      <ClanDetailsSection clanData={clanData} mvpMember={mvpMember} />
      <ClanWarProgressSection
        progression={clanWarProgression}
        trophyProgression={clanWarTrophyProgression}
        averagePlacement={averagePlacement}
      />
      <MemberPerformanceSection
        hasActiveClanWar={hasActiveClanWar}
        currentWarRankings={currentWarRankings}
        averageFameRankings={averageFameRankings}
      />
      <MemberAwardsSection awards={memberAwards} />
    </div>
  );
}
