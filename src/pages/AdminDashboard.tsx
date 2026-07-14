import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSlug, getBlogPosts, saveBlogPosts, type BlogPost } from "@/lib/blogStore";
import { getPortfolioItems, savePortfolioItems, type PortfolioItem } from "@/lib/portfolioStore";
import { getClientsItems, saveClientsItems, type ClientItem } from "@/lib/clientsStore";
import { getCaseStudyItems, saveCaseStudyItems, type CaseStudyItem } from "@/lib/caseStudyStore";
import {
  createJob,
  deleteJob,
  deleteJobApplication,
  fetchAdminJobs,
  fetchJobApplications,
  getResumeUrl,
  updateJobApplication,
  updateJob,
  updateJobStatus,
  type ApplicationStatus,
  type JobApplication,
  type JobPayload,
  type JobPost,
  type JobStatus,
} from "@/lib/careerApi";
import { supabase } from "@/lib/supabase";
import { ADMIN_LOGIN_PATH } from "@/lib/adminRoutes";
import { uploadImageToGodaddy, uploadImageToSupabaseStorage } from "@/lib/uploadApi";
import {
  deleteBlogPostFromSupabase,
  deleteClientFromSupabase,
  deleteCaseStudyFromSupabase,
  deletePortfolioItemFromSupabase,
  fetchActiveClients,
  fetchPublishedCaseStudies,
  fetchPublishedBlogPosts,
  fetchPublishedPortfolioItems,
  upsertBlogPostsToSupabase,
  upsertCaseStudiesToSupabase,
  upsertClientsToSupabase,
  upsertPortfolioItemsToSupabase,
} from "@/lib/contentApi";

const formatDate = () =>
  new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const generateUuid = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

const normalizeIds = <T extends { id: string }>(items: T[]) => {
  let changed = false;
  const normalized = items.map((item) => {
    if (UUID_RE.test(item.id)) return item;
    changed = true;
    return { ...item, id: generateUuid() };
  });
  return { normalized, changed };
};

const parseTags = (input: string) =>
  input
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

const emptyJobForm: JobPayload = {
  title: "",
  department: "",
  job_type: "Full-time",
  work_mode: "Work from Office",
  location: "",
  experience: "",
  salary_range: "",
  short_description: "",
  full_description: "",
  responsibilities: "",
  skills: "",
  qualification: "",
  open_positions: 1,
  application_deadline: "",
  status: "active",
};

const applicationStatusOptions: { value: ApplicationStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "selected", label: "Selected" },
  { value: "not_selected", label: "Not Selected" },
  { value: "on_hold", label: "On Hold" },
  { value: "interview_scheduled", label: "Interview Scheduled" },
];

const applicationStatusLabel = (status: ApplicationStatus) =>
  applicationStatusOptions.find((option) => option.value === status)?.label || "New";

