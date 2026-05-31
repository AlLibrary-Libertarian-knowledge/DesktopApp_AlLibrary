/** Legacy community network types for unused P2P helpers. */

export interface CommunityNetwork {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface NetworkParticipation {
  [key: string]: unknown;
}

export interface JoinNetworkRequest {
  networkId: string;
  [key: string]: unknown;
}
