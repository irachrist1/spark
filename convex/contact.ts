import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdminOrThrow } from "./users";

const CONTACT_CATEGORY = v.union(
  v.literal("general"),
  v.literal("mentor"),
  v.literal("partnership"),
  v.literal("school"),
  v.literal("student"),
  v.literal("feedback"),
  v.literal("bug")
);

// Public submission endpoint for contact form
export const submit = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    category: CONTACT_CATEGORY,
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const submissionId = await ctx.db.insert("contactSubmissions", {
      name: args.name.trim(),
      email: args.email.trim().toLowerCase(),
      category: args.category,
      message: args.message.trim(),
      status: "new",
      createdAt: Date.now(),
      reviewedAt: undefined,
    });

    return { submissionId };
  },
});

// Admin query for contact queue
export const listAdmin = query({
  args: {
    status: v.optional(v.union(v.literal("new"), v.literal("reviewed"), v.literal("closed"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdminOrThrow(ctx);

    let submissions = await ctx.db.query("contactSubmissions").order("desc").collect();

    if (args.status) {
      submissions = submissions.filter((submission) => submission.status === args.status);
    }

    return submissions.slice(0, args.limit ?? 100);
  },
});

// Admin mutation to set contact status
export const updateStatus = mutation({
  args: {
    id: v.id("contactSubmissions"),
    status: v.union(v.literal("new"), v.literal("reviewed"), v.literal("closed")),
  },
  handler: async (ctx, args) => {
    await requireAdminOrThrow(ctx);

    await ctx.db.patch(args.id, {
      status: args.status,
      reviewedAt: args.status === "new" ? undefined : Date.now(),
    });

    return { success: true };
  },
});
