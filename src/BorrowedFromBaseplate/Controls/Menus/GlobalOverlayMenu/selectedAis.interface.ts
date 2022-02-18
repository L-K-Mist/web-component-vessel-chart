export interface SearchVesselResult {
  name: string;
  mmsi: number;
  imo: number;
  time: string;
  type: string;
  latitude: string;
  longitude: string;
  destination: string;
  callsign?: string;
  cog?: string;
  sog?: number;
  eta: string;
  heading?: number;
  navigationStatus: string;
}
