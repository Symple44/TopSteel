'use client'
import React from 'react'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
import { Card } from '../../../layout/card'
import { CheckCircle, XCircle, Clock, AlertTriangle, FileText, Calendar } from 'lucide-react'
interface Certification {
  id: string
  name: string
  standard: string
  status: 'valid' | 'expired' | 'pending' | 'rejected' | 'warning'
  issueDate: Date
  expiryDate: Date
  issuingBody: string
  certificateNumber?: string
  scope?: string
  notes?: string
}
interface CertificationStatusProps {
  className?: string
  certifications: Certification[]
  materialName?: string
  showDetails?: boolean
  onCertificationClick?: (certification: Certification) => void
}
export function CertificationStatus({ 
  className, 
  certifications,
  materialName,
  showDetails = false,
  onCertificationClick
}: CertificationStatusProps) {
  const getStatusIcon = (status: Certification['status']) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'expired':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }
  const getStatusBadge = (status: Certification['status']) => {
    switch (status) {
      case 'valid':
        return <Badge variant="success" className="text-xs">Valid</Badge>
      case 'expired':
        return <Badge variant="destructive" className="text-xs">Expired</Badge>
      case 'pending':
        return <Badge variant="secondary" className="text-xs">Pending</Badge>
      case 'rejected':
        return <Badge variant="destructive" className="text-xs">Rejected</Badge>
      case 'warning':
        return <Badge variant="outline" className="text-xs border-orange-200 text-orange-600">Warning</Badge>
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>
    }
  }
  const getDaysUntilExpiry = (expiryDate: Date) => {
    const today = new Date()
    const diffTime = expiryDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
  const getOverallStatus = () => {
    if (certifications.length === 0) return 'none'
    if (certifications.some(cert => cert.status === 'expired' || cert.status === 'rejected')) return 'critical'
    if (certifications.some(cert => cert.status === 'warning' || cert.status === 'pending')) return 'warning'
    if (certifications.every(cert => cert.status === 'valid')) return 'valid'
    return 'partial'
  }
  const overallStatus = getOverallStatus()
  return (
    <Card className={cn("p-6", className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Certification Status</h3>
            {materialName && (
              <p className="text-sm text-muted-foreground">Material: {materialName}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {overallStatus === 'valid' && <CheckCircle className="w-5 h-5 text-green-600" />}
            {overallStatus === 'critical' && <XCircle className="w-5 h-5 text-red-600" />}
            {overallStatus === 'warning' && <AlertTriangle className="w-5 h-5 text-orange-600" />}
            {overallStatus === 'none' && <Clock className="w-5 h-5 text-gray-400" />}
            <span className={cn(
              "text-sm font-medium",
              overallStatus === 'valid' && "text-green-600",
              overallStatus === 'critical' && "text-red-600",
              overallStatus === 'warning' && "text-orange-600",
              overallStatus === 'none' && "text-gray-400"
            )}>
              {certifications.length} Certification{certifications.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        {/* Certifications List */}
        {certifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No certifications available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {certifications.map((cert) => {
              const daysUntilExpiry = getDaysUntilExpiry(cert.expiryDate)
              const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0
              return (
                <div 
                  key={cert.id}
                  className={cn(
                    "p-4 rounded-lg border transition-colors",
                    onCertificationClick && "cursor-pointer hover:bg-muted/50",
                    cert.status === 'expired' && "border-red-200 bg-red-50",
                    cert.status === 'warning' && "border-orange-200 bg-orange-50",
                    isExpiringSoon && cert.status === 'valid' && "border-yellow-200 bg-yellow-50"
                  )}
                  onClick={() => onCertificationClick?.(cert)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(cert.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{cert.name}</h4>
                          {getStatusBadge(cert.status)}
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Standard: {cert.standard}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Issued by: {cert.issuingBody}
                        </p>
                        {cert.certificateNumber && (
                          <p className="text-xs text-muted-foreground">
                            Certificate: {cert.certificateNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Calendar className="w-3 h-3" />
                        <span>Expires: {cert.expiryDate.toLocaleDateString()}</span>
                      </div>
                      {cert.status === 'valid' && (
                        <div className={cn(
                          "font-medium",
                          isExpiringSoon ? "text-yellow-600" : "text-green-600"
                        )}>
                          {daysUntilExpiry > 0 ? `${daysUntilExpiry} days left` : 'Expired'}
                        </div>
                      )}
                      {cert.status === 'expired' && (
                        <div className="text-red-600 font-medium">
                          Expired {Math.abs(daysUntilExpiry)} days ago
                        </div>
                      )}
                    </div>
                  </div>
                  {showDetails && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      {cert.scope && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Scope:</p>
                          <p className="text-xs">{cert.scope}</p>
                        </div>
                      )}
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Issued: {cert.issueDate.toLocaleDateString()}</span>
                        <span>Valid until: {cert.expiryDate.toLocaleDateString()}</span>
                      </div>
                      {cert.notes && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Notes:</p>
                          <p className="text-xs">{cert.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {isExpiringSoon && cert.status === 'valid' && (
                    <div className="mt-2 p-2 bg-yellow-100 rounded text-xs text-yellow-800">
                      <AlertTriangle className="w-3 h-3 inline mr-1" />
                      Certification expires in {daysUntilExpiry} days
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {/* Summary Stats */}
        {certifications.length > 0 && (
          <div className="pt-3 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-green-600">
                  {certifications.filter(c => c.status === 'valid').length}
                </div>
                <div className="text-xs text-muted-foreground">Valid</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-red-600">
                  {certifications.filter(c => c.status === 'expired' || c.status === 'rejected').length}
                </div>
                <div className="text-xs text-muted-foreground">Expired/Rejected</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-yellow-600">
                  {certifications.filter(c => c.status === 'pending').length}
                </div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-orange-600">
                  {certifications.filter(c => getDaysUntilExpiry(c.expiryDate) <= 30 && getDaysUntilExpiry(c.expiryDate) > 0).length}
                </div>
                <div className="text-xs text-muted-foreground">Expiring Soon</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
