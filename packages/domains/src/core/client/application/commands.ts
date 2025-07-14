/**
 * 🎯 COMMANDES - DOMAINE CLIENT
 * Cas d'usage pour les actions de modification (CQRS)
 */

import type { Client, ClientType, ClientStatut, ClientPriorite, ClientContact, ClientAddress } from '../domain/entities'

// ===== COMMANDES =====

export interface CreateClientCommand {
  readonly nom: string
  readonly type: ClientType
  readonly email: string
  readonly telephone: string
  readonly contact: ClientContact
  readonly adresse: ClientAddress
  readonly priorite?: ClientPriorite
  readonly siret?: string
  readonly source?: string
  readonly notes?: string
}

export interface UpdateClientCommand {
  readonly id: string
  readonly nom?: string
  readonly type?: ClientType
  readonly email?: string
  readonly telephone?: string
  readonly contact?: Partial<ClientContact>
  readonly adresse?: Partial<ClientAddress>
  readonly statut?: ClientStatut
  readonly priorite?: ClientPriorite
  readonly siret?: string
  readonly notes?: string
}

export interface ChangeClientStatusCommand {
  readonly id: string
  readonly newStatus: ClientStatut
  readonly reason?: string
}

export interface ArchiveClientCommand {
  readonly id: string
  readonly reason: string
  readonly transferProjectsTo?: string
}

// ===== RÉSULTATS =====

export interface CommandResult<T = unknown> {
  readonly success: boolean
  readonly data?: T
  readonly error?: string
  readonly validationErrors?: Record<string, string[]>
}

// ===== HANDLERS =====

export interface IClientCommandHandler {
  createClient(command: CreateClientCommand): Promise<CommandResult<Client>>
  
  updateClient(command: UpdateClientCommand): Promise<CommandResult<Client>>
  
  changeClientStatus(command: ChangeClientStatusCommand): Promise<CommandResult<Client>>
  
  archiveClient(command: ArchiveClientCommand): Promise<CommandResult<boolean>>
  
  deleteClient(id: string): Promise<CommandResult<boolean>>
}