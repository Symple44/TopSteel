'use client'

import { DevisPreview } from '@/components/facturation/devis-preview'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Calculator, Download, Eye, Plus, Save, Send, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

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
        remise: 0
      }
    ],
    sousTotal: 0,
    remiseGlobale: 0,
    totalHT: 0,
    totalTVA: 0,
    totalTTC: 0
  })

  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  useEffect(() => {
    calculateTotals()
  }, [devis.lignes, devis.remiseGlobale])

  const calculateTotals = () => {
    const sousTotal = devis.lignes.reduce((sum, ligne) => {
      const montantLigne = ligne.quantite * ligne.prixUnitaire * (1 - ligne.remise / 100)
      return sum + montantLigne
    }, 0)

    const totalHT = sousTotal * (1 - devis.remiseGlobale / 100)
    const totalTVA = devis.lignes.reduce((sum, ligne) => {
      const montantLigne = ligne.quantite * ligne.prixUnitaire * (1 - ligne.remise / 100)
      const montantTVA = montantLigne * ligne.taux_tva / 100
      return sum + montantTVA
    }, 0) * (1 - devis.remiseGlobale / 100)

    const totalTTC = totalHT + totalTVA

    setDevis(prev => ({
      ...prev,
      sousTotal,
      totalHT,
      totalTVA,
      totalTTC
    }))
  }

  const addLigne = () => {
    const newLigne = {
      id: Date.now().toString(),
      designation: '',
      quantite: 1,
      unite: 'u',
      prixUnitaire: 0,
      taux_tva: 20,
      remise: 0
    }
    setDevis(prev => ({
      ...prev,
      lignes: [...prev.lignes, newLigne]
    }))
  }

  const removeLigne = (id: string) => {
    setDevis(prev => ({
      ...prev,
      lignes: prev.lignes.filter(l => l.id !== id)
    }))
  }

  const updateLigne = (id: string, field: string, value: any) => {
    setDevis(prev => ({
      ...prev,
      lignes: prev.lignes.map(l => 
        l.id === id ? { ...l, [field]: value } : l
      )
    }))
  }

  if (!resolvedParams) return <div>Chargement...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Devis {devis.reference}</h1>
          <p className="text-muted-foreground">
            Création et modification de devis
          </p>
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
                  <Select value={devis.clientId} onValueChange={(value) => setDevis(prev => ({ ...prev, clientId: value }))}>
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
                  <Select value={devis.projetId} onValueChange={(value) => setDevis(prev => ({ ...prev, projetId: value }))}>
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
                <Label htmlFor="conditions">Conditions commerciales</Label>
                <Textarea
                  id="conditions"
                  value={devis.conditions}
                  onChange={(e) => setDevis(prev => ({ ...prev, conditions: e.target.value }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Lignes du devis */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lignes du devis</CardTitle>
                <Button size="sm" onClick={addLigne}>
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
                    <TableHead className="w-20">Qté</TableHead>
                    <TableHead className="w-20">Unité</TableHead>
                    <TableHead className="w-32">P.U. HT</TableHead>
                    <TableHead className="w-20">TVA</TableHead>
                    <TableHead className="w-24">Remise</TableHead>
                    <TableHead className="w-32">Total HT</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devis.lignes.map((ligne) => (
                    <TableRow key={ligne.id}>
                      <TableCell>
                        <Input
                          value={ligne.designation}
                          onChange={(e) => updateLigne(ligne.id, 'designation', e.target.value)}
                          placeholder="Description du produit/service"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={ligne.quantite}
                          onChange={(e) => updateLigne(ligne.id, 'quantite', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.1"
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={ligne.unite} 
                          onValueChange={(value) => updateLigne(ligne.id, 'unite', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="u">u</SelectItem>
                            <SelectItem value="m">m</SelectItem>
                            <SelectItem value="m²">m²</SelectItem>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="h">h</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={ligne.prixUnitaire}
                          onChange={(e) => updateLigne(ligne.id, 'prixUnitaire', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={ligne.taux_tva.toString()} 
                          onValueChange={(value) => updateLigne(ligne.id, 'taux_tva', parseFloat(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="5.5">5.5%</SelectItem>
                            <SelectItem value="10">10%</SelectItem>
                            <SelectItem value="20">20%</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={ligne.remise}
                          onChange={(e) => updateLigne(ligne.id, 'remise', parseFloat(e.target.value) || 0)}
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        €{(ligne.quantite * ligne.prixUnitaire * (1 - ligne.remise / 100)).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLigne(ligne.id)}
                          className="text-red-600"
                        >
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
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Récapitulatif
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Sous-total HT</span>
                <span className="font-medium">€{devis.sousTotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Remise globale</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={devis.remiseGlobale}
                    onChange={(e) => setDevis(prev => ({ ...prev, remiseGlobale: parseFloat(e.target.value) || 0 }))}
                    className="w-16 h-8"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <span className="text-sm">%</span>
                </div>
              </div>
              
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium">Total HT</span>
                <span className="font-medium">€{devis.totalHT.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span>TVA</span>
                <span>€{devis.totalTVA.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between border-t pt-2 text-lg font-bold">
                <span>Total TTC</span>
                <span>€{devis.totalTTC.toFixed(2)}</span>
              </div>
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

      {/* Modal aperçu */}
      {showPreview && (
        <DevisPreview
          devis={devis}
          open={showPreview}
          onOpenChange={setShowPreview}
        />
      )}
    </div>
  )
}