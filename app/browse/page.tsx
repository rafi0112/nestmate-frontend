import { getListings } from "@/lib/api";
import BrowseClient from "@/components/BrowseClient";

export default async function BrowsePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  let listings = [];
  try { listings = await getListings(); } catch {}
  return <BrowseClient listings={listings} initialQuery={q || ''} />;
}
