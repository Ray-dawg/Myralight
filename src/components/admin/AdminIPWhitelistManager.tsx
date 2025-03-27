import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { toast } from "../ui/use-toast";
import { Trash2, Plus } from "lucide-react";

interface IPWhitelistEntry {
  id: string;
  ip_address: string;
  description: string;
  created_at: string;
}

const AdminIPWhitelistManager = () => {
  const [ipEntries, setIpEntries] = useState<IPWhitelistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newIp, setNewIp] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load IP whitelist entries
  useEffect(() => {
    fetchIpWhitelist();
  }, []);

  const fetchIpWhitelist = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("admin_ip_whitelist")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setIpEntries(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching IP whitelist",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addIpToWhitelist = async () => {
    if (!newIp) {
      toast({
        title: "Validation Error",
        description: "IP address is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase.from("admin_ip_whitelist").insert([
        {
          ip_address: newIp,
          description: newDescription || "No description",
        },
      ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "IP address added to whitelist",
      });

      // Reset form and refresh list
      setNewIp("");
      setNewDescription("");
      fetchIpWhitelist();
    } catch (error: any) {
      toast({
        title: "Error adding IP to whitelist",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const removeIpFromWhitelist = async (id: string) => {
    try {
      const { error } = await supabase
        .from("admin_ip_whitelist")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "IP address removed from whitelist",
      });

      // Refresh list
      fetchIpWhitelist();
    } catch (error: any) {
      toast({
        title: "Error removing IP from whitelist",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Admin IP Whitelist</CardTitle>
        <CardDescription>
          Restrict admin panel access to specific IP addresses for enhanced
          security.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
            <Input
              placeholder="IP Address (e.g., 192.168.1.1)"
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              className="md:flex-1"
            />
            <Input
              placeholder="Description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="md:flex-1"
            />
            <Button
              onClick={addIpToWhitelist}
              disabled={submitting}
              className="w-full md:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" /> Add IP
            </Button>
          </div>

          {loading ? (
            <div className="py-4 text-center">Loading IP whitelist...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Added On</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ipEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        No IP addresses in whitelist. Add one to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ipEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">
                          {entry.ip_address}
                        </TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell>
                          {new Date(entry.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeIpFromWhitelist(entry.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Your current IP:{" "}
          <span className="font-mono">
            {window.location.hostname === "localhost"
              ? "127.0.0.1"
              : "Loading..."}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default AdminIPWhitelistManager;
