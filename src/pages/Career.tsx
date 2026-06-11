import { FormEvent, useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  GraduationCap,
  HeartHandshake,
  Laptop,
  MapPin,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import SeoHead from "@/components/SeoHead";
import { fetchJobs, submitJobApplication, type JobPost } from "@/lib/careerApi";

const whyJoin = [
  { icon: Sparkles, title: "Creative work culture", desc: "Work on campaigns, designs, content, and digital ideas for growing brands." },
  { icon: TrendingUp, title: "Growth opportunities", desc: "Take ownership early and build a practical portfolio across live client projects." },
  { icon: Target, title: "Digital marketing exposure", desc: "Learn how SEO, ads, social media, design, and web experiences work together." },
  { icon: HeartHandshake, title: "Friendly team environment", desc: "Collaborate with a supportive team that values clarity, speed, and craft." },
  { icon: GraduationCap, title: "Skill development", desc: "Sharpen creative, technical, client communication, and campaign execution skills." },
];

const emptyForm = {
  full_name: "",
  email: "",
  phone: "",
  experience: "",
  current_location: "",
  resume_drive_link: "",
  portfolio_link: "",
  message: "",
};

const splitList = (value: string) =>
  value
    .split(/[;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

const CareerPage = () => {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [resume, setResume] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [showApplyForm, setShowApplyForm] = useState(false);
  const jobsRef = useRef<HTMLElement | null>(null);
  const whyRef = useRef(null);
  const whyInView = useInView(whyRef, { once: true, margin: "-80px" });

  useEffect(() => {
    let mounted = true;
    fetchJobs()
      .then((data) => {
        if (!mounted) return;
        setJobs(data);
        setError("");
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Could not load job openings.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const openJob = (job: JobPost, apply = false) => {
    setSelectedJob(job);
    setShowApplyForm(apply);
    setForm(emptyForm);
    setResume(null);
    setSuccess("");
    setFormError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedJob) return;
    setSubmitting(true);
    setSuccess("");
    setFormError("");

    try {
      const payload = new FormData();
      payload.append("job_id", String(selectedJob.id));
      payload.append("position_applied_for", selectedJob.title);
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (resume) payload.append("resume", resume);

      const result = await submitJobApplication(payload);
      setSuccess(result.message || "Application submitted successfully.");
      setForm(emptyForm);
      setResume(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not submit application.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SeoHead
        title="Careers at Praavi Consultants | Digital Marketing Jobs in Pune"
        description="Join Praavi Consultants and build your career in digital marketing, design, video editing, sales, SEO, and creative campaign execution."
        canonicalPath="/career"
      />

      <section className="page-hero min-h-[520px]">
        <div className="relative z-10 container-max px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-[0.2em] mb-4">
            Careers at Praavi
          </p>
          <h1 className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
            Build Your Career With <span className="gradient-text-orange">Praavi Consultants</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            Join our creative and growth-focused digital marketing team.
          </p>
          <button
            onClick={() => jobsRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="mt-8 inline-flex items-center justify-center gap-2 gradient-bg px-6 py-3 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            View Open Positions
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <section className="section-padding" ref={whyRef}>
        <div className="container-max">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">
              Why <span className="gradient-text">Join Us</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-2xl mx-auto">
              A hands-on agency environment for people who love building, learning, and seeing their work go live.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {whyJoin.map((item, index) => (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                animate={whyInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="service-card"
              >
                <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mb-4">
                  <item.icon size={22} className="text-primary-foreground" />
                </div>
                <h3 className="font-display text-base font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section ref={jobsRef} className="section-padding bg-card">
        <div className="container-max">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold">
                Current <span className="gradient-text">Openings</span>
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-3">
                Explore active roles managed by the Praavi admin team.
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              {jobs.length} active {jobs.length === 1 ? "position" : "positions"}
            </div>
          </div>

          {loading ? (
            <div className="service-card text-sm text-muted-foreground">Loading open positions...</div>
          ) : error ? (
            <div className="service-card text-sm text-muted-foreground">{error}</div>
          ) : jobs.length === 0 ? (
            <div className="service-card text-sm text-muted-foreground">
              No active openings right now. Please check back soon.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {jobs.map((job, index) => (
                <motion.article
                  key={job.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  className="service-card flex flex-col"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-primary mb-2">{job.department}</p>
                      <h3 className="font-display text-xl font-semibold">{job.title}</h3>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-secondary border border-border text-muted-foreground">
                      {job.open_positions} open
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-2"><BriefcaseBusiness size={15} className="text-primary" /> {job.job_type} | {job.work_mode}</span>
                    <span className="flex items-center gap-2"><MapPin size={15} className="text-primary" /> {job.location}</span>
                    <span className="flex items-center gap-2"><Laptop size={15} className="text-primary" /> {job.experience}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{job.short_description}</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {job.skills.split(",").slice(0, 5).map((skill) => (
                      <span key={skill.trim()} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-muted-foreground border border-border">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto flex flex-wrap gap-3">
                    <button onClick={() => openJob(job)} className="px-4 py-2 rounded-lg text-sm font-semibold border border-border hover:bg-secondary transition-colors">
                      View Details
                    </button>
                    <button onClick={() => openJob(job, true)} className="gradient-bg px-4 py-2 rounded-lg text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
                      Apply Now
                    </button>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>

      {selectedJob ? (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm px-4 py-6 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-5xl rounded-2xl border border-border bg-card shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-border">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.16em] text-primary mb-2">{selectedJob.department}</p>
                  <h2 className="font-display text-3xl sm:text-4xl font-bold leading-tight">{selectedJob.title}</h2>
                  <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><MapPin size={14} /> {selectedJob.location}</span>
                    <span className="inline-flex items-center gap-1"><BriefcaseBusiness size={14} /> {selectedJob.job_type}</span>
                    <span className="inline-flex items-center gap-1"><CalendarDays size={14} /> {selectedJob.experience}</span>
                  </div>
                  {!showApplyForm ? (
                    <button
                      onClick={() => setShowApplyForm(true)}
                      className="mt-5 inline-flex items-center justify-center gap-2 gradient-bg px-5 py-3 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                      Apply Now
                      <ArrowRight size={16} />
                    </button>
                  ) : null}
                </div>
                <button onClick={() => setSelectedJob(null)} className="p-2 rounded-lg border border-border hover:bg-secondary transition-colors" aria-label="Close job details">
                  <X size={18} />
                </button>
              </div>

              {showApplyForm ? (
                <div className="p-5 sm:p-6">
                  <form onSubmit={handleSubmit} className="mx-auto max-w-3xl rounded-2xl border border-border bg-background p-5 sm:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <h3 className="font-display text-2xl font-semibold">Apply for this job</h3>
                        <p className="text-sm text-muted-foreground mt-1">Share your details and resume with the Praavi team.</p>
                      </div>
                      <button type="button" onClick={() => setShowApplyForm(false)} className="text-sm text-muted-foreground hover:text-foreground text-left sm:text-right">
                        Back to details
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input required placeholder="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="bg-card border border-border rounded-lg px-3 py-2 text-sm" />
                      <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-card border border-border rounded-lg px-3 py-2 text-sm" />
                      <input required placeholder="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-card border border-border rounded-lg px-3 py-2 text-sm" />
                      <input readOnly value={selectedJob.title} className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground" />
                      <input required placeholder="Experience" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} className="bg-card border border-border rounded-lg px-3 py-2 text-sm" />
                      <input required placeholder="Current Location" value={form.current_location} onChange={(e) => setForm({ ...form, current_location: e.target.value })} className="bg-card border border-border rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm text-muted-foreground">Upload Resume PDF/DOC</label>
                      <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => setResume(e.target.files?.[0] || null)} className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm" />
                    </div>
                    <input placeholder="Or paste Google Drive resume link" value={form.resume_drive_link} onChange={(e) => setForm({ ...form, resume_drive_link: e.target.value })} className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm" />
                    <input placeholder="Portfolio Link (optional)" value={form.portfolio_link} onChange={(e) => setForm({ ...form, portfolio_link: e.target.value })} className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm" />
                    <textarea required rows={4} placeholder="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm" />
                    {success ? <p className="text-sm text-emerald-400">{success}</p> : null}
                    {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
                    <button disabled={submitting} type="submit" className="w-full gradient-bg px-5 py-3 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-60">
                      {submitting ? "Submitting..." : "Submit Application"}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 p-5 sm:p-6">
                  <div className="space-y-8">
                    <section>
                      <h3 className="font-display text-xl font-semibold mb-3">About the job</h3>
                      <p className="text-sm sm:text-base text-muted-foreground leading-7 whitespace-pre-line">
                        {selectedJob.full_description}
                      </p>
                    </section>

                    <section>
                      <h3 className="font-display text-xl font-semibold mb-3">Responsibilities</h3>
                      <ul className="space-y-2 text-sm sm:text-base text-muted-foreground leading-7">
                        {splitList(selectedJob.responsibilities).map((item) => (
                          <li key={item} className="flex gap-3">
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </section>

                    <section>
                      <h3 className="font-display text-xl font-semibold mb-3">Required skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedJob.skills.split(",").map((skill) => (
                          <span key={skill.trim()} className="text-xs sm:text-sm px-3 py-1.5 rounded-full bg-secondary text-muted-foreground border border-border">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h3 className="font-display text-xl font-semibold mb-3">Qualification</h3>
                      <p className="text-sm sm:text-base text-muted-foreground leading-7">{selectedJob.qualification}</p>
                    </section>
                  </div>

                  <aside className="lg:sticky lg:top-6 h-fit rounded-2xl border border-border bg-background p-5">
                    <h3 className="font-display text-lg font-semibold mb-4">Job overview</h3>
                    <div className="space-y-4 text-sm">
                      {[
                        ["Department", selectedJob.department],
                        ["Job type", selectedJob.job_type],
                        ["Work mode", selectedJob.work_mode],
                        ["Location", selectedJob.location],
                        ["Experience", selectedJob.experience],
                        ["Open positions", String(selectedJob.open_positions)],
                        ...(selectedJob.salary_range ? [["Salary", selectedJob.salary_range]] : []),
                        ...(selectedJob.application_deadline ? [["Deadline", selectedJob.application_deadline]] : []),
                      ].map(([label, value]) => (
                        <div key={label} className="border-b border-border pb-3 last:border-b-0 last:pb-0">
                          <p className="text-muted-foreground">{label}</p>
                          <p className="font-medium mt-1">{value}</p>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowApplyForm(true)}
                      className="mt-5 w-full gradient-bg px-5 py-3 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                      Apply Now
                    </button>
                  </aside>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default CareerPage;
