import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSlug, getBlogPosts, saveBlogPosts, type BlogPost } from "@/lib/blogStore";
import { getPortfolioItems, savePortfolioItems, type PortfolioItem } from "@/lib/portfolioStore";
import { getClientsItems, saveClientsItems, type ClientItem } from "@/lib/clientsStore";
import { supabase } from "@/lib/supabase";
import { uploadImageToGodaddy } from "@/lib/uploadApi";
import {
  deleteBlogPostFromSupabase,
  deleteClientFromSupabase,
  deletePortfolioItemFromSupabase,
  upsertBlogPostsToSupabase,
  upsertClientsToSupabase,
  upsertPortfolioItemsToSupabase,
} from "@/lib/contentApi";

const formatDate = () =>
  new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const parseTags = (input: string) =>
  input
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Unknown error";
};

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<"blog" | "work" | "clients">("blog");

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

  const [clients, setClients] = useState<ClientItem[]>(getClientsItems());
  const [clientName, setClientName] = useState("");
  const [clientLogoUrl, setClientLogoUrl] = useState("/placeholder.svg");
  const [clientError, setClientError] = useState("");
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState("");
  const [syncError, setSyncError] = useState("");
  const [syncing, setSyncing] = useState(false);

  const syncAllToSupabase = async () => {
    setSyncing(true);
    setSyncError("");
    setSyncMessage("");
    try {
      await upsertBlogPostsToSupabase(posts);
      await upsertPortfolioItemsToSupabase(works);
      await upsertClientsToSupabase(clients);
      setSyncMessage("Synced local Blog, Work, and Clients data to Supabase.");
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
            id: String(Date.now()),
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

    setPosts(updated);
    saveBlogPosts(updated);
    void upsertBlogPostsToSupabase(updated).catch(() => {
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
            id: `work-${Date.now()}`,
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
      savePortfolioItems(updated);
      setWorks(updated);
      void upsertPortfolioItemsToSupabase(updated).catch(() => {
        setWorkError("Saved locally, but failed to sync work to Supabase.");
      });
      resetWorkForm();
    } catch {
      setWorkError("Could not save work. Storage is full. Use a smaller image or image URL.");
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
      : [
          {
            id: `client-${Date.now()}`,
            name: clientName.trim(),
            category: "Client",
            logoUrl: normalizedLogo,
            websiteUrl: "",
            createdAt: Date.now(),
          },
          ...clients,
        ];

    setClients(updated);
    saveClientsItems(updated);
    void upsertClientsToSupabase(updated).catch(() => {
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

  const handleBlogImageUpload = async (file?: File) => {
    if (!file) return;
    try {
      const uploadedUrl = await uploadImageToGodaddy(file, "blogs");
      setImageUrl(uploadedUrl);
      setError("");
    } catch {
      setError("Could not upload blog image to GoDaddy.");
    }
  };

  const handleWorkImageUpload = async (file?: File) => {
    if (!file) return;
    try {
      const uploadedUrl = await uploadImageToGodaddy(file, "works");
      setWorkImageUrl(uploadedUrl);
      setWorkError("");
    } catch {
      setWorkError("Could not upload work image to GoDaddy.");
    }
  };

  const handleClientLogoUpload = async (file?: File) => {
    if (!file) return;
    try {
      const uploadedUrl = await uploadImageToGodaddy(file, "clients");
      setClientLogoUrl(uploadedUrl);
      setClientError("");
    } catch {
      setClientError("Could not upload client logo to GoDaddy.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  return (
    <section className="section-padding">
      <div className="container-max space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Blogs: {posts.length} | Works: {works.length} | Clients: {clients.length}
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
            onClick={() => setActiveSection("clients")}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
              activeSection === "clients" ? "gradient-bg text-primary-foreground border-transparent" : "border-border hover:bg-secondary"
            }`}
          >
            Clients Management
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
        ) : (
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
                      <img src={client.logoUrl} alt={client.name} className="w-12 h-12 rounded-lg object-cover border border-border" />
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
        )}
      </div>
    </section>
  );
};

export default AdminDashboardPage;
