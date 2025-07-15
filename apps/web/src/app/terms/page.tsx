import { Card } from '@erp/ui'
import { FileText, Scale, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Conditions d'Utilisation</h1>
          <p className="text-gray-600">
            TopSteel ERP - Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>

        <Card className="p-8 shadow-lg space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Scale className="mr-2 h-5 w-5 text-blue-600" />
              Acceptation des conditions
            </h2>
            <div className="text-gray-700 space-y-3">
              <p>
                En accédant et en utilisant TopSteel ERP (le "Service"), vous acceptez d'être lié par 
                ces conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas 
                utiliser notre service.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  <strong>Important :</strong> Ces conditions constituent un contrat légalement contraignant 
                  entre vous et TopSteel SAS.
                </p>
              </div>
            </div>
          </section>

          {/* Description du service */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
              Description du service
            </h2>
            <div className="text-gray-700 space-y-3">
              <p>
                TopSteel ERP est une plateforme de gestion d'entreprise spécialisée pour l'industrie 
                métallurgique, proposant des modules pour :
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <ul className="list-disc list-inside space-y-1">
                  <li>Gestion de production</li>
                  <li>Gestion des stocks</li>
                  <li>Gestion clients/fournisseurs</li>
                  <li>Facturation et devis</li>
                </ul>
                <ul className="list-disc list-inside space-y-1">
                  <li>Planning et ressources</li>
                  <li>Qualité et traçabilité</li>
                  <li>Maintenance préventive</li>
                  <li>Tableau de bord analytique</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Obligations utilisateur */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-amber-600" />
              Vos obligations
            </h2>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Utilisation appropriée</h3>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>• Utiliser le service uniquement à des fins légales et professionnelles</li>
                  <li>• Respecter les droits de propriété intellectuelle</li>
                  <li>• Ne pas tenter de compromettre la sécurité du système</li>
                  <li>• Ne pas surcharger nos serveurs par un usage excessif</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Sécurité du compte</h3>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>• Maintenir la confidentialité de vos identifiants</li>
                  <li>• Utiliser des mots de passe robustes</li>
                  <li>• Nous signaler immédiatement tout accès non autorisé</li>
                  <li>• Activer l'authentification à deux facteurs quand disponible</li>
                </ul>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-medium text-red-900 mb-2 flex items-center">
                  <XCircle className="mr-2 h-4 w-4" />
                  Utilisations interdites
                </h3>
                <ul className="text-red-800 text-sm space-y-1">
                  <li>• Tentatives de piratage ou d'intrusion</li>
                  <li>• Partage de contenu illégal ou malveillant</li>
                  <li>• Revente ou sous-licence du service</li>
                  <li>• Ingénierie inverse du logiciel</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Propriété intellectuelle */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Propriété intellectuelle</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                TopSteel ERP et tous ses composants (logiciel, documentation, interfaces) sont la 
                propriété exclusive de TopSteel SAS et sont protégés par les lois sur la propriété 
                intellectuelle.
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Vos données</h3>
                <p className="text-gray-700 text-sm">
                  Vous conservez tous les droits sur vos données métier. Nous nous engageons à ne pas 
                  les utiliser à d'autres fins que la fourniture du service.
                </p>
              </div>
            </div>
          </section>

          {/* Disponibilité */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="mr-2 h-5 w-5 text-purple-600" />
              Disponibilité et maintenance
            </h2>
            <div className="text-gray-700 space-y-3">
              <p>
                Nous nous efforçons de maintenir une disponibilité optimale du service, avec un 
                objectif de 99,5% de temps de fonctionnement.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-900 mb-2">Maintenance planifiée</h3>
                  <p className="text-green-800 text-sm">
                    Interventions programmées le dimanche entre 2h et 6h du matin, 
                    avec préavis de 48h minimum.
                  </p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-medium text-amber-900 mb-2">Interruptions d'urgence</h3>
                  <p className="text-amber-800 text-sm">
                    Possibles pour des raisons de sécurité ou de maintenance critique, 
                    avec notification immédiate.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Limitation de responsabilité */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Limitation de responsabilité</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                Dans les limites autorisées par la loi, TopSteel ne saurait être tenu responsable :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Des dommages indirects ou de la perte de données</li>
                <li>Des interruptions de service indépendantes de notre volonté</li>
                <li>De l'utilisation inappropriée du service par l'utilisateur</li>
                <li>Des décisions prises sur la base des données du système</li>
              </ul>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-blue-800 text-sm">
                  <strong>Garantie :</strong> Nous nous engageons à corriger les défauts du service 
                  dans des délais raisonnables et à fournir un support technique adapté.
                </p>
              </div>
            </div>
          </section>

          {/* Tarification */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Tarification et facturation</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                L'utilisation de TopSteel ERP est soumise aux tarifs en vigueur selon votre contrat.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Facturation</h3>
                  <ul className="text-gray-700 text-sm space-y-1">
                    <li>• Facturation mensuelle ou annuelle</li>
                    <li>• Paiement par prélèvement ou virement</li>
                    <li>• Factures disponibles dans l'interface</li>
                  </ul>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Résiliation</h3>
                  <ul className="text-gray-700 text-sm space-y-1">
                    <li>• Préavis de 30 jours par email</li>
                    <li>• Export de données possible pendant 60 jours</li>
                    <li>• Remboursement au prorata si annuel</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Modifications */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Modifications des conditions</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                Nous nous réservons le droit de modifier ces conditions d'utilisation. 
                Les modifications importantes vous seront notifiées par email avec un préavis de 30 jours.
              </p>
              <p>
                La poursuite de l'utilisation du service après modification vaut acceptation 
                des nouvelles conditions.
              </p>
            </div>
          </section>

          {/* Loi applicable */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Loi applicable et juridiction</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                Ces conditions sont régies par le droit français. Tout litige sera soumis 
                à la juridiction des tribunaux de Lyon, France.
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 text-sm">
                  <strong>Médiation :</strong> En cas de litige, nous privilégions la résolution amiable. 
                  Vous pouvez contacter notre service client à support@topsteel.com
                </p>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                Pour toute question concernant ces conditions d'utilisation :
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p><strong>TopSteel SAS</strong></p>
                <p>123 Rue de l'Industrie, 69001 Lyon, France</p>
                <p>Email : <a href="mailto:legal@topsteel.com" className="text-blue-600 hover:underline">legal@topsteel.com</a></p>
                <p>Téléphone : +33 1 23 45 67 89</p>
                <p>SIRET : 123 456 789 00123</p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t pt-6 text-center">
            <p className="text-gray-500 text-sm mb-4">
              Version 2.1 - Ces conditions annulent et remplacent toutes les versions précédentes.
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/privacy" className="text-blue-600 hover:underline text-sm">
                Politique de confidentialité
              </Link>
              <Link href="/support" className="text-blue-600 hover:underline text-sm">
                Support
              </Link>
              <Link href="/login" className="text-blue-600 hover:underline text-sm">
                Retour à la connexion
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}