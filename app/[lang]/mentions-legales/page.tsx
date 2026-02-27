import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions Légales & Impressum",
  description: "Informations légales, conditions d'utilisation et politique de confidentialité de Kabuki Sushi Genève.",
};

export default function MentionsLegales() {
  return (
    <div className="bg-neutral-900 min-h-screen text-gray-300 py-24">
      <div className="container mx-auto px-6 max-w-4xl">
        
        <h1 className="text-4xl font-display font-bold text-white mb-12 border-l-4 border-kabuki-red pl-6">
          Mentions Légales (Impressum)
        </h1>

        <div className="space-y-12">
          
          {/* SECTION 1 : ÉDITEUR */}
          <section className="bg-neutral-800 p-8 rounded-2xl border border-neutral-700">
            <h2 className="text-2xl font-bold text-white mb-4">1. Éditeur du Site</h2>
            <p className="mb-4">
              Le site internet <strong>Kabuki Sushi</strong> est édité par :
            </p>
            <ul className="list-disc pl-5 space-y-2 text-white">
              <li><strong>Raison sociale :</strong> Kabuki Sushi (ou Votre Société SA/SARL)</li>
              <li><strong>Adresse :</strong> 1 Boulevard de la Tour, 1205 Genève, Suisse</li>
              <li><strong>Téléphone :</strong> +41 22 00 00 00</li>
              <li><strong>Email :</strong> contact@kabuki.com</li>
              {/* Le numéro IDE est obligatoire en Suisse si vous êtes inscrit au registre du commerce */}
              <li><strong>Numéro IDE (UID) :</strong> CHE-123.456.789 (À compléter)</li>
              <li><strong>Directeur de la publication :</strong> [Votre Nom]</li>
            </ul>
          </section>

          {/* SECTION 2 : HÉBERGEMENT */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4">2. Hébergement</h2>
            <p>
              Ce site est hébergé par :<br/>
              <strong>Vercel Inc.</strong><br/>
              440 N Barranca Ave #4133<br/>
              Covina, CA 91723<br/>
              États-Unis
            </p>
          </section>

          {/* SECTION 3 : PROPRIÉTÉ INTELLECTUELLE */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4">3. Propriété Intellectuelle</h2>
            <p className="leading-relaxed">
              L&apos;ensemble de ce site relève de la législation suisse et internationale sur le droit d&apos;auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
              La reproduction de tout ou partie de ce site sur un support électronique quel qu&apos;il soit est formellement interdite sauf autorisation expresse du directeur de la publication.
            </p>
          </section>

          {/* SECTION 4 : DONNÉES PERSONNELLES */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4">4. Protection des Données</h2>
            <p className="leading-relaxed mb-4">
              Kabuki Sushi s&apos;engage à ce que la collecte et le traitement de vos données, effectués à partir du site, soient conformes à la loi fédérale sur la protection des données (LPD) et au règlement général sur la protection des données (RGPD).
            </p>
            <p className="leading-relaxed">
              Les informations recueillies via les formulaires (Contact, Devis Traiteur) sont enregistrées dans un fichier informatisé par Kabuki Sushi pour la gestion de la clientèle. Elles sont conservées pendant 3 ans et sont destinées uniquement à notre service commercial.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}