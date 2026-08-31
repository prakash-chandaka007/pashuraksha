import { redirect } from "next/navigation";

export default async function FarmerProfilePage() {
  redirect("/farmer/settings");
}
