import { supabase } from "@/lib/supabase";

export type JobStatus = "active" | "inactive";

export interface JobPost {
  id: number;
  title: string;
  department: string;
  job_type: string;
  work_mode: string;
  location: string;
  experience: string;
  salary_range?: string | null;
  short_description: string;
  full_description: string;
  responsibilities: string;
  skills: string;
  qualification: string;
  open_positions: number;
  application_deadline?: string | null;
  status: JobStatus;
  created_at?: string;
  updated_at?: string;
}

export interface JobApplication {
  id: number;
  job_id: number;
  job_title?: string;
  full_name: string;
  email: string;
  phone: string;
  experience: string;
  current_location: string;
  resume_file: string;
  portfolio_link?: string | null;
  message: string;
  created_at: string;
}

export type JobPayload = Omit<JobPost, "id" | "created_at" | "updated_at">;

const RESUME_BUCKET = "job-resumes";

const normalizeJob = (row: any): JobPost => ({
  id: Number(row.id),
  title: row.title ?? "",
  department: row.department ?? "",
  job_type: row.job_type ?? "",
  work_mode: row.work_mode ?? "",
  location: row.location ?? "",
  experience: row.experience ?? "",
  salary_range: row.salary_range ?? "",
  short_description: row.short_description ?? "",
  full_description: row.full_description ?? "",
  responsibilities: row.responsibilities ?? "",
  skills: row.skills ?? "",
  qualification: row.qualification ?? "",
  open_positions: Number(row.open_positions ?? 1),
  application_deadline: row.application_deadline ?? "",
  status: (row.status ?? "inactive") as JobStatus,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const normalizeApplication = (row: any): JobApplication => ({
  id: Number(row.id),
  job_id: Number(row.job_id),
  job_title: row.jobs?.title ?? row.job_title ?? "",
  full_name: row.full_name ?? "",
  email: row.email ?? "",
  phone: row.phone ?? "",
  experience: row.experience ?? "",
  current_location: row.current_location ?? "",
  resume_file: row.resume_file ?? "",
  portfolio_link: row.portfolio_link ?? "",
  message: row.message ?? "",
  created_at: row.created_at ?? "",
});

const normalizePayload = (payload: JobPayload) => ({
  title: payload.title,
  department: payload.department,
  job_type: payload.job_type,
  work_mode: payload.work_mode,
  location: payload.location,
  experience: payload.experience,
  salary_range: payload.salary_range || null,
  short_description: payload.short_description,
  full_description: payload.full_description,
  responsibilities: payload.responsibilities,
  skills: payload.skills,
  qualification: payload.qualification,
  open_positions: Number(payload.open_positions || 1),
  application_deadline: payload.application_deadline || null,
  status: payload.status,
});

export const fetchJobs = async () => {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(normalizeJob);
};

export const fetchAdminJobs = async () => {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(normalizeJob);
};

export const fetchJob = async (id: number) => {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Job not found.");
  return normalizeJob(data);
};

export const createJob = async (payload: JobPayload) => {
  const { data, error } = await supabase
    .from("jobs")
    .insert(normalizePayload(payload))
    .select("*")
    .single();

  if (error) throw error;
  return normalizeJob(data);
};

export const updateJob = async (id: number, payload: JobPayload) => {
  const { data, error } = await supabase
    .from("jobs")
    .update(normalizePayload(payload))
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return normalizeJob(data);
};

export const deleteJob = async (id: number) => {
  const { error } = await supabase.from("jobs").delete().eq("id", id);
  if (error) throw error;
  return { success: true };
};

export const updateJobStatus = async (id: number, status: JobStatus) => {
  const { data, error } = await supabase
    .from("jobs")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return normalizeJob(data);
};

export const submitJobApplication = async (formData: FormData) => {
  const resume = formData.get("resume");
  const jobId = Number(formData.get("job_id"));
  const resumeDriveLink = String(formData.get("resume_drive_link") || "").trim();

  if (!(resume instanceof File) && !resumeDriveLink) {
    throw new Error("Please upload your resume or paste a Google Drive resume link.");
  }

  let resumeFile = resumeDriveLink;

  if (resume instanceof File) {
    const extension = resume.name.split(".").pop()?.toLowerCase() || "pdf";
    const safeName = resume.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const nameWithoutExtension = safeName.replace(/\.[^.]+$/, "");
    const resumePath = `${jobId}/${Date.now()}-${nameWithoutExtension}.${extension}`;

    const upload = await supabase.storage.from(RESUME_BUCKET).upload(resumePath, resume, {
      contentType: resume.type || "application/octet-stream",
      upsert: false,
    });

    if (upload.error) throw upload.error;
    resumeFile = upload.data.path;
  }

  const { error } = await supabase.from("job_applications").insert({
    job_id: jobId,
    full_name: String(formData.get("full_name") || ""),
    email: String(formData.get("email") || ""),
    phone: String(formData.get("phone") || ""),
    experience: String(formData.get("experience") || ""),
    current_location: String(formData.get("current_location") || ""),
    resume_file: resumeFile,
    portfolio_link: String(formData.get("portfolio_link") || "") || null,
    message: String(formData.get("message") || ""),
  });

  if (error) throw error;

  return { success: true, message: "Application submitted successfully. Our team will review it soon." };
};

export const fetchJobApplications = async () => {
  const { data, error } = await supabase
    .from("job_applications")
    .select("*, jobs(title)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(normalizeApplication);
};

export const getResumeUrl = (resumeFile: string) => {
  if (!resumeFile) return "#";
  if (/^https?:\/\//i.test(resumeFile)) return resumeFile;
  return supabase.storage.from(RESUME_BUCKET).getPublicUrl(resumeFile).data.publicUrl;
};
