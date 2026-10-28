import { Router } from "express";

export const careerNotificationsRouter = Router();

const clean = (value: unknown, maxLength = 2000) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

careerNotificationsRouter.post("/application-notification", async (req, res) => {
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.CAREER_NOTIFICATION_EMAIL;
  const sender = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !recipient || !sender) {
    res.status(503).json({ error: "Career email notifications are not configured." });
    return;
  }

  const applicant = clean(req.body?.full_name, 160);
  const applicantEmail = clean(req.body?.email, 254);
  const phone = clean(req.body?.phone, 80);
  const jobTitle = clean(req.body?.position_applied_for, 160) || `Job #${clean(req.body?.job_id, 30)}`;
  const experience = clean(req.body?.experience, 300);
  const location = clean(req.body?.current_location, 160);
  const portfolio = clean(req.body?.portfolio_link, 500);
  const message = clean(req.body?.message, 4000);

  if (!applicant || !/^\S+@\S+\.\S+$/.test(applicantEmail) || !jobTitle) {
    res.status(400).json({ error: "Applicant name, valid email, and job title are required." });
    return;
  }

  const htmlEntities: Record<string, string> = {
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  };
  const safe = (value: string) => value.replace(/[&<>"']/g, (char) => htmlEntities[char] ?? char);
  const rows = [
    ["Applicant", applicant], ["Email", applicantEmail], ["Phone", phone],
    ["Position", jobTitle], ["Experience", experience], ["Location", location],
    ["Portfolio", portfolio],
  ].map(([label, value]) => `<p><strong>${safe(label)}:</strong> ${safe(value)}</p>`).join("");
  const html = `<h2>New career application</h2>${rows}<p><strong>Message:</strong></p><p>${safe(message).replace(/\n/g, "<br>")}</p>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: sender,
      to: [recipient],
      reply_to: applicantEmail,
      subject: `New job application: ${jobTitle} - ${applicant}`,
      html,
    }),
  });

  if (!response.ok) {
    console.error("Career notification email failed:", response.status, await response.text());
    res.status(502).json({ error: "The application was saved, but its notification email failed." });
    return;
  }

  res.json({ success: true });
});
