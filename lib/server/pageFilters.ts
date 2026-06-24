import { filterSchema, Filters } from "./filters";

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function filtersFromSearchParams(searchParams: SearchParams): Promise<Filters> {
  const params = await searchParams;
  return filterSchema.parse({
    startDate: first(params.startDate),
    endDate: first(params.endDate),
    pickupBorough: first(params.pickupBorough),
    dropoffBorough: first(params.dropoffBorough),
    paymentType: first(params.paymentType),
    airportOnly: first(params.airportOnly),
    minDistance: first(params.minDistance),
  });
}

