export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h1 className="text-4xl font-bold mb-8">Politique de Confidentialité</h1>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">1. Collecte des données</h2>
              <p>
                Nous collectons les données suivantes :
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Informations de compte (email, nom)</li>
                <li>Captures d'écran de conversations pour analyse</li>
                <li>Échantillons vocaux pour clonage de voix</li>
                <li>Données d'utilisation et analytics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">2. Utilisation des données</h2>
              <p>
                Vos données sont utilisées pour :
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Créer et améliorer votre double IA</li>
                <li>Personnaliser votre expérience</li>
                <li>Améliorer nos services</li>
                <li>Vous contacter concernant votre compte</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">3. Protection des données</h2>
              <p>
                Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données
                contre tout accès, modification, divulgation ou destruction non autorisés.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">4. Vos droits</h2>
              <p>
                Conformément au RGPD, vous disposez des droits suivants :
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Droit d'accès à vos données</li>
                <li>Droit de rectification</li>
                <li>Droit à l'effacement</li>
                <li>Droit à la portabilité</li>
                <li>Droit d'opposition</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">5. Contact</h2>
              <p>
                Pour toute question concernant vos données personnelles, contactez-nous à :
                privacy@mydouble.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
