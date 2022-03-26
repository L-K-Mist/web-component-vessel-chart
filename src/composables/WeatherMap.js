import { ref, onMounted, watch, computed } from "vue";

import TileGrid from "ol/tilegrid/TileGrid";
import "ol/ol.css";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import Layer from "ol/layer/Layer";
import XYZ from "ol/source/XYZ";
import { toLonLat, fromLonLat } from "ol/proj";
import { getBottomRight } from "ol/extent";
import { defaults as defaultInteractions } from "ol/interaction";

const BASE_URL = "https://cs.stratumfive.com/tile/256/{z}/{y}/{x}/png";

export function useMap(
  mapContainer
  // tileLoadFunctionTerrain,
  // tileLoadFunctionWeather
) {
  const map = ref(null);

  const center = ref([40, 40]);
  const projection = ref("EPSG:4326");
  const zoom = ref(1);
  const rotation = ref(0);
  const source = ref(null);
  const weatherSource = ref(null);
  const weatherLayer = ref(null);
  const terrainLayer = ref(null);

  // const vesselMap = ref(null);
  const trsDate = ref(2021102505);
  // trs2:2021102617::::
  // "?layers=trs:15bd173d:9400D3:0.5:2:"
  const trsQuery = computed(() => `?layers=trs2:${trsDate.value}::::`); // without the date at the end like 2021102514
  const trsUrl = computed(() => `${BASE_URL}${trsQuery.value}`);

  watch(trsUrl, async (newUrl) => {
    console.log("dvdb - watch - newUrl", newUrl);
    weatherSource.value.setUrl(newUrl);
  });

  onMounted(() => {
    // source.value.source.setTileLoadFunction(tileLoadFunctionTerrain);
    source.value = new XYZ({
      // Hardcoded use of cartoserver for terrain,
      // because cors issues with existing cmap provider with this approach.
      url: "https://cs.stratumfive.com/tile/256/{z}/{y}/{x}/png?layers=cmap",
      // tileLoadFunction: tileLoadFunctionTerrain,
    });
    terrainLayer.value = new TileLayer({
      source: source.value,
    });
    // weatherSource.value.source.setTileLoadFunction(tileLoadFunctionWeather);
    weatherSource.value = new XYZ({
      // Hardcoded use of cartoserver for terrain,
      url: trsUrl.value,
      // tileLoadFunction: tileLoadFunctionWeather,
    });
    weatherLayer.value = new TileLayer({
      source: weatherSource.value,
    });

    map.value = new Map({
      target: mapContainer.value,
      layers: [terrainLayer.value, weatherLayer.value],
      view: new View({
        center: center.value,
        zoom: zoom.value,
      }),
      controls: [],
    });
    // EXAMPLES :
    // weatherSource.value.setUrl(trsUrl.value);
    // weatherSource.value.source.tileSize = 512;
    // weatherSource.value.source.tmpSize = [512, 512];
    // weatherSource.value.source.tilePixelRatio_ = 2;
    // console.log("dvdb - onMounted - map.value.map", map.value);
    // const tileGrid = new TileGrid({
    //   minZoom: 6,
    //   extent: map.value.map.getExtent(),
    //   resolutions: map.value.map.getResolutions().slice(1),
    //   tileSize: [512, 512],
    // });
    // weatherSource.value.source.setTileGrid(tileGrid);

    // Render Layer experiment:
    map.value.addLayer(
      new Layer({
        render: function (frameState) {
          // TODO Bring back later solution: The SVG Viewbox Approach.

          // console.log("dvdb - onMounted - frameState", frameState);
          // const scale = svgResolution / frameState.viewState.resolution;
          // const center = frameState.viewState.center;
          // const size = frameState.size;
          // const cssTransform = composeCssTransform(
          //   size[0] / 2,
          //   size[1] / 2,
          //   scale,
          //   scale,
          //   frameState.viewState.rotation,
          //   -center[0] / svgResolution - width / 2,
          //   center[1] / svgResolution - height / 2
          // );
          // svgContainer.style.transform = cssTransform;
          // svgContainer.style.opacity = this.getOpacity();
          // return svgContainer;
          return null;
        },
      })
    );
  });
  return map;
}
