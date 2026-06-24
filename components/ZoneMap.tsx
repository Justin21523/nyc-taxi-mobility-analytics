"use client";

import Map, { Layer, Source } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

type ZoneMapProps = {
  geojson: Record<string, unknown> | null;
};

export function ZoneMap({ geojson }: ZoneMapProps) {
  if (!geojson) {
    return <div className="rounded-md border border-dashed border-slate-300 p-8 text-sm text-slate-600">Zone GeoJSON is not available. Run the downloader with zone GeoJSON enabled.</div>;
  }
  return (
    <div className="h-[640px] overflow-hidden rounded-lg border border-slate-200">
      <Map
        initialViewState={{ longitude: -73.92, latitude: 40.72, zoom: 9.5 }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        style={{ width: "100%", height: "100%" }}
      >
        <Source id="taxi-zones" type="geojson" data={geojson}>
          <Layer
            id="taxi-zones-fill"
            type="fill"
            paint={{
              "fill-color": [
                "rgba",
                ["at", 0, ["get", "fill_color"]],
                ["at", 1, ["get", "fill_color"]],
                ["at", 2, ["get", "fill_color"]],
                0.65,
              ] as never,
              "fill-outline-color": "#475569",
            }}
          />
        </Source>
      </Map>
    </div>
  );
}
