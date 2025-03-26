/**
 * Email templates for authentication-related emails
 */

// Base template with common styling
const baseTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f9f9f9;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 1px solid #eaeaea;
    }
    .logo {
      max-width: 150px;
      height: auto;
    }
    .content {
      padding: 30px 20px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #0070f3;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #0051a8;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 12px;
      border-top: 1px solid #eaeaea;
    }
    @media only screen and (max-width: 600px) {
      .container {
        width: 100%;
        border-radius: 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=trucking" alt="Logo" class="logo">
      <h2>Modern Trucking Platform</h2>
    </div>
    <div class="content">
      {{content}}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Modern Trucking Platform. All rights reserved.</p>
      <p>If you didn't request this email, please ignore it or contact support.</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Email verification template
 * @param username User's name or email
 * @param verificationUrl URL for email verification
 * @returns Formatted HTML email
 */
export const emailVerificationTemplate = (
  username: string,
  verificationUrl: string,
): string => {
  const content = `
    <h3>Verify Your Email Address</h3>
    <p>Hello ${username},</p>
    <p>Thank you for registering with Modern Trucking Platform. To complete your registration, please verify your email address by clicking the button below:</p>
    <div style="text-align: center;">
      <a href="${verificationUrl}" class="button">Verify Email Address</a>
    </div>
    <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
    <p style="word-break: break-all; font-size: 12px;">${verificationUrl}</p>
    <p>This link will expire in 24 hours.</p>
    <p>Welcome aboard!</p>
    <p>The Modern Trucking Team</p>
  `;

  return baseTemplate.replace("{{content}}", content);
};

/**
 * Password reset template
 * @param username User's name or email
 * @param resetUrl URL for password reset
 * @returns Formatted HTML email
 */
export const passwordResetTemplate = (
  username: string,
  resetUrl: string,
): string => {
  const content = `
    <h3>Reset Your Password</h3>
    <p>Hello ${username},</p>
    <p>We received a request to reset your password for your Modern Trucking Platform account. Click the button below to set a new password:</p>
    <div style="text-align: center;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </div>
    <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
    <p style="word-break: break-all; font-size: 12px;">${resetUrl}</p>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request a password reset, please ignore this email or contact our support team if you have concerns.</p>
    <p>The Modern Trucking Team</p>
  `;

  return baseTemplate.replace("{{content}}", content);
};

/**
 * Magic link login template
 * @param username User's name or email
 * @param magicLinkUrl URL for passwordless login
 * @returns Formatted HTML email
 */
export const magicLinkTemplate = (
  username: string,
  magicLinkUrl: string,
): string => {
  const content = `
    <h3>Your Login Link</h3>
    <p>Hello ${username},</p>
    <p>Here's your secure login link for Modern Trucking Platform. Click the button below to log in:</p>
    <div style="text-align: center;">
      <a href="${magicLinkUrl}" class="button">Log In</a>
    </div>
    <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
    <p style="word-break: break-all; font-size: 12px;">${magicLinkUrl}</p>
    <p>This link will expire in 10 minutes and can only be used once.</p>
    <p>The Modern Trucking Team</p>
  `;

  return baseTemplate.replace("{{content}}", content);
};

/**
 * MFA setup confirmation template
 * @param username User's name or email
 * @returns Formatted HTML email
 */
export const mfaSetupTemplate = (username: string): string => {
  const content = `
    <h3>Multi-Factor Authentication Enabled</h3>
    <p>Hello ${username},</p>
    <p>This email confirms that Multi-Factor Authentication (MFA) has been successfully set up for your Modern Trucking Platform account.</p>
    <p>Your account is now more secure. You will be required to enter a verification code from your authenticator app when logging in.</p>
    <p>If you did not enable MFA on your account, please contact our support team immediately.</p>
    <p>The Modern Trucking Team</p>
  `;

  return baseTemplate.replace("{{content}}", content);
};

/**
 * Account activity notification template
 * @param username User's name or email
 * @param activityDetails Details of the account activity
 * @param timestamp Time of the activity
 * @param ipAddress IP address from which the activity originated
 * @param deviceInfo Device information
 * @returns Formatted HTML email
 */
export const accountActivityTemplate = (
  username: string,
  activityDetails: string,
  timestamp: string,
  ipAddress: string,
  deviceInfo: string,
): string => {
  const content = `
    <h3>Account Activity Notification</h3>
    <p>Hello ${username},</p>
    <p>We detected the following activity on your Modern Trucking Platform account:</p>
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin: 15px 0;">
      <p><strong>Activity:</strong> ${activityDetails}</p>
      <p><strong>Time:</strong> ${timestamp}</p>
      <p><strong>IP Address:</strong> ${ipAddress}</p>
      <p><strong>Device:</strong> ${deviceInfo}</p>
    </div>
    <p>If this was you, no further action is needed.</p>
    <p>If you don't recognize this activity, please secure your account by changing your password immediately and contact our support team.</p>
    <p>The Modern Trucking Team</p>
  `;

  return baseTemplate.replace("{{content}}", content);
};
