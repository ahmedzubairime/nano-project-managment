import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

export default async function LocalizedRootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await currentUser();

  if (user) {
    redirect(`/${locale}/dashboard`);
  } else {
    redirect(`/${locale}/sign-in`);
  }
}
