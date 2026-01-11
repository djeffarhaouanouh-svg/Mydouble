export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h1 className="text-4xl font-bold mb-8">Mentions Légales</h1>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">Éditeur du site</h2>
              <p>
                <strong>MyDouble</strong>
                <br />
                SARL au capital de 10 000€
                <br />
                Siège social : [Adresse]
                <br />
                RCS : [Numéro RCS]
                <br />
                SIRET : [Numéro SIRET]
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">Directeur de la publication</h2>
              <p>[Nom du directeur]</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">Hébergement</h2>
              <p>
                Ce site est hébergé par Vercel Inc.
                <br />
                340 S Lemon Ave #4133, Walnut, CA 91789, USA
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">Contact</h2>
              <p>
                Email : contact@mydouble.com
                <br />
                Téléphone : [Numéro de téléphone]
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
