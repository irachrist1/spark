import type { Id } from "@/convex/_generated/dataModel";

export interface SchoolSummary {
  _id: Id<"schools">;
  name: string;
  type: "university" | "technical_college" | "vocational_school" | "high_school" | "training_center" | "online_platform";
  location: {
    city: string;
    district: string;
  };
  partnershipTier: "featured" | "partner" | "listed";
  programsOffered: Array<{
    name: string;
    duration: string;
    tuitionPerYear: number;
    careerIds: Id<"careers">[];
  }>;
  description: string;
  logo?: string;
  website?: string;
  accreditation?: string;
  establishedYear?: number;
  studentCount?: number;
  scholarshipInfo?: string;
  featured: boolean;
  clickCount: number;
  isActive?: boolean;
}

export interface CareerWithCost {
  _id: Id<"careers">;
  title: string;
  category: string;
  shortDescription: string;
  salaryMin: number;
  salaryMax: number;
  costAnalysis?: {
    totalCostMin: number;
    totalCostMax: number;
  };
}

export interface AssessmentCareerMatch {
  careerId: string;
  matchPercentage: number;
  matchReasons: string[];
  interestScore?: number;
  valueScore?: number;
  personalityScore?: number;
  environmentScore?: number;
  career: CareerWithCost | null;
}
