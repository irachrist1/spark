'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { SchoolCard } from '@/components/SchoolCard';

const SCHOOL_TYPES = [
  { label: 'All', value: 'all' },
  { label: 'University', value: 'university' },
  { label: 'Technical College', value: 'technical_college' },
  { label: 'Vocational School', value: 'vocational_school' },
  { label: 'Training Center', value: 'training_center' },
  { label: 'Online Platform', value: 'online_platform' },
] as const;

const TIERS = [
  { label: 'All Tiers', value: 'all' },
  { label: 'Featured', value: 'featured' },
  { label: 'Partner', value: 'partner' },
  { label: 'Listed', value: 'listed' },
] as const;

export default function SchoolsPage() {
  const [careerId, setCareerId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<(typeof SCHOOL_TYPES)[number]['value']>('all');
  const [tierFilter, setTierFilter] = useState<(typeof TIERS)[number]['value']>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCareerId(params.get('careerId'));
  }, []);

  const schools = useQuery(api.schools.listPublic, {
    ...(typeFilter === 'all' ? {} : { type: typeFilter }),
    ...(careerId ? { careerId: careerId as Id<'careers'> } : {}),
  });

  const filteredSchools = useMemo(() => {
    if (!schools) return [];

    return schools.filter((school) => {
      const matchesTier = tierFilter === 'all' || school.partnershipTier === tierFilter;
      const query = search.trim().toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        school.name.toLowerCase().includes(query) ||
        school.location.city.toLowerCase().includes(query) ||
        school.programsOffered.some((program) => program.name.toLowerCase().includes(query));

      return matchesTier && matchesSearch;
    });
  }, [schools, tierFilter, search]);

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <Link href="/careers" className="text-sm font-bold text-gray-600 hover:text-black">
            ← Back to Careers
          </Link>
          <h1 className="text-4xl md:text-5xl font-black mt-3 mb-3">Schools & Training Options</h1>
          <p className="text-lg font-bold text-gray-700">
            Explore Rwanda institutions connected to career pathways.
          </p>
          {careerId && (
            <p className="text-sm font-bold text-brutal-blue mt-2">
              Showing recommendations related to your selected career.
            </p>
          )}
        </div>

        <div className="bg-white border-3 border-black shadow-brutal p-4 md:p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-black text-xs uppercase mb-2">Search</label>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full px-3 py-2 border-2 border-black font-bold"
                placeholder="School, city, or program"
              />
            </div>
            <div>
              <label className="block font-black text-xs uppercase mb-2">School Type</label>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as (typeof SCHOOL_TYPES)[number]['value'])}
                className="w-full px-3 py-2 border-2 border-black font-bold"
              >
                {SCHOOL_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-black text-xs uppercase mb-2">Partnership Tier</label>
              <select
                value={tierFilter}
                onChange={(event) => setTierFilter(event.target.value as (typeof TIERS)[number]['value'])}
                className="w-full px-3 py-2 border-2 border-black font-bold"
              >
                {TIERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {schools === undefined ? (
          <div className="text-center py-10 font-bold">Loading schools...</div>
        ) : filteredSchools.length === 0 ? (
          <div className="bg-white border-3 border-black shadow-brutal p-8 text-center">
            <h2 className="text-2xl font-black mb-2">No schools found</h2>
            <p className="font-bold text-gray-700">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <>
            <p className="font-bold text-gray-700 mb-4">{filteredSchools.length} schools found</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredSchools.map((school) => (
                <SchoolCard key={school._id} school={school} compact={false} showCTA={true} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
