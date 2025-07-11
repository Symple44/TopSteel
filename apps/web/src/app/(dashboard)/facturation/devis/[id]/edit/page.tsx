'use client'

import { DevisPreview } from '@/components/facturation/devis-preview'
import {
  Badge, Button, Card, CardContent, CardHeader, CardTitle,
  Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea
} from '@erp/ui'
import { Calculator, Download, Eye, Plus, Save, Send, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface DevisEditPageProps {
  params: Promise<{ id: string }>
}

export default function DevisEditPage({ params }: DevisEditPageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [devis, setDevis] = useState({
    reference: 'DEV-2024-0001',
    clientId: '',
    projetId: '',
    dateCreation: new Date(),
    dateValidite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    conditions: 'Devis valable 30 jours. Acompte de 30% à la commande.',
    lignes: [
      {
        id: '1',
        designation: 'Portail coulissant acier galvanisé',
        quantite: 1,
        unite: 'u',
        prixUnitaire: 2500,
        taux_tva: 20,
        remise: 0,
      },
    ],
    sousTotal: 0,
    remiseGlobale: 0,
    totalHT: 0,
    totalTVA: 0,
    totalTTC: 0,
  })

  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  const calculateTotals = useCallback(() => {
    const sousTotal = devis.lignes.reduce((sum, ligne) => {
      const montantLigne = ligne.quantite * ligne.prixUnitaire * (1 - ligne.remise / 100)

      return sum + montantLigne
    }, 0)

    const totalHT = sousTotal * (1 - devis.remiseGlobale / 100)
    const totalTVA =
      devis.lignes.reduce((sum, ligne) => {
        const montantLigne = ligne.quantite * ligne.prixUnitaire * (1 - ligne.remise / 100)
        const montantTVA = (montantLigne * ligne.taux_tva) / 100

        return sum + montantTVA
      }, 0) *
      (1 - devis.remiseGlobale / 100)

    const totalTTC = totalHT + totalTVA

    setDevis((prev) => ({
      ...prev,
      sousTotal,
      totalHT,
      totalTVA,
      totalTTC,
    }))
  }, [devis.lignes, devis.remiseGlobale])

  useEffect(() => {
    calculateTotals()
  }, [calculateTotals])

  const addLigne = useCallback(() => {
    const newLigne = {
      id: Date.now().toString(),
      designation: '',
      quantite: 1,
      unite: 'u',
      prixUnitaire: 0,
      taux_tva: 20,
      remise: 0,
    }

    setDevis((prev) => ({
      ...prev,
      lignes: [...prev.lignes, newLigne],
    }))
  }, [])

  const removeLigne = useCallback((id: string) => {
    setDevis((prev) => ({
      ...prev,
      lignes: prev.lignes.filter((l) => l.id !== id),
    }))
  }, [])

  const updateLigne = useCallback((id: string, field: string, value: any) => {
    setDevis((prev) => ({
      ...prev,
      lignes: prev.lignes.map((l) => (l.id === id ? { ...l, [field]: value } : l)),
    }))
  }, [])

  if (!resolvedParams) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-2 border-current border-r-transparent" />
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Devis {devis.reference}</h1>
          <p className="text-muted-foreground">Création et modification de devis</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Aperçu
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline">
            <Send className="h-4 w-4 mr-2" />
            Envoyer
          </Button>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations générales */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client">Client</Label>
                  <Select
                    value={devis.clientId}
                    onValueChange={(value) => setDevis((prev) => ({ ...prev, clientId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Client A</SelectItem>
                      <SelectItem value="2">Client B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="projet">Projet (optionnel)</Label>
                  <Select
                    value={devis.projetId}
                    onValueChange={(value) => setDevis((prev) => ({ ...prev, projetId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un projet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Projet A</SelectItem>
                      <SelectItem value="2">Projet B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="conditions">Conditions générales</Label>
                <Textarea
                  id="conditions"
                  value={devis.conditions}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setDevis((prev) => ({
                      ...prev,
                      conditions: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full p-2 border rounded-md resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Lignes du devis */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lignes du devis</CardTitle>
                <Button onClick={addLigne} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter ligne
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Désignation</TableHead>
                    <TableHead>Qté</TableHead>
                    <TableHead>Unité</TableHead>
                    <TableHead>Prix Unit.</TableHead>
                    <TableHead>TVA %</TableHead>
                    <TableHead>Remise %</TableHead>
                    <TableHead>Total HT</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devis.lignes.map((ligne) => (
                    <TableRow key={ligne.id}>
                      <TableCell>
                        <Input
                          value={ligne.designation}
                          onChange={(e) =>
                            updateLigne(
                              ligne.id,
                              'designation',
                              (e.target as HTMLInputElement | HTMLTextAreaElement).value
                            )
                          }
                          placeholder="Description de la prestation"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={ligne.quantite?.toString() ?? ""}
                          onChange={(e) =>
                            updateLigne(
                              ligne.id,
                              'quantite',
                              Number.parseFloat(
                                (e.target as HTMLInputElement | HTMLTextAreaElement).value
                              ) || 0
                            )
                          }
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={ligne.unite}
                          onValueChange={(value) => updateLigne(ligne.id, 'unite', value)}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="u">u</SelectItem>
                            <SelectItem value="m">m</SelectItem>
                            <SelectItem value="m²">m²</SelectItem>
                            <SelectItem value="h">h</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={ligne.prixUnitaire?.toString() ?? ""}
                          onChange={(e) =>
                            updateLigne(
                              ligne.id,
                              'prixUnitaire',
                              Number.parseFloat(
                                (e.target as HTMLInputElement | HTMLTextAreaElement).value
                              ) || 0
                            )
                          }
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={ligne.taux_tva?.toString() ?? ""}
                          onChange={(e) =>
                            updateLigne(
                              ligne.id,
                              'taux_tva',
                              Number.parseFloat(
                                (e.target as HTMLInputElement | HTMLTextAreaElement).value
                              ) || 0
                            )
                          }
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={ligne.remise?.toString() ?? ""}
                          onChange={(e) =>
                            updateLigne(
                              ligne.id,
                              'remise',
                              Number.parseFloat(
                                (e.target as HTMLInputElement | HTMLTextAreaElement).value
                              ) || 0
                            )
                          }
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        {(ligne.quantite * ligne.prixUnitaire * (1 - ligne.remise / 100)).toFixed(
                          2
                        )}{' '}
                        €
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => removeLigne(ligne.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Récapitulatif */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Sous-total:</span>
                  <span>{devis.sousTotal.toFixed(2)} €</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Remise globale:</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={devis.remiseGlobale?.toString() ?? ""}
                      onChange={(e) =>
                        setDevis((prev) => ({
                          ...prev,
                          remiseGlobale:
                            Number.parseFloat(
                              (e.target as HTMLInputElement | HTMLTextAreaElement).value
                            ) || 0,
                        }))
                      }
                      className="w-16 text-right"
                    />
                    <span>%</span>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span>Total HT:</span>
                  <span className="font-medium">{devis.totalHT.toFixed(2)} €</span>
                </div>

                <div className="flex justify-between">
                  <span>Total TVA:</span>
                  <span>{devis.totalTVA.toFixed(2)} €</span>
                </div>

                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total TTC:</span>
                  <span>{devis.totalTTC.toFixed(2)} €</span>
                </div>
              </div>

              <Button className="w-full" onClick={calculateTotals}>
                <Calculator className="h-4 w-4 mr-2" />
                Recalculer
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statut</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">Brouillon</Badge>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal d'aperçu */}
      {showPreview && (
        <DevisPreview devisId={devis.reference} open={showPreview} onOpenChange={setShowPreview} />
      )}
    </div>
  )
}


