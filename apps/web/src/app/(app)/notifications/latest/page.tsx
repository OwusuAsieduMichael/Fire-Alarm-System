import { redirect } from "next/navigation";

/** Bell formerly used /notifications/latest — keep the URL working. */
export default function LatestNotificationRedirect() {
  redirect("/alert");
}
