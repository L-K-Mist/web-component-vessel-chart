/* eslint-disable */

/**
 * Works out if a track crosses the dateline (antimeridian line) and splits it in to 2 tracks
 * Fixes issue where the track line goes the wrong way around the globe, resulting in a horizontal
 * line across the map
 * Code taken from stack overflow.... https://stackoverflow.com/a/54572737/3098555
 * @param points
 */

import MultiLineString from 'ol/geom/MultiLineString';
import { Feature } from 'ol';
import { Geometry } from 'ol/geom';

type Point = number[]; // [lon, lat]

export const datelineFix = (points: Point[]): Feature<Geometry> => {
  var pointsSplitted = [] as Point[];
  var pointsArray = [] as Point[][];
  pointsSplitted.push(points[0]);
  var lastLambda = points[0][0];

  for (var i = 1; i < points.length; i++) {
    var lastPoint = points[i - 1];
    var nextPoint = points[i];
    if (Math.abs(nextPoint[0] - lastLambda) > 180) {
      var deltaX = xToValueRange(nextPoint[0] - lastPoint[0]);
      var deltaY = nextPoint[1] - lastPoint[1];
      var deltaXS = xToValueRange(180 - nextPoint[0]);
      var deltaYS;
      if (deltaX === 0) {
        deltaYS = 0;
      } else {
        deltaYS = (deltaY / deltaX) * deltaXS;
      }
      var sign = lastPoint[0] < 0 ? -1 : 1;
      pointsSplitted.push([180 * sign, nextPoint[1] + deltaYS]);
      pointsArray.push(pointsSplitted);
      pointsSplitted = [];
      pointsSplitted.push([-180 * sign, nextPoint[1] + deltaYS]);
    }
    pointsSplitted.push(nextPoint);
    lastLambda = nextPoint[0];
  }

  pointsArray.push(pointsSplitted);
  var geom = new MultiLineString(pointsArray);

  // Transform from one lat/long format to another
  // https://openlayers.org/en/latest/apidoc/module-ol_geom_MultiLineString-MultiLineString.html#transform
  geom.transform("EPSG:4326", "EPSG:3857");

  return new Feature({
    geometry: geom,
  });
};

function xToValueRange(x) {
  if (Math.abs(x) > 180) {
    var sign = x < 0 ? -1 : 1;
    return x - 2 * 180 * sign;
  } else {
    return x;
  }
}
