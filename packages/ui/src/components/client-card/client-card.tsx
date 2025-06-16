// packages/ui/src/components/client-card/client-card.tsx
export function ClientCard({ client, onClick }) {
  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{client.nom}</CardTitle>
          <Badge variant={client.type === 'PROFESSIONNEL' ? 'default' : 'secondary'}>
            {client.type}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        <div className="text-sm">
          <p className="text-muted-foreground">Contact</p>
          <p>{client.contact}</p>
        </div>
        
        <div className="text-sm">
          <p className="text-muted-foreground">Email</p>
          <p>{client.email}</p>
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span>Projets actifs</span>
          <Badge variant="outline">{client.projetsActifs || 0}</Badge>
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span>CA total</span>
          <span className="font-semibold">
            {formatCurrency(client.chiffreAffaires || 0)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}