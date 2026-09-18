import { redirect } from "next/navigation";
import { getCurrentDeliveryUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const user = await getCurrentDeliveryUser();

  if (user) {
    redirect("/app");
  } else {
    redirect("/login");
  }
}
