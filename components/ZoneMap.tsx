"use client";

import Map, { Layer, Popup, Source } from "react-map-gl/maplibre";
import { useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

type ZoneMapProps = {
  geojson: Record<string, unknown> | null;
  selectedZoneId?: number | null;
};

export function ZoneMap({ geojson, selectedZoneId }: ZoneMapProps) {
  const [hover, setHover] = useState<{ longitude: number; latitude: number; properties: Record<string, unknown> } | null>(null);
  if (!geojson) {
    return <div className="ui-empty rounded-md p-8 text-center text-sm">Zone GeoJSON is not available. Run the downloader with zone GeoJSON enabled.</div>;
  }
  return (
    <div className="h-[640px] overflow-hidden rounded-lg border border-app-border shadow-sm">
      <Map
        initialViewState={{ longitude: -73.92, latitude: 40.72, zoom: 9.5 }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        style={{ width: "100%", height: "100%" }}
        interactiveLayerIds={["taxi-zones-fill"]}
        onMouseMove={(event) => {
          const feature = event.features?.[0];
          if (!feature) return;
          setHover({ longitude: event.lngLat.lng, latitude: event.lngLat.lat, properties: feature.properties as Record<string, unknown> });
        }}
        onMouseLeave={() => setHover(null)}
        onClick={(event) => {
          const feature = event.features?.[0];
          const locationId = feature?.properties?.locationid;
          if (!locationId) return;
          const next = new URL(window.location.href);
          next.searchParams.set("zoneId", String(locationId));
          window.location.href = `${next.pathname}${next.search}`;
        }}
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
          <Layer
            id="taxi-zones-selected"
            type="line"
            filter={selectedZoneId ? ["==", ["to-number", ["get", "locationid"]], selectedZoneId] as never : ["==", ["get", "locationid"], "__none__"] as never}
            paint={{
              "line-color": "#0f172a",
              "line-width": 3,
            }}
          />
        </Source>
        {hover ? (
          <Popup longitude={hover.longitude} latitude={hover.latitude} closeButton={false} closeOnClick={false} offset={12}>
            <div className="min-w-40 text-xs">
              <div className="font-semibold text-app-text-primary">{String(hover.properties.zone ?? hover.properties.zone_name ?? "Taxi zone")}</div>
              <div className="text-app-text-secondary">Trips: {String(hover.properties.trip_count ?? 0)}</div>
              <div className="text-app-text-secondary">Revenue: ${String(hover.properties.total_revenue ?? 0)}</div>
            </div>
          </Popup>
        ) : null}
      </Map>
    </div>
  );
}
