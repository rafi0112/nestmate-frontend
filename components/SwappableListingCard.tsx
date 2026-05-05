'use client';
import { useState } from 'react';
import { Listing } from '@/lib/types';
import ListingCard from './ListingCard';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  listing: Listing;
  householdCard: React.ReactNode;
  onDelete?: (id: string) => void;
}

export default function SwappableListingCard({ listing, householdCard, onDelete }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="swappable-container">
      {/* Minimized state - click to expand */}
      <div
        className={`swappable-card ${isExpanded ? 'swappable-minimized' : 'swappable-active'}`}
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div className="swappable-preview">
          <div className="preview-image">
            <img
              src={listing.imageUrl || `https://picsum.photos/seed/${listing._id}/600/300`}
              alt={listing.title}
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${listing._id || 'default'}/600/300`;
              }}
            />
          </div>
          <div className="preview-info">
            <h3 className="preview-title">{listing.title}</h3>
            <p className="preview-location">{listing.location}</p>
            <p className="preview-price">৳{Number(listing.rentAmount).toLocaleString()}/mo</p>
          </div>
          <div className="preview-toggle">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </div>

      {/* Maximized state - full card details */}
      <div className={`swappable-card ${isExpanded ? 'swappable-active' : 'swappable-minimized'}`}>
        <div className="swappable-content">
          <ListingCard listing={listing} showActions onDelete={onDelete} />
          {householdCard}
          <button
            className="swappable-collapse-btn"
            onClick={() => setIsExpanded(false)}
          >
            <ChevronUp size={16} /> Collapse
          </button>
        </div>
      </div>
    </div>
  );
}
