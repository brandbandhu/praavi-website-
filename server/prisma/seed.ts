import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth.js";

const prisma = new PrismaClient();

// This seed only sets up what the app needs to be usable on day one:
// login accounts and the default bucket-split percentages. It intentionally
// does NOT create any sample employees, subscriptions, receivables, or
// payments — those are real business data entered from the app itself.
async function main() {
  console.log("Seeding Praavi Consultants finance database...");

  const adminUsername = process.env.FMS_ADMIN_USERNAME;
  const adminPassword = process.env.FMS_ADMIN_PASSWORD;
  const financeUsername = process.env.FMS_FINANCE_USERNAME;
  const financePassword = process.env.FMS_FINANCE_PASSWORD;

  if (!adminUsername || !adminPassword || !financeUsername || !financePassword) {
    throw new Error("Set FMS_ADMIN_USERNAME, FMS_ADMIN_PASSWORD, FMS_FINANCE_USERNAME, and FMS_FINANCE_PASSWORD before seeding.");
  }

  const users = [
    { email: adminUsername, name: "Malhar Pandey", role: "founder", password: adminPassword },
    { email: financeUsername, name: "Sakshi Finance", role: "accountant", password: financePassword },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, passwordHash: hashPassword(u.password) },
      create: { email: u.email, name: u.name, role: u.role, passwordHash: hashPassword(u.password) },
    });
  }

  const existingConfig = await prisma.bucketConfigVersion.findFirst();
  if (!existingConfig) {
    await prisma.bucketConfigVersion.create({
      data: {
        effectiveFrom: new Date("2020-01-01T00:00:00.000Z"),
        entries: {
          create: [
            { bucketName: "salary_pool", percentageBps: 5600, fixedMonthlyTargetPaise: null, dueDay: 1 },
            { bucketName: "kotak", percentageBps: 1900, fixedMonthlyTargetPaise: 8_000_000, dueDay: 10 },
            {
              bucketName: "fuel",
              percentageBps: 200,
              fixedMonthlyTargetMinPaise: 600_000,
              fixedMonthlyTargetMaxPaise: 800_000,
            },
            { bucketName: "axis", percentageBps: 800, fixedMonthlyTargetPaise: null },
            { bucketName: "marketing", percentageBps: 700, fixedMonthlyTargetPaise: null },
            { bucketName: "profit", percentageBps: 800, fixedMonthlyTargetPaise: null },
          ],
        },
      },
    });
  }

  // ---- Digital Marketing deliverable catalog + 4 starter packages ----
  // Names, quantities and prices below are placeholders — edit them from
  // the "DM Packages" page once real numbers are decided.
  const deliverableSeed = [
    { name: "Reels / Short-form Videos", unit: "per month" },
    { name: "Static Post Creatives", unit: "per month" },
    { name: "Carousel Posts", unit: "per month" },
    { name: "Story Creatives", unit: "per month" },
    { name: "Instagram Management", unit: "included" },
    { name: "Facebook Management", unit: "included" },
    { name: "YouTube Management", unit: "included" },
    { name: "LinkedIn Management", unit: "included" },
    { name: "Meta Ads Campaigns", unit: "campaigns/month" },
    { name: "Google Ads Management", unit: "included" },
    { name: "Influencer Collaborations", unit: "per month" },
    { name: "Content Calendar & Strategy", unit: "included" },
    { name: "Copywriting & Captions", unit: "included" },
    { name: "Photography / Shoot Days", unit: "days/month" },
    { name: "Video Editing (Long-form)", unit: "per month" },
    { name: "Community Management", unit: "included" },
    { name: "Monthly Performance Report", unit: "included" },
    { name: "Email Marketing Campaigns", unit: "per month" },
    { name: "SEO / Blog Content", unit: "posts/month" },
  ];

  const existingDeliverables = await prisma.deliverableType.count();
  if (existingDeliverables === 0) {
    const deliverables: Record<string, string> = {};
    for (let i = 0; i < deliverableSeed.length; i++) {
      const d = await prisma.deliverableType.create({
        data: { name: deliverableSeed[i].name, unit: deliverableSeed[i].unit, sortOrder: i },
      });
      deliverables[d.name] = d.id;
    }

    type PackageQty = Record<string, number>; // deliverable name -> quantity (0 = not included)
    const packages: { name: string; description: string; pricePaise: number; qty: PackageQty }[] = [
      {
        name: "Starter",
        description: "For small businesses just getting going on social.",
        pricePaise: 2_500_000,
        qty: {
          "Reels / Short-form Videos": 4,
          "Static Post Creatives": 8,
          "Carousel Posts": 2,
          "Story Creatives": 8,
          "Instagram Management": 1,
          "Facebook Management": 1,
          "Content Calendar & Strategy": 1,
          "Copywriting & Captions": 1,
          "Photography / Shoot Days": 1,
          "Community Management": 1,
          "Monthly Performance Report": 1,
        },
      },
      {
        name: "Growth",
        description: "For brands ready to scale reach and start paid.",
        pricePaise: 4_500_000,
        qty: {
          "Reels / Short-form Videos": 8,
          "Static Post Creatives": 12,
          "Carousel Posts": 4,
          "Story Creatives": 15,
          "Instagram Management": 1,
          "Facebook Management": 1,
          "YouTube Management": 1,
          "Meta Ads Campaigns": 2,
          "Influencer Collaborations": 1,
          "Content Calendar & Strategy": 1,
          "Copywriting & Captions": 1,
          "Photography / Shoot Days": 2,
          "Video Editing (Long-form)": 2,
          "Community Management": 1,
          "Monthly Performance Report": 1,
          "Email Marketing Campaigns": 2,
          "SEO / Blog Content": 2,
        },
      },
      {
        name: "Premium",
        description: "Full-funnel presence across every major platform.",
        pricePaise: 7_500_000,
        qty: {
          "Reels / Short-form Videos": 15,
          "Static Post Creatives": 20,
          "Carousel Posts": 8,
          "Story Creatives": 25,
          "Instagram Management": 1,
          "Facebook Management": 1,
          "YouTube Management": 1,
          "LinkedIn Management": 1,
          "Meta Ads Campaigns": 4,
          "Google Ads Management": 1,
          "Influencer Collaborations": 3,
          "Content Calendar & Strategy": 1,
          "Copywriting & Captions": 1,
          "Photography / Shoot Days": 4,
          "Video Editing (Long-form)": 4,
          "Community Management": 1,
          "Monthly Performance Report": 1,
          "Email Marketing Campaigns": 4,
          "SEO / Blog Content": 4,
        },
      },
      {
        name: "Enterprise",
        description: "Maximum output for brands that need to dominate share of voice.",
        pricePaise: 12_500_000,
        qty: {
          "Reels / Short-form Videos": 25,
          "Static Post Creatives": 30,
          "Carousel Posts": 12,
          "Story Creatives": 30,
          "Instagram Management": 1,
          "Facebook Management": 1,
          "YouTube Management": 1,
          "LinkedIn Management": 1,
          "Meta Ads Campaigns": 8,
          "Google Ads Management": 1,
          "Influencer Collaborations": 6,
          "Content Calendar & Strategy": 1,
          "Copywriting & Captions": 1,
          "Photography / Shoot Days": 8,
          "Video Editing (Long-form)": 8,
          "Community Management": 1,
          "Monthly Performance Report": 1,
          "Email Marketing Campaigns": 8,
          "SEO / Blog Content": 8,
        },
      },
    ];

    for (let i = 0; i < packages.length; i++) {
      const p = packages[i];
      await prisma.quotationPackage.create({
        data: {
          name: p.name,
          description: p.description,
          defaultPricePaise: p.pricePaise,
          sortOrder: i,
          items: {
            create: Object.entries(deliverables).map(([name, deliverableTypeId]) => ({
              deliverableTypeId,
              included: (p.qty[name] ?? 0) > 0,
              quantity: p.qty[name] ?? 0,
            })),
          },
        },
      });
    }
  }

  // ---- Web Dev deliverable catalog + 4 packages ----
  // Landing Page / Static / Dynamic / E-commerce, escalating in pages and
  // features. "Custom" isn't seeded as a package — same as Digital
  // Marketing, it's a UI option that starts from a blank checklist.
  const existingWebDevTypes = await prisma.deliverableType.count({ where: { department: "Web Dev" } });
  if (existingWebDevTypes === 0) {
    const webDeliverableSeed = [
      { name: "Custom UI/UX Design", unit: "included" },
      { name: "Design Revision Rounds", unit: "rounds" },
      { name: "Responsive Design", unit: "included" },
      { name: "Wireframing", unit: "included" },
      { name: "Number of Pages", unit: "pages" },
      { name: "Blog / News Section", unit: "included" },
      { name: "Content Upload (copy & images)", unit: "included" },
      { name: "Contact/Inquiry Forms", unit: "forms" },
      { name: "Booking/Appointment Form", unit: "included" },
      { name: "Newsletter Signup Integration", unit: "included" },
      { name: "Live Chat Integration", unit: "included" },
      { name: "Multi-language Support", unit: "included" },
      { name: "CMS (self-editable)", unit: "included" },
      { name: "Product Catalog Setup", unit: "products" },
      { name: "Shopping Cart & Checkout", unit: "included" },
      { name: "Payment Gateway Integration", unit: "gateways" },
      { name: "Order Management Dashboard", unit: "included" },
      { name: "Coupon/Discount Engine", unit: "included" },
      { name: "Inventory Management", unit: "included" },
      { name: "User Login / Membership Portal", unit: "included" },
      { name: "Custom Admin Dashboard", unit: "included" },
      { name: "API Integration (CRM/ERP/3rd-party)", unit: "integrations" },
      { name: "Custom Web App Development", unit: "included" },
      { name: "On-page SEO Setup", unit: "included" },
      { name: "Analytics & Search Console Setup", unit: "included" },
      { name: "Page Speed Optimization", unit: "included" },
      { name: "Free Tech Support Period", unit: "days" },
      { name: "Training/Handover Session", unit: "sessions" },
      { name: "Documentation Handover", unit: "included" },
      { name: "Ongoing Maintenance Retainer", unit: "included" },
    ];

    const webDeliverables: Record<string, string> = {};
    for (let i = 0; i < webDeliverableSeed.length; i++) {
      const d = await prisma.deliverableType.create({
        data: { name: webDeliverableSeed[i].name, unit: webDeliverableSeed[i].unit, department: "Web Dev", sortOrder: i },
      });
      webDeliverables[d.name] = d.id;
    }

    type WebPackageQty = Record<string, number>;
    const webPackages: { name: string; description: string; pricePaise: number; qty: WebPackageQty }[] = [
      {
        name: "Landing Page",
        description: "A single high-converting page for a campaign, product, or launch.",
        pricePaise: 1_500_000,
        qty: {
          "Custom UI/UX Design": 1,
          "Design Revision Rounds": 3,
          "Responsive Design": 1,
          "Wireframing": 1,
          "Number of Pages": 1,
          "Content Upload (copy & images)": 1,
          "Contact/Inquiry Forms": 1,
          "On-page SEO Setup": 1,
          "Analytics & Search Console Setup": 1,
          "Free Tech Support Period": 45,
          "Training/Handover Session": 1,
          "Documentation Handover": 1,
        },
      },
      {
        name: "Static",
        description: "A straightforward brochure-style website, up to 5 pages.",
        pricePaise: 3_000_000,
        qty: {
          "Custom UI/UX Design": 1,
          "Design Revision Rounds": 3,
          "Responsive Design": 1,
          "Wireframing": 1,
          "Number of Pages": 5,
          "Blog / News Section": 1,
          "Content Upload (copy & images)": 1,
          "Contact/Inquiry Forms": 1,
          "CMS (self-editable)": 1,
          "On-page SEO Setup": 1,
          "Analytics & Search Console Setup": 1,
          "Page Speed Optimization": 1,
          "Free Tech Support Period": 45,
          "Training/Handover Session": 1,
          "Documentation Handover": 1,
        },
      },
      {
        name: "Dynamic",
        description: "A content-rich, interactive site up to 10 pages — bookings, newsletters, accounts.",
        pricePaise: 6_000_000,
        qty: {
          "Custom UI/UX Design": 1,
          "Design Revision Rounds": 3,
          "Responsive Design": 1,
          "Wireframing": 1,
          "Number of Pages": 10,
          "Blog / News Section": 1,
          "Content Upload (copy & images)": 1,
          "Contact/Inquiry Forms": 2,
          "Booking/Appointment Form": 1,
          "Newsletter Signup Integration": 1,
          "Live Chat Integration": 1,
          "Multi-language Support": 1,
          "CMS (self-editable)": 1,
          "User Login / Membership Portal": 1,
          "On-page SEO Setup": 1,
          "Analytics & Search Console Setup": 1,
          "Page Speed Optimization": 1,
          "Free Tech Support Period": 45,
          "Training/Handover Session": 2,
          "Documentation Handover": 1,
        },
      },
      {
        name: "E-commerce",
        description: "A full online store — catalog, cart, payments, order management, up to 15 pages.",
        pricePaise: 12_000_000,
        qty: {
          "Custom UI/UX Design": 1,
          "Design Revision Rounds": 3,
          "Responsive Design": 1,
          "Wireframing": 1,
          "Number of Pages": 15,
          "Blog / News Section": 1,
          "Content Upload (copy & images)": 1,
          "Contact/Inquiry Forms": 2,
          "Booking/Appointment Form": 1,
          "Newsletter Signup Integration": 1,
          "Live Chat Integration": 1,
          "Multi-language Support": 1,
          "CMS (self-editable)": 1,
          "Product Catalog Setup": 50,
          "Shopping Cart & Checkout": 1,
          "Payment Gateway Integration": 2,
          "Order Management Dashboard": 1,
          "Coupon/Discount Engine": 1,
          "Inventory Management": 1,
          "User Login / Membership Portal": 1,
          "Custom Admin Dashboard": 1,
          "API Integration (CRM/ERP/3rd-party)": 1,
          "On-page SEO Setup": 1,
          "Analytics & Search Console Setup": 1,
          "Page Speed Optimization": 1,
          "Free Tech Support Period": 45,
          "Training/Handover Session": 2,
          "Documentation Handover": 1,
        },
      },
    ];

    for (let i = 0; i < webPackages.length; i++) {
      const p = webPackages[i];
      await prisma.quotationPackage.create({
        data: {
          name: p.name,
          description: p.description,
          department: "Web Dev",
          defaultPricePaise: p.pricePaise,
          sortOrder: i,
          items: {
            create: Object.entries(webDeliverables).map(([name, deliverableTypeId]) => ({
              deliverableTypeId,
              included: (p.qty[name] ?? 0) > 0,
              quantity: p.qty[name] ?? 0,
            })),
          },
        },
      });
    }
  }

  console.log("Seed complete — accounts and default bucket percentages only, no sample data.");
  console.log("Seeded founder and accountant login accounts.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
