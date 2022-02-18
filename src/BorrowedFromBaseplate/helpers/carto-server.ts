import dayjs, { Dayjs as DayjsDate } from 'dayjs';

enum EAisLabelType {
  None,
  VesselName,
  MMSI,
  Callsign,
  VesselType,
  Destination
}

enum ELayerName {
  trs = 'trs',
  density = 'density',
  ais = 'ais'
}


let layerName: ELayerName | string;
const kDensityLayerDateTimeFormat = 'YYYYMMDDHH';
const kAisLayerDateTimeFormat = 'YYYYMMDDHHmm';

// Cartoserver accepts a comma separated list of image formats,
// webp support is detected by cartoserver and the second format is the fallback format
// (for safari)
let imageFormat: string = 'webplossy,png' as 'webplossy,png' | 'webplossless,png' | 'png';

function createDensityLayer({ type, dates }: { type: string, dates: string[]}): string {
  // Density layers work as -> Vessel Type : Dates (months)
  const combinedDates: string = dates.length ? dates.join(',') : String(new Date().getFullYear());

  return `density:${type}:${combinedDates}`;
}

function createHistoricAISLayer(
  labelType: EAisLabelType,
  dateTime: string,
  selectedVessels: string[],
): string {
  // It gets the latest AIS position of the vessels within the given timeframe
  // (startDateTime, endDateTime)
  imageFormat = 'webplossless,png';

  const timezoneOffset = new Date(dayjs(dateTime).toISOString()).getTimezoneOffset();

  // start time and end time are required to get the latest position of the vessel
  const formattedStartDateTime: string = dayjs(dateTime).add(timezoneOffset, 'minute').format(kAisLayerDateTimeFormat);
  const formattedEndDateTime: string = dayjs(formattedStartDateTime).add(30, 'minute').format(kAisLayerDateTimeFormat);

  if (!selectedVessels.length) {
    return `evps-global-hist:${formattedStartDateTime}:${formattedEndDateTime}:${EAisLabelType[labelType]}:1:0%2c1%2c2`;
  }

  return `evps-hist-track:mmsi:${selectedVessels.join(',')}:${formattedStartDateTime}:${formattedEndDateTime}`;
}

/**
 * Used to get the date for an image. imageIndex is image index based on
 * current date. So 0 will be related to the current date where -1 would be
 * 3 hours before and 1 would be 3 hours after.
 */
export function getDateForImage(
  imageIndex: number,
  currentDateTime: string | DayjsDate | Date,
): DayjsDate {
  const date = dayjs(currentDateTime);
  const currentHour = date.hour();

  const availableHours = [0, 3, 6, 9, 12, 15, 18, 21];
  const { closestAvailableHour } = availableHours.reduce((obj, hour) => {
    const newdiff = Math.abs(currentHour - hour);
    if (newdiff < obj.diff) {
      return {
        diff: newdiff,
        closestAvailableHour: hour,
      };
    }
    return obj;
  }, { diff: Infinity, closestAvailableHour: 0 });

  const hour = closestAvailableHour + imageIndex * 3;

  const adjustedDate = date
    .set('hour', hour)
    .set('minute', 0)
    .set('second', 0);

  return adjustedDate;
}

/**
 * Get Image URL
 * Gets the cartoserver image url for multiple layers in one request
 */
export function getImageUrl(
  options: {
    layers: any[];
    date: DayjsDate;
    cartoServerUrl: string;
    dimensions: {
      width: number;
      height: number;
    };
    extent: number[];
    densityParameters?: {
      type: string;
      dates: string[];
    };
    isPlaying?: boolean
  },
): string | false {
  const {
    layers, date, cartoServerUrl, dimensions, extent, isPlaying = false,
  } = options;

  if (!date.isValid()) {
    console.warn('Invalid Date', date);
  }

  if (!layers.length) {
    console.warn('No Layers Selected');
    return false;
  }

  const parts: string[] = layers.map(({
    key, imagePrefix, dateFormat, omitDate, labelType = EAisLabelType.None, dateTime = '', selectedVessels = [],
  }: {
    key: string
    imagePrefix: string
    dateFormat: string
    omitDate: boolean
    labelType: EAisLabelType
    dateTime: string,
    selectedVessels: string[]
  }) => {
    let formattedDate: string = omitDate
      ? ''
      : date.format(dateFormat || kDensityLayerDateTimeFormat);

    layerName = key;

    if (formattedDate) {
      formattedDate = (layerName === ELayerName.trs || layerName === ELayerName.ais)
        ? `:${formattedDate}`
        : `:hidedate:${formattedDate}`;
    }

    // TODO add this functionality to the weather overlay definition so it can
    // be handled for all metrics in a generic way
    if (layerName === ELayerName.trs) {
      // TRS options are not optional
      // FillColor : OutlineColour : OutlineWidth : ZoomLevel
      // See https://cs.stratumfive.com/config/painters
      layerName = 'trs:15bd173d:9400D3:0.5:2';
    }

    if (layerName === ELayerName.density && options.densityParameters) {
      layerName = createDensityLayer(options.densityParameters);
    }

    // Show historic ais layer only when not playing the timeline and dateTime is provided
    if (
      layerName === ELayerName.ais
      && labelType !== EAisLabelType.None
      && dateTime
      && (!isPlaying || selectedVessels.length)
    ) {
      layerName = createHistoricAISLayer(
        labelType,
        date.format(kAisLayerDateTimeFormat),
        selectedVessels,
      );

      return `${imagePrefix || ''}${layerName}`;
    }

    // e.g 's3llg:precipitation:2019010212'
    return `${imagePrefix || ''}${layerName}${formattedDate}`;
  });

  if (layers.some((layer) => layer.type === 'sea' && layer.style === 'gradient')) {
    // Some sea layers overflow onto the land. This helps tidy that up a bit. Ideally we
    // could make the land transparent so you only see the map below but thats not possible
    parts.push('land:fff:fff');
  }

  // Block the other ais layers (non-historic) from loading when the board timeline is playing
  if (isPlaying && parts.includes(ELayerName.ais)) {
    return false;
  }

  // Find AIS layer and move it to the front to be visible on top of other layers
  const aisLayerIndex = parts.findIndex((part) => part.includes('evps-global-hist'));

  if (parts.length > 1 && aisLayerIndex !== parts.length) {
    parts.push(parts.splice(aisLayerIndex, 1)[0]);
  }

  const url = {
    domain: `${cartoServerUrl}/chart/`,
    size: `${dimensions.width},${dimensions.height}/`,
    position: `smc:${extent[0]},${extent[1]},${extent[2]},${extent[3]}/`,
    layers: `${imageFormat}?layers=${parts.join(';')}`,
  };

  return Object.values(url).join('');
}
