import React from "react";
import DemandHeatmapDashboard from "../admin/DemandHeatmapDashboard";
import { Card, CardContent } from "../ui/card";

const DemandHeatmapDemo: React.FC = () => {
  return (
    <Card className="w-full h-full bg-background">
      <CardContent className="p-6">
        <h1 className="text-2xl font-bold mb-4">Demand Heatmap Dashboard</h1>
        <p className="text-muted-foreground mb-6">
          This dashboard visualizes load demand across different regions using
          Mapbox GL JS. It supports heatmap visualization, point-based
          visualization, and lane analysis.
        </p>
        <DemandHeatmapDashboard />
      </CardContent>
    </Card>
  );
};

export default DemandHeatmapDemo;
