import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing credentials",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await apiRequest("POST", "/api/admin/login", {
        email,
        password
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Invalid credentials");
      }
      
      const data = await response.json();
      
      // Store admin email in session storage instead of token
      if (data.user && data.user.email) {
        sessionStorage.setItem("adminEmail", data.user.email);
        sessionStorage.setItem("adminRole", data.user.role);
      }
      
      toast({
        title: "Login successful",
        description: "Welcome to the admin dashboard",
      });
      
      // Redirect to dashboard using wouter
      setLocation("/admin/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#9a7d62]">Novo Pets Admin</h1>
          <p className="text-gray-600">Sign in to access the dashboard</p>
        </div>
        
        <form onSubmit={handleLogin}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-[#9a7d62] hover:bg-[#9a7d62]/90"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </div>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>For admin access, please contact the system administrator</p>
        </div>
      </div>
    </div>
  );
} 