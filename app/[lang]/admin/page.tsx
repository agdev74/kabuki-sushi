import { redirect } from "next/navigation";

export default function AdminPage({ params }: { params: { lang: string } }) {
  // ✅ On envoie directement vers la gestion du menu
  redirect(`/${params.lang}/admin/menu`);
}