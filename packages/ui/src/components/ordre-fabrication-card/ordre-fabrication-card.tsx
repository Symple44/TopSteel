// packages/ui/src/components/ordre-fabrication-card/ordre-fabrication-card.tsx
export function OrdreFabricationCard({ ordre, onClick }) {
  const getPriorityColor = (priorite: string) => {
    switch (priorite) {
      case 'URGENTE': return 'bg-red-100 text-red-800'
      case 'HAUTE': return 'bg-orange-100 text-orange-800'
      case 'NORMALE': return 'bg-blue-100 text-blue-800'
      case 'BASSE': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">OF-{ordre.numero}</CardTitle>
          <Badge className={getPriorityColor(ordre.priorite)}>
            {ordre.priorite}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Projet: {ordre.projet.reference}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="text-sm">
          <p className="text-muted-foreground">Description</p>
          <p className="font-medium">{ordre.description}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Date début</span>
            <p>{formatDate(ordre.dateDebut)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Date fin prévue</span>
            <p>{formatDate(ordre.dateFinPrevue)}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Avancement</span>
            <span className="text-sm font-medium">{ordre.avancement}%</span>
          </div>
          <Progress value={ordre.avancement} className="h-2" />
        </div>
        
        {ordre.machine && (
          <div className="text-xs text-muted-foreground">
            Machine: {ordre.machine}
          </div>
        )}
      </CardContent>
    </Card>
  )
}