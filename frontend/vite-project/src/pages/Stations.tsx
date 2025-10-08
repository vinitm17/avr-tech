import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Zap, AlertTriangle, CheckCircle, XCircle, ArrowLeft, Battery, Clock, Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from "@/components/ui/Modal";

interface Station {
  id: number;
  location: string;
  city: string; // Adding city to be used for filtering
  healthPercentage: number;
  isOccupied: boolean;
  isActive: boolean;
  isFaulty: boolean;
  totalEnergyConsumption: string;
  oem: string;
  reseller: string;
  operator: string;
  connectedUser: string | null;
}

interface ApiError {
  response?: {
    data?: {
      msg?: string;
    };
  };
}

interface StationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  station: Station | null;
  userData: UserData | null;
  onStartCharging: (stationId: number, pointsToUse: number) => void;
  onStopCharging: (stationId: number) => void;
  isCharging: boolean;
  loading: boolean;
}

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  points: string;
}

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [filteredStations, setFilteredStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chargingStations, setChargingStations] = useState<Set<number>>(new Set());
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [stationIdSearch, setStationIdSearch] = useState<string>("");
  const [cities, setCities] = useState<string[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [stationModalOpen, setStationModalOpen] = useState(false);
  const [pointsToUse, setPointsToUse] = useState<number>(10);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStations();
    fetchUserData();
  }, []);

  // Filter stations whenever filter criteria change
  useEffect(() => {
    if (stations.length > 0) {
      let filtered = [...stations];
      
      // Filter by city if selected (and not "all")
      if (cityFilter && cityFilter !== "all") {
        filtered = filtered.filter(station => 
          station.location.toLowerCase().includes(cityFilter.toLowerCase())
        );
      }
      
      // Filter by station ID if provided
      if (stationIdSearch) {
        filtered = filtered.filter(station => 
          station.id.toString().includes(stationIdSearch)
        );
      }
      
      setFilteredStations(filtered);
    }
  }, [stations, cityFilter, stationIdSearch]);

  // Extract unique cities from stations
  useEffect(() => {
    if (stations.length > 0) {
      // Extract city names from locations
      const cityNames = stations.map(station => {
        // Assuming location format is "Name - City" or similar
        const parts = station.location.split('-');
        return parts.length > 1 ? parts[1].trim() : station.location;
      });
      
      // Get unique cities
      const uniqueCities = Array.from(new Set(cityNames));
      setCities(uniqueCities);
    }
  }, [stations]);

  const fetchUserData = async () => {
    try {
      const response = await api.get("/get/dashboard");
      setUserData({
        id: response.data.data.userId,
        firstName: response.data.data.userName.split(' ')[0],
        lastName: response.data.data.userName.split(' ')[1] || '',
        email: response.data.data.email,
        points: response.data.data.totalPoints
      });
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  };

  const fetchStations = async () => {
    try {
      setLoading(true);
      const response = await api.get("/get/stations");
      
      // Enhance station data with city extraction
      const enhancedStations = response.data.stations.map((station: any) => {
        // Extract city from location (assuming format like "Name - City")
        const locationParts = station.location.split('-');
        const city = locationParts.length > 1 ? locationParts[1].trim() : station.location;
        
        return {
          ...station,
          city
        };
      });
      
      setStations(enhancedStations);
      setFilteredStations(enhancedStations);
      setError("");
    } catch (err) {
      console.error("Error fetching stations:", err);
      setError("Failed to load stations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartCharging = async (stationId: number, customPoints?: number) => {
    try {
      setActionLoading(stationId);
      const payload = customPoints ? { CID: stationId, points: customPoints } : { CID: stationId };
      const response = await api.post("/post/startCharging", payload);
      console.log("Charging started:", response.data);
      
      // Add station to charging set and update stations list
      setChargingStations(prev => new Set([...prev, stationId]));
      setFilteredStations(prev => prev.map(station => 
        station.id === stationId 
          ? { ...station, isOccupied: true }
          : station
      ));
      setStations(prev => prev.map(station => 
        station.id === stationId 
          ? { ...station, isOccupied: true }
          : station
      ));
      
      // Update user data with reduced points
      if (userData && customPoints) {
        const currentPoints = parseInt(userData.points);
        setUserData({
          ...userData,
          points: (currentPoints - customPoints).toString()
        });
      }
      
      // Close modal if open
      setStationModalOpen(false);
      
      // Show success message
      alert(`Charging started successfully at Station #${stationId}`);
      
    } catch (err: unknown) {
      console.error("Error starting charging:", err);
      const errorMessage = (err as ApiError)?.response?.data?.msg || "Failed to start charging. Please try again.";
      alert(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStopCharging = async (stationId: number) => {
    try {
      setActionLoading(stationId);
      const response = await api.post("/post/stopCharging", { CID: stationId });
      console.log("Charging stopped:", response.data);
      
      // Remove station from charging set and update stations list
      setChargingStations(prev => {
        const newSet = new Set(prev);
        newSet.delete(stationId);
        return newSet;
      });
      setFilteredStations(prev => prev.map(station => 
        station.id === stationId 
          ? { ...station, isOccupied: false }
          : station
      ));
      setStations(prev => prev.map(station => 
        station.id === stationId 
          ? { ...station, isOccupied: false }
          : station
      ));
      
      // Update user data after session
      await fetchUserData();
      
      // Show success message with session details
      const sessionInfo = response.data;
      alert(`Charging stopped successfully!\nTime: ${sessionInfo.totalTime}\nCoins Used: ${sessionInfo.coinsUsed}`);
      
    } catch (err: unknown) {
      console.error("Error stopping charging:", err);
      const errorMessage = (err as ApiError)?.response?.data?.msg || "Failed to stop charging. Please try again.";
      alert(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (station: Station) => {
    if (station.isFaulty) return "text-red-600 bg-red-100";
    if (station.isOccupied) return "text-yellow-600 bg-yellow-100";
    if (station.isActive) return "text-green-600 bg-green-100";
    return "text-gray-600 bg-gray-100";
  };

  const getStatusText = (station: Station) => {
    if (station.isFaulty) return "Faulty";
    if (station.isOccupied) return "Occupied";
    if (station.isActive) return "Available";
    return "Inactive";
  };

  const getStatusIcon = (station: Station) => {
    if (station.isFaulty) return <XCircle className="w-4 h-4" />;
    if (station.isOccupied) return <Clock className="w-4 h-4" />;
    if (station.isActive) return <CheckCircle className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <header className="bg-white/80 backdrop-blur-sm border-b border-blue-200 sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => navigate("/home")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <h1 className="text-2xl font-bold text-gray-800">Charging Stations</h1>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-6 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading stations...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <header className="bg-white/80 backdrop-blur-sm border-b border-blue-200 sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => navigate("/home")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <h1 className="text-2xl font-bold text-gray-800">Charging Stations</h1>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchStations}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-blue-300 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => navigate("/home")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Charging Stations</h1>
                <p className="text-sm text-gray-700">Find and connect to available charging points</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-blue-100 px-3 py-2 rounded-full">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">{filteredStations.length} Stations Found</span>
            </div>
          </div>
          
          {/* Search and Filter Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-2">
            {/* Station ID Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search by Station ID"
                  className="pl-10 w-full"
                  value={stationIdSearch}
                  onChange={(e) => setStationIdSearch(e.target.value)}
                />
              </div>
            </div>
            
            {/* City Filter */}
            <div className="flex-1">
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-full bg-white text-gray-900 border-gray-300">
                  <SelectValue placeholder="Filter by City" className="text-gray-700" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map((city, index) => (
                    <SelectItem key={index} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Clear Filters Button */}
            {(cityFilter !== "all" || stationIdSearch) && (
              <Button 
                className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  setCityFilter("all");
                  setStationIdSearch("");
                }}
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md hover:shadow-lg transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm mb-1">Available</p>
                  <p className="text-2xl font-bold">
                    {stations.filter(s => s.isActive && !s.isOccupied && !s.isFaulty).length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-400/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-md hover:shadow-lg transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm mb-1">Occupied</p>
                  <p className="text-2xl font-bold">
                    {stations.filter(s => s.isOccupied).length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-yellow-400/30 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md hover:shadow-lg transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm mb-1">Faulty</p>
                  <p className="text-2xl font-bold">
                    {stations.filter(s => s.isFaulty).length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-red-400/30 rounded-full flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-500 to-gray-600 text-white shadow-md hover:shadow-lg transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-100 text-sm mb-1">Inactive</p>
                  <p className="text-2xl font-bold">
                    {stations.filter(s => !s.isActive).length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-gray-400/30 rounded-full flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stations List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStations.map((station) => (
            <Card 
              key={station.id} 
              className={`bg-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${
                chargingStations.has(station.id) ? 'border-2 border-green-500' : 'border border-gray-200'
              }`}
              onClick={() => {
                setSelectedStation(station);
                setStationModalOpen(true);
              }}
            >
              <CardContent className="p-6">
                {/* Station Header with colored background based on status */}
                <div className={`-m-6 mb-4 p-6 ${
                  station.isFaulty ? 'bg-red-50 border-b border-red-100' : 
                  station.isOccupied ? 'bg-yellow-50 border-b border-yellow-100' : 
                  station.isActive ? 'bg-green-50 border-b border-green-100' : 
                  'bg-gray-50 border-b border-gray-100'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        station.isFaulty ? 'bg-red-100 text-red-600' : 
                        station.isOccupied ? 'bg-yellow-100 text-yellow-600' : 
                        station.isActive ? 'bg-green-100 text-green-600' : 
                        'bg-gray-100 text-gray-600'
                      }`}>
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Station #{station.id}</h3>
                        <p className="text-sm text-gray-700">{station.location}</p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(station)}`}>
                      {getStatusIcon(station)}
                      <span>{getStatusText(station)}</span>
                    </div>
                  </div>
                </div>

                {/* Station Details */}
                <div className="space-y-3 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Health</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            station.healthPercentage >= 80 ? 'bg-green-500' :
                            station.healthPercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${station.healthPercentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{station.healthPercentage}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Energy Used</span>
                    <div className="flex items-center space-x-1">
                      <Battery className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-gray-900">{station.totalEnergyConsumption} kWh</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Operator</span>
                    <span className="text-sm font-semibold text-gray-900">{station.operator}</span>
                  </div>

                  {station.connectedUser && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Current User</span>
                      <span className="text-sm font-semibold text-blue-700">{station.connectedUser}</span>
                    </div>
                  )}
                </div>

                {/* View Details Button - Replaces direct action buttons */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    View Details & Connect
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStations.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No stations found</h3>
            <p className="text-gray-700 max-w-md mx-auto mb-4">
              {stations.length > 0 
                ? "Try adjusting your search filters to see more stations."
                : "There are no charging stations available at the moment."}
            </p>
            {stations.length > 0 && (cityFilter !== "all" || stationIdSearch) && (
              <Button 
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  setCityFilter("all");
                  setStationIdSearch("");
                }}
              >
                Clear All Filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Station Detail Modal */}
      <StationDetailModal
        isOpen={stationModalOpen}
        onClose={() => setStationModalOpen(false)}
        station={selectedStation}
        userData={userData}
        onStartCharging={handleStartCharging}
        onStopCharging={handleStopCharging}
        isCharging={selectedStation ? chargingStations.has(selectedStation.id) : false}
        loading={selectedStation ? actionLoading === selectedStation.id : false}
      />
    </div>
  );
}

// Station Detail Modal Component
function StationDetailModal({ 
  isOpen, 
  onClose, 
  station, 
  userData, 
  onStartCharging,
  onStopCharging,
  isCharging,
  loading
}: StationDetailModalProps) {
  const [pointsToUse, setPointsToUse] = useState<number>(10);
  const userPoints = userData?.points ? parseInt(userData.points) : 0;

  // Validate points input
  const handlePointsChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      // Don't allow more points than user has
      if (numValue <= userPoints) {
        setPointsToUse(numValue);
      } else {
        setPointsToUse(userPoints);
      }
    }
  };

  if (!isOpen || !station) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Station #${station.id} Details`}>
      <div className="space-y-6">
        {/* Station Info */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="font-semibold text-lg text-blue-800 mb-3 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-blue-600" />
            Station Information
          </h3>
          <div className="space-y-3 divide-y divide-blue-100">
            <div className="flex justify-between pb-2">
              <span className="text-gray-700 font-medium">Location:</span>
              <span className="font-medium text-gray-900">{station.location}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-700 font-medium">Status:</span>
              <span className={`font-medium ${
                station.isFaulty ? 'text-red-600' : 
                station.isOccupied ? 'text-yellow-600' : 
                station.isActive ? 'text-green-600' : 'text-gray-600'
              }`}>
                {station.isFaulty ? 'Faulty' : 
                 station.isOccupied ? 'Occupied' : 
                 station.isActive ? 'Available' : 'Inactive'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-700 font-medium">Health:</span>
              <div className="flex items-center">
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden mr-2">
                  <div 
                    className={`h-full rounded-full ${
                      station.healthPercentage >= 80 ? 'bg-green-500' :
                      station.healthPercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${station.healthPercentage}%` }}
                  ></div>
                </div>
                <span className="font-medium text-gray-900">{station.healthPercentage}%</span>
              </div>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-700 font-medium">Energy Consumption:</span>
              <span className="font-medium text-gray-900">{station.totalEnergyConsumption} kWh</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-gray-700 font-medium">Operator:</span>
              <span className="font-medium text-gray-900">{station.operator}</span>
            </div>
          </div>
        </div>
        
        {/* User Info */}
        {userData && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <h3 className="font-semibold text-lg text-green-800 mb-3 flex items-center">
              <Battery className="w-5 h-5 mr-2 text-green-600" />
              Your Account
            </h3>
            <div className="space-y-3 divide-y divide-green-100">
              <div className="flex justify-between pb-2">
                <span className="text-gray-700 font-medium">Name:</span>
                <span className="font-medium text-gray-900">{userData.firstName} {userData.lastName}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-700 font-medium">Email:</span>
                <span className="font-medium text-gray-900">{userData.email}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-gray-700 font-medium">Available Points:</span>
                <span className="font-medium text-green-700">{userData.points} points</span>
              </div>
            </div>
          </div>
        )}

        {/* Charging Controls */}
        {!isCharging && station.isActive && !station.isOccupied && !station.isFaulty && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
            <h3 className="font-semibold text-lg text-yellow-800 mb-3 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-yellow-600" />
              Start Charging
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Points to use for charging:
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="1"
                    max={userPoints}
                    value={pointsToUse}
                    onChange={(e) => handlePointsChange(e.target.value)}
                    className="w-full p-2 border border-yellow-200 bg-white rounded-md text-gray-900 focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 focus:outline-none"
                  />
                  <span className="ml-2 text-gray-800 font-medium">points</span>
                </div>
                <p className="text-sm text-gray-800 mt-2 bg-yellow-100 p-2 rounded">
                  This will allow approximately {pointsToUse * 5} minutes of charging time.
                </p>
              </div>
              
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={() => onStartCharging(station.id, pointsToUse)}
                disabled={loading || pointsToUse <= 0 || pointsToUse > userPoints}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Starting Charging...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Start Charging ({pointsToUse} points)
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Stop Charging Control */}
        {isCharging && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-100">
            <h3 className="font-semibold text-lg text-red-800 mb-3 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-red-600" />
              Active Charging
            </h3>
            <p className="text-gray-800 mb-4 bg-red-100 p-3 rounded">
              You have an active charging session at this station. You can stop charging at any time.
            </p>
            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              onClick={() => onStopCharging(station.id)}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Stopping...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Stop Charging
                </>
              )}
            </Button>
          </div>
        )}

        {/* Not Available Message */}
        {(station.isFaulty || !station.isActive || (station.isOccupied && !isCharging)) && (
          <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-center text-gray-700 p-2">
              <AlertTriangle className="w-5 h-5 mr-2 text-gray-600" />
              <span className="font-medium">This station is not available for charging at the moment.</span>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-2">
          <Button variant="outline" onClick={onClose} className="border-gray-300 text-gray-700 hover:bg-gray-50">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
