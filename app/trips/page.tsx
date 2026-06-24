import { SimpleTable } from "@/components/Charts";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { filtersFromSearchParams, type SearchParams } from "@/lib/server/pageFilters";
import { tripSearch } from "@/lib/server/queries";

export default async function TripsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters = await filtersFromSearchParams(Promise.resolve(params));
  const rows = await tripSearch(filters, {
    limit: Number(params.limit ?? 100),
    pickupZone: typeof params.pickupZone === "string" ? params.pickupZone : null,
    dropoffZone: typeof params.dropoffZone === "string" ? params.dropoffZone : null,
    minFare: params.minFare ? Number(params.minFare) : null,
    maxFare: params.maxFare ? Number(params.maxFare) : null,
    sortBy: typeof params.sortBy === "string" ? params.sortBy : "pickup_datetime",
    sortDir: typeof params.sortDir === "string" ? params.sortDir : "desc",
  });
  return (
    <>
      <PageHeader title="Trip Explorer" subtitle="Sortable trip-level sample with the global filters applied." filters={filters} />
      <Section title="Trips">
        <SimpleTable rows={rows} />
      </Section>
    </>
  );
}

