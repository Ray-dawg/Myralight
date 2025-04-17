#!/usr/bin/env node

/**
 * Security Scan Script
 *
 * This script replaces the GitHub workflow security scan with a local solution
 * that can be run manually or as part of your CI/CD pipeline without requiring
 * GitHub workflow permissions.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const REPORT_DIR = path.join(__dirname, "../security-reports");

// Create reports directory if it doesn't exist
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

function runCommand(command, errorMessage) {
  try {
    console.log(`Running: ${command}`);
    const output = execSync(command, { encoding: "utf8" });
    return output;
  } catch (error) {
    console.error(`${errorMessage}:\n${error.message}`);
    return null;
  }
}

function runDependencyCheck() {
  console.log("\n🔍 Running dependency vulnerability scan...");

  // Using npm audit which is built-in
  const auditReport = runCommand(
    "npm audit --json > " +
      path.join(REPORT_DIR, `npm-audit-${timestamp}.json`),
    "Failed to run npm audit",
  );

  // Run snyk test if available
  runCommand(
    "npx snyk test --json > " + path.join(REPORT_DIR, `snyk-${timestamp}.json`),
    "Failed to run Snyk test (this is optional)",
  );

  console.log("✅ Dependency check complete");
}

function runStaticCodeAnalysis() {
  console.log("\n🔍 Running static code analysis...");

  // Run ESLint security plugin
  runCommand(
    "npx eslint . --ext .js,.jsx,.ts,.tsx --config .eslintrc.security.json --format json > " +
      path.join(REPORT_DIR, `eslint-security-${timestamp}.json`),
    "Failed to run ESLint security scan",
  );

  console.log("✅ Static code analysis complete");
}

function generateSummaryReport() {
  console.log("\n📊 Generating summary report...");

  const summaryPath = path.join(
    REPORT_DIR,
    `security-summary-${timestamp}.txt`,
  );
  let summaryContent = `Security Scan Summary (${new Date().toISOString()})\n\n`;

  // Add npm audit summary
  try {
    const auditFile = path.join(REPORT_DIR, `npm-audit-${timestamp}.json`);
    if (fs.existsSync(auditFile)) {
      const auditData = JSON.parse(fs.readFileSync(auditFile, "utf8"));
      summaryContent += "NPM Audit Results:\n";
      if (auditData.metadata) {
        summaryContent += `- Vulnerabilities: ${auditData.metadata.vulnerabilities.total}\n`;
        summaryContent += `- Critical: ${auditData.metadata.vulnerabilities.critical}\n`;
        summaryContent += `- High: ${auditData.metadata.vulnerabilities.high}\n`;
        summaryContent += `- Moderate: ${auditData.metadata.vulnerabilities.moderate}\n`;
        summaryContent += `- Low: ${auditData.metadata.vulnerabilities.low}\n`;
      }
      summaryContent += "\n";
    }
  } catch (error) {
    summaryContent += "Error parsing npm audit results\n\n";
  }

  // Add ESLint summary
  try {
    const eslintFile = path.join(
      REPORT_DIR,
      `eslint-security-${timestamp}.json`,
    );
    if (fs.existsSync(eslintFile)) {
      const eslintData = JSON.parse(fs.readFileSync(eslintFile, "utf8"));
      let errorCount = 0;
      let warningCount = 0;

      if (Array.isArray(eslintData)) {
        eslintData.forEach((file) => {
          errorCount += file.errorCount || 0;
          warningCount += file.warningCount || 0;
        });
      }

      summaryContent += "ESLint Security Results:\n";
      summaryContent += `- Errors: ${errorCount}\n`;
      summaryContent += `- Warnings: ${warningCount}\n\n`;
    }
  } catch (error) {
    summaryContent += "Error parsing ESLint security results\n\n";
  }

  // Write summary to file
  fs.writeFileSync(summaryPath, summaryContent);
  console.log(`Summary report saved to: ${summaryPath}`);
}

// Main execution
console.log("🛡️  Starting security scan...");
runDependencyCheck();
runStaticCodeAnalysis();
generateSummaryReport();
console.log(
  "\n✅ Security scan complete! Check the security-reports directory for results.",
);
