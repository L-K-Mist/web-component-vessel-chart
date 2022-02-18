import { Map as MapInterface } from 'ol';
import { Vector as VectorSource } from 'ol/source';
import { Positions } from '../SMap.interface';
import { datelineFix } from './datelineFix';

/**
 * Zoom the map to fit a single vessel's route.
 * @param mapInstance OpenLayers map instance
 * @param positions Vessel's positions from metrics
 * @param zoomPadding Optional padding (in pixels) to be cleared inside the view.
 */
export default function (
  mapInstance: MapInterface,
  positions: Positions,
  zoomPadding: Number = 280, // Adjusted from 200 to 280.
  // This is to better include the whole ship's journey,
  // eliminating edge cases where some of the journey is out of view.
  // The higher this number is, the more likely it is that the chart-view
  // will zoom out more. Lower numbers mean that the view will more tightly
  // zoom in to the route, but increases the likelihood that part of the
  // route is cut out of the view.
): void {
  const points = positions.map((position) => {
    const { lon, lat } = position.value;
    return [lon, lat];
  });

  const lineSource = new VectorSource();
  const lineFeature = datelineFix(points);
  lineSource.addFeature(lineFeature);

  mapInstance.getView().fit(lineSource.getExtent(), {
    padding: Array(4).fill(zoomPadding),
  });
}
