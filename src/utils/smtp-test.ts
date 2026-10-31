import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export interface SmtpDiagnosticResult {
  success: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  message: string;
  errorCode?: string;
}

/**
 * Attempts a live SMTP handshake and credential verification against the configured
 * environment variables (with automatic diagnostic check on fallback port 587/465).
 */
export async function runSmtpDiagnostic(): Promise<SmtpDiagnosticResult> {
  const host = (process.env.SMTP_HOST || 'mailserver.businessidentity.llc').trim();
  const configuredPort = Number(process.env.SMTP_PORT || 465);
  const user = (process.env.SMTP_USER || '').trim();
  const pass = process.env.SMTP_PASS || '';
  const secureEnv = process.env.SMTP_SECURE;
  const secure = secureEnv !== undefined ? secureEnv !== 'false' && configuredPort === 465 : configuredPort === 465;

  console.log('==============================================================');
  console.log('Golden Mind Psychiatry PLLC — SMTP Credential Diagnostic');
  console.log('==============================================================');
  console.log(`SMTP_HOST   : ${host}`);
  console.log(`SMTP_PORT   : ${configuredPort}`);
  console.log(`SMTP_SECURE : ${secure}`);
  console.log(`SMTP_USER   : ${user || '(NOT SET)'}`);
  console.log(`SMTP_PASS   : ${pass ? `******** (${pass.length} chars)` : '(NOT SET)'}`);
  console.log('--------------------------------------------------------------');

  if (!host || !user || !pass) {
    const missing: string[] = [];
    if (!host) missing.push('SMTP_HOST');
    if (!user) missing.push('SMTP_USER');
    if (!pass) missing.push('SMTP_PASS');
    const msg = `SMTP Diagnostic FAILED: Missing required environment variable(s): ${missing.join(', ')}`;
    console.error(`[FAIL] ${msg}`);
    return {
      success: false,
      host,
      port: configuredPort,
      secure,
      user,
      message: msg,
      errorCode: 'MISSING_ENV_VARS',
    };
  }

  // 1. Test primary configured port
  try {
    console.log(`[TEST] Connecting to ${host}:${configuredPort} (secure=${secure})...`);
    const primaryTransporter = nodemailer.createTransport({
      host,
      port: configuredPort,
      secure,
      requireTLS: configuredPort === 587,
      auth: { user, pass },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      tls: {
        minVersion: 'TLSv1.2',
      },
    });

    await primaryTransporter.verify();
    const okMsg = `SMTP Connection & Credentials VERIFIED successfully on ${host}:${configuredPort} (secure=${secure}) for ${user}!`;
    console.log(`[SUCCESS] ${okMsg}`);
    return {
      success: true,
      host,
      port: configuredPort,
      secure,
      user,
      message: okMsg,
    };
  } catch (primaryErr: unknown) {
    const errCode = (primaryErr as { code?: string })?.code || 'UNKNOWN';
    const errMsg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
    console.warn(`[WARN] Primary port ${configuredPort} failed (${errCode}): ${errMsg}`);

    // 2. Test alternate port (587 STARTTLS vs 465 SSL/TLS)
    const fallbackPort = configuredPort === 465 ? 587 : 465;
    const fallbackSecure = fallbackPort === 465;
    try {
      console.log(
        `[TEST] Retrying on alternate port ${host}:${fallbackPort} (secure=${fallbackSecure})...`
      );
      const fallbackTransporter = nodemailer.createTransport({
        host,
        port: fallbackPort,
        secure: fallbackSecure,
        requireTLS: fallbackPort === 587,
        auth: { user, pass },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        tls: {
          minVersion: 'TLSv1.2',
        },
      });

      await fallbackTransporter.verify();
      const fallbackOkMsg = `SMTP Connection & Credentials VERIFIED on alternate port ${host}:${fallbackPort} (secure=${fallbackSecure})! Tip: Update SMTP_PORT=${fallbackPort} and SMTP_SECURE=${fallbackSecure}.`;
      console.log(`[SUCCESS] ${fallbackOkMsg}`);
      return {
        success: true,
        host,
        port: fallbackPort,
        secure: fallbackSecure,
        user,
        message: fallbackOkMsg,
      };
    } catch (fallbackErr: unknown) {
      const fbCode = (fallbackErr as { code?: string })?.code || errCode;
      const fbMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
      const finalMsg = `SMTP Connection FAILED on both port ${configuredPort} (${errMsg}) and port ${fallbackPort} (${fbMsg}). Please verify SMTP_HOST, SMTP_USER, and SMTP_PASS.`;
      console.error(`[FAIL] ${finalMsg}`);
      return {
        success: false,
        host,
        port: configuredPort,
        secure,
        user,
        message: finalMsg,
        errorCode: fbCode,
      };
    }
  }
}

// Run immediately when invoked directly via `npx tsx src/utils/smtp-test.ts`
const isDirectExecution =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv.some((arg) => arg.includes('smtp-test'));

if (isDirectExecution) {
  runSmtpDiagnostic()
    .then((result) => {
      if (!result.success) {
        process.exitCode = 1;
      }
    })
    .catch((err) => {
      console.error('[FATAL] Unexpected error during SMTP diagnostic:', err);
      process.exitCode = 1;
    });
}
