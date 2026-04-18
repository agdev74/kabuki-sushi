"use client";

import OrdersList from "@/components/admin/OrdersList";
import EmergencyControl from "@/components/admin/EmergencyControl";
import Reveal from "@/components/Reveal";

export default function AdminDashboardPage() {
  return (
    <div className="p-8 space-y-10">
      <Reveal>
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-widest text-white">
            Tableau de <span className="text-kabuki-red">Bord</span>
          </h1>
          <p className="text-gray-500 text-sm mt-2 italic">
            Suivi des commandes passées via le site Kabuki Sushi.
          </p>
        </div>
      </Reveal>

      {/* ─── Contrôle du Restaurant ─────────────────────────────────────── */}
      <Reveal>
        <section aria-labelledby="store-control-heading">
          <h2
            id="store-control-heading"
            className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 border-b border-neutral-800 pb-2"
          >
            Contrôle du Restaurant
          </h2>
          <EmergencyControl />
        </section>
      </Reveal>

      {/* ─── Commandes en cours ─────────────────────────────────────────── */}
      <Reveal>
        <section aria-labelledby="orders-heading">
          <h2
            id="orders-heading"
            className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 border-b border-neutral-800 pb-2"
          >
            Commandes en cours
          </h2>
          <OrdersList />
        </section>
      </Reveal>
    </div>
  );
}