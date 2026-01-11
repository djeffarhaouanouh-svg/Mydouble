export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h1 className="text-4xl font-bold mb-8">Politique de Cookies</h1>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">Qu'est-ce qu'un cookie ?</h2>
              <p>
                Un cookie est un petit fichier texte déposé sur votre appareil lors de la visite
                d'un site web. Il permet de mémoriser des informations sur votre navigation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">Types de cookies utilisés</h2>

              <h3 className="text-xl font-semibold mb-2 text-black">Cookies essentiels</h3>
              <p className="mb-4">
                Ces cookies sont nécessaires au fonctionnement du site. Ils permettent :
              </p>
              <ul className="list-disc ml-6 space-y-1 mb-4">
                <li>L'authentification et la sécurité</li>
                <li>La mémorisation de vos préférences</li>
                <li>Le bon fonctionnement du panier</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 text-black">Cookies analytiques</h3>
              <p className="mb-4">
                Ces cookies nous aident à comprendre comment les visiteurs utilisent notre site :
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Pages visitées</li>
                <li>Durée des visites</li>
                <li>Sources de trafic</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">Gérer vos cookies</h2>
              <p>
                Vous pouvez à tout moment désactiver les cookies dans les paramètres de votre navigateur.
                Notez que cela peut affecter certaines fonctionnalités du site.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">Durée de conservation</h2>
              <p>
                Les cookies sont conservés pour une durée maximale de 13 mois, conformément à la
                réglementation CNIL.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
