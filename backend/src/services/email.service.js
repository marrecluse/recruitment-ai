const nodemailer = require('nodemailer');

const STAGE_LABELS = {
  applied:     'Application Received',
  shortlisted: 'Shortlisted',
  reviewed:    'Under Review',
  interview:   'Interview Scheduled',
  offer:       'Offer Extended',
  hired:       'Hired 🎉',
  rejected:    'Application Unsuccessful',
};

const STAGE_COLORS = {
  applied:     '#818CF8',
  shortlisted: '#60A5FA',
  reviewed:    '#60A5FA',
  interview:   '#F59E0B',
  offer:       '#10B981',
  hired:       '#059669',
  rejected:    '#EF4444',
};

function createTransport() {
  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST   || 'smtp.gmail.com',
    port:   Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

// ── Stage change → candidate ─────────────────────────────────
async function sendStageChangeEmail({ to, candidateName, jobTitle, company, stage }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return; // silently skip if not configured

  const label = STAGE_LABELS[stage] || stage;
  const color = STAGE_COLORS[stage] || '#4F46E5';

  const stageMessages = {
    shortlisted: `Great news! Your profile stood out and you have been shortlisted for <strong>${jobTitle}</strong>.`,
    reviewed:    `Your application for <strong>${jobTitle}</strong> is currently under review by the hiring team.`,
    interview:   `Congratulations! You have been selected for an interview for <strong>${jobTitle}</strong>. The recruiter will be in touch with details shortly.`,
    offer:       `Exciting news! You have received a job offer for <strong>${jobTitle}</strong> at ${company}. Please log in to view the details.`,
    hired:       `Welcome aboard! You have been officially hired for <strong>${jobTitle}</strong> at ${company}. Congratulations! 🎉`,
    rejected:    `Thank you for your interest in <strong>${jobTitle}</strong> at ${company}. After careful consideration, we will not be moving forward with your application at this time. We encourage you to apply for future openings.`,
  };

  const message = stageMessages[stage] || `Your application status for <strong>${jobTitle}</strong> has been updated to <strong>${label}</strong>.`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#4F46E5,#6366F1);padding:32px 40px;text-align:center;">
          <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">RecruitAI</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:4px;">Application Update</div>
        </td></tr>
        <!-- Status badge -->
        <tr><td style="padding:32px 40px 0;text-align:center;">
          <div style="display:inline-block;background:${color}1A;border:1.5px solid ${color};color:${color};font-size:13px;font-weight:700;padding:6px 18px;border-radius:20px;letter-spacing:0.3px;">
            ${label}
          </div>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:24px 40px 32px;">
          <p style="margin:0 0 16px;font-size:15px;color:#1E293B;">Hi <strong>${candidateName}</strong>,</p>
          <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">${message}</p>
          <div style="background:#F8FAFC;border-left:3px solid ${color};border-radius:4px;padding:14px 16px;margin-bottom:24px;">
            <div style="font-size:11px;color:#94A3B8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Position</div>
            <div style="font-size:15px;font-weight:700;color:#0F172A;">${jobTitle}</div>
            <div style="font-size:13px;color:#64748B;margin-top:2px;">${company}</div>
          </div>
          <div style="text-align:center;">
            <a href="${process.env.FRONTEND_URL || 'http://51.68.197.138:5173'}/candidate/applications"
               style="display:inline-block;background:#4F46E5;color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:8px;">
              View My Applications
            </a>
          </div>
        </td></tr>
        <!-- Footer -->
        <tr><td style="border-top:1px solid #F1F5F9;padding:20px 40px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#94A3B8;">You're receiving this because you applied via RecruitAI. © ${new Date().getFullYear()} RecruitAI</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await createTransport().sendMail({
    from:    `"RecruitAI" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Application Update: ${label} — ${jobTitle}`,
    html,
  });
}

