"use client";

import OrdersList from "@/components/admin/OrdersList";
import Reveal from "@/components/Reveal";

export default function AdminDashboardPage() {
  return (
    <div className="p-8">
      <Reveal>
        <div className="mb-10">
          <h1 className="text-3xl font-display font-bold uppercase tracking-widest text-white">
            Tableau de <span className="text-kabuki-red">Bord</span>
          </h1>
          <p className="text-gray-500 text-sm mt-2 italic">
            Suivi des commandes passées via le site.
          </p>
        </div>
      </Reveal>

      {/* Le composant qui contient toute la logique et l'import de date-fns */}
      <OrdersList />
    </div>
  );
}