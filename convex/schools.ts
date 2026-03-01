import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdminOrThrow } from "./users";

const SCHOOL_TYPE = v.union(
  v.literal("university"),
  v.literal("technical_college"),
  v.literal("vocational_school"),
  v.literal("high_school"),
  v.literal("training_center"),
  v.literal("online_platform")
);

const PARTNERSHIP_TIER = v.union(
  v.literal("featured"),
  v.literal("partner"),
  v.literal("listed")
);

const sortSchools = <T extends { partnershipTier: "featured" | "partner" | "listed"; clickCount: number }>(
  schools: T[]
) => {
  const tierOrder = { featured: 0, partner: 1, listed: 2 };
  return schools.sort((a, b) => {
    const aTier = tierOrder[a.partnershipTier];
    const bTier = tierOrder[b.partnershipTier];

    if (aTier !== bTier) return aTier - bTier;
    return b.clickCount - a.clickCount;
  });
};

// Get schools for a specific career (public)
export const getByCareer = query({
  args: { careerId: v.id("careers") },
  handler: async (ctx, args) => {
    const schools = await ctx.db
      .query("schools")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const relevantSchools = schools.filter((school) =>
      school.programsOffered.some((program) => program.careerIds.includes(args.careerId))
    );

    return sortSchools(relevantSchools);
  },
});

// Get schools by multiple career IDs (public)
export const getByCareerIds = query({
  args: { careerIds: v.array(v.id("careers")) },
  handler: async (ctx, args) => {
    const schools = await ctx.db
      .query("schools")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const relevantSchools = schools.filter((school) =>
      school.programsOffered.some((program) =>
        program.careerIds.some((careerId) => args.careerIds.includes(careerId))
      )
    );

    return sortSchools(relevantSchools);
  },
});

// Public school listing
export const listPublic = query({
  args: {
    type: v.optional(SCHOOL_TYPE),
    careerId: v.optional(v.id("careers")),
  },
  handler: async (ctx, args) => {
    let schools = await ctx.db.query("schools").collect();

    if (args.type) {
      schools = schools.filter((school) => school.type === args.type);
    }

    schools = schools.filter((school) => school.isActive);

    const selectedCareerId = args.careerId;
    if (selectedCareerId) {
      schools = schools.filter((school) =>
        school.programsOffered.some((program) =>
          program.careerIds.includes(selectedCareerId)
        )
      );
    }

    return sortSchools(schools);
  },
});

// Admin school listing
export const listAdmin = query({
  args: {
    type: v.optional(SCHOOL_TYPE),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdminOrThrow(ctx);

    let schools = await ctx.db.query("schools").collect();

    if (args.type) {
      schools = schools.filter((school) => school.type === args.type);
    }

    if (args.activeOnly !== undefined) {
      schools = schools.filter((school) => school.isActive === args.activeOnly);
    }

    return sortSchools(schools);
  },
});

// Backward-compatible alias
export const list = listPublic;

