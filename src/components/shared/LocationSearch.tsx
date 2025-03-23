import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, MapPin, X } from "lucide-react";
import { MAPBOX_ACCESS_TOKEN } from "@/lib/mapbox";

interface LocationSearchProps {
  onLocationSelect: (location: {
    address: string;
    coordinates: { latitude: number; longitude: number };
    placeDetails?: any;
  }) => void;
  placeholder?: string;
  initialValue?: string;
  className?: string;
}

const LocationSearch: React.FC<LocationSearchProps> = ({
  onLocationSelect,
  placeholder = "Search for a location",
  initialValue = "",
  className = "",
}) => {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Handle outside clicks to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Search for locations using Mapbox Geocoding API
  const searchLocations = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery,
        )}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=5&types=address,place,poi`,
      );

      if (!response.ok) throw new Error("Geocoding request failed");

      const data = await response.json();
      setResults(data.features || []);
      setShowResults(true);
    } catch (error) {
      console.error("Error searching locations:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      searchLocations(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectLocation = (result: any) => {
    const [longitude, latitude] = result.center;
    const address = result.place_name;

    onLocationSelect({
      address,
      coordinates: { latitude, longitude },
      placeDetails: result,
    });

    setQuery(address);
    setShowResults(false);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <div className="relative">
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          className="pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full"
            onClick={clearSearch}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {showResults && results.length > 0 && (
        <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-auto shadow-lg">
          <ul className="py-1">
            {results.map((result) => (
              <li
                key={result.id}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-start"
                onClick={() => handleSelectLocation(result)}
              >
                <MapPin className="h-4 w-4 mt-1 mr-2 flex-shrink-0 text-gray-500" />
                <div>
                  <div className="font-medium">{result.text}</div>
                  <div className="text-sm text-gray-500">
                    {result.place_name.replace(result.text + ", ", "")}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};

export default LocationSearch;
