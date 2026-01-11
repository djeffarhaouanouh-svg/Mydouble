export default function CGVPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h1 className="text-4xl font-bold mb-8">Conditions Générales de Vente</h1>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">1. Objet</h2>
              <p>
                Les présentes conditions générales de vente (CGV) régissent la relation contractuelle
                entre MyDouble et ses utilisateurs pour l'utilisation de la plateforme de création de doubles IA.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">2. Services proposés</h2>
              <p>
                MyDouble propose un service permettant de créer un assistant IA personnalisé capable
                de converser dans le style de l'utilisateur.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">3. Prix</h2>
              <p>
                Le service de base est gratuit. Des fonctionnalités premium peuvent être proposées
                moyennant un abonnement mensuel.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">4. Droit de rétractation</h2>
              <p>
                Conformément à la législation en vigueur, vous disposez d'un délai de 14 jours
                pour exercer votre droit de rétractation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">5. Protection des données</h2>
              <p>
                Vos données personnelles sont traitées conformément à notre politique de confidentialité
                et au RGPD.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
