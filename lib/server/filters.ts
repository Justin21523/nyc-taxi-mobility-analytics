import { z } from "zod";

export const filterSchema = z.object({
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  pickupBorough: z.string().optional().nullable(),
  dropoffBorough: z.string().optional().nullable(),
  paymentType: z.string().optional().nullable(),
  airportOnly: z.coerce.boolean().optional().default(false),
  minDistance: z.coerce.number().optional().default(0),
  datasetId: z.string().regex(/^[a-z0-9-]+$/).optional().nullable(),
});

export type Filters = z.infer<typeof filterSchema>;

export function parseFilters(searchParams: URLSearchParams): Filters {
  return filterSchema.parse({
    startDate: searchParams.get("startDate"),
    endDate: searchParams.get("endDate"),
    pickupBorough: searchParams.get("pickupBorough"),
    dropoffBorough: searchParams.get("dropoffBorough"),
    paymentType: searchParams.get("paymentType"),
    airportOnly: searchParams.get("airportOnly") ?? undefined,
    minDistance: searchParams.get("minDistance") ?? undefined,
    datasetId: searchParams.get("datasetId"),
  });
}

export function filteredFrom(filters: Filters): { fromSql: string; params: Record<string, unknown> } {
  const clauses: string[] = [];
  const params: Record<string, unknown> = {};
  if (filters.startDate) {
    clauses.push("CAST(t.pickup_datetime AS DATE) >= $startDate");
    params.startDate = filters.startDate;
  }
  if (filters.endDate) {
    clauses.push("CAST(t.pickup_datetime AS DATE) <= $endDate");
    params.endDate = filters.endDate;
  }
  if (filters.pickupBorough && filters.pickupBorough !== "All") {
    clauses.push("p.borough = $pickupBorough");
    params.pickupBorough = filters.pickupBorough;
  }
  if (filters.dropoffBorough && filters.dropoffBorough !== "All") {
    clauses.push("d.borough = $dropoffBorough");
    params.dropoffBorough = filters.dropoffBorough;
  }
  if (filters.paymentType && filters.paymentType !== "All") {
    clauses.push("CAST(t.payment_type AS VARCHAR) = $paymentType");
    params.paymentType = filters.paymentType;
  }
  if (filters.airportOnly) {
    clauses.push("(p.service_zone = 'Airport' OR d.service_zone = 'Airport')");
  }
  if (filters.minDistance && filters.minDistance > 0) {
    clauses.push("t.trip_distance >= $minDistance");
    params.minDistance = filters.minDistance;
  }
  const whereSql = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const tripsTable = filters.datasetId ? `uploaded_trips_${filters.datasetId.replaceAll("-", "_")}` : "trips";
  return {
    fromSql: `
      FROM ${tripsTable} t
      JOIN zones p ON t.pickup_location_id = p.location_id
      JOIN zones d ON t.dropoff_location_id = d.location_id
      ${whereSql}
    `,
    params,
  };
}
