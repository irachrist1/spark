"use client";

import { ReactNode } from "react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const hasValidConvexUrl =
  typeof convexUrl === "string" &&
  convexUrl.length > 0 &&
  /^https?:\/\//.test(convexUrl) &&
  !convexUrl.includes("your-convex-url") &&
  !convexUrl.includes("placeholder");
const hasValidClerkKey =
  typeof clerkPublishableKey === "string" &&
  clerkPublishableKey.length > 0 &&
  clerkPublishableKey.startsWith("pk_") &&
  !clerkPublishableKey.includes("your_key_here");

const missingEnvVars = [
  !hasValidClerkKey ? "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" : null,
  !hasValidConvexUrl ? "NEXT_PUBLIC_CONVEX_URL" : null,
].filter((envVar): envVar is string => Boolean(envVar));

const convex = hasValidConvexUrl ? new ConvexReactClient(convexUrl) : null;
const clerkLocalization = {
  signIn: {
    start: {
      subtitle: "Sign in to OpportunityMap",
    },
  },
};

function EnvironmentSetupError() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white border-2 border-black p-6">
        <h1 className="text-2xl font-bold mb-4">Environment Configuration Required</h1>
        <p className="mb-4">
          The app cannot start because required public environment variables are missing or invalid.
        </p>
        <p className="font-semibold mb-2">Fix these values in your <code>.env.local</code>:</p>
        <ul className="list-disc pl-6 mb-4">
          {missingEnvVars.map((envVar) => (
            <li key={envVar}>
              <code>{envVar}</code>
            </li>
          ))}
        </ul>
        <p>
          Restart the dev server after updating env values.
        </p>
      </div>
    </div>
  );
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!hasValidClerkKey || !hasValidConvexUrl || !convex || !clerkPublishableKey) {
    return <EnvironmentSetupError />;
  }

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      signInForceRedirectUrl="/auth-redirect"
      signInFallbackRedirectUrl="/auth-redirect"
      localization={clerkLocalization}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
