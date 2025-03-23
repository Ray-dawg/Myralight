import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, Filter, Download } from "lucide-react";

export default function RateManagement() {
  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Rate Management</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <DollarSign className="h-4 w-4 mr-2" />
            Set Rates
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Current Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { route: "Chicago → Detroit", rate: 2.5 },
                { route: "Milwaukee → Minneapolis", rate: 2.8 },
                { route: "Detroit → Cleveland", rate: 2.3 },
              ].map((rate, i) => (
                <div key={i} className="flex items-center justify-between">
                  <p className="font-medium">{rate.route}</p>
                  <p className="text-sm">${rate.rate}/mile</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
