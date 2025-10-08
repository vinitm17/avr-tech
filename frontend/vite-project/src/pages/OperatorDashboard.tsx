import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogOut, MapPin, Settings, Wrench, Wallet, Zap, BarChart, Users, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

interface Station {
  id: number;
  location: string;
  totalEnergyConsumption: string;
  healthPercentage: number;
  isOccupied: boolean;
  isActive: boolean;
  isFaulty: boolean;
  recentSessions: Session[];
}

interface Session {
  id: number;
  date: string;
  duration: string;
  pointsUsed: string;
  energyConsumption: number;
  user: string;
}

interface OperatorDashboardData {
  stationsOperated: number;
  totalSessions: number;
  totalPoints: string;
  stations: Station[];
}

export default function OperatorDashboard() {
  const [dashboardData, setDashboardData] = useState<OperatorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadOperatorDashboard = async () => {
      try {
        setLoading(true);
        const response = await api.get("/hw/get/operator-dashboard");
        setDashboardData(response.data.data);
        setError("");
      } catch (err: any) {
        console.error("Error fetching operator dashboard:", err);
        if (err.response?.status === 403) {
          setError("Access denied. Only operators can access this dashboard.");
        } else {
          setError("Failed to load operator dashboard data");
          // If authentication error, redirect to login
          if (err.response?.status === 401) {
            localStorage.removeItem("token");
            navigate("/signin");
          }
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadOperatorDashboard();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading operator dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <header className="bg-white/90 backdrop-blur-sm border-b border-blue-300 shadow-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Operator Dashboard</h1>
                <p className="text-sm text-gray-700">Manage your charging stations</p>
              </div>
              <Button variant="outline" onClick={() => navigate("/home")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <Wrench className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => navigate("/home")}>
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-blue-300 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Operator Dashboard</h1>
                <p className="text-sm text-gray-700">Manage your charging stations</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => navigate("/home")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                User Dashboard
              </Button>
              <Button variant="outline" onClick={handleLogout} className="hover:bg-red-50 hover:border-red-200">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Stations Operated</p>
                  <p className="text-3xl font-bold">{dashboardData?.stationsOperated || 0}</p>
                </div>
                <MapPin className="w-8 h-8 text-blue-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Sessions</p>
                  <p className="text-3xl font-bold">{dashboardData?.totalSessions || 0}</p>
                </div>
                <BarChart className="w-8 h-8 text-green-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Revenue (Points)</p>
                  <p className="text-3xl font-bold">{dashboardData?.totalPoints || 0}</p>
                </div>
                <Wallet className="w-8 h-8 text-purple-100" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Placeholder for future content */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center mb-8">
          <Zap className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Operator Dashboard</h2>
          <p className="text-gray-600 mb-6">
            This is a placeholder for the operator dashboard. You can expand this with station management 
            features, analytics, and more based on your requirements.
          </p>
          <Button onClick={() => navigate("/stations")}>
            View All Stations
          </Button>
        </div>

        {/* Station List Preview */}
        <h2 className="text-xl font-bold text-gray-800 mb-4">Your Stations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {dashboardData?.stations.slice(0, 6).map((station) => (
            <Card key={station.id} className="bg-white shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">Station #{station.id}</h3>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    station.isFaulty ? 'bg-red-100 text-red-800' : 
                    station.isOccupied ? 'bg-yellow-100 text-yellow-800' : 
                    station.isActive ? 'bg-green-100 text-green-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {station.isFaulty ? 'Faulty' : 
                     station.isOccupied ? 'Occupied' : 
                     station.isActive ? 'Available' : 'Inactive'}
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{station.location}</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Health</span>
                    <span className="text-sm font-medium">{station.healthPercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Energy Consumption</span>
                    <span className="text-sm font-medium">{station.totalEnergyConsumption} kWh</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}