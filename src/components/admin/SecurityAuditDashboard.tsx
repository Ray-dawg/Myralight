import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Separator } from "../ui/separator";
import { Progress } from "../ui/progress";

interface SecurityAudit {
  id: string;
  triggered_by: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  started_at: string;
  completed_at: string | null;
  audit_type: "scheduled" | "manual" | "automated";
  findings: any;
  created_at: string;
}

interface VulnerabilityReport {
  id: string;
  audit_id: string;
  vulnerability_type: string;
  severity: "low" | "medium" | "high" | "critical";
  affected_component: string;
  description: string;
  remediation_steps: string;
  status: "open" | "in_progress" | "resolved" | "wont_fix";
  created_at: string;
  updated_at: string;
}

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: "low" | "medium" | "high" | "critical";
  user_id: string;
  ip_address: string;
  user_agent: string;
  details: any;
  created_at: string;
}

interface SecurityScanResult {
  id: string;
  scan_type:
    | "dependency"
    | "static_analysis"
    | "dynamic_analysis"
    | "penetration_test";
  scan_tool: string;
  scan_date: string;
  findings_count: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  report_url: string | null;
  raw_results: any;
  created_at: string;
}

const SecurityAuditDashboard: React.FC = () => {
  const [audits, setAudits] = useState<SecurityAudit[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<VulnerabilityReport[]>(
    [],
  );
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [scanResults, setScanResults] = useState<SecurityScanResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [runningAudit, setRunningAudit] = useState<boolean>(false);

  useEffect(() => {
    fetchSecurityData();

    // Set up realtime subscriptions
    const auditsSubscription = supabase
      .channel("security_audits_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "security_audits" },
        () => {
          fetchAudits();
        },
      )
      .subscribe();

    const vulnerabilitiesSubscription = supabase
      .channel("vulnerability_reports_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vulnerability_reports" },
        () => {
          fetchVulnerabilities();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(auditsSubscription);
      supabase.removeChannel(vulnerabilitiesSubscription);
    };
  }, []);

  const fetchSecurityData = async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchAudits(),
        fetchVulnerabilities(),
        fetchSecurityEvents(),
        fetchScanResults(),
      ]);
    } catch (err) {
      setError("Failed to fetch security data");
      console.error("Error fetching security data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAudits = async () => {
    const { data, error } = await supabase
      .from("security_audits")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    setAudits(data || []);
  };

  const fetchVulnerabilities = async () => {
    const { data, error } = await supabase
      .from("vulnerability_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    setVulnerabilities(data || []);
  };

  const fetchSecurityEvents = async () => {
    const { data, error } = await supabase
      .from("security_events")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    setSecurityEvents(data || []);
  };

  const fetchScanResults = async () => {
    const { data, error } = await supabase
      .from("security_scan_results")
      .select("*")
      .order("scan_date", { ascending: false });

    if (error) throw error;
    setScanResults(data || []);
  };

  const runSecurityAudit = async () => {
    setRunningAudit(true);
    try {
      const { data: functionData, error: functionError } =
        await supabase.functions.invoke("run-security-audit", {
          body: { auditType: "manual" },
        });

      if (functionError) throw functionError;
      console.log("Security audit initiated:", functionData);
    } catch (err) {
      setError("Failed to run security audit");
      console.error("Error running security audit:", err);
    } finally {
      setRunningAudit(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-red-500 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "medium":
        return "bg-yellow-500 text-black";
      case "low":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-500 text-white";
      case "in_progress":
        return "bg-blue-500 text-white";
      case "pending":
        return "bg-yellow-500 text-black";
      case "failed":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const calculateSecurityScore = () => {
    if (vulnerabilities.length === 0) return 100;

    const weights = {
      critical: 10,
      high: 5,
      medium: 2,
      low: 1,
    };

    const totalIssues = vulnerabilities.length;
    const weightedSum = vulnerabilities.reduce((sum, vuln) => {
      return sum + (weights[vuln.severity] || 1);
    }, 0);

    // Calculate score (100 - weighted percentage)
    const maxPossibleScore = totalIssues * weights.critical;
    const score = 100 - (weightedSum / maxPossibleScore) * 100;

    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 70) return "text-yellow-500";
    if (score >= 50) return "text-orange-500";
    return "text-red-500";
  };

  const securityScore = calculateSecurityScore();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-t-blue-500 border-b-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4">Loading security data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Security Audit Dashboard</h1>
        <Button onClick={runSecurityAudit} disabled={runningAudit}>
          {runningAudit ? "Running Audit..." : "Run Security Audit"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
          <TabsTrigger value="audits">Audit History</TabsTrigger>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="scans">Scan Results</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Score</CardTitle>
                <CardDescription>Overall security rating</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <span
                    className={`text-5xl font-bold ${getScoreColor(securityScore)}`}
                  >
                    {securityScore}
                  </span>
                  <span className="text-2xl">/100</span>
                  <Progress value={securityScore} className="mt-4" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vulnerabilities</CardTitle>
                <CardDescription>By severity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Critical</span>
                    <Badge className="bg-red-500">
                      {
                        vulnerabilities.filter((v) => v.severity === "critical")
                          .length
                      }
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>High</span>
                    <Badge className="bg-orange-500">
                      {
                        vulnerabilities.filter((v) => v.severity === "high")
                          .length
                      }
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Medium</span>
                    <Badge className="bg-yellow-500 text-black">
                      {
                        vulnerabilities.filter((v) => v.severity === "medium")
                          .length
                      }
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Low</span>
                    <Badge className="bg-blue-500">
                      {
                        vulnerabilities.filter((v) => v.severity === "low")
                          .length
                      }
                    </Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setActiveTab("vulnerabilities")}
                >
                  View Details
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest security events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {securityEvents.slice(0, 5).map((event) => (
                    <div key={event.id} className="text-sm">
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                        <span className="font-medium">{event.event_type}</span>
                      </div>
                      <div className="text-gray-500 text-xs mt-1">
                        {new Date(event.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                  {securityEvents.length === 0 && (
                    <div className="text-gray-500 text-center py-4">
                      No recent security events
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setActiveTab("events")}
                >
                  View All Events
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Latest Audit</CardTitle>
                <CardDescription>Most recent security audit</CardDescription>
              </CardHeader>
              <CardContent>
                {audits.length > 0 ? (
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Status:</span>
                      <Badge className={getStatusColor(audits[0].status)}>
                        {audits[0].status}
                      </Badge>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Type:</span>
                      <span>{audits[0].audit_type}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Started:</span>
                      <span>
                        {new Date(audits[0].started_at).toLocaleString()}
                      </span>
                    </div>
                    {audits[0].completed_at && (
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">Completed:</span>
                        <span>
                          {new Date(audits[0].completed_at).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {audits[0].findings && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Key Findings:</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {audits[0].findings.recommendations
                            ?.slice(0, 3)
                            .map((rec: string, i: number) => (
                              <li key={i} className="text-sm">
                                {rec}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-4">
                    No audits have been run yet
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setActiveTab("audits")}
                >
                  View All Audits
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Latest Scan Results</CardTitle>
                <CardDescription>Most recent security scans</CardDescription>
              </CardHeader>
              <CardContent>
                {scanResults.length > 0 ? (
                  <div className="space-y-4">
                    {scanResults.slice(0, 2).map((scan) => (
                      <div
                        key={scan.id}
                        className="border-b pb-3 last:border-0 last:pb-0"
                      >
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">
                            {scan.scan_type.replace("_", " ")} scan
                          </span>
                          <span className="text-sm">
                            {new Date(scan.scan_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm">{scan.scan_tool}</div>
                        <div className="flex gap-2 mt-2">
                          <Badge className="bg-red-500">
                            {scan.critical_count} critical
                          </Badge>
                          <Badge className="bg-orange-500">
                            {scan.high_count} high
                          </Badge>
                          <Badge className="bg-yellow-500 text-black">
                            {scan.medium_count} medium
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-4">
                    No scan results available
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setActiveTab("scans")}
                >
                  View All Scans
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vulnerabilities" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Vulnerability Reports</CardTitle>
              <CardDescription>
                All detected security vulnerabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vulnerabilities.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Severity</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Component</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reported</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vulnerabilities.map((vuln) => (
                      <TableRow key={vuln.id}>
                        <TableCell>
                          <Badge className={getSeverityColor(vuln.severity)}>
                            {vuln.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>{vuln.vulnerability_type}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {vuln.affected_component}
                        </TableCell>
                        <TableCell>{vuln.description}</TableCell>
                        <TableCell>{vuln.status}</TableCell>
                        <TableCell>
                          {new Date(vuln.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p>No vulnerabilities have been detected.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audits" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Audit History</CardTitle>
              <CardDescription>Record of all security audits</CardDescription>
            </CardHeader>
            <CardContent>
              {audits.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Triggered By</TableHead>
                      <TableHead>Findings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {audits.map((audit) => (
                      <TableRow key={audit.id}>
                        <TableCell>
                          {new Date(audit.started_at).toLocaleString()}
                        </TableCell>
                        <TableCell>{audit.audit_type}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(audit.status)}>
                            {audit.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {audit.completed_at
                            ? `${Math.round(
                                (new Date(audit.completed_at).getTime() -
                                  new Date(audit.started_at).getTime()) /
                                  1000,
                              )} seconds`
                            : "In progress"}
                        </TableCell>
                        <TableCell>{audit.triggered_by}</TableCell>
                        <TableCell>
                          {audit.findings
                            ? `${audit.findings.vulnerabilities?.length || 0} issues found`
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p>No security audits have been run yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
              <CardDescription>Log of security-related events</CardDescription>
            </CardHeader>
            <CardContent>
              {securityEvents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {securityEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          {new Date(event.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>{event.event_type}</TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(event.severity)}>
                            {event.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>{event.user_id}</TableCell>
                        <TableCell>{event.ip_address}</TableCell>
                        <TableCell>
                          <pre className="text-xs whitespace-pre-wrap">
                            {JSON.stringify(event.details, null, 2)}
                          </pre>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p>No security events have been recorded.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scans" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Scan Results</CardTitle>
              <CardDescription>
                Results from automated security scans
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scanResults.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Scan Type</TableHead>
                      <TableHead>Tool</TableHead>
                      <TableHead>Findings</TableHead>
                      <TableHead>Critical</TableHead>
                      <TableHead>High</TableHead>
                      <TableHead>Medium</TableHead>
                      <TableHead>Low</TableHead>
                      <TableHead>Report</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scanResults.map((scan) => (
                      <TableRow key={scan.id}>
                        <TableCell>
                          {new Date(scan.scan_date).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {scan.scan_type.replace("_", " ")}
                        </TableCell>
                        <TableCell>{scan.scan_tool}</TableCell>
                        <TableCell>{scan.findings_count}</TableCell>
                        <TableCell>
                          <Badge className="bg-red-500">
                            {scan.critical_count}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-orange-500">
                            {scan.high_count}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-yellow-500 text-black">
                            {scan.medium_count}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-500">
                            {scan.low_count}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {scan.report_url ? (
                            <a
                              href={scan.report_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              View Report
                            </a>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p>No scan results are available.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityAuditDashboard;
