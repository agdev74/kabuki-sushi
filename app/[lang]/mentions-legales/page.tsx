import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions Légales & CGV",
  description: "Informations légales, conditions générales de vente et politique de confidentialité de Kabuki Sushi Genève.",
};

export default function MentionsLegales() {
  return (
    <div className="bg-neutral-900 min-h-screen text-gray-300 py-24">
      <div className="container mx-auto px-6 max-w-4xl">
        
        <h1 className="text-4xl font-display font-bold text-white mb-12 border-l-4 border-kabuki-red pl-6">
          Mentions Légales & CGV
        </h1>

        <div className="space-y-12">
          
          {/* SECTION 1 : ÉDITEUR */}
          <section className="bg-neutral-800 p-8 rounded-2xl border border-neutral-700">
            <h2 className="text-2xl font-bold text-white mb-4">1. Éditeur du Site</h2>
            <p className="mb-4">
              Le site internet <strong>Kabuki Sushi</strong> est édité par :
            </p>
            <ul className="list-disc pl-5 space-y-2 text-white">
              <li><strong>Raison sociale :</strong> Kabuki Sushi SA/SARL (À adapter)</li>
              <li><strong>Adresse :</strong> 1 Boulevard de la Tour, 1205 Genève, Suisse</li>
              <li><strong>Téléphone :</strong> <a href="tel:+41786767100">078 676 71 00</a></li>
              <li><strong>Email :</strong> contact@kabuki-sushi.ch (À adapter)</li>
              <li><strong>Numéro IDE (UID) :</strong> CHE-XXX.XXX.XXX (À compléter)</li>
              <li><strong>Directeur de la publication :</strong> [Ton Nom]</li>
            </ul>
          </section>

          {/* SECTION 2 : CONDITIONS GÉNÉRALES DE VENTE (Obligatoire pour Stripe) */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4">2. Conditions Générales de Vente (CGV)</h2>
            <div className="space-y-4 leading-relaxed">
              <p><strong>Commandes et Paiement :</strong> Le paiement des commandes s&apos;effectue en ligne au moment de la validation via notre prestataire de paiement sécurisé (Stripe). Les prix sont indiqués en Francs Suisses (CHF) et incluent la TVA applicable.</p>
              <p><strong>Droit de rétractation et annulation :</strong> Conformément à la législation en vigueur sur les denrées périssables, <strong>aucun droit de rétractation ni remboursement</strong> ne peut être exercé une fois la préparation de la commande commencée en cuisine.</p>
              <p><strong>Livraison :</strong> Kabuki Sushi s&apos;efforce de respecter les horaires de livraison et de retrait annoncés. Toutefois, un retard indépendant de notre volonté (trafic, intempéries) ne donne droit à aucune compensation. Il incombe au client de fournir une adresse et un numéro de téléphone exacts.</p>
            </div>
          </section>

          {/* SECTION 3 : DONNÉES PERSONNELLES & PAIEMENTS (Modifiée pour Stripe) */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4">3. Protection des Données et Paiements</h2>
            <div className="space-y-4 leading-relaxed">
              <p>
                Kabuki Sushi s&apos;engage à ce que la collecte et le traitement de vos données (nom, adresse, téléphone) soient conformes à la loi fédérale sur la protection des données (LPD). Elles sont conservées uniquement pour la gestion de vos commandes et notre service client.
              </p>
              <p className="p-4 bg-kabuki-red/10 border border-kabuki-red/20 rounded-xl text-white">
                <strong>Sécurité des paiements :</strong> Vos transactions financières sont entièrement gérées et sécurisées par notre partenaire <strong>Stripe Inc.</strong> Kabuki Sushi ne stocke, ni n&apos;a accès à aucun moment à vos coordonnées bancaires complètes.
              </p>
            </div>
          </section>

          {/* SECTION 4 : PROPRIÉTÉ INTELLECTUELLE */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4">4. Propriété Intellectuelle</h2>
            <p className="leading-relaxed">
              L&apos;ensemble de ce site relève de la législation suisse et internationale sur le droit d&apos;auteur. Tous les droits de reproduction sont réservés, y compris pour les représentations iconographiques et photographiques. La reproduction de tout ou partie de ce site sans autorisation expresse est formellement interdite.
            </p>
          </section>

          {/* SECTION 5 : HÉBERGEMENT */}
          <section>
            <h2 className="text-xl font-bold text-gray-500 mb-4">5. Hébergement</h2>
            <p className="text-sm text-gray-400">
              Ce site est hébergé par : <strong>Vercel Inc.</strong>, 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}