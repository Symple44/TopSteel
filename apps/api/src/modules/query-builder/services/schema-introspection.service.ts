import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'

export interface TableInfo {
  tableName: string
  schemaName: string
  comment?: string
}

export interface ColumnInfo {
  tableName: string
  columnName: string
  dataType: string
  isNullable: boolean
  columnDefault?: string
  characterMaximumLength?: number
  numericPrecision?: number
  numericScale?: number
  isPrimaryKey: boolean
  isForeignKey: boolean
  referencedTable?: string
  referencedColumn?: string
  comment?: string
}

export interface RelationInfo {
  constraintName: string
  sourceTable: string
  sourceColumn: string
  targetTable: string
  targetColumn: string
}

@Injectable()
export class SchemaIntrospectionService {
  constructor(
    @InjectDataSource('tenant')
    private dataSource: DataSource,
  ) {}

  async getTables(schemaName: string = 'public'): Promise<TableInfo[]> {
    const query = `
      SELECT 
        table_name as "tableName",
        table_schema as "schemaName",
        obj_description(pgclass.oid, 'pg_class') as comment
      FROM information_schema.tables
      LEFT JOIN pg_catalog.pg_class pgclass ON pgclass.relname = table_name
      WHERE table_schema = $1 
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE 'typeorm_%'
      ORDER BY table_name
    `

    return this.dataSource.query(query, [schemaName])
  }

  async getColumns(tableName: string, schemaName: string = 'public'): Promise<ColumnInfo[]> {
    const query = `
      WITH primary_keys AS (
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_name = $1
          AND tc.table_schema = $2
      ),
      foreign_keys AS (
        SELECT
          kcu.column_name,
          ccu.table_name AS referenced_table,
          ccu.column_name AS referenced_column
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = $1
          AND tc.table_schema = $2
      )
      SELECT 
        c.table_name as "tableName",
        c.column_name as "columnName",
        c.data_type as "dataType",
        c.is_nullable = 'YES' as "isNullable",
        c.column_default as "columnDefault",
        c.character_maximum_length as "characterMaximumLength",
        c.numeric_precision as "numericPrecision",
        c.numeric_scale as "numericScale",
        COALESCE(pk.column_name IS NOT NULL, false) as "isPrimaryKey",
        COALESCE(fk.column_name IS NOT NULL, false) as "isForeignKey",
        fk.referenced_table as "referencedTable",
        fk.referenced_column as "referencedColumn",
        col_description(pgclass.oid, c.ordinal_position) as comment
      FROM information_schema.columns c
      LEFT JOIN primary_keys pk ON pk.column_name = c.column_name
      LEFT JOIN foreign_keys fk ON fk.column_name = c.column_name
      LEFT JOIN pg_catalog.pg_class pgclass ON pgclass.relname = c.table_name
      WHERE c.table_name = $1 
        AND c.table_schema = $2
      ORDER BY c.ordinal_position
    `

    return this.dataSource.query(query, [tableName, schemaName])
  }

  async getRelations(tableName: string, schemaName: string = 'public'): Promise<RelationInfo[]> {
    const query = `
      SELECT 
        tc.constraint_name as "constraintName",
        tc.table_name as "sourceTable",
        kcu.column_name as "sourceColumn",
        ccu.table_name as "targetTable",
        ccu.column_name as "targetColumn"
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND (tc.table_name = $1 OR ccu.table_name = $1)
        AND tc.table_schema = $2
    `

    return this.dataSource.query(query, [tableName, schemaName])
  }

  async getDatabases(): Promise<string[]> {
    const query = `
      SELECT datname as database
      FROM pg_database
      WHERE datistemplate = false
        AND datname NOT IN ('postgres', 'template0', 'template1')
      ORDER BY datname
    `

    const results = await this.dataSource.query(query)
    return results.map((r: any) => r.database)
  }

  async getSchemas(): Promise<string[]> {
    const query = `
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
        AND schema_name NOT LIKE 'pg_temp_%'
      ORDER BY schema_name
    `

    const results = await this.dataSource.query(query)
    return results.map((r: any) => r.schema_name)
  }
}