// ── New application → recruiter ──────────────────────────────
async function sendNewApplicationEmail({ to, recruiterName, candidateName, candidateEmail, jobTitle, score }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

  const scoreColor = score >= 0.7 ? '#10B981' : score >= 0.4 ? '#F59E0B' : '#EF4444';
  const scorePct   = Math.round((score || 0) * 100);

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#0F172A,#1E293B);padding:32px 40px;text-align:center;">
          <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">RecruitAI</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px;">New Application Received</div>
        </td></tr>
        <tr><td style="padding:32px 40px 0;text-align:center;">
          <div style="width:56px;height:56px;border-radius:50%;background:#EEF2FF;display:inline-flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#4F46E5;margin-bottom:8px;">
            ${candidateName.charAt(0).toUpperCase()}
          </div>
          <div style="font-size:18px;font-weight:700;color:#0F172A;">${candidateName}</div>
          <div style="font-size:13px;color:#64748B;">${candidateEmail}</div>
        </td></tr>
        <tr><td style="padding:24px 40px 32px;">
          <p style="margin:0 0 16px;font-size:15px;color:#1E293B;">Hi <strong>${recruiterName}</strong>,</p>
          <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
            A new candidate has applied to <strong>${jobTitle}</strong>.
          </p>
          <div style="background:#F8FAFC;border-radius:8px;padding:16px;margin-bottom:24px;border:1px solid #E2E8F0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:4px 0;">
                  <span style="font-size:12px;color:#94A3B8;">Position</span><br>
                  <span style="font-size:14px;font-weight:700;color:#0F172A;">${jobTitle}</span>
                </td>
                <td style="padding:4px 0;text-align:right;">
                  <span style="font-size:12px;color:#94A3B8;">AI Match Score</span><br>
                  <span style="font-size:20px;font-weight:800;color:${scoreColor};">${scorePct}%</span>
                </td>
              </tr>
            </table>
          </div>
          <div style="text-align:center;">
            <a href="${process.env.FRONTEND_URL || 'http://51.68.197.138:5173'}/recruiter/candidates"
               style="display:inline-block;background:#4F46E5;color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:8px;">
              Review Application
            </a>
          </div>
        </td></tr>
        <tr><td style="border-top:1px solid #F1F5F9;padding:20px 40px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#94A3B8;">RecruitAI Recruiter Portal © ${new Date().getFullYear()}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await createTransport().sendMail({
    from:    `"RecruitAI" <${process.env.EMAIL_USER}>`,
    to,
    subject: `New Application: ${candidateName} applied for ${jobTitle} (${scorePct}% match)`,
    html,
  });
}


// ── Password reset → user ────────────────────────────────────
async function sendPasswordResetEmail({ to, name, resetCode, expiresIn }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#4F46E5,#7C3AED);padding:32px 40px;text-align:center;">
          <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">RecruitAI</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:4px;">Password Reset</div>
        </td></tr>
        <tr><td style="padding:36px 40px 12px;">
          <p style="margin:0 0 16px;font-size:15px;color:#1E293B;">Hi <strong>${name}</strong>,</p>
          <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.6;">
            We received a request to reset your RecruitAI password. Use the code below — it expires in <strong>${expiresIn}</strong>.
          </p>
          <div style="text-align:center;margin-bottom:28px;">
            <div style="display:inline-block;background:#EEF2FF;border:2px solid #C7D2FE;border-radius:12px;padding:20px 40px;">
              <div style="font-size:11px;font-weight:700;color:#6366F1;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px;">Your Reset Code</div>
              <div style="font-size:36px;font-weight:800;color:#4F46E5;letter-spacing:0.18em;font-family:monospace;">${resetCode}</div>
            </div>
          </div>
          <p style="margin:0 0 28px;font-size:13px;color:#94A3B8;text-align:center;line-height:1.6;">
            If you did not request a password reset, you can safely ignore this email.<br>
            Your password will not be changed until you use this code.
          </p>
          <div style="text-align:center;">
            <a href="${process.env.FRONTEND_URL || 'http://51.68.197.138:5173'}/reset-password"
               style="display:inline-block;background:#4F46E5;color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:8px;">
              Reset My Password →
            </a>
          </div>
        </td></tr>
        <tr><td style="border-top:1px solid #F1F5F9;padding:20px 40px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#94A3B8;">© ${new Date().getFullYear()} RecruitAI · This link expires in ${expiresIn}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await createTransport().sendMail({
    from:    `"RecruitAI" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Your RecruitAI password reset code: ${resetCode}`,
    html,
  });
}

module.exports = { sendStageChangeEmail, sendNewApplicationEmail, sendPasswordResetEmail };
