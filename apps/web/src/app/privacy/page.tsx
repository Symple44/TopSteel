import { Card } from '@erp/ui'
import { Shield, Eye, Lock, Database, Users, Mail } from 'lucide-react'
import Link from 'next/link'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Politique de Confidentialité</h1>
          <p className="text-gray-600">
            TopSteel ERP - Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>

        <Card className="p-8 shadow-lg space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Eye className="mr-2 h-5 w-5 text-blue-600" />
              Introduction
            </h2>
            <div className="text-gray-700 space-y-3">
              <p>
                TopSteel s'engage à protéger votre vie privée et vos données personnelles. Cette politique 
                explique comment nous collectons, utilisons et protégeons vos informations lorsque vous 
                utilisez notre plateforme ERP.
              </p>
              <p>
                En utilisant TopSteel ERP, vous acceptez les pratiques décrites dans cette politique de confidentialité.
              </p>
            </div>
          </section>

          {/* Données collectées */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Database className="mr-2 h-5 w-5 text-green-600" />
              Données que nous collectons
            </h2>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Informations d'identification</h3>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>• Nom, prénom, adresse email</li>
                  <li>• Informations de l'entreprise (nom, SIRET, adresse)</li>
                  <li>• Identifiants de connexion et mots de passe (chiffrés)</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Données d'utilisation</h3>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>• Logs de connexion et d'activité</li>
                  <li>• Données de performance et d'utilisation</li>
                  <li>• Préférences utilisateur et paramètres</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Données métier</h3>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>• Informations clients et fournisseurs</li>
                  <li>• Données de production et de stock</li>
                  <li>• Documents et fichiers téléchargés</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Utilisation des données */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="mr-2 h-5 w-5 text-purple-600" />
              Comment nous utilisons vos données
            </h2>
            <div className="text-gray-700 space-y-3">
              <p>Nous utilisons vos données uniquement pour :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Fournir et maintenir le service TopSteel ERP</li>
                <li>Gérer votre compte et authentification</li>
                <li>Améliorer nos services et développer de nouvelles fonctionnalités</li>
                <li>Fournir un support technique et client</li>
                <li>Respecter nos obligations légales et réglementaires</li>
              </ul>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-blue-800 text-sm">
                  <strong>Important :</strong> Nous ne vendons jamais vos données à des tiers et ne les utilisons 
                  pas à des fins publicitaires.
                </p>
              </div>
            </div>
          </section>

          {/* Sécurité */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Lock className="mr-2 h-5 w-5 text-red-600" />
              Sécurité et protection
            </h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                Nous mettons en place des mesures de sécurité strictes pour protéger vos données :
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Chiffrement</h3>
                  <p className="text-gray-700 text-sm">
                    Toutes les données sont chiffrées en transit (HTTPS) et au repos (AES-256).
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Authentification</h3>
                  <p className="text-gray-700 text-sm">
                    Authentification forte avec 2FA disponible et politique de mots de passe robuste.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Accès contrôlé</h3>
                  <p className="text-gray-700 text-sm">
                    Accès limité selon le principe du moindre privilège et audit complet.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Sauvegardes</h3>
                  <p className="text-gray-700 text-sm">
                    Sauvegardes automatiques chiffrées avec rétention et tests de restauration.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Vos droits */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="mr-2 h-5 w-5 text-amber-600" />
              Vos droits (RGPD)
            </h2>
            <div className="text-gray-700 space-y-3">
              <p>Conformément au RGPD, vous disposez des droits suivants :</p>
              <div className="grid md:grid-cols-2 gap-4">
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="font-medium text-gray-900 mr-2">Accès :</span>
                    <span className="text-sm">Consulter vos données personnelles</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium text-gray-900 mr-2">Rectification :</span>
                    <span className="text-sm">Corriger des données inexactes</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium text-gray-900 mr-2">Effacement :</span>
                    <span className="text-sm">Supprimer vos données</span>
                  </li>
                </ul>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="font-medium text-gray-900 mr-2">Limitation :</span>
                    <span className="text-sm">Restreindre le traitement</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium text-gray-900 mr-2">Portabilité :</span>
                    <span className="text-sm">Récupérer vos données</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium text-gray-900 mr-2">Opposition :</span>
                    <span className="text-sm">Vous opposer au traitement</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Conservation */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Conservation des données</h2>
            <div className="text-gray-700 space-y-3">
              <p>Nous conservons vos données selon les durées légales :</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Données de compte : pendant la durée d'utilisation + 3 ans</li>
                <li>Données comptables : 10 ans (obligation légale)</li>
                <li>Logs de sécurité : 1 an</li>
                <li>Données de support : 3 ans après résolution</li>
              </ul>
            </div>
          </section>

          {/* Contact */}
          <section className="border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Mail className="mr-2 h-5 w-5 text-blue-600" />
              Contact et réclamations
            </h2>
            <div className="text-gray-700 space-y-3">
              <p>
                Pour exercer vos droits ou pour toute question concernant cette politique :
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p><strong>Délégué à la Protection des Données (DPO)</strong></p>
                <p>Email : <a href="mailto:dpo@topsteel.com" className="text-blue-600 hover:underline">dpo@topsteel.com</a></p>
                <p>Adresse : 123 Rue de l'Industrie, 69001 Lyon, France</p>
              </div>
              <p className="text-sm">
                Vous pouvez également déposer une réclamation auprès de la CNIL si vous estimez 
                que vos droits ne sont pas respectés.
              </p>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t pt-6 text-center">
            <p className="text-gray-500 text-sm mb-4">
              Cette politique peut être mise à jour. Nous vous informerons de tout changement significatif.
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/terms" className="text-blue-600 hover:underline text-sm">
                Conditions d'utilisation
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