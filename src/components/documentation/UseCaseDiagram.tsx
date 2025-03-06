
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function UseCaseDiagram() {
  const diagramStyles = {
    actorStyle: "rounded-xl border-2 border-blue-500 py-2 px-4 bg-white shadow-md",
    useCaseStyle: "rounded-full border-2 border-indigo-500 py-3 px-6 bg-white shadow-md",
    lineStyle: "stroke-gray-400 stroke-[1.5px]",
    systemBoundaryStyle: "rounded-3xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-6",
  };

  const actors = [
    { id: "landlord", name: "Landlord", x: 100, y: 250 },
    { id: "tenant", name: "Tenant", x: 100, y: 450 },
    { id: "service_provider", name: "Service Provider", x: 100, y: 650 },
  ];

  const useCases = [
    { id: "manage_properties", name: "Manage Properties", x: 350, y: 150, actors: ["landlord"] },
    { id: "track_revenue", name: "Track Revenue", x: 350, y: 220, actors: ["landlord"] },
    { id: "manage_tenants", name: "Manage Tenants", x: 350, y: 290, actors: ["landlord"] },
    { id: "handle_maintenance", name: "Handle Maintenance Requests", x: 350, y: 360, actors: ["landlord", "tenant", "service_provider"] },
    { id: "view_rent_property", name: "View Rented Property", x: 350, y: 430, actors: ["tenant"] },
    { id: "submit_maintenance", name: "Submit Maintenance Request", x: 350, y: 500, actors: ["tenant"] },
    { id: "access_documents", name: "Access Documents", x: 350, y: 570, actors: ["landlord", "tenant"] },
    { id: "track_payments", name: "Track Payments", x: 350, y: 640, actors: ["landlord", "tenant"] },
    { id: "provide_services", name: "Provide Services", x: 350, y: 710, actors: ["service_provider"] },
    { id: "track_jobs", name: "Track Job Status", x: 350, y: 780, actors: ["service_provider"] },
  ];

  return (
    <Card className="w-full max-w-5xl mx-auto my-8 overflow-hidden shadow-md">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="text-2xl font-bold">User Case Diagram - AdminChirii.ro Platform</CardTitle>
      </CardHeader>
      <CardContent className="p-6 overflow-auto">
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Diagram Legend</h3>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <div className={`${diagramStyles.actorStyle} text-sm`}>Actor</div>
              <span className="text-sm text-gray-600">System User</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`${diagramStyles.useCaseStyle} text-sm`}>Use Case</div>
              <span className="text-sm text-gray-600">System Function</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="40" height="2" className={diagramStyles.lineStyle}>
                <line x1="0" y1="1" x2="40" y2="1" />
              </svg>
              <span className="text-sm text-gray-600">Association</span>
            </div>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="relative" style={{ width: "800px", height: "850px", minWidth: "800px" }}>
          {/* System Boundary */}
          <div 
            className={diagramStyles.systemBoundaryStyle}
            style={{ position: "absolute", left: "200px", top: "50px", width: "550px", height: "750px" }}
          >
            <div className="absolute -top-3 left-8 bg-gray-50 px-2 text-gray-600 font-medium">
              AdminChirii.ro System
            </div>
            
            {/* Use Cases */}
            {useCases.map((useCase) => (
              <div 
                key={useCase.id}
                className={diagramStyles.useCaseStyle}
                style={{ position: "absolute", left: useCase.x - 200, top: useCase.y - 50 }}
              >
                <span className="text-sm font-medium">{useCase.name}</span>
              </div>
            ))}
          </div>
          
          {/* Actors */}
          {actors.map((actor) => (
            <div 
              key={actor.id}
              className={diagramStyles.actorStyle}
              style={{ position: "absolute", left: actor.x, top: actor.y }}
            >
              <span className="text-sm font-medium">{actor.name}</span>
            </div>
          ))}
          
          {/* Lines connecting actors to use cases */}
          <svg width="800" height="850" style={{ position: "absolute", top: 0, left: 0 }}>
            {useCases.map((useCase) => (
              useCase.actors.map((actorId) => {
                const actor = actors.find(a => a.id === actorId);
                if (!actor) return null;
                
                return (
                  <line 
                    key={`${actor.id}-${useCase.id}`}
                    x1={actor.x + 100}
                    y1={actor.y + 15}
                    x2={useCase.x - 50}
                    y2={useCase.y + 15}
                    className={diagramStyles.lineStyle}
                  />
                );
              })
            ))}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
