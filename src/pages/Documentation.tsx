
import React from 'react';
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { UseCaseDiagram } from "@/components/documentation/UseCaseDiagram";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Documentation() {
  const navigate = useNavigate();
  
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/dashboard')}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Platform Documentation</h1>
          </div>
        </div>
        
        <Tabs defaultValue="use-case-diagram" className="w-full">
          <TabsList className="w-full max-w-md mx-auto grid grid-cols-2 mb-6">
            <TabsTrigger value="use-case-diagram">Use Case Diagram</TabsTrigger>
            <TabsTrigger value="system-overview">System Overview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="use-case-diagram" className="mt-6">
            <Card className="bg-white/60 backdrop-blur-sm mb-6">
              <CardHeader>
                <CardTitle>Use Case Diagram</CardTitle>
                <CardDescription>
                  This diagram illustrates how different user roles interact with the system functionalities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  A use case diagram provides a high-level view of the system functionality from a user's perspective.
                  It shows what the system can do and which types of users can interact with each function.
                </p>
              </CardContent>
            </Card>
            
            <UseCaseDiagram />
          </TabsContent>
          
          <TabsContent value="system-overview" className="mt-6">
            <Card className="bg-white/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
                <CardDescription>
                  High-level architecture and component overview of the AdminChirii.ro platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Dashboard Structure</h3>
                  <p className="text-gray-600">
                    The main dashboard container is in <code>src/pages/Index.tsx</code>, which authenticates the user, 
                    determines their role, and renders the appropriate dashboard component based on that role.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Role-Specific Dashboards</h3>
                  <ul className="space-y-4 pl-6 list-disc text-gray-600">
                    <li>
                      <span className="font-medium text-gray-800">Landlord Dashboard:</span> 
                      <ul className="pl-6 list-disc mt-1">
                        <li>Property metrics (total properties, monthly revenue, active tenants, pending maintenance)</li>
                        <li>Calendar section for important dates</li>
                        <li>Revenue tracking and predictions</li>
                        <li>Upcoming income section</li>
                      </ul>
                    </li>
                    <li>
                      <span className="font-medium text-gray-800">Tenant Dashboard:</span>
                      <ul className="pl-6 list-disc mt-1">
                        <li>Property information for rented units</li>
                        <li>Maintenance request access</li>
                        <li>Document management</li>
                        <li>Payment status information</li>
                      </ul>
                    </li>
                    <li>
                      <span className="font-medium text-gray-800">Service Provider Dashboard:</span>
                      <ul className="pl-6 list-disc mt-1">
                        <li>Active job metrics</li>
                        <li>Completed jobs counter</li>
                        <li>Monthly earnings tracker</li>
                        <li>Getting started guide for new providers</li>
                      </ul>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Key Components</h3>
                  <ul className="space-y-2 pl-6 list-disc text-gray-600">
                    <li><span className="font-medium text-gray-800">DashboardMetrics:</span> Shows role-specific metrics in cards</li>
                    <li><span className="font-medium text-gray-800">DashboardHeader:</span> Displays welcome message with user's name</li>
                    <li><span className="font-medium text-gray-800">DashboardLayout:</span> Provides the sidebar and main content structure</li>
                    <li><span className="font-medium text-gray-800">RevenueSection:</span> Visualizes financial data for landlords</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Data Management</h3>
                  <p className="text-gray-600">
                    The dashboard uses React Query to fetch and cache data for tenant properties, landlord metrics, 
                    service provider jobs, and revenue data.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
