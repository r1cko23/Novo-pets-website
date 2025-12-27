import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Services from "@/pages/Services";
import Booking from "@/pages/Booking";
import Contact from "@/pages/Contact";
import Admin from "@/pages/Admin";
import AdminDashboard from "@/pages/AdminDashboard";
import { useEffect } from "react";

function MainLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const isHomePage = location === "/";

  return (
    <>
      <Navbar />
      <main className={isHomePage ? "" : "pt-28 min-h-screen"}>
        {children}
      </main>
      <Footer />
    </>
  );
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen">
      {children}
    </main>
  );
}

function Router() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");
  
  // Use different layout based on route
  const Layout = isAdminRoute ? AdminLayout : MainLayout;
  
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  return (
    <Layout>
      <Switch>
        {/* Main routes */}
        <Route path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/services" component={Services} />
        <Route path="/booking" component={Booking} />
        <Route path="/contact" component={Contact} />
        
        {/* Admin routes */}
        <Route path="/admin" component={Admin} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        
        {/* 404 page */}
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <div className="antialiased min-h-screen bg-background text-foreground">
          <Router />
        </div>
        <Analytics />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
