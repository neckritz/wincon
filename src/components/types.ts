export interface ClanResponse {
  tag: string;
  name: string;
  description: string;
  type: string;
  clanScore: number;
  clanWarTrophies: number;
  requiredTrophies: number;
  donationsPerWeek: number;
  members: number;
}

export interface ClanMember {
  tag: string;
  name: string;
  role: string;
  expLevel: number;
  trophies: number;
  donations: number;
  donationsReceived: number;
  clanRank: number;
  previousClanRank: number;
}

export interface ClanMembersResponse {
  items: ClanMember[];
}

export interface PlayerResponse {
  tag: string;
  name: string;
  trophies: number;
}

export interface BattleLogTeamMember {
  tag?: string;
  name?: string;
  crowns?: number;
  startingTrophies?: number;
}

export interface BattleLogEntry {
  type?: string;
  battleTime?: string;
  team?: BattleLogTeamMember[];
  opponent?: BattleLogTeamMember[];
}

export interface ClanWarClan {
  tag: string;
  name: string;
  fame: number;
  repairPoints: number;
  participants?: ClanWarParticipant[] | number;
}

export interface ClanWarStanding {
  rank: number;
  trophyChange: number;
  clan: ClanWarClan;
}

export interface ClanWarLogItem {
  seasonId: number;
  sectionIndex: number;
  standings: ClanWarStanding[];
  createdDate: string;
}

export interface ClanWarLogResponse {
  items: ClanWarLogItem[];
}

export interface CurrentClanWarResponse {
  state: string;
  sectionIndex: number;
  periodType: string;
  clan?: CurrentClanWarClan;
  clans?: CurrentClanWarClan[];
}

export interface ClanWarParticipant {
  tag: string;
  name: string;
  fame: number;
  repairPoints: number;
  boatAttacks: number;
  decksUsed: number;
  decksUsedToday: number;
}

export interface CurrentClanWarClan {
  tag: string;
  name: string;
  fame: number;
  repairPoints: number;
  participants?: ClanWarParticipant[];
}
