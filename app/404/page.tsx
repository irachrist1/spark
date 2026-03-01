import { redirect } from "next/navigation";

export default function Legacy404RedirectPage() {
  redirect("/auth-redirect");
}

