import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, User, Mail, Zap, Clock, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

interface ProfileData {
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  totalPoints: string;
  totalSessions: number;
  stationsUsed: number;
  vehicle?: string;
}

export default function Profile() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setLoading(true);
        const response = await api.get("/get/dashboard");
        
        // Extract first and last name from the userName
        const nameParts = response.data.data.userName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        setProfileData({
          ...response.data.data,
          firstName,
          lastName,
        });
        setError("");
      } catch (err) {
        console.error("Error fetching profile data:", err);
        setError("Failed to load profile data");
        // If authentication error, redirect to login
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/signin");
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadProfileData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate("/home")}>Return to Home</Button>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-yellow-500 mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Profile Data</h2>
          <p className="text-gray-600 mb-6">We couldn't find your profile information.</p>
          <Button onClick={() => navigate("/home")}>Return to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-blue-300 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => navigate("/home")} className="border-blue-300 text-blue-600 hover:bg-blue-50">
                <ArrowLeft className="w-4 h-4 mr-2 text-blue-600" />
                Back to Home
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
                <p className="text-sm text-gray-700">View and manage your account information</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Profile Avatar */}
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-4xl font-bold text-white">
                {profileData.firstName.charAt(0)}{profileData.lastName.charAt(0)}
              </span>
            </div>
            
            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {profileData.firstName} {profileData.lastName}
              </h2>
              <div className="flex items-center justify-center md:justify-start text-gray-600 mb-4">
                <Mail className="w-4 h-4 mr-2 text-blue-600" />
                <span>{profileData.email}</span>
              </div>
              
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="bg-blue-50 px-4 py-2 rounded-full flex items-center">
                  <Zap className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-blue-600 font-medium">{profileData.totalPoints} Points</span>
                </div>
                <div className="bg-green-50 px-4 py-2 rounded-full flex items-center">
                  <Clock className="w-4 h-4 text-green-600 mr-2" />
                  <span className="text-green-600 font-medium">{profileData.totalSessions} Sessions</span>
                </div>
                <div className="bg-purple-50 px-4 py-2 rounded-full flex items-center">
                  <MapPin className="w-4 h-4 text-purple-600 mr-2" />
                  <span className="text-purple-600 font-medium">{profileData.stationsUsed} Stations</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center bg-blue-50 p-2 rounded-md">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Personal Information
              </h3>
              <div className="space-y-4 divide-y divide-gray-100">
                <div className="pb-3">
                  <label className="text-sm text-gray-600 font-medium block mb-2">First Name</label>
                  <div className="text-white font-semibold text-lg pl-2">{profileData.firstName}</div>
                </div>
                <div className="py-3">
                  <label className="text-sm text-gray-600 font-medium block mb-2">Last Name</label>
                  <div className="text-white font-semibold text-lg pl-2">{profileData.lastName}</div>
                </div>
                <div className="pt-3">
                  <label className="text-sm text-gray-600 font-medium block mb-2">Email Address</label>
                  <div className="text-white font-semibold text-lg pl-2">{profileData.email}</div>
                </div>
                {profileData.vehicle && (
                  <div className="pt-3">
                    <label className="text-sm text-gray-600 font-medium block mb-2">Vehicle</label>
                    <div className="text-white font-semibold text-lg pl-2">{profileData.vehicle}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center bg-green-50 p-2 rounded-md">
                <Zap className="w-5 h-5 mr-2 text-green-600" />
                Charging Statistics
              </h3>
              <div className="space-y-4 divide-y divide-gray-100">
                <div className="pb-3">
                  <label className="text-sm text-gray-600 font-medium block mb-2">Available Points</label>
                  <div className="text-white font-bold text-2xl pl-2">{profileData.totalPoints}</div>
                </div>
                <div className="py-3">
                  <label className="text-sm text-gray-600 font-medium block mb-2">Charging Sessions</label>
                  <div className="text-white font-semibold text-lg pl-2">{profileData.totalSessions}</div>
                </div>
                <div className="pt-3">
                  <label className="text-sm text-gray-600 font-medium block mb-2">Stations Used</label>
                  <div className="text-white font-semibold text-lg pl-2">{profileData.stationsUsed}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600 mb-4">Need to update your information or have questions about your account?</p>
          <Button 
            variant="outline" 
            onClick={() => navigate("/support")} 
            className="mr-4 border-blue-300 text-blue-600 hover:bg-blue-50"
          >
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
}