const formatApplicationDate = (value?: string | null) => {
  if (!value) return "";
  const [dateOnly] = value.split("T");
  const [year, month, day] = dateOnly.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

const applicationStatusClass = (status: ApplicationStatus) => {
  switch (status) {
    case "selected":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
    case "not_selected":
      return "border-red-500/40 bg-red-500/10 text-red-300";
    case "on_hold":
      return "border-amber-500/40 bg-amber-500/10 text-amber-300";
    case "interview_scheduled":
      return "border-sky-500/40 bg-sky-500/10 text-sky-300";
    default:
      return "border-border bg-secondary text-muted-foreground";
  }
};

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Unknown error";
};

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<"blog" | "work" | "case-studies" | "clients" | "career">("blog");

  const [posts, setPosts] = useState<BlogPost[]>(getBlogPosts());
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [readTime, setReadTime] = useState("5 min read");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("/placeholder.svg");
  const [error, setError] = useState("");
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  const [works, setWorks] = useState<PortfolioItem[]>(getPortfolioItems());
  const [workTitle, setWorkTitle] = useState("");
  const [workClient, setWorkClient] = useState("");
  const [workDesc, setWorkDesc] = useState("");
  const [workTagsInput, setWorkTagsInput] = useState("Web Development, SEO");
  const [workStat, setWorkStat] = useState("");
  const [workImageUrl, setWorkImageUrl] = useState("/placeholder.svg");
  const [workLiveUrl, setWorkLiveUrl] = useState("");
  const [workError, setWorkError] = useState("");
  const [editingWorkId, setEditingWorkId] = useState<string | null>(null);

  const [caseStudies, setCaseStudies] = useState<CaseStudyItem[]>(getCaseStudyItems());
  const [caseClient, setCaseClient] = useState("");
  const [caseTitle, setCaseTitle] = useState("");
  const [caseProblem, setCaseProblem] = useState("");
  const [caseSolution, setCaseSolution] = useState("");
  const [caseTechnologyInput, setCaseTechnologyInput] = useState("React, SEO, Google Ads");
  const [caseBefore, setCaseBefore] = useState("");
  const [caseAfter, setCaseAfter] = useState("");
  const [caseTrafficGrowth, setCaseTrafficGrowth] = useState("");
  const [caseLeadsGenerated, setCaseLeadsGenerated] = useState("");
  const [caseTestimonial, setCaseTestimonial] = useState("");
  const [caseScreenshot, setCaseScreenshot] = useState("/placeholder.svg");
  const [caseScreenshotUploading, setCaseScreenshotUploading] = useState(false);
  const [caseError, setCaseError] = useState("");
  const [editingCaseStudyId, setEditingCaseStudyId] = useState<string | null>(null);
  const caseScreenshotIsEmbedded = caseScreenshot.startsWith("data:");

  const [clients, setClients] = useState<ClientItem[]>(getClientsItems());
  const [clientName, setClientName] = useState("");
  const [clientLogoUrl, setClientLogoUrl] = useState("/placeholder.svg");
  const [clientError, setClientError] = useState("");
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState("");
  const [syncError, setSyncError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [jobForm, setJobForm] = useState<JobPayload>(emptyJobForm);
  const [editingJobId, setEditingJobId] = useState<number | null>(null);
  const [careerError, setCareerError] = useState("");
  const [careerMessage, setCareerMessage] = useState("");
  const [careerLoading, setCareerLoading] = useState(false);
  const [savingApplicationId, setSavingApplicationId] = useState<number | null>(null);
  const [applicationError, setApplicationError] = useState("");
  const [applicationMessage, setApplicationMessage] = useState("");

  useEffect(() => {
    const normalizedPosts = normalizeIds(posts);
    if (normalizedPosts.changed) {
      setPosts(normalizedPosts.normalized);
      saveBlogPosts(normalizedPosts.normalized);
    }

    const normalizedWorks = normalizeIds(works);
    if (normalizedWorks.changed) {
      setWorks(normalizedWorks.normalized);
      savePortfolioItems(normalizedWorks.normalized);
    }

    const normalizedClients = normalizeIds(clients);
    if (normalizedClients.changed) {
      setClients(normalizedClients.normalized);
      saveClientsItems(normalizedClients.normalized);
    }

    const normalizedCaseStudies = normalizeIds(caseStudies);
    if (normalizedCaseStudies.changed) {
      setCaseStudies(normalizedCaseStudies.normalized);
      saveCaseStudyItems(normalizedCaseStudies.normalized);
    }

    let mounted = true;

    Promise.all([fetchPublishedBlogPosts(), fetchPublishedPortfolioItems(), fetchActiveClients(), fetchPublishedCaseStudies()])
      .then(([livePosts, liveWorks, liveClients, liveCaseStudies]) => {
        if (!mounted) return;

        if (livePosts.length > 0) {
          setPosts(livePosts);
          saveBlogPosts(livePosts);
        }
        if (liveWorks.length > 0) {
          setWorks(liveWorks);
          savePortfolioItems(liveWorks);
        }
        if (liveClients.length > 0) {
          setClients(liveClients);
          saveClientsItems(liveClients);
        }
        if (liveCaseStudies.length > 0) {
          setCaseStudies(liveCaseStudies);
          saveCaseStudyItems(liveCaseStudies);
        }
      })
      .catch(() => {
        // Keep local fallback when Supabase is unavailable or empty.
      });

    Promise.all([fetchAdminJobs(), fetchJobApplications()])
      .then(([careerJobs, careerApplications]) => {
        if (!mounted) return;
        setJobs(careerJobs);
        setApplications(careerApplications);
        setCareerError("");
      })
      .catch((error) => {
        if (!mounted) return;
        setCareerError(`Career Supabase data unavailable: ${getErrorMessage(error)}`);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const syncAllToSupabase = async () => {
    setSyncing(true);
    setSyncError("");
    setSyncMessage("");
    try {
      const normalizedPosts = normalizeIds(posts);
      const normalizedWorks = normalizeIds(works);
      const normalizedClients = normalizeIds(clients);
      const normalizedCaseStudies = normalizeIds(caseStudies);

      if (normalizedPosts.changed) {
        setPosts(normalizedPosts.normalized);
        saveBlogPosts(normalizedPosts.normalized);
      }
      if (normalizedWorks.changed) {
        setWorks(normalizedWorks.normalized);
        savePortfolioItems(normalizedWorks.normalized);
      }
      if (normalizedClients.changed) {
        setClients(normalizedClients.normalized);
        saveClientsItems(normalizedClients.normalized);
      }
      if (normalizedCaseStudies.changed) {
        setCaseStudies(normalizedCaseStudies.normalized);
        saveCaseStudyItems(normalizedCaseStudies.normalized);
      }

      await upsertBlogPostsToSupabase(normalizedPosts.normalized);
      await upsertPortfolioItemsToSupabase(normalizedWorks.normalized);
      await upsertClientsToSupabase(normalizedClients.normalized);
      await upsertCaseStudiesToSupabase(normalizedCaseStudies.normalized);
      setSyncMessage("Synced local Blog, Work, Case Studies, and Clients data to Supabase.");
    } catch (error) {
      setSyncError(`Supabase sync failed: ${getErrorMessage(error)}`);
    } finally {
      setSyncing(false);
    }
  };

  const resetBlogForm = () => {
    setTitle("");
    setCategory("General");
    setReadTime("5 min read");
    setExcerpt("");
    setContent("");
    setImageUrl("/placeholder.svg");
    setEditingPostId(null);
  };

  const resetWorkForm = () => {
    setWorkTitle("");
    setWorkClient("");
    setWorkDesc("");
    setWorkTagsInput("Web Development, SEO");
    setWorkStat("");
    setWorkImageUrl("/placeholder.svg");
    setWorkLiveUrl("");
    setEditingWorkId(null);
  };

  const resetCaseStudyForm = () => {
    setCaseClient("");
    setCaseTitle("");
    setCaseProblem("");
    setCaseSolution("");
    setCaseTechnologyInput("React, SEO, Google Ads");
    setCaseBefore("");
    setCaseAfter("");
    setCaseTrafficGrowth("");
    setCaseLeadsGenerated("");
    setCaseTestimonial("");
    setCaseScreenshot("/placeholder.svg");
    setEditingCaseStudyId(null);
  };

  const resetClientForm = () => {
    setClientName("");
    setClientLogoUrl("/placeholder.svg");
    setEditingClientId(null);
  };

  const handleCreateOrUpdateBlog = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const slugBase = createSlug(title);
    if (!slugBase) {
      setError("Please enter a valid blog title.");
      return;
    }

    const normalizedImage = imageUrl.trim() || "/placeholder.svg";
    if (normalizedImage.length > 1_500_000) {
      setError("Image is too large. Upload a smaller/compressed image.");
      return;
    }
    const isEditMode = !!editingPostId;

    const updated = isEditMode
      ? posts.map((post) => {
          if (post.id !== editingPostId) return post;
          const slugTakenByOther = posts.some((p) => p.id !== post.id && p.slug === slugBase);
          return {
            ...post,
            slug: slugTakenByOther ? `${slugBase}-${Date.now()}` : slugBase,
            title: title.trim(),
            excerpt: excerpt.trim(),
            content: content.trim(),
            category: category.trim(),
            readTime: readTime.trim(),
            imageUrl: normalizedImage,
            date: formatDate(),
          };
        })
      : [
          {
            id: generateUuid(),
            slug: posts.some((p) => p.slug === slugBase) ? `${slugBase}-${Date.now()}` : slugBase,
            title: title.trim(),
            excerpt: excerpt.trim(),
            content: content.trim(),
            category: category.trim(),
            readTime: readTime.trim(),
            imageUrl: normalizedImage,
            date: formatDate(),
            createdAt: Date.now(),
          },
          ...posts,
        ];

    const normalizedPosts = normalizeIds(updated);
    setPosts(normalizedPosts.normalized);
    saveBlogPosts(normalizedPosts.normalized);
    void upsertBlogPostsToSupabase(normalizedPosts.normalized).catch(() => {
      setError("Saved locally, but failed to sync blog to Supabase.");
    });
    resetBlogForm();
  };

  const handleCreateOrUpdateWork = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setWorkError("");

    const tags = parseTags(workTagsInput);
    if (!workTitle.trim() || !workClient.trim() || !workDesc.trim() || !workStat.trim()) {
      setWorkError("Please fill all required work fields.");
      return;
    }
    if (tags.length === 0) {
      setWorkError("Add at least one tag (comma separated).");
      return;
    }

    const normalizedImage = workImageUrl.trim() || "/placeholder.svg";
    if (normalizedImage.length > 1_500_000) {
      setWorkError("Image is too large. Upload a smaller/compressed image.");
      return;
    }
    const isEditMode = !!editingWorkId;

    const updated = isEditMode
      ? works.map((work) =>
          work.id === editingWorkId
            ? {
                ...work,
                title: workTitle.trim(),
                client: workClient.trim(),
                desc: workDesc.trim(),
                tags,
                stat: workStat.trim(),
                imageUrl: normalizedImage,
                liveUrl: workLiveUrl.trim(),
              }
            : work
        )
      : [
          {
            id: generateUuid(),
            title: workTitle.trim(),
            client: workClient.trim(),
            desc: workDesc.trim(),
            tags,
            stat: workStat.trim(),
            imageUrl: normalizedImage,
            liveUrl: workLiveUrl.trim(),
            createdAt: Date.now(),
          },
          ...works,
        ];

    try {
      const normalizedWorks = normalizeIds(updated);
      savePortfolioItems(normalizedWorks.normalized);
      setWorks(normalizedWorks.normalized);
      void upsertPortfolioItemsToSupabase(normalizedWorks.normalized).catch(() => {
        setWorkError("Saved locally, but failed to sync work to Supabase.");
      });
      resetWorkForm();
    } catch {
      setWorkError("Could not save work. Storage is full. Use a smaller image or image URL.");
    }
  };

  const handleCreateOrUpdateCaseStudy = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCaseError("");

    const technology = parseTags(caseTechnologyInput);
    if (!caseClient.trim() || !caseTitle.trim() || !caseProblem.trim() || !caseSolution.trim()) {
      setCaseError("Please fill client, title, problem, and solution.");
      return;
    }
    if (technology.length === 0) {
      setCaseError("Add at least one technology.");
      return;
    }

    const normalizedScreenshot = caseScreenshot.trim() || "/placeholder.svg";
    if (normalizedScreenshot.length > 1_500_000) {
      setCaseError("Screenshot is too large. Upload a smaller/compressed image.");
      return;
    }
    if (normalizedScreenshot.startsWith("data:")) {
      setCaseError("This image is only stored locally because upload API is unavailable. Please upload to hosting or paste an image URL before saving to Supabase.");
      return;
    }

    const isEditMode = !!editingCaseStudyId;
    const updated = isEditMode
      ? caseStudies.map((study) =>
          study.id === editingCaseStudyId
            ? {
                ...study,
                client: caseClient.trim(),
                title: caseTitle.trim(),
                problem: caseProblem.trim(),
                solution: caseSolution.trim(),
                technology,
                before: caseBefore.trim(),
                after: caseAfter.trim(),
                trafficGrowth: caseTrafficGrowth.trim(),
                leadsGenerated: caseLeadsGenerated.trim(),
                testimonial: caseTestimonial.trim(),
                screenshot: normalizedScreenshot,
              }
            : study
        )
      : [
          {
            id: generateUuid(),
            client: caseClient.trim(),
            title: caseTitle.trim(),
            problem: caseProblem.trim(),
            solution: caseSolution.trim(),
            technology,
            before: caseBefore.trim(),
            after: caseAfter.trim(),
            trafficGrowth: caseTrafficGrowth.trim(),
            leadsGenerated: caseLeadsGenerated.trim(),
            testimonial: caseTestimonial.trim(),
            screenshot: normalizedScreenshot,
            createdAt: Date.now(),
          },
          ...caseStudies,
        ];

    try {
      const normalizedCaseStudies = normalizeIds(updated);
      saveCaseStudyItems(normalizedCaseStudies.normalized);
      setCaseStudies(normalizedCaseStudies.normalized);
      void upsertCaseStudiesToSupabase(normalizedCaseStudies.normalized).catch(() => {
        setCaseError("Saved locally, but failed to sync case studies to Supabase.");
      });
      resetCaseStudyForm();
    } catch {
      setCaseError("Could not save case study. Use a smaller screenshot or image URL.");
    }
  };

  const handleCreateOrUpdateClient = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setClientError("");

    if (!clientName.trim()) {
      setClientError("Please fill required client fields.");
      return;
    }

    const normalizedLogo = clientLogoUrl.trim() || "/placeholder.svg";
    const isEditMode = !!editingClientId;
    const normalizedName = clientName.trim().toLowerCase();

    const updated = isEditMode
      ? clients.map((client) =>
          client.id === editingClientId
            ? {
                ...client,
                name: clientName.trim(),
                category: client.category || "Client",
                logoUrl: normalizedLogo,
                websiteUrl: client.websiteUrl || "",
              }
            : client
        )
      : (() => {
          const existing = clients.find((client) => client.name.trim().toLowerCase() === normalizedName);
          if (existing) {
            return clients.map((client) =>
              client.id === existing.id
                ? {
                    ...client,
                    name: clientName.trim(),
                    category: client.category || "Client",
                    logoUrl: normalizedLogo,
                    websiteUrl: client.websiteUrl || "",
                  }
                : client
            );
          }
          return [
            {
              id: generateUuid(),
              name: clientName.trim(),
              category: "Client",
              logoUrl: normalizedLogo,
              websiteUrl: "",
              createdAt: Date.now(),
            },
            ...clients,
          ];
        })();

    const normalizedClients = normalizeIds(updated);
    setClients(normalizedClients.normalized);
    saveClientsItems(normalizedClients.normalized);
    void upsertClientsToSupabase(normalizedClients.normalized).catch(() => {
      setClientError("Saved locally, but failed to sync client to Supabase.");
    });
    resetClientForm();
  };

  const handleEditBlog = (post: BlogPost) => {
    setEditingPostId(post.id);
    setTitle(post.title);
    setCategory(post.category);
    setReadTime(post.readTime);
    setExcerpt(post.excerpt);
    setContent(post.content);
    setImageUrl(post.imageUrl);
    setActiveSection("blog");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteBlog = (id: string) => {
    const updated = posts.filter((post) => post.id !== id);
    setPosts(updated);
    saveBlogPosts(updated);
    void deleteBlogPostFromSupabase(id).catch(() => {
      setError("Deleted locally, but failed to delete from Supabase.");
    });
    if (editingPostId === id) resetBlogForm();
  };

  const handleEditWork = (work: PortfolioItem) => {
    setEditingWorkId(work.id);
    setWorkTitle(work.title);
    setWorkClient(work.client);
    setWorkDesc(work.desc);
    setWorkTagsInput(work.tags.join(", "));
    setWorkStat(work.stat);
    setWorkImageUrl(work.imageUrl);
    setWorkLiveUrl(work.liveUrl || "");
    setActiveSection("work");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteWork = (id: string) => {
    const updated = works.filter((work) => work.id !== id);
    setWorks(updated);
    savePortfolioItems(updated);
    void deletePortfolioItemFromSupabase(id).catch(() => {
      setWorkError("Deleted locally, but failed to delete from Supabase.");
    });
    if (editingWorkId === id) resetWorkForm();
  };

  const handleEditCaseStudy = (study: CaseStudyItem) => {
    setEditingCaseStudyId(study.id);
    setCaseClient(study.client);
    setCaseTitle(study.title);
    setCaseProblem(study.problem);
    setCaseSolution(study.solution);
    setCaseTechnologyInput(study.technology.join(", "));
    setCaseBefore(study.before);
    setCaseAfter(study.after);
    setCaseTrafficGrowth(study.trafficGrowth);
    setCaseLeadsGenerated(study.leadsGenerated);
    setCaseTestimonial(study.testimonial);
    setCaseScreenshot(study.screenshot);
    setActiveSection("case-studies");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteCaseStudy = (id: string) => {
    const updated = caseStudies.filter((study) => study.id !== id);
    setCaseStudies(updated);
    saveCaseStudyItems(updated);
    void deleteCaseStudyFromSupabase(id).catch(() => {
      setCaseError("Deleted locally, but failed to delete from Supabase.");
    });
    if (editingCaseStudyId === id) resetCaseStudyForm();
  };

  const handleEditClient = (client: ClientItem) => {
    setEditingClientId(client.id);
    setClientName(client.name);
    setClientLogoUrl(client.logoUrl);
    setActiveSection("clients");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteClient = (id: string) => {
    const updated = clients.filter((client) => client.id !== id);
    setClients(updated);
    saveClientsItems(updated);
    void deleteClientFromSupabase(id).catch(() => {
      setClientError("Deleted locally, but failed to delete from Supabase.");
    });
    if (editingClientId === id) resetClientForm();
  };

  const refreshCareerData = async () => {
    const [careerJobs, careerApplications] = await Promise.all([fetchAdminJobs(), fetchJobApplications()]);
    setJobs(careerJobs);
    setApplications(careerApplications);
  };

  const resetJobForm = () => {
    setJobForm(emptyJobForm);
    setEditingJobId(null);
  };

  const handleCreateOrUpdateJob = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCareerError("");
    setCareerMessage("");
    setCareerLoading(true);

    try {
      const payload = {
        ...jobForm,
        title: jobForm.title.trim(),
        department: jobForm.department.trim(),
        location: jobForm.location.trim(),
        experience: jobForm.experience.trim(),
        salary_range: jobForm.salary_range?.trim() || "",
        short_description: jobForm.short_description.trim(),
        full_description: jobForm.full_description.trim(),
        responsibilities: jobForm.responsibilities.trim(),
        skills: jobForm.skills.trim(),
        qualification: jobForm.qualification.trim(),
        open_positions: Number(jobForm.open_positions || 1),
        application_deadline: jobForm.application_deadline || "",
      };

      if (editingJobId) {
        await updateJob(editingJobId, payload);
        setCareerMessage("Job post updated successfully.");
      } else {
        await createJob(payload);
        setCareerMessage("Job post created successfully.");
      }
      await refreshCareerData();
      resetJobForm();
    } catch (error) {
      setCareerError(getErrorMessage(error));
    } finally {
      setCareerLoading(false);
    }
  };

  const handleEditJob = (job: JobPost) => {
    setEditingJobId(job.id);
    setJobForm({
      title: job.title,
      department: job.department,
      job_type: job.job_type,
      work_mode: job.work_mode,
      location: job.location,
      experience: job.experience,
      salary_range: job.salary_range || "",
      short_description: job.short_description,
      full_description: job.full_description,
      responsibilities: job.responsibilities,
      skills: job.skills,
      qualification: job.qualification,
      open_positions: job.open_positions,
      application_deadline: job.application_deadline || "",
      status: job.status,
    });
    setActiveSection("career");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteJob = async (id: number) => {
    setCareerError("");
    setCareerMessage("");
    try {
      await deleteJob(id);
      await refreshCareerData();
      setCareerMessage("Job post deleted successfully.");
      if (editingJobId === id) resetJobForm();
    } catch (error) {
      setCareerError(getErrorMessage(error));
    }
  };

  const handleToggleJobStatus = async (job: JobPost) => {
    setCareerError("");
    setCareerMessage("");
    const nextStatus: JobStatus = job.status === "active" ? "inactive" : "active";
    try {
      await updateJobStatus(job.id, nextStatus);
      await refreshCareerData();
      setCareerMessage(`Job marked ${nextStatus}.`);
    } catch (error) {
      setCareerError(getErrorMessage(error));
    }
  };

  const handleUpdateApplication = async (
    application: JobApplication,
    changes: Partial<Pick<JobApplication, "application_status" | "interview_date" | "admin_notes">>
  ) => {
    setCareerError("");
    setApplicationError("");
    setApplicationMessage("");
    setSavingApplicationId(application.id);
    const updatedApplication = {
      ...application,
      ...changes,
    };

    try {
      const saved = await updateJobApplication(application.id, {
        application_status: updatedApplication.application_status,
        interview_date: updatedApplication.interview_date
          ? updatedApplication.interview_date.slice(0, 10)
          : null,
        admin_notes: updatedApplication.admin_notes || null,
      });
      setApplications((current) => current.map((item) => (item.id === application.id ? saved : item)));
      setApplicationMessage(`Saved ${application.full_name}'s application record.`);
    } catch (error) {
      setApplicationError(`Could not save application: ${getErrorMessage(error)}`);
      await refreshCareerData().catch(() => undefined);
    } finally {
      setSavingApplicationId(null);
    }
  };

  const updateApplicationDraft = (
    id: number,
    changes: Partial<Pick<JobApplication, "application_status" | "interview_date" | "admin_notes">>
  ) => {
    setApplications((current) =>
      current.map((application) =>
        application.id === id ? { ...application, ...changes } : application
      )
    );
  };

  const handleDeleteApplication = async (id: number) => {
    setCareerError("");
    setApplicationError("");
    setApplicationMessage("");
    try {
      await deleteJobApplication(id);
      setApplications((current) => current.filter((application) => application.id !== id));
      setApplicationMessage("Application deleted.");
    } catch (error) {
      setApplicationError(`Could not delete application: ${getErrorMessage(error)}`);
    }
  };

  const handleBlogImageUpload = async (file?: File) => {
    if (!file) return;
    try {
      const uploadedUrl = await uploadImageToGodaddy(file, "blogs");
      setImageUrl(uploadedUrl);
      setError("");
    } catch (error) {
      try {
        const uploadedUrl = await uploadImageToSupabaseStorage(file, "blogs");
        setImageUrl(uploadedUrl);
        setError("");
      } catch (storageError) {
        try {
          const dataUrl = await fileToDataUrl(file);
          if (dataUrl.length > 1_500_000) {
            setError("Image is too large. Upload a smaller/compressed image.");
            return;
          }
          setImageUrl(dataUrl);
          setError(`Upload failed. GoDaddy: ${getErrorMessage(error)} | Supabase Storage: ${getErrorMessage(storageError)}`);
        } catch {
          setError(`Could not upload blog image: ${getErrorMessage(storageError)}`);
        }
      }
    }
  };

  const handleWorkImageUpload = async (file?: File) => {
    if (!file) return;
    try {
      const uploadedUrl = await uploadImageToGodaddy(file, "works");
      setWorkImageUrl(uploadedUrl);
      setWorkError("");
    } catch (error) {
      try {
        const uploadedUrl = await uploadImageToSupabaseStorage(file, "works");
        setWorkImageUrl(uploadedUrl);
        setWorkError("");
      } catch (storageError) {
        try {
          const dataUrl = await fileToDataUrl(file);
          if (dataUrl.length > 1_500_000) {
            setWorkError("Image is too large. Upload a smaller/compressed image.");
            return;
          }
          setWorkImageUrl(dataUrl);
          setWorkError(
            `Upload failed. GoDaddy: ${getErrorMessage(error)} | Supabase Storage: ${getErrorMessage(storageError)}`
          );
        } catch {
          setWorkError(`Could not upload work image: ${getErrorMessage(storageError)}`);
        }
      }
    }
  };

  const handleCaseStudyScreenshotUpload = async (file?: File) => {
    if (!file) return;
    setCaseScreenshotUploading(true);
    setCaseError("");
    try {
      const uploadedUrl = await uploadImageToGodaddy(file, "case-studies");
      setCaseScreenshot(uploadedUrl);
      setCaseError("");
    } catch (error) {
      try {
        const uploadedUrl = await uploadImageToSupabaseStorage(file, "case-studies");
        setCaseScreenshot(uploadedUrl);
        setCaseError("");
      } catch (storageError) {
        try {
          const dataUrl = await fileToDataUrl(file);
          if (dataUrl.length > 1_500_000) {
            setCaseError("Screenshot is too large. Upload a smaller/compressed image.");
            return;
          }
          setCaseScreenshot(dataUrl);
          setCaseError(
            `Upload failed. GoDaddy: ${getErrorMessage(error)} | Supabase Storage: ${getErrorMessage(storageError)}`
          );
        } catch {
          setCaseError(`Could not upload case study screenshot: ${getErrorMessage(storageError)}`);
        }
      }
    } finally {
      setCaseScreenshotUploading(false);
    }
  };

  const handleClientLogoUpload = async (file?: File) => {
    if (!file) return;
    try {
      const uploadedUrl = await uploadImageToGodaddy(file, "clients");
      setClientLogoUrl(uploadedUrl);
      setClientError("");
    } catch (error) {
      try {
        const uploadedUrl = await uploadImageToSupabaseStorage(file, "clients");
        setClientLogoUrl(uploadedUrl);
        setClientError("");
      } catch (storageError) {
        try {
          const dataUrl = await fileToDataUrl(file);
          if (dataUrl.length > 1_500_000) {
            setClientError("Image is too large. Upload a smaller/compressed image.");
            return;
          }
          setClientLogoUrl(dataUrl);
          setClientError(
            `Upload failed. GoDaddy: ${getErrorMessage(error)} | Supabase Storage: ${getErrorMessage(storageError)}`
          );
        } catch {
          setClientError(`Could not upload client logo: ${getErrorMessage(storageError)}`);
        }
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate(ADMIN_LOGIN_PATH);
  };

  return (
    <section className="section-padding">
      <div className="container-max space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Blogs: {posts.length} | Works: {works.length} | Case Studies: {caseStudies.length} | Clients: {clients.length} | Jobs: {jobs.length}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void syncAllToSupabase()}
              disabled={syncing}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-primary/40 text-primary hover:bg-primary/10 transition-colors disabled:opacity-60"
            >
              {syncing ? "Syncing..." : "Sync All to Supabase"}
            </button>
            <button
              onClick={handleLogout}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-border hover:bg-secondary transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {syncMessage ? <p className="text-sm text-emerald-400">{syncMessage}</p> : null}
        {syncError ? <p className="text-sm text-destructive">{syncError}</p> : null}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setActiveSection("blog")}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
              activeSection === "blog" ? "gradient-bg text-primary-foreground border-transparent" : "border-border hover:bg-secondary"
            }`}
          >
            Blog Management
          </button>
          <button
            onClick={() => setActiveSection("work")}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
              activeSection === "work" ? "gradient-bg text-primary-foreground border-transparent" : "border-border hover:bg-secondary"
            }`}
          >
            Our Work Management
          </button>
          <button
            onClick={() => setActiveSection("case-studies")}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
              activeSection === "case-studies" ? "gradient-bg text-primary-foreground border-transparent" : "border-border hover:bg-secondary"
            }`}
          >
            Case Studies
          </button>
          <button
            onClick={() => setActiveSection("clients")}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
              activeSection === "clients" ? "gradient-bg text-primary-foreground border-transparent" : "border-border hover:bg-secondary"
            }`}
          >
            Clients Management
          </button>
          <button
            onClick={() => setActiveSection("career")}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
              activeSection === "career" ? "gradient-bg text-primary-foreground border-transparent" : "border-border hover:bg-secondary"
            }`}
          >
            Career / Job Posts
          </button>
        </div>

        {activeSection === "blog" ? (
          <>
            <div className="service-card">
              <h2 className="font-display text-xl font-semibold mb-4">{editingPostId ? "Edit Blog Post" : "Create New Blog Post"}</h2>
              <form onSubmit={handleCreateOrUpdateBlog} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><label className="block text-sm mb-2">Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm mb-2">Category</label><input value={category} onChange={(e) => setCategory(e.target.value)} required className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm mb-2">Read Time</label><input value={readTime} onChange={(e) => setReadTime(e.target.value)} required className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-sm mb-2">Featured Image URL</label><input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} required className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-sm mb-2">Or Upload Image</label><input type="file" accept="image/*" onChange={(e) => handleBlogImageUpload(e.target.files?.[0])} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-sm mb-2">Short Excerpt</label><textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} required rows={3} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-sm mb-2">Full Content</label><textarea value={content} onChange={(e) => setContent(e.target.value)} required rows={8} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                {error && <p className="md:col-span-2 text-sm text-destructive">{error}</p>}
                <div className="md:col-span-2 flex flex-wrap gap-3">
                  <button type="submit" className="gradient-bg px-6 py-3 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">{editingPostId ? "Update Blog" : "Publish Blog"}</button>
                  {editingPostId && <button type="button" onClick={resetBlogForm} className="px-6 py-3 rounded-xl text-sm font-semibold border border-border hover:bg-secondary transition-colors">Cancel Edit</button>}
                </div>
              </form>
            </div>

            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold">Published Blogs</h2>
              {posts.length === 0 ? <div className="service-card text-sm text-muted-foreground">No blog posts published yet.</div> : posts.map((post) => (
                <article key={post.id} className="service-card">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div><p className="text-xs text-muted-foreground mb-1">{post.category} | {post.date}</p><h3 className="font-display text-lg font-semibold">{post.title}</h3><p className="text-sm text-muted-foreground mt-2">{post.excerpt}</p></div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEditBlog(post)} className="text-sm px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors">Edit</button>
                      <button onClick={() => handleDeleteBlog(post.id)} className="text-sm px-4 py-2 rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors">Delete</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : activeSection === "work" ? (
          <>
            <div className="service-card">
              <h2 className="font-display text-xl font-semibold mb-4">{editingWorkId ? "Edit Portfolio Work" : "Add Portfolio Work"}</h2>
              <form onSubmit={handleCreateOrUpdateWork} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm mb-2">Project Title</label><input value={workTitle} onChange={(e) => setWorkTitle(e.target.value)} required className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm mb-2">Client Name</label><input value={workClient} onChange={(e) => setWorkClient(e.target.value)} required className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-sm mb-2">Project Description</label><textarea value={workDesc} onChange={(e) => setWorkDesc(e.target.value)} required rows={3} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm mb-2">Tags (comma separated)</label><input value={workTagsInput} onChange={(e) => setWorkTagsInput(e.target.value)} required className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm mb-2">Result/Stat</label><input value={workStat} onChange={(e) => setWorkStat(e.target.value)} required className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm mb-2">Image URL</label><input value={workImageUrl} onChange={(e) => setWorkImageUrl(e.target.value)} required className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm mb-2">Or Upload Image</label><input type="file" accept="image/*" onChange={(e) => handleWorkImageUpload(e.target.files?.[0])} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-sm mb-2">Live Project URL (optional)</label><input value={workLiveUrl} onChange={(e) => setWorkLiveUrl(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                {workError && <p className="md:col-span-2 text-sm text-destructive">{workError}</p>}
                <div className="md:col-span-2 flex flex-wrap gap-3">
                  <button type="submit" className="gradient-bg px-6 py-3 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">{editingWorkId ? "Update Work" : "Add Work"}</button>
                  {editingWorkId && <button type="button" onClick={resetWorkForm} className="px-6 py-3 rounded-xl text-sm font-semibold border border-border hover:bg-secondary transition-colors">Cancel Edit</button>}
                </div>
              </form>
            </div>

            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold">Portfolio Works</h2>
              {works.length === 0 ? <div className="service-card text-sm text-muted-foreground">No portfolio items added yet.</div> : works.map((work) => (
                <article key={work.id} className="service-card">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div><p className="text-xs text-primary mb-1">{work.client}</p><h3 className="font-display text-lg font-semibold">{work.title}</h3><p className="text-sm text-muted-foreground mt-2">{work.desc}</p><div className="flex flex-wrap gap-2 mt-3">{work.tags.map((tag) => <span key={tag} className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground">{tag}</span>)}</div><p className="text-sm font-semibold mt-3">{work.stat}</p></div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEditWork(work)} className="text-sm px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors">Edit</button>
                      <button onClick={() => handleDeleteWork(work.id)} className="text-sm px-4 py-2 rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors">Delete</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : activeSection === "case-studies" ? (
          <>
            <div className="service-card">
              <h2 className="font-display text-xl font-semibold mb-4">{editingCaseStudyId ? "Edit Case Study" : "Add Case Study"}</h2>
              <form onSubmit={handleCreateOrUpdateCaseStudy} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm mb-2">Client Name</label><input value={caseClient} onChange={(e) => setCaseClient(e.target.value)} required className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm mb-2">Case Study Title</label><input value={caseTitle} onChange={(e) => setCaseTitle(e.target.value)} required className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-sm mb-2">Client Problem</label><textarea value={caseProblem} onChange={(e) => setCaseProblem(e.target.value)} required rows={3} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-sm mb-2">Solution Provided</label><textarea value={caseSolution} onChange={(e) => setCaseSolution(e.target.value)} required rows={3} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-sm mb-2">Technology Used (comma separated)</label><input value={caseTechnologyInput} onChange={(e) => setCaseTechnologyInput(e.target.value)} required className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm mb-2">Before</label><textarea value={caseBefore} onChange={(e) => setCaseBefore(e.target.value)} rows={3} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm mb-2">After</label><textarea value={caseAfter} onChange={(e) => setCaseAfter(e.target.value)} rows={3} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm mb-2">Traffic Growth</label><input value={caseTrafficGrowth} onChange={(e) => setCaseTrafficGrowth(e.target.value)} placeholder="200% engagement increase" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm mb-2">Leads Generated</label><input value={caseLeadsGenerated} onChange={(e) => setCaseLeadsGenerated(e.target.value)} placeholder="45+ qualified monthly enquiries" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-sm mb-2">Client Testimonial</label><textarea value={caseTestimonial} onChange={(e) => setCaseTestimonial(e.target.value)} rows={3} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2">
                  <label className="block text-sm mb-2">Case Study Image</label>
                  <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 rounded-xl border border-border bg-background p-4">
                    <div className="h-44 rounded-lg border border-border bg-secondary/60 p-4 flex items-center justify-center overflow-hidden">
                      <img src={caseScreenshot} alt="Case study preview" className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-2">Image URL</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            value={caseScreenshotIsEmbedded ? "Embedded local image selected" : caseScreenshot}
                            onChange={(e) => setCaseScreenshot(e.target.value)}
                            readOnly={caseScreenshotIsEmbedded}
                            required
                            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm"
                          />
                          {caseScreenshot !== "/placeholder.svg" ? (
                            <button
                              type="button"
                              onClick={() => {
                                setCaseScreenshot("/placeholder.svg");
                                setCaseError("");
                              }}
                              className="px-4 py-2 rounded-lg text-sm font-semibold border border-border hover:bg-secondary transition-colors"
                            >
                              Clear
                            </button>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Upload stores an image URL when the upload API is available. If it is unavailable, the image is kept locally for preview.
                        </p>
                      </div>
                      <label className="flex min-h-[112px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-5 text-center hover:bg-primary/10 transition-colors">
                        <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(e) => handleCaseStudyScreenshotUpload(e.target.files?.[0])} className="sr-only" disabled={caseScreenshotUploading} />
                        <span className="text-sm font-semibold text-foreground">
                          {caseScreenshotUploading ? "Uploading image..." : "Upload Case Study Image"}
                        </span>
                        <span className="mt-1 text-xs text-muted-foreground">
                          PNG, JPG, WEBP, or SVG. Recommended Canva size: 1600 x 900 px.
                        </span>
                        <span className="mt-3 rounded-lg border border-border bg-card px-4 py-2 text-xs text-primary">
                          Choose File
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
                {caseError && <p className="md:col-span-2 text-sm text-destructive">{caseError}</p>}
                <div className="md:col-span-2 flex flex-wrap gap-3">
                  <button type="submit" className="gradient-bg px-6 py-3 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">{editingCaseStudyId ? "Update Case Study" : "Add Case Study"}</button>
                  {editingCaseStudyId && <button type="button" onClick={resetCaseStudyForm} className="px-6 py-3 rounded-xl text-sm font-semibold border border-border hover:bg-secondary transition-colors">Cancel Edit</button>}
                </div>
              </form>
            </div>

            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold">Case Studies List</h2>
              {caseStudies.length === 0 ? <div className="service-card text-sm text-muted-foreground">No case studies added yet.</div> : caseStudies.map((study) => (
                <article key={study.id} className="service-card">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <span className="w-24 h-16 rounded-lg border border-border bg-secondary p-2 flex items-center justify-center flex-shrink-0">
                        <img src={study.screenshot} alt={`${study.client} case study`} className="max-w-full max-h-full object-contain" />
                      </span>
                      <div>
                        <p className="text-xs text-primary mb-1">{study.client}</p>
                        <h3 className="font-display text-lg font-semibold">{study.title}</h3>
                        <p className="text-sm text-muted-foreground mt-2">{study.problem}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {study.technology.map((tech) => <span key={tech} className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground">{tech}</span>)}
                        </div>
                        <p className="text-sm font-semibold mt-3">{study.trafficGrowth} {study.leadsGenerated ? `| ${study.leadsGenerated}` : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEditCaseStudy(study)} className="text-sm px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors">Edit</button>
                      <button onClick={() => handleDeleteCaseStudy(study.id)} className="text-sm px-4 py-2 rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors">Delete</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : activeSection === "clients" ? (
          <>
            <div className="service-card">
              <h2 className="font-display text-xl font-semibold mb-4">{editingClientId ? "Edit Client" : "Add Client"}</h2>
              <form onSubmit={handleCreateOrUpdateClient} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm mb-2">Client Name</label><input value={clientName} onChange={(e) => setClientName(e.target.value)} required className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm mb-2">Logo URL</label><input value={clientLogoUrl} onChange={(e) => setClientLogoUrl(e.target.value)} required className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm mb-2">Or Upload Logo</label><input type="file" accept="image/*" onChange={(e) => handleClientLogoUpload(e.target.files?.[0])} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm" /></div>
                {clientError && <p className="md:col-span-2 text-sm text-destructive">{clientError}</p>}
                <div className="md:col-span-2 flex flex-wrap gap-3">
                  <button type="submit" className="gradient-bg px-6 py-3 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">{editingClientId ? "Update Client" : "Add Client"}</button>
                  {editingClientId && <button type="button" onClick={resetClientForm} className="px-6 py-3 rounded-xl text-sm font-semibold border border-border hover:bg-secondary transition-colors">Cancel Edit</button>}
                </div>
              </form>
            </div>

            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold">Clients List</h2>
              {clients.length === 0 ? <div className="service-card text-sm text-muted-foreground">No clients added yet.</div> : clients.map((client) => (
                <article key={client.id} className="service-card">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <img
                        src={client.logoUrl}
                        alt={`${client.name} logo`}
                        className="w-12 h-12 rounded-lg object-cover border border-border"
                      />
                      <div>
                        <h3 className="font-display text-lg font-semibold">{client.name}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEditClient(client)} className="text-sm px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors">Edit</button>
                      <button onClick={() => handleDeleteClient(client.id)} className="text-sm px-4 py-2 rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors">Delete</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="service-card">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div>
                  <h2 className="font-display text-xl font-semibold">{editingJobId ? "Edit Job Post" : "Add Job Post"}</h2>
                  <p className="text-sm text-muted-foreground mt-1">Manage active and inactive career openings shown on the Career page.</p>
                </div>
                <button
                  type="button"
                  onClick={() => void refreshCareerData()}
                  className="px-4 py-2 rounded-lg text-sm font-semibold border border-border hover:bg-secondary transition-colors"
                >
                  Refresh
                </button>
              </div>

              <form onSubmit={handleCreateOrUpdateJob} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm mb-2">Job Title</label><input value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} required className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm mb-2">Department</label><input value={jobForm.department} onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })} required className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm mb-2">Job Type</label><select value={jobForm.job_type} onChange={(e) => setJobForm({ ...jobForm, job_type: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm">{["Full-time", "Part-time", "Internship", "Freelance"].map((type) => <option key={type}>{type}</option>)}</select></div>
                <div><label className="block text-sm mb-2">Work Mode</label><select value={jobForm.work_mode} onChange={(e) => setJobForm({ ...jobForm, work_mode: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm">{["Work from Office", "Remote", "Hybrid"].map((mode) => <option key={mode}>{mode}</option>)}</select></div>
                <div><label className="block text-sm mb-2">Location</label><input value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} required className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm mb-2">Experience Required</label><input value={jobForm.experience} onChange={(e) => setJobForm({ ...jobForm, experience: e.target.value })} required className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm mb-2">Salary Range optional</label><input value={jobForm.salary_range || ""} onChange={(e) => setJobForm({ ...jobForm, salary_range: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm mb-2">Open Positions</label><input type="number" min="1" value={jobForm.open_positions} onChange={(e) => setJobForm({ ...jobForm, open_positions: Number(e.target.value) })} required className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm mb-2">Application Deadline optional</label><input type="date" value={jobForm.application_deadline || ""} onChange={(e) => setJobForm({ ...jobForm, application_deadline: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm mb-2">Status</label><select value={jobForm.status} onChange={(e) => setJobForm({ ...jobForm, status: e.target.value as JobStatus })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
                <div className="md:col-span-2"><label className="block text-sm mb-2">Short Description</label><textarea value={jobForm.short_description} onChange={(e) => setJobForm({ ...jobForm, short_description: e.target.value })} required rows={3} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-sm mb-2">Full Job Description</label><textarea value={jobForm.full_description} onChange={(e) => setJobForm({ ...jobForm, full_description: e.target.value })} required rows={5} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-sm mb-2">Responsibilities</label><textarea value={jobForm.responsibilities} onChange={(e) => setJobForm({ ...jobForm, responsibilities: e.target.value })} required rows={4} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-sm mb-2">Required Skills</label><textarea value={jobForm.skills} onChange={(e) => setJobForm({ ...jobForm, skills: e.target.value })} required rows={3} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-sm mb-2">Qualification</label><textarea value={jobForm.qualification} onChange={(e) => setJobForm({ ...jobForm, qualification: e.target.value })} required rows={3} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></div>
                {careerError && <p className="md:col-span-2 text-sm text-destructive">{careerError}</p>}
                {careerMessage && <p className="md:col-span-2 text-sm text-emerald-400">{careerMessage}</p>}
                <div className="md:col-span-2 flex flex-wrap gap-3">
                  <button disabled={careerLoading} type="submit" className="gradient-bg px-6 py-3 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-60">{careerLoading ? "Saving..." : editingJobId ? "Update Job" : "Add Job"}</button>
                  {editingJobId && <button type="button" onClick={resetJobForm} className="px-6 py-3 rounded-xl text-sm font-semibold border border-border hover:bg-secondary transition-colors">Cancel Edit</button>}
                </div>
              </form>
            </div>

            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold">Career / Job Posts</h2>
              {jobs.length === 0 ? <div className="service-card text-sm text-muted-foreground">No job posts found. Add a job to publish it on the Career page.</div> : jobs.map((job) => (
                <article key={job.id} className="service-card">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`text-xs px-2.5 py-1 rounded-full border ${job.status === "active" ? "text-emerald-300 border-emerald-500/30 bg-emerald-500/10" : "text-muted-foreground border-border bg-secondary"}`}>{job.status}</span>
                        <span className="text-xs text-muted-foreground">{job.department} | {job.job_type} | {job.work_mode}</span>
                      </div>
                      <h3 className="font-display text-lg font-semibold">{job.title}</h3>
                      <p className="text-sm text-muted-foreground mt-2">{job.short_description}</p>
                      <p className="text-sm text-muted-foreground mt-2">{job.location} | {job.experience} | {job.open_positions} open</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button onClick={() => handleEditJob(job)} className="text-sm px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors">Edit</button>
                      <button onClick={() => void handleToggleJobStatus(job)} className="text-sm px-4 py-2 rounded-lg border border-primary/40 text-primary hover:bg-primary/10 transition-colors">{job.status === "active" ? "Deactivate" : "Activate"}</button>
                      <button onClick={() => void handleDeleteJob(job.id)} className="text-sm px-4 py-2 rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors">Delete</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold">Submitted Applications</h2>
              {applicationMessage ? <p className="text-sm text-emerald-400">{applicationMessage}</p> : null}
              {applicationError ? <p className="text-sm text-destructive">{applicationError}</p> : null}
              {applications.length === 0 ? <div className="service-card text-sm text-muted-foreground">No applications submitted yet.</div> : applications.map((application) => (
                <article key={application.id} className="service-card">
                  <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <p className="text-xs text-primary">{application.job_title || `Job #${application.job_id}`}</p>
                        <span className={`text-xs px-2.5 py-1 rounded-full border ${applicationStatusClass(application.application_status)}`}>
                          {applicationStatusLabel(application.application_status)}
                        </span>
                      </div>
                      <h3 className="font-display text-lg font-semibold">{application.full_name}</h3>
                      <p className="text-sm text-muted-foreground mt-2">{application.email} | {application.phone}</p>
                      <p className="text-sm text-muted-foreground mt-1">Experience: {application.experience} | Location: {application.current_location}</p>
                      {application.interview_date ? (
                        <p className="text-sm text-primary mt-2">
                          Interview: {formatApplicationDate(application.interview_date)}
                        </p>
                      ) : null}
                      {application.portfolio_link ? <a href={application.portfolio_link} target="_blank" rel="noreferrer" className="inline-block text-sm text-primary hover:underline mt-2">Portfolio Link</a> : null}
                      <p className="text-sm text-muted-foreground mt-2">{application.message}</p>
                      {application.admin_notes ? (
                        <p className="text-sm text-muted-foreground mt-3 rounded-lg border border-border bg-background p-3">
                          <span className="text-foreground font-medium">Admin notes:</span> {application.admin_notes}
                        </p>
                      ) : null}
                    </div>
                    <div className="rounded-xl border border-border bg-background p-4 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm mb-2">Applicant Status</label>
                          <select
                            value={application.application_status}
                            onChange={(e) =>
                              updateApplicationDraft(application.id, {
                                application_status: e.target.value as ApplicationStatus,
                              })
                            }
                            className={`w-full rounded-lg px-3 py-2 text-sm border ${applicationStatusClass(application.application_status)}`}
                          >
                            {applicationStatusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm mb-2">Interview Date</label>
                          <input
                            type="date"
                            value={application.interview_date ? application.interview_date.slice(0, 10) : ""}
                            onChange={(e) =>
                              updateApplicationDraft(application.id, {
                                interview_date: e.target.value,
                                application_status: e.target.value
                                  ? "interview_scheduled"
                                  : application.application_status,
                              })
                            }
                            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm mb-2">Admin Notes</label>
                        <textarea
                          rows={3}
                          value={application.admin_notes || ""}
                          onChange={(e) =>
                            updateApplicationDraft(application.id, {
                              admin_notes: e.target.value,
                            })
                          }
                          placeholder="Follow-up notes, interview feedback, next steps..."
                          className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <a href={getResumeUrl(application.resume_file)} target="_blank" rel="noreferrer" className="text-sm px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors text-center">
                          Download Resume
                        </a>
                        <button
                          onClick={() => void handleUpdateApplication(application, {})}
                          disabled={savingApplicationId === application.id}
                          className="text-sm px-4 py-2 rounded-lg border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 transition-colors disabled:opacity-60"
                        >
                          {savingApplicationId === application.id ? "Saving..." : "Save"}
                        </button>
                        <button onClick={() => void handleDeleteApplication(application.id)} className="text-sm px-4 py-2 rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default AdminDashboardPage;
