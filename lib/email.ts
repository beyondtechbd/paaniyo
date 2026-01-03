// lib/email.ts
// Email sending utility with multiple provider support

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailConfig {
  provider: 'resend' | 'sendgrid' | 'smtp';
  fromName: string;
  fromEmail: string;
  apiKey?: string;
}

// Get email config from environment or database
async function getEmailConfig(): Promise<EmailConfig> {
  // In production, you'd fetch these from database settings
  return {
    provider: (process.env.EMAIL_PROVIDER as EmailConfig['provider']) || 'resend',
    fromName: process.env.EMAIL_FROM_NAME || 'Paaniyo',
    fromEmail: process.env.EMAIL_FROM || 'noreply@paaniyo.com',
    apiKey: process.env.EMAIL_API_KEY,
  };
}

// Send email using configured provider
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const config = await getEmailConfig();
  
  if (!config.apiKey) {
    console.warn('Email API key not configured, skipping email send');
    return { success: false, error: 'Email not configured' };
  }

  try {
    switch (config.provider) {
      case 'resend':
        return await sendWithResend(config, options);
      case 'sendgrid':
        return await sendWithSendGrid(config, options);
      default:
        return { success: false, error: 'Unknown email provider' };
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
}

// Resend provider
async function sendWithResend(config: EmailConfig, options: EmailOptions) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${config.fromName} <${config.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send email via Resend');
  }

  return { success: true };
}

// SendGrid provider
async function sendWithSendGrid(config: EmailConfig, options: EmailOptions) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: options.to }] }],
      from: { email: config.fromEmail, name: config.fromName },
      subject: options.subject,
      content: [
        { type: 'text/html', value: options.html },
        ...(options.text ? [{ type: 'text/plain', value: options.text }] : []),
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to send email via SendGrid');
  }

  return { success: true };
}

// Email templates
export function getEmailVerificationTemplate(name: string, verifyUrl: string): { subject: string; html: string; text: string } {
  const subject = 'Verify your email - Paaniyo';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" style="max-width: 500px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; border: 1px solid #334155; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #22d3ee; font-size: 32px; font-weight: 700;">
                💧 Paaniyo
              </h1>
              <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">
                Premium Hydration Marketplace
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              <h2 style="margin: 0 0 16px; color: #f1f5f9; font-size: 24px; font-weight: 600;">
                Verify Your Email
              </h2>
              <p style="margin: 0 0 24px; color: #94a3b8; font-size: 16px; line-height: 1.6;">
                Hi ${name || 'there'},
              </p>
              <p style="margin: 0 0 24px; color: #94a3b8; font-size: 16px; line-height: 1.6;">
                Thanks for signing up! Please verify your email address by clicking the button below:
              </p>
              
              <!-- Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="${verifyUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link:
              </p>
              <p style="margin: 8px 0 24px; padding: 12px; background: #1e293b; border-radius: 8px; color: #22d3ee; font-size: 12px; word-break: break-all;">
                ${verifyUrl}
              </p>
              
              <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background: #0f172a; border-top: 1px solid #334155; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                © 2026 Paaniyo. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Verify Your Email - Paaniyo

Hi ${name || 'there'},

Thanks for signing up! Please verify your email address by clicking the link below:

${verifyUrl}

This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.

© 2026 Paaniyo
  `.trim();

  return { subject, html, text };
}

export function getPasswordResetTemplate(name: string, resetUrl: string): { subject: string; html: string; text: string } {
  const subject = 'Reset your password - Paaniyo';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" style="max-width: 500px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; border: 1px solid #334155; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #22d3ee; font-size: 32px; font-weight: 700;">
                💧 Paaniyo
              </h1>
              <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">
                Premium Hydration Marketplace
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              <h2 style="margin: 0 0 16px; color: #f1f5f9; font-size: 24px; font-weight: 600;">
                Reset Your Password
              </h2>
              <p style="margin: 0 0 24px; color: #94a3b8; font-size: 16px; line-height: 1.6;">
                Hi ${name || 'there'},
              </p>
              <p style="margin: 0 0 24px; color: #94a3b8; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password. Click the button below to create a new password:
              </p>
              
              <!-- Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f97316 0%, #ef4444 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link:
              </p>
              <p style="margin: 8px 0 24px; padding: 12px; background: #1e293b; border-radius: 8px; color: #22d3ee; font-size: 12px; word-break: break-all;">
                ${resetUrl}
              </p>
              
              <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                This link expires in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background: #0f172a; border-top: 1px solid #334155; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                © 2026 Paaniyo. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Reset Your Password - Paaniyo

Hi ${name || 'there'},

We received a request to reset your password. Click the link below to create a new password:

${resetUrl}

This link expires in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you have concerns.

© 2026 Paaniyo
  `.trim();

  return { subject, html, text };
}

export function getOrderConfirmationTemplate(
  name: string,
  orderNumber: string,
  items: Array<{ name: string; quantity: number; price: number }>,
  total: number,
  shippingAddress: string
): { subject: string; html: string; text: string } {
  const subject = `Order Confirmed #${orderNumber} - Paaniyo`;
  
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #334155; color: #f1f5f9;">
        ${item.name} × ${item.quantity}
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #334155; color: #f1f5f9; text-align: right;">
        ৳${item.price.toLocaleString()}
      </td>
    </tr>
  `).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmed</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" style="max-width: 500px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; border: 1px solid #334155; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #22d3ee; font-size: 32px; font-weight: 700;">
                💧 Paaniyo
              </h1>
            </td>
          </tr>
          
          <!-- Success Icon -->
          <tr>
            <td style="padding: 20px 40px; text-align: center;">
              <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; line-height: 64px; font-size: 32px;">
                ✓
              </div>
              <h2 style="margin: 16px 0 8px; color: #f1f5f9; font-size: 24px; font-weight: 600;">
                Order Confirmed!
              </h2>
              <p style="margin: 0; color: #94a3b8; font-size: 14px;">
                Order #${orderNumber}
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              <p style="margin: 0 0 24px; color: #94a3b8; font-size: 16px; line-height: 1.6;">
                Hi ${name || 'there'}, thank you for your order! We're getting it ready for you.
              </p>
              
              <!-- Order Items -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                ${itemsHtml}
                <tr>
                  <td style="padding: 16px 0; color: #f1f5f9; font-weight: 600; font-size: 18px;">
                    Total
                  </td>
                  <td style="padding: 16px 0; color: #22d3ee; font-weight: 600; font-size: 18px; text-align: right;">
                    ৳${total.toLocaleString()}
                  </td>
                </tr>
              </table>
              
              <!-- Shipping Address -->
              <div style="padding: 16px; background: #1e293b; border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                  Shipping To
                </p>
                <p style="margin: 0; color: #f1f5f9; font-size: 14px; line-height: 1.5;">
                  ${shippingAddress}
                </p>
              </div>
              
              <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                We'll send you another email when your order ships. You can track your order in your account.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background: #0f172a; border-top: 1px solid #334155; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                © 2026 Paaniyo. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const itemsText = items.map(item => `  - ${item.name} × ${item.quantity}: ৳${item.price.toLocaleString()}`).join('\n');

  const text = `
Order Confirmed #${orderNumber} - Paaniyo

Hi ${name || 'there'},

Thank you for your order! We're getting it ready for you.

Order Items:
${itemsText}

Total: ৳${total.toLocaleString()}

Shipping To:
${shippingAddress}

We'll send you another email when your order ships. You can track your order in your account.

© 2026 Paaniyo
  `.trim();

  return { subject, html, text };
}
