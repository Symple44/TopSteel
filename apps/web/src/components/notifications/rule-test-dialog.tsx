'use client'

import { useState } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Textarea,
  Label,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@erp/ui'
import { AlertCircle, CheckCircle, XCircle, Play, FileText, Eye } from 'lucide-react'

interface TestResult {
  success: boolean
  result: {
    ruleActive: boolean
    conditionResult: {
      result: boolean
      details: Record<string, any>
    }
    templateVariables?: Record<string, any>
    notificationPreview?: {
      title: string
      message: string
      type: string
      category: string
      priority: string
      actionUrl?: string
      actionLabel?: string
    }
    message: string
  }
  error?: string
}

interface RuleTestDialogProps {
  ruleId: string
  ruleName: string
  triggerType: string
}

export default function RuleTestDialog({ ruleId, ruleName, triggerType }: RuleTestDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [testData, setTestData] = useState('')
  const [sampleData, setSampleData] = useState<any>(null)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingSample, setLoadingSample] = useState(false)

  const loadSampleData = async () => {
    setLoadingSample(true)
    try {
      const { callClientApi } = await import('@/utils/backend-api')
      const response = await callClientApi(`notifications/rules/${ruleId}/test`)
      if (response.ok) {
        const data = await response.json()
        setSampleData(data.data)
        setTestData(JSON.stringify(data.data.sampleData, null, 2))
      } else {
        console.error('Failed to load sample data')
      }
    } catch (error) {
      console.error('Error loading sample data:', error)
    } finally {
      setLoadingSample(false)
    }
  }

  const runTest = async () => {
    if (!testData.trim()) {
      setTestResult({
        success: false,
        result: {
          ruleActive: false,
          conditionResult: { result: false, details: {} },
          message: 'Données de test requises'
        },
        error: 'Veuillez fournir des données de test'
      })
      return
    }

    setIsLoading(true)
    try {
      const parsedData = JSON.parse(testData)
      
      const { callClientApi } = await import('@/utils/backend-api')
      const response = await callClientApi(`notifications/rules/${ruleId}/test`, {
        method: 'POST',
        body: JSON.stringify({ testData: parsedData }),
      })

      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        result: {
          ruleActive: false,
          conditionResult: { result: false, details: {} },
          message: 'Erreur lors du test'
        },
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open && !sampleData) {
      loadSampleData()
    }
    if (!open) {
      setTestResult(null)
    }
  }

  const getStatusIcon = (result: TestResult) => {
    if (!result.success || result.error) {
      return <XCircle className="h-5 w-5 text-red-500" />
    }
    if (result.result.conditionResult.result) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    }
    return <AlertCircle className="h-5 w-5 text-yellow-500" />
  }

  const getStatusColor = (result: TestResult) => {
    if (!result.success || result.error) return 'border-red-200 bg-red-50'
    if (result.result.conditionResult.result) return 'border-green-200 bg-green-50'
    return 'border-yellow-200 bg-yellow-50'
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      LOW: 'bg-gray-100 text-gray-800',
      NORMAL: 'bg-blue-100 text-blue-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800',
    }
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getTypeColor = (type: string) => {
    const colors = {
      info: 'bg-blue-100 text-blue-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Play className="h-4 w-4 mr-2" />
          Tester
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tester la règle: {ruleName}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="test" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="test">Test</TabsTrigger>
            <TabsTrigger value="sample">Données d'exemple</TabsTrigger>
            <TabsTrigger value="result">Résultat</TabsTrigger>
          </TabsList>

          <TabsContent value="test" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testData">Données de test (JSON)</Label>
              <Textarea
                id="testData"
                value={testData}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTestData(e.target.value)}
                placeholder="Entrez vos données de test au format JSON..."
                className="min-h-[200px] font-mono"
              />
              <p className="text-sm text-muted-foreground">
                Événement: <Badge variant="outline">{triggerType}</Badge>
              </p>
            </div>

            <div className="flex space-x-2">
              <Button onClick={runTest} disabled={isLoading}>
                {isLoading ? 'Test en cours...' : 'Exécuter le test'}
              </Button>
              <Button variant="outline" onClick={loadSampleData} disabled={loadingSample}>
                {loadingSample ? 'Chargement...' : 'Charger exemple'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="sample" className="space-y-4">
            {sampleData ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Exemple pour {sampleData.triggerType}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {sampleData.description}
                    </p>
                    <div className="space-y-2">
                      <Label>Champs disponibles:</Label>
                      <div className="flex flex-wrap gap-2">
                        {sampleData.availableFields.map((field: string) => (
                          <Badge key={field} variant="outline" className="text-xs">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Données d'exemple:</Label>
                      <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                        {JSON.stringify(sampleData.sampleData, null, 2)}
                      </pre>
                    </div>
                    <Button 
                      onClick={() => setTestData(JSON.stringify(sampleData.sampleData, null, 2))}
                      variant="outline"
                      size="sm"
                    >
                      Utiliser cet exemple
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8">
                <Button onClick={loadSampleData} disabled={loadingSample}>
                  {loadingSample ? 'Chargement...' : 'Charger les données d\'exemple'}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="result" className="space-y-4">
            {testResult ? (
              <Card className={`border-2 ${getStatusColor(testResult)}`}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {getStatusIcon(testResult)}
                    <span>Résultat du test</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="font-medium">{testResult.result.message}</p>
                    {testResult.error && (
                      <p className="text-red-600 text-sm">{testResult.error}</p>
                    )}
                  </div>

                  {testResult.result.conditionResult && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Évaluation des conditions:</h4>
                      <div className="space-y-2">
                        {Object.entries(testResult.result.conditionResult.details).map(([conditionId, details]: [string, any]) => (
                          <div key={conditionId} className="flex items-center space-x-2 text-sm">
                            {details.result ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span>{details.condition}</span>
                            <span className="text-muted-foreground">
                              (valeur: {JSON.stringify(details.actualValue)})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {testResult.result.notificationPreview && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Aperçu de la notification:</h4>
                      <Card>
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <Badge className={getTypeColor(testResult.result.notificationPreview.type)}>
                                {testResult.result.notificationPreview.type}
                              </Badge>
                              <Badge className={getPriorityColor(testResult.result.notificationPreview.priority)}>
                                {testResult.result.notificationPreview.priority}
                              </Badge>
                              <Badge variant="outline">
                                {testResult.result.notificationPreview.category}
                              </Badge>
                            </div>
                            <div>
                              <h5 className="font-medium">{testResult.result.notificationPreview.title}</h5>
                              <p className="text-sm text-muted-foreground mt-1">
                                {testResult.result.notificationPreview.message}
                              </p>
                            </div>
                            {testResult.result.notificationPreview.actionUrl && (
                              <div className="flex items-center space-x-2 text-sm">
                                <span className="text-muted-foreground">Action:</span>
                                <Badge variant="outline">
                                  {testResult.result.notificationPreview.actionLabel || 'Voir'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  → {testResult.result.notificationPreview.actionUrl}
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {testResult.result.templateVariables && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Variables du template:</h4>
                      <div className="max-h-32 overflow-y-auto">
                        <pre className="bg-gray-50 p-2 rounded text-xs">
                          {JSON.stringify(testResult.result.templateVariables, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun résultat de test</p>
                <p className="text-sm">Exécutez un test pour voir les résultats ici</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}