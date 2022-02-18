interface StyleDetail {
  url: string;
  name: string;
  type?: 'satellite' | 'topographic' | 'hybrid';
}

export const groups = {
  CMap: ['cmap', 'cmapTerrain'],
  Clean: ['cleanLight', 'cleanDark'],
  Other: [
    'aerial',
    'road',
    'openStreetMap',
    'openTopoMap',
    'nasaGibsNight',
  ],
};

export interface CMapOption {
  label: string;
  type: 'checkbox' | 'number' | 'select',
  default: any,
  cmapId: number,
  value?: any;
}

export const cMapOptions = [
  {
    label: 'Show all depth contours',
    type: 'checkbox',
    default: true,
    cmapId: 43,
  },
  {
    label: 'Shallow depth contour (meters)',
    type: 'number',
    default: 2,
    cmapId: 0,
  },
  {
    label: 'Safety contour depth (meters)',
    type: 'number',
    default: 30,
    cmapId: 1,
  },
  {
    label: 'Deep contour depth (meters)',
    type: 'number',
    default: 30,
    cmapId: 2,
  },
  {
    label: 'Safety contour line',
    type: 'checkbox',
    default: true,
    cmapId: 16,
  },
  {
    label: 'Depth contour labels',
    type: 'checkbox',
    default: true,
    cmapId: 18,
  },
  {
    label: 'Soundings above shallow depth contour',
    type: 'checkbox',
    default: true,
    cmapId: 26,
  },
  {
    label: 'Soundings below safety depth',
    type: 'checkbox',
    default: true,
    cmapId: 17,
  },
  {
    label: 'Depth units',
    type: 'select',
    options: [{ value: 0, text: 'Metres' }, { value: 1, text: 'Feet' }, { value: 2, text: 'Fathoms' }, { value: 3, text: 'DecFathoms' }, { value: 4, text: 'Rounded feet' }],
    default: 0,
    cmapId: 34,
  },
  {
    label: 'Height units',
    type: 'select',
    options: [{ value: 0, text: 'Metres' }, { value: 1, text: 'Feet' }],
    default: 0,
    cmapId: 57,
  },
  {
    label: 'Range units',
    type: 'select',
    options: [{ value: 0, text: 'Nautical miles' }, { value: 1, text: 'Metres (or kilometres)' }, { value: 2, text: 'Yards (or kiloyards)' }, { value: 3, text: 'Statute miles' }],
    default: 0,
    cmapId: 58,
  },
  {
    label: 'Area labels',
    type: 'checkbox',
    default: false,
    cmapId: 22,
  },
  {
    label: 'Important labels',
    type: 'checkbox',
    default: true,
    cmapId: 8,
  },
  {
    label: 'City labels',
    type: 'checkbox',
    default: false,
    cmapId: 9,
  },
  {
    label: 'Light descriptions',
    type: 'checkbox',
    default: false,
    cmapId: 11,
  },
  {
    label: 'Show buoys and beacons with NOAA symbols',
    type: 'checkbox',
    default: false,
    cmapId: 61,
  },
  {
    label: 'Show sounding values',
    type: 'checkbox',
    default: true,
    cmapId: 62,
  },
  {
    label: 'Danger symbols for obstructions above safety contour',
    type: 'checkbox',
    default: true,
    cmapId: 14,
  },
  {
    label: 'Show white light icons as white',
    type: 'checkbox',
    default: true,
    cmapId: 66,
  },
] as CMapOption[];

/**
 * Typescript doesn't allow type aliases for object keys, so we write 'string'
 * when really we mean 'MapStyle'
 * */
/** @type {Object.<MapStyle, StyleDetail>} */
export default ({ cartoServerURL = '' }): { [key: string]: StyleDetail } => ({
  cmap: {
    url: 'https://cm0.stratumfive.com/tileservercmap/Tile.aspx?layer=cmap&x={x}&y={y}&zoom={z}',
    name: 'C-Map Standard',
    type: 'topographic',
  },
  cmapTerrain: {
    name: 'C-Map Terrain',
    url: 'https://cm0.stratumfive.com/tileservercmap/Tile.aspx?layer=terraincmap&x={x}&y={y}&zoom={z}',
    type: 'topographic',
  },
  aerial: {
    url: 'https://1.aerial.maps.cit.api.here.com/maptile/2.1/maptile/newest/hybrid.day/{z}/{x}/{y}/256/png8?app_id=TLHsx7aiHdOctoGoUfh0&app_code=fubSKWpwjaH5Z-3a9JQddQ',
    name: 'Aerial',
    type: 'satellite',
  },
  road: {
    url: 'https://1.base.maps.cit.api.here.com/maptile/2.1/maptile/newest/normal.day/{z}/{x}/{y}/256/png8?app_id=TLHsx7aiHdOctoGoUfh0&app_code=fubSKWpwjaH5Z-3a9JQddQ',
    name: 'Road',
    type: 'satellite',
  },
  openStreetMap: {
    url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    name: 'Open Street Map',
    type: 'topographic',
  },
  openTopoMap: {
    url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
    name: 'Open Topo Map',
    type: 'topographic',
  },
  esriWoldImagery: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    name: 'Esri World Imagery',
    type: 'satellite',
  },
  nasaGibsNight: {
    url: 'https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default//GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg',
    name: 'Earth at Night (NASA)',
    type: 'satellite',
  },
  cleanLight: {
    name: 'Light',
    url: `${cartoServerURL}/tile/256/{z}/{y}/{x}/png?layers=bg:fff;land:ffe5f0e5:ff4e4e4e`,
  },
  cleanDark: {
    name: 'Dark',
    url: `${cartoServerURL}/tile/256/{z}/{y}/{x}/png?layers=bg:000;land:32323c:41414b`,
  },
});