// Get school by ID (public)
export const getById = query({
  args: { id: v.id("schools") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get schools by IDs (public)
export const getByIds = query({
  args: { ids: v.array(v.id("schools")) },
  handler: async (ctx, args) => {
    const schools = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
    return schools.filter((school) => school !== null);
  },
});

// Get featured schools (public)
export const getFeatured = query({
  args: {},
  handler: async (ctx) => {
    const schools = await ctx.db
      .query("schools")
      .filter((q) =>
        q.and(q.eq(q.field("isActive"), true), q.eq(q.field("featured"), true))
      )
      .collect();

    return schools.sort((a, b) => b.clickCount - a.clickCount);
  },
});

// Track school click (public)
export const trackClick = mutation({
  args: { schoolId: v.id("schools") },
  handler: async (ctx, args) => {
    const school = await ctx.db.get(args.schoolId);
    if (!school) {
      throw new Error("School not found");
    }

    await ctx.db.patch(args.schoolId, {
      clickCount: school.clickCount + 1,
    });

    await ctx.db.insert("analyticsEvents", {
      eventName: "school_link_clicked",
      actorUserId: undefined,
      actorRole: undefined,
      metadata: {
        schoolId: args.schoolId,
      },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Track inquiry (public)
export const trackInquiry = mutation({
  args: { schoolId: v.id("schools") },
  handler: async (ctx, args) => {
    const school = await ctx.db.get(args.schoolId);
    if (!school) {
      throw new Error("School not found");
    }

    await ctx.db.patch(args.schoolId, {
      inquiryCount: school.inquiryCount + 1,
    });

    return { success: true };
  },
});

// Create new school (admin only)
export const create = mutation({
  args: {
    name: v.string(),
    type: SCHOOL_TYPE,
    location: v.object({
      city: v.string(),
      district: v.string(),
    }),
    website: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    programsOffered: v.array(
      v.object({
        name: v.string(),
        duration: v.string(),
        tuitionPerYear: v.number(),
        careerIds: v.array(v.id("careers")),
      })
    ),
    partnershipTier: PARTNERSHIP_TIER,
    description: v.string(),
    logo: v.optional(v.string()),
    accreditation: v.optional(v.string()),
    establishedYear: v.optional(v.number()),
    studentCount: v.optional(v.number()),
    featured: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdminOrThrow(ctx);

    const now = Date.now();

    const schoolId = await ctx.db.insert("schools", {
      name: args.name,
      type: args.type,
      location: args.location,
      website: args.website,
      contactEmail: args.contactEmail,
      contactPhone: args.contactPhone,
      programsOffered: args.programsOffered,
      partnershipTier: args.partnershipTier,
      partnerSince: args.partnershipTier !== "listed" ? now : undefined,
      description: args.description,
      logo: args.logo,
      accreditation: args.accreditation,
      establishedYear: args.establishedYear,
      studentCount: args.studentCount,
      clickCount: 0,
      inquiryCount: 0,
      isActive: true,
      featured: args.featured,
      createdAt: now,
      updatedAt: now,
    });

    return { schoolId };
  },
});

// Update school (admin only)
export const update = mutation({
  args: {
    schoolId: v.id("schools"),
    name: v.optional(v.string()),
    type: v.optional(SCHOOL_TYPE),
    location: v.optional(
      v.object({
        city: v.string(),
        district: v.string(),
      })
    ),
    website: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    programsOffered: v.optional(
      v.array(
        v.object({
          name: v.string(),
          duration: v.string(),
          tuitionPerYear: v.number(),
          careerIds: v.array(v.id("careers")),
        })
      )
    ),
    partnershipTier: v.optional(PARTNERSHIP_TIER),
    description: v.optional(v.string()),
    logo: v.optional(v.string()),
    accreditation: v.optional(v.string()),
    establishedYear: v.optional(v.number()),
    studentCount: v.optional(v.number()),
    featured: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdminOrThrow(ctx);

    const { schoolId, ...updates } = args;

    const school = await ctx.db.get(schoolId);
    if (!school) {
      throw new Error("School not found");
    }

    await ctx.db.patch(schoolId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete school (admin only)
export const remove = mutation({
  args: { schoolId: v.id("schools") },
  handler: async (ctx, args) => {
    await requireAdminOrThrow(ctx);
    await ctx.db.delete(args.schoolId);
    return { success: true };
  },
});

// Get school analytics (admin only)
export const getAnalytics = query({
  args: { schoolId: v.optional(v.id("schools")) },
  handler: async (ctx, args) => {
    await requireAdminOrThrow(ctx);

    if (args.schoolId) {
      const school = await ctx.db.get(args.schoolId);
      if (!school) return null;

      return {
        schoolId: school._id,
        name: school.name,
        clicks: school.clickCount,
        inquiries: school.inquiryCount,
        conversionRate:
          school.clickCount > 0
            ? ((school.inquiryCount / school.clickCount) * 100).toFixed(2)
            : "0",
      };
    }

    const schools = await ctx.db.query("schools").collect();

    const totalClicks = schools.reduce((sum, school) => sum + school.clickCount, 0);
    const totalInquiries = schools.reduce((sum, school) => sum + school.inquiryCount, 0);

    const topPerforming = schools
      .sort((a, b) => b.clickCount - a.clickCount)
      .slice(0, 10)
      .map((school) => ({
        schoolId: school._id,
        name: school.name,
        tier: school.partnershipTier,
        clicks: school.clickCount,
        inquiries: school.inquiryCount,
      }));

    return {
      totalSchools: schools.length,
      totalClicks,
      totalInquiries,
      overallConversionRate:
        totalClicks > 0 ? ((totalInquiries / totalClicks) * 100).toFixed(2) : "0",
      topPerforming,
    };
  },
});
