import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Code,
  Key,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Activity,
} from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  status: "active" | "inactive";
  created: string;
  lastUsed?: string;
  scopes: string[];
}

interface Integration {
  id: string;
  name: string;
  type: string;
  status: "connected" | "disconnected" | "error";
  lastSync?: string;
}

export default function ApiManagement() {
  const [showKey, setShowKey] = useState<string | null>(null);

  const [apiKeys] = useState<ApiKey[]>([
    {
      id: "key_1",
      name: "Production API Key",
      key: "pk_live_12345abcdef",
      status: "active",
      created: "2024-01-15",
      lastUsed: "2024-02-20",
      scopes: ["read:loads", "write:loads", "read:users"],
    },
    {
      id: "key_2",
      name: "Development API Key",
      key: "pk_test_67890ghijkl",
      status: "active",
      created: "2024-02-01",
      lastUsed: "2024-02-19",
      scopes: ["read:loads", "read:users"],
    },
  ]);

  const [integrations] = useState<Integration[]>([
    {
      id: "int_1",
      name: "GPS Tracking System",
      type: "Tracking",
      status: "connected",
      lastSync: "5 minutes ago",
    },
    {
      id: "int_2",
      name: "Payment Gateway",
      type: "Payment",
      status: "connected",
      lastSync: "1 hour ago",
    },
    {
      id: "int_3",
      name: "Weather API",
      type: "Weather",
      status: "error",
      lastSync: "3 hours ago",
    },
  ]);

  const getStatusBadge = (status: string) => {
    const styles = {
      connected: "bg-green-100 text-green-800",
      disconnected: "bg-gray-100 text-gray-800",
      error: "bg-red-100 text-red-800",
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={styles[status as keyof typeof styles]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">API Management</h1>
          <p className="text-gray-500 mt-1">
            Manage API keys and external integrations
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Generate New Key
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* API Keys */}
        <Card>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {apiKeys.map((key) => (
              <div key={key.id} className="p-4 border rounded-lg space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{key.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Key className="h-4 w-4 text-gray-400" />
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {showKey === key.id ? key.key : "•".repeat(16)}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setShowKey(showKey === key.id ? null : key.id)
                        }
                      >
                        {showKey === key.id ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {getStatusBadge(key.status)}
                </div>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>Created: {key.created}</span>
                  {key.lastUsed && <span>Last used: {key.lastUsed}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {key.scopes.map((scope) => (
                    <Badge key={scope} variant="secondary">
                      {scope}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card>
          <CardHeader>
            <CardTitle>External Integrations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className="p-4 border rounded-lg space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{integration.name}</h3>
                    <p className="text-sm text-gray-500">
                      Type: {integration.type}
                    </p>
                  </div>
                  {getStatusBadge(integration.status)}
                </div>
                {integration.lastSync && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Activity className="h-4 w-4" />
                    Last sync: {integration.lastSync}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Now
                  </Button>
                  <Button variant="outline" size="sm">
                    <Code className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
