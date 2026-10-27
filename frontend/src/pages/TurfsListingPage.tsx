import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search, MapPin, Star, Heart, Filter,
  ArrowUpDown, SlidersHorizontal, CheckCircle2
} from 'lucide-react';
import { Turf } from '../types';
import { api } from '../services/api';

export const TurfsListingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);

  const initialLocation = searchParams.get('location') || 'All';
  const initialSport = searchParams.get('sport') || 'All';
  const initialSearch = searchParams.get('search') || '';

  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [selectedSport, setSelectedSport] = useState(initialSport);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [maxPrice, setMaxPrice] = useState<number>(3000);
  const [sortBy, setSortBy] = useState<'rating' | 'price_low' | 'price_high'>('rating');
  const [favorites, setFavorites] = useState<number[]>([]);

  const fetchTurfs = async () => {
    setLoading(true);
    try {
      const data = await api.getTurfs({
        location: selectedLocation !== 'All' ? selectedLocation : undefined,
        sport: selectedSport !== 'All' ? selectedSport : undefined,
        search: searchQuery || undefined,
        max_price: maxPrice < 3000 ? maxPrice : undefined,
      });
      setTurfs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTurfs();
  }, [selectedLocation, selectedSport, maxPrice]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTurfs();
  };

  const toggleFavorite = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Sort turfs
  const sortedTurfs = [...turfs].sort((a, b) => {
    if (sortBy === 'rating') return Number(b.rating) - Number(a.rating);
    if (sortBy === 'price_low') return Number(a.hourly_base_price) - Number(b.hourly_base_price);
    if (sortBy === 'price_high') return Number(b.hourly_base_price) - Number(a.hourly_base_price);
    return 0;
  });

  const sportsList = ['All', 'Football', 'Box Cricket', 'Futsal', 'Badminton'];
  const locationsList = ['All', 'HSR', 'Whitefield', 'Koramangala', 'Indiranagar'];

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Title & Breadcrumb */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-[#111827]">
            Explore Sports Turfs
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Book verified turf pitches in Bangalore with live slot availability and dynamic pricing.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-soft border border-gray-200/80 mb-8 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search turf name, area, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#166534] focus:bg-white"
              />
            </div>

            {/* Location Selector */}
            <div className="w-full md:w-52">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#166534]"
              >
                {locationsList.map(loc => (
                  <option key={loc} value={loc}>Location: {loc}</option>
                ))}
              </select>
            </div>

            {/* Sort selector */}
            <div className="w-full md:w-52">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#166534]"
              >
                <option value="rating">Sort: Highest Rated</option>
                <option value="price_low">Sort: Price (Low to High)</option>
                <option value="price_high">Sort: Price (High to Low)</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-[#166534] hover:bg-[#064E3B] text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              Filter
            </button>
          </form>

          {/* Sport Pills & Price Filter */}
          <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-gray-500 mr-1">Sport:</span>
              {sportsList.map(sp => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => setSelectedSport(sp)}
                  className={`px-3 py-1.5 rounded-full font-medium transition-all ${
                    selectedSport === sp
                      ? 'bg-[#166534] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {sp}
                </button>
              ))}
            </div>

            {/* Price Slider */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-gray-500 whitespace-nowrap">Max Price: <strong className="text-gray-900">₹{maxPrice}/hr</strong></span>
              <input
                type="range"
                min="800"
                max="3000"
                step="100"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-28 sm:w-36 accent-[#166534] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Turf Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="bg-white rounded-2xl p-4 border border-gray-200 animate-pulse">
                <div className="h-44 bg-gray-200 rounded-xl mb-4" />
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="h-8 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : sortedTurfs.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 max-w-lg mx-auto my-12">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No Turfs Found</h3>
            <p className="text-sm text-gray-500 mt-1 mb-6">
              We couldn't find any turfs matching your selected filters. Try adjusting your location or sports filter.
            </p>
            <button
              onClick={() => {
                setSelectedLocation('All');
                setSelectedSport('All');
                setSearchQuery('');
                setMaxPrice(3000);
              }}
              className="px-5 py-2.5 bg-[#166534] text-white text-xs font-bold rounded-xl"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedTurfs.map((turf) => {
              const isFav = favorites.includes(turf.id);
              return (
                <div
                  key={turf.id}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-200/90 shadow-soft hover:shadow-card transition-all duration-300 flex flex-col group"
                >
                  {/* Card Image */}
                  <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                    <img
                      src={turf.main_image}
                      alt={turf.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1529900245534-47fbf02a4b5b?auto=format&fit=crop&w=600&q=80";
                      }}
                    />
                    <button
                      onClick={(e) => toggleFavorite(turf.id, e)}
                      aria-label="Favorite"
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors shadow-sm"
                    >
                      <Heart
                        className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-white'}`}
                      />
                    </button>
                    {/* Sports Tags */}
                    <div className="absolute bottom-2.5 left-3 flex flex-wrap gap-1">
                      {turf.sports?.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 backdrop-blur-sm text-white">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-[#166534] transition-colors line-clamp-1">
                        {turf.name}
                      </h3>
                      
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{turf.location}</span>
                      </div>

                      <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-gray-700">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span>{turf.rating}</span>
                        <span className="text-gray-400 font-normal">({turf.review_count} reviews)</span>
                      </div>

                      <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                        {turf.tagline || turf.description}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-gray-400 block font-normal">Starts at</span>
                        <span className="text-lg font-black text-gray-900">
                          ₹{Math.round(turf.hourly_base_price).toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500 font-normal"> / hr</span>
                      </div>

                      <Link
                        to={`/turfs/${turf.id}`}
                        className="px-5 py-2.5 rounded-xl bg-[#166534] hover:bg-[#064E3B] text-white text-xs font-bold transition-all shadow-sm hover:shadow active:scale-95 flex items-center gap-1.5"
                      >
                        Book Slots
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
