import { redirect } from "next/navigation";

export default function CloudDisabled() {
  return redirect("/admin"); // Cloud UI disabled permanently
}