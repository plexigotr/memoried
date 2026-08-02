import { redirect } from "next/navigation";

export default function VerifyPage() {
  redirect("/account/login");
}
