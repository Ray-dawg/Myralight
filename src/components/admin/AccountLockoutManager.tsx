import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { LockOpen, AlertTriangle } from "lucide-react";

interface LockedAccount {
  id: string;
  email: string;
  failed_login_attempts: number;
  account_locked: boolean;
  account_locked_until: string;
}

const AccountLockoutManager = () => {
  const [lockedAccounts, setLockedAccounts] = useState<LockedAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Load locked accounts
  useEffect(() => {
    fetchLockedAccounts();
  }, []);

  const fetchLockedAccounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, email, failed_login_attempts, account_locked, account_locked_until",
        )
        .eq("account_locked", true)
        .order("account_locked_until", { ascending: false });

      if (error) throw error;
      setLockedAccounts(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching locked accounts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const unlockAccount = async (id: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          account_locked: false,
          account_locked_until: null,
          failed_login_attempts: 0,
        })
        .eq("id", id);

      if (error) throw error;

      // Log the account unlock event
      await supabase.from("auth_logs").insert([
        {
          event_type: "account_unlocked",
          user_id: id,
          level: "security",
          details: {
            reason: "Manual unlock by admin",
            admin_id: (await supabase.auth.getUser()).data.user?.id,
          },
          created_at: new Date().toISOString(),
        },
      ]);

      toast({
        title: "Success",
        description: "Account has been unlocked",
      });

      // Refresh list
      fetchLockedAccounts();
    } catch (error: any) {
      toast({
        title: "Error unlocking account",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatTimeRemaining = (lockUntil: string) => {
    const now = new Date();
    const lockTime = new Date(lockUntil);

    if (lockTime <= now) {
      return "Expired (will auto-unlock on next login attempt)";
    }

    const diffMs = lockTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} remaining`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours} hour${hours !== 1 ? "s" : ""} ${mins} minute${mins !== 1 ? "s" : ""} remaining`;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Account Lockout Management</CardTitle>
        <CardDescription>
          View and manage accounts that have been locked due to multiple failed
          login attempts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-4 text-center">Loading locked accounts...</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Failed Attempts</TableHead>
                  <TableHead>Locked Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lockedAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      No locked accounts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  lockedAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">
                        {account.email}
                      </TableCell>
                      <TableCell>{account.failed_login_attempts}</TableCell>
                      <TableCell>
                        {new Date(
                          account.account_locked_until,
                        ).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                          {formatTimeRemaining(account.account_locked_until)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => unlockAccount(account.id)}
                        >
                          <LockOpen className="h-4 w-4 mr-2" /> Unlock
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AccountLockoutManager;
