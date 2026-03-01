import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireAdminOrThrow } from "./users";

const EVENT_NAME = v.union(
  v.literal("assessment_started"),
  v.literal("assessment_completed"),
  v.literal("results_viewed"),
  v.literal("career_saved"),
  v.literal("reality_quiz_started"),
  v.literal("reality_quiz_completed"),
  v.literal("mentor_booking_requested"),
  v.literal("mentor_booking_confirmed"),
  v.literal("school_link_clicked")
);

export const trackEvent = mutation({
  args: {
    eventName: EVENT_NAME,
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const eventId = await ctx.db.insert("analyticsEvents", {
      eventName: args.eventName,
      actorUserId: user?._id,
      actorRole: user?.role,
      metadata: args.metadata,
      createdAt: Date.now(),
    });

    return { eventId };
  },
});

export const getPilotKpis = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdminOrThrow(ctx);

    const lookbackDays = args.days ?? 14;
    const since = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;
    const events = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_created", (q) => q.gte("createdAt", since))
      .collect();

    const count = (eventName: string) =>
      events.filter((event) => event.eventName === eventName).length;

    const assessmentStarted = count("assessment_started");
    const assessmentCompleted = count("assessment_completed");
    const resultsViewed = count("results_viewed");
    const quizStarted = count("reality_quiz_started");
    const quizCompleted = count("reality_quiz_completed");
    const bookingsRequested = count("mentor_booking_requested");
    const bookingsConfirmed = count("mentor_booking_confirmed");

    return {
      rangeDays: lookbackDays,
      totals: {
        assessmentStarted,
        assessmentCompleted,
        resultsViewed,
        quizStarted,
        quizCompleted,
        bookingsRequested,
        bookingsConfirmed,
        schoolClicks: count("school_link_clicked"),
      },
      rates: {
        assessmentCompletionRate:
          assessmentStarted > 0 ? Number(((assessmentCompleted / assessmentStarted) * 100).toFixed(2)) : 0,
        resultsViewRate:
          assessmentCompleted > 0 ? Number(((resultsViewed / assessmentCompleted) * 100).toFixed(2)) : 0,
        quizCompletionRate:
          quizStarted > 0 ? Number(((quizCompleted / quizStarted) * 100).toFixed(2)) : 0,
        bookingConfirmationRate:
          bookingsRequested > 0 ? Number(((bookingsConfirmed / bookingsRequested) * 100).toFixed(2)) : 0,
      },
    };
  },
});
