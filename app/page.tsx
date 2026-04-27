import { getListings } from "@/lib/api";
import HomeClient from "@/components/HomeClient";

export default async function HomePage() {
  let listings = [];
  try { listings = await getListings(); } catch {}
  return <HomeClient listings={listings} />;
}
