#!/usr/bin/env node

/**
 * Local security audit script
 * This script runs various security checks locally during development
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Create reports directory if it doesn't exist
const reportsDir = path.join(__dirname, "../security-reports");
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

console.log("🔒 Starting security audit...");

try {
  // Run npm audit
  console.log("\n📦 Checking npm dependencies...");
  const npmAuditResult = execSync("npm audit --json").toString();
  fs.writeFileSync(path.join(reportsDir, "npm-audit.json"), npmAuditResult);
  console.log("✅ npm audit completed");

  // Parse and display summary
  const auditData = JSON.parse(npmAuditResult);
  console.log(
    `Found vulnerabilities: ${auditData.metadata.vulnerabilities.total}`,
  );
  console.log(`  Critical: ${auditData.metadata.vulnerabilities.critical}`);
  console.log(`  High: ${auditData.metadata.vulnerabilities.high}`);
  console.log(`  Moderate: ${auditData.metadata.vulnerabilities.moderate}`);
  console.log(`  Low: ${auditData.metadata.vulnerabilities.low}`);
} catch (error) {
  console.log("⚠️ npm audit found issues:");
  try {
    const errorOutput = error.stdout.toString();
    fs.writeFileSync(path.join(reportsDir, "npm-audit.json"), errorOutput);

    // Try to parse the JSON output even if the command failed
    const auditData = JSON.parse(errorOutput);
    console.log(
      `Found vulnerabilities: ${auditData.metadata.vulnerabilities.total}`,
    );
    console.log(`  Critical: ${auditData.metadata.vulnerabilities.critical}`);
    console.log(`  High: ${auditData.metadata.vulnerabilities.high}`);
    console.log(`  Moderate: ${auditData.metadata.vulnerabilities.moderate}`);
    console.log(`  Low: ${auditData.metadata.vulnerabilities.low}`);
  } catch (parseError) {
    console.error("Error parsing npm audit output:", parseError);
    fs.writeFileSync(
      path.join(reportsDir, "npm-audit-error.log"),
      error.toString(),
    );
  }
}

// Run Snyk test if available
try {
  console.log("\n🛡️ Running Snyk security test...");
  const snykResult = execSync("npx snyk test --json").toString();
  fs.writeFileSync(path.join(reportsDir, "snyk-test.json"), snykResult);
  console.log("✅ Snyk test completed");
} catch (error) {
  console.log("⚠️ Snyk test found issues or failed to run:");
  try {
    const errorOutput = error.stdout
      ? error.stdout.toString()
      : error.toString();
    fs.writeFileSync(path.join(reportsDir, "snyk-test-error.log"), errorOutput);
  } catch (writeError) {
    console.error("Error saving Snyk output:", writeError);
  }
}

// Check for outdated packages
try {
  console.log("\n📦 Checking for outdated packages...");
  const outdatedResult = execSync("npm outdated --json").toString();
  fs.writeFileSync(path.join(reportsDir, "npm-outdated.json"), outdatedResult);
  console.log("✅ Outdated packages check completed");

  // Count outdated packages
  const outdatedData = JSON.parse(outdatedResult);
  const outdatedCount = Object.keys(outdatedData).length;
  console.log(`Found ${outdatedCount} outdated packages`);
} catch (error) {
  console.log("⚠️ Error checking outdated packages:");
  fs.writeFileSync(
    path.join(reportsDir, "npm-outdated-error.log"),
    error.toString(),
  );
}

// Check for known security issues in the codebase
try {
  console.log("\n🔍 Scanning code for security issues...");

  // List of patterns to search for
  const securityPatterns = [
    { pattern: "password", description: "Potential hardcoded password" },
    { pattern: "apiKey", description: "Potential hardcoded API key" },
    { pattern: "secret", description: "Potential hardcoded secret" },
    {
      pattern: "dangerouslySetInnerHTML",
      description: "Potential XSS vulnerability",
    },
    { pattern: "eval\\(", description: "Dangerous eval() usage" },
    { pattern: "innerHTML", description: "Potential DOM-based XSS" },
    { pattern: "document\\.write", description: "Unsafe document.write usage" },
    {
      pattern: "\\.innerText",
      description: "Potential DOM manipulation issue",
    },
    {
      pattern: "Object\\.assign\\({}, ",
      description: "Potential prototype pollution",
    },
    {
      pattern: "new Function\\(",
      description: "Dangerous Function constructor usage",
    },
    { pattern: "localStorage", description: "Client-side storage usage" },
    { pattern: "sessionStorage", description: "Client-side storage usage" },
    { pattern: "\\.exec\\(", description: "Potential unsafe RegExp execution" },
    {
      pattern: "Math\\.random\\(\\)",
      description: "Non-cryptographic random number generation",
    },
    { pattern: "http:", description: "Non-HTTPS URL" },
  ];

  // Results object
  const results = [];

  // Search for patterns in source files
  const sourceDir = path.join(__dirname, "../src");
  const findCmd = `find ${sourceDir} -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx"`;
  const sourceFiles = execSync(findCmd).toString().split("\n").filter(Boolean);

  sourceFiles.forEach((file) => {
    const content = fs.readFileSync(file, "utf8");

    securityPatterns.forEach(({ pattern, description }) => {
      const regex = new RegExp(pattern, "g");
      let match;

      while ((match = regex.exec(content)) !== null) {
        // Get the line number
        const lineNumber = content.substring(0, match.index).split("\n").length;

        // Get the line content
        const lines = content.split("\n");
        const lineContent = lines[lineNumber - 1].trim();

        results.push({
          file: path.relative(path.join(__dirname, ".."), file),
          line: lineNumber,
          pattern,
          description,
          content: lineContent,
        });
      }
    });
  });

  // Write results to file
  fs.writeFileSync(
    path.join(reportsDir, "code-scan-results.json"),
    JSON.stringify(results, null, 2),
  );

  console.log(
    `✅ Code scan completed. Found ${results.length} potential issues.`,
  );

  // Display summary of findings
  if (results.length > 0) {
    console.log("\nPotential security issues found:");
    results.forEach((issue) => {
      console.log(`- ${issue.file}:${issue.line} - ${issue.description}`);
    });
  }
} catch (error) {
  console.error("Error scanning code:", error);
  fs.writeFileSync(
    path.join(reportsDir, "code-scan-error.log"),
    error.toString(),
  );
}

// Run ESLint with security plugin if available
try {
  console.log("\n🔍 Running ESLint with security plugin...");
  const eslintResult = execSync(
    "npx eslint --ext .js,.jsx,.ts,.tsx src/ --no-eslintrc --config .eslintrc.security.json || true",
  ).toString();
  fs.writeFileSync(path.join(reportsDir, "eslint-security.log"), eslintResult);
  console.log("✅ ESLint security check completed");
} catch (error) {
  console.log("⚠️ Error running ESLint security check:");
  fs.writeFileSync(
    path.join(reportsDir, "eslint-security-error.log"),
    error.toString(),
  );
}

// Create a summary report
try {
  const summary = {
    timestamp: new Date().toISOString(),
    npmAudit: fs.existsSync(path.join(reportsDir, "npm-audit.json")),
    snykTest: fs.existsSync(path.join(reportsDir, "snyk-test.json")),
    outdatedPackages: fs.existsSync(path.join(reportsDir, "npm-outdated.json")),
    codeScan: fs.existsSync(path.join(reportsDir, "code-scan-results.json")),
    eslintSecurity: fs.existsSync(path.join(reportsDir, "eslint-security.log")),
  };

  fs.writeFileSync(
    path.join(reportsDir, "summary.json"),
    JSON.stringify(summary, null, 2),
  );
} catch (error) {
  console.error("Error creating summary report:", error);
}

console.log(
  "\n🔒 Security audit completed. Reports saved to security-reports directory.",
);

// Create a .eslintrc.security.json file if it doesn't exist
const eslintSecurityConfigPath = path.join(
  __dirname,
  "../.eslintrc.security.json",
);
if (!fs.existsSync(eslintSecurityConfigPath)) {
  const eslintSecurityConfig = {
    extends: ["plugin:security/recommended"],
    plugins: ["security"],
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      ecmaFeatures: {
        jsx: true,
      },
    },
    rules: {
      "security/detect-buffer-noassert": "error",
      "security/detect-child-process": "error",
      "security/detect-disable-mustache-escape": "error",
      "security/detect-eval-with-expression": "error",
      "security/detect-no-csrf-before-method-override": "error",
      "security/detect-non-literal-fs-filename": "error",
      "security/detect-non-literal-regexp": "error",
      "security/detect-non-literal-require": "error",
      "security/detect-object-injection": "warn",
      "security/detect-possible-timing-attacks": "error",
      "security/detect-pseudoRandomBytes": "error",
      "security/detect-unsafe-regex": "error",
    },
  };

  fs.writeFileSync(
    eslintSecurityConfigPath,
    JSON.stringify(eslintSecurityConfig, null, 2),
  );
  console.log("Created .eslintrc.security.json for security linting");
}
