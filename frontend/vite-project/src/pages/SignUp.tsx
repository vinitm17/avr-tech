import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "../lib/axios";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { User, Mail, Lock, UserPlus, AlertCircle, CheckCircle } from "lucide-react";

const formSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

type FormData = z.infer<typeof formSchema>;

export default function SignUp() {
  const [message, setMessage] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setMessage(""); // Clear previous message
      const res = await axios.post("/signup", data);
      setMessage(res.data.msg);
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }
    } catch (err) {
      console.error('Signup error:', err);
      setMessage("Signup failed. Please try again.");
    }
  };

  const isSuccess = message && !message.includes("failed");
  const isError = message && message.includes("failed");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4 shadow-lg">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Join us and start your journey</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="space-y-6">
            {/* First Name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4" />
                First Name
              </Label>
              <div className="relative">
                <Input 
                  {...register("firstName")} 
                  className={`pl-10 h-12 border-2 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 ${
                    errors.firstName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500 text-slate-800'
                  }`}
                  placeholder="Enter your first name"
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              {errors.firstName && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.firstName.message}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4" />
                Last Name
              </Label>
              <div className="relative">
                <Input 
                  {...register("lastName")} 
                  className={`pl-10 h-12 border-2 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 ${
                    errors.lastName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500 text-slate-800'
                  }`}
                  placeholder="Enter your last name"
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              {errors.lastName && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.lastName.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <div className="relative">
                <Input 
                  {...register("email")} 
                  className={`pl-10 h-12 border-2 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 ${
                    errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500 text-slate-800'
                  }`}
                  placeholder="Enter your email"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </Label>
              <div className="relative">
                <Input 
                  type="password" 
                  {...register("password")} 
                  className={`pl-10 h-12 border-2 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 ${
                    errors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500 text-slate-800'
                  }`}
                  placeholder="Create a password"
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={isSubmitting}
              onClick={handleSubmit(onSubmit)}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </>
              )}
            </Button>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`mt-6 p-4 rounded-lg border-2 transition-all duration-200 ${
              isSuccess 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : isError 
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              <div className="flex items-center gap-2">
                {isSuccess && <CheckCircle className="w-5 h-5 text-green-600" />}
                {isError && <AlertCircle className="w-5 h-5 text-red-600" />}
                <p className="font-medium">{message}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Already have an account?{" "}
            <a href="/signin" className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors ">
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}