import { MetadataId, MetricValue, Vessel } from '@stratumfive/ui-baseplate/src/types';

export interface MapVessel {
  metadataId: MetadataId;
  name: Vessel['name'];
  mmsi?: number;
  callsign?: string;
  type?: string;
  destination?: string;
  hasSsasAlert?: Vessel['hasSsasAlert'];
  position: {
    lat: number;
    lon: number;
  };
  course: number;
  timestamp: number;
  color?: string;
  selected?: boolean;
}

// The data we emit when a vessel marker is clicked
export interface SMapVesselClick {
  vesselId: number;
  course: number | null;
  timestamp: number;
  route: LatLon;
}

export interface MapPointIcon {
  src: string;
  size: [number, number];
  anchor?: [number, number];
  scale?: number;
  zIndex?: number;
}

export interface MapPoint {
  metadataId: number | string;
  position: {
    lat: number;
    lon: number;
  }
  active?: boolean;
  iconSet?: {
    default: MapPointIcon;
    hover?: MapPointIcon;
    active?: MapPointIcon;
  }
}

export type WeatherOverlay =
  'flat-surface-current-speed'
 | 'flat-sig-wave-height'
 | 'flat-precip-in-3hrs'
 | 'flat-precip-in-6hrs'
 | 'flat-precip-in-12hrs'
 | 'flat-relative-humidity'
 | 'flat-wind-speed'
 | 'flat-visibility'
 | 'wind-wave-height'
 | 'wind-wave-period'
 | 'wind-wave-direction'
 | 'swell-height'
 | 'swell-period'
 | 'swell-direction'
 | 'surface-currents'
 | 'air-pressure'
 | 'wind-speed-at-10m'
 | 'wind-barbs'
 | 'relative-humidity'
 | 'surface-temp'
 | 'air-temp-at-2m'
 | 'cloud-cover'
 | '1000-500mb-thickness'
 | 'precipitation'
 | 'ice-cover'
 | 'iceedge'
 | 'icebergs'
 | 'visibility';

export interface ControlsToggle {
  type: string;
  text: string;
  icon: string;
}

export type MapStyle =
  'cmap'
  | 'cmapTerrain'
  | 'openStreetMap'
  | 'cartoDbDarkMatter'
  | 'openTopoMap'
  | 'esriWoldImagery'
  | 'nasaGibsNight'
  | 'weather'
  | 'cleanLight'
  | 'cleanDark';

export interface LatLon {
  lat: number;
  lon: number;
}

export interface Port {
  name: string;
  location: LatLon;
  id: string;
}

export interface ContextMenuItem {
  name: string;
  handler: void;
}

/**
 * Single vessel's position from metrics
 */
export interface PositionMetric extends MetricValue {
  value: LatLon
}

/**
 * Positions of the vessel
 */
export type Positions = [PositionMetric];

/**
 * Type for handling ais positions.
 */
export type AisPositionType = 'current' | 'historic';
