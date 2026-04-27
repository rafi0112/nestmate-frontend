import { getListing, getListings } from "@/lib/api";
import ListingDetailClient from "@/components/ListingDetailClient";
import { notFound } from "next/navigation";

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let listing = null;
  let allListings = [];
  try {
    listing = await getListing(id);
    allListings = await getListings();
  } catch { }
  if (!listing) return notFound();
  const similar = allListings.filter((l: { _id: string; location?: string }) => l._id !== id && l.location === listing.location).slice(0, 3);
  return <ListingDetailClient listing={listing} similar={similar} />;
}
