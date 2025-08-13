import { SearchDocument, AnyDatabaseRecord } from '../types/search-types'
import { SearchableEntity } from '../config/searchable-entities.config'

/**
 * Converts a database record to a SearchDocument
 */
export function convertToSearchDocument(
  entity: SearchableEntity,
  id: string,
  record: AnyDatabaseRecord
): SearchDocument {
  const searchDoc: SearchDocument = {
    id,
    type: entity.type,
    title: getRecordTitle(entity, record),
    description: getRecordDescription(entity, record),
    url: entity.urlPattern.replace('{id}', id),
    icon: entity.icon,
    metadata: extractMetadata(entity, record)
  }

  // Add entity-specific fields
  if (record.tenantId) {
    searchDoc.tenantId = String(record.tenantId)
  }

  return searchDoc
}

function getRecordTitle(entity: SearchableEntity, record: AnyDatabaseRecord): string {
  // Try primary fields first
  for (const field of entity.searchableFields.primary) {
    const value = record[field.name]
    if (value) {
      return String(value)
    }
  }

  // Fallback to entity-specific title logic
  switch (entity.type) {
    case 'client':
    case 'fournisseur':
      return String(record.denomination || record.code || record.id)
    case 'article':
      return String(record.designation || record.reference || record.id)
    case 'material':
    case 'shared_material':
      return String(record.nom || record.reference || record.code || record.id)
    case 'menu':
      return String(record.title || record.id)
    case 'user':
      return String(`${record.prenom || ''} ${record.nom || ''}`.trim() || record.email || record.id)
    default:
      return String(record.title || record.nom || record.name || record.id)
  }
}

function getRecordDescription(entity: SearchableEntity, record: AnyDatabaseRecord): string | undefined {
  // Try secondary fields first
  for (const field of entity.searchableFields.secondary) {
    const value = record[field.name]
    if (value) {
      return String(value)
    }
  }

  // Fallback to entity-specific description logic
  switch (entity.type) {
    case 'client':
    case 'fournisseur':
      return [record.email, record.ville].filter(Boolean).join(' - ') || undefined
    case 'article':
      return String(record.description || record.famille || '')
    case 'material':
    case 'shared_material':
      return String(record.description || record.type || '')
    case 'user':
      return String(record.email || '')
    default:
      return String(record.description || '')
  }
}

function extractMetadata(entity: SearchableEntity, record: AnyDatabaseRecord): Record<string, string | number | boolean | Date | null | undefined> {
  const metadata: Record<string, string | number | boolean | Date | null | undefined> = {}

  // Extract metadata fields
  entity.searchableFields.metadata.forEach(field => {
    const value = record[field.name]
    if (value !== undefined && value !== null) {
      metadata[field.name] = value
    }
  })

  // Add common metadata
  if (record.type) metadata.entityType = record.type
  if (record.statut) metadata.status = record.statut
  if (record.ville) metadata.city = record.ville
  if (record.code_postal) metadata.postalCode = record.code_postal

  return metadata
}