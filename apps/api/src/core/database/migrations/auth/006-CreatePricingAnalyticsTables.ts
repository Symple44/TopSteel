import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm'

export class CreatePricingAnalyticsTables1740000000006 implements MigrationInterface {
  name = 'CreatePricingAnalyticsTables1740000000006'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // =============== PRICING LOGS TABLE ===============
    await queryRunner.createTable(
      new Table({
        name: 'pricing_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'societe_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'rule_id',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'article_id',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'customer_id',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'customer_group',
            type: 'varchar',
            length: '50',
            isNullable: true
          },
          {
            name: 'channel',
            type: 'varchar',
            length: '20',
            default: "'ERP'"
          },
          {
            name: 'base_price',
            type: 'decimal',
            precision: 12,
            scale: 4,
            default: 0
          },
          {
            name: 'final_price',
            type: 'decimal',
            precision: 12,
            scale: 4,
            default: 0
          },
          {
            name: 'discount',
            type: 'decimal',
            precision: 12,
            scale: 4,
            default: 0
          },
          {
            name: 'discount_percentage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0
          },
          {
            name: 'quantity',
            type: 'decimal',
            precision: 10,
            scale: 3,
            default: 1
          },
          {
            name: 'calculation_time',
            type: 'integer',
            default: 0,
            comment: 'Temps de calcul en millisecondes'
          },
          {
            name: 'applied',
            type: 'boolean',
            default: false
          },
          {
            name: 'reason',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Raison si règle non appliquée'
          },
          {
            name: 'cache_hit',
            type: 'boolean',
            default: false
          },
          {
            name: 'error',
            type: 'text',
            isNullable: true
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()'
          }
        ]
      }),
      true
    )

    // =============== WEBHOOK SUBSCRIPTIONS TABLE ===============
    await queryRunner.createTable(
      new Table({
        name: 'webhook_subscriptions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'societe_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'url',
            type: 'varchar',
            length: '500',
            isNullable: false
          },
          {
            name: 'secret',
            type: 'varchar',
            length: '128',
            isNullable: false,
            comment: 'Secret pour signature HMAC'
          },
          {
            name: 'events',
            type: 'jsonb',
            isNullable: false,
            default: "'[]'",
            comment: 'Liste des événements écoutés'
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true
          },
          {
            name: 'filters',
            type: 'jsonb',
            isNullable: true,
            comment: 'Filtres pour déclencher le webhook'
          },
          {
            name: 'retry_policy',
            type: 'jsonb',
            default: `'{
              "maxRetries": 3,
              "retryDelay": 1000,
              "backoffMultiplier": 2
            }'`
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            default: `'{
              "totalCalls": 0,
              "successRate": 100
            }'`
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()'
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()'
          }
        ]
      }),
      true
    )

    // =============== WEBHOOK EVENTS TABLE ===============
    await queryRunner.createTable(
      new Table({
        name: 'webhook_events',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
            isNullable: false
          },
          {
            name: 'societe_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'data',
            type: 'jsonb',
            isNullable: false
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'timestamp',
            type: 'timestamptz',
            default: 'now()'
          }
        ]
      }),
      true
    )

    // =============== WEBHOOK DELIVERIES TABLE ===============
    await queryRunner.createTable(
      new Table({
        name: 'webhook_deliveries',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'subscription_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'event_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'url',
            type: 'varchar',
            length: '500',
            isNullable: false
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'pending'"
          },
          {
            name: 'attempts',
            type: 'integer',
            default: 0
          },
          {
            name: 'last_attempt',
            type: 'timestamptz',
            isNullable: true
          },
          {
            name: 'response',
            type: 'jsonb',
            isNullable: true,
            comment: 'Réponse HTTP (status, body, error)'
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()'
          }
        ]
      }),
      true
    )

    // =============== SALES HISTORY TABLE (pour ML) ===============
    await queryRunner.createTable(
      new Table({
        name: 'sales_history',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'societe_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'article_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'customer_id',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'date',
            type: 'date',
            isNullable: false
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 12,
            scale: 4,
            isNullable: false
          },
          {
            name: 'quantity',
            type: 'decimal',
            precision: 10,
            scale: 3,
            isNullable: false
          },
          {
            name: 'revenue',
            type: 'decimal',
            precision: 15,
            scale: 4,
            isNullable: false
          },
          {
            name: 'cost',
            type: 'decimal',
            precision: 12,
            scale: 4,
            isNullable: true
          },
          {
            name: 'channel',
            type: 'varchar',
            length: '20',
            default: "'ERP'"
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()'
          }
        ]
      }),
      true
    )

    // =============== INDEXES POUR PERFORMANCE ===============
    
    // Pricing Logs indexes
    await queryRunner.createIndex('pricing_logs', new TableIndex({
      name: 'idx_pricing_logs_societe_date',
      columnNames: ['societe_id', 'created_at']
    }))

    await queryRunner.createIndex('pricing_logs', new TableIndex({
      name: 'idx_pricing_logs_rule_id',
      columnNames: ['rule_id'],
      where: 'rule_id IS NOT NULL'
    }))

    await queryRunner.createIndex('pricing_logs', new TableIndex({
      name: 'idx_pricing_logs_article_customer',
      columnNames: ['article_id', 'customer_id']
    }))

    await queryRunner.createIndex('pricing_logs', new TableIndex({
      name: 'idx_pricing_logs_channel_applied',
      columnNames: ['channel', 'applied']
    }))

    // Webhook Subscriptions indexes
    await queryRunner.createIndex('webhook_subscriptions', new TableIndex({
      name: 'idx_webhook_subs_societe_active',
      columnNames: ['societe_id', 'is_active']
    }))

    // Webhook Events indexes
    await queryRunner.createIndex('webhook_events', new TableIndex({
      name: 'idx_webhook_events_societe_type_time',
      columnNames: ['societe_id', 'type', 'timestamp']
    }))

    // Webhook Deliveries indexes
    await queryRunner.createIndex('webhook_deliveries', new TableIndex({
      name: 'idx_webhook_deliveries_subscription',
      columnNames: ['subscription_id']
    }))

    await queryRunner.createIndex('webhook_deliveries', new TableIndex({
      name: 'idx_webhook_deliveries_event',
      columnNames: ['event_id']
    }))

    await queryRunner.createIndex('webhook_deliveries', new TableIndex({
      name: 'idx_webhook_deliveries_status',
      columnNames: ['status']
    }))

    // Sales History indexes
    await queryRunner.createIndex('sales_history', new TableIndex({
      name: 'idx_sales_history_article_date',
      columnNames: ['article_id', 'date']
    }))

    await queryRunner.createIndex('sales_history', new TableIndex({
      name: 'idx_sales_history_societe_date',
      columnNames: ['societe_id', 'date']
    }))

    await queryRunner.createIndex('sales_history', new TableIndex({
      name: 'idx_sales_history_customer_date',
      columnNames: ['customer_id', 'date'],
      where: 'customer_id IS NOT NULL'
    }))

    // =============== FOREIGN KEYS ===============
    
    // Webhook deliveries -> subscriptions
    await queryRunner.query(`
      ALTER TABLE webhook_deliveries 
      ADD CONSTRAINT fk_webhook_deliveries_subscription 
      FOREIGN KEY (subscription_id) REFERENCES webhook_subscriptions(id) 
      ON DELETE CASCADE
    `)

    // Webhook deliveries -> events
    await queryRunner.query(`
      ALTER TABLE webhook_deliveries 
      ADD CONSTRAINT fk_webhook_deliveries_event 
      FOREIGN KEY (event_id) REFERENCES webhook_events(id) 
      ON DELETE CASCADE
    `)

    // =============== MATERIALIZED VIEWS POUR ANALYTICS ===============
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW pricing_stats_hourly AS
      SELECT 
        DATE_TRUNC('hour', created_at) as hour,
        societe_id,
        channel,
        COUNT(*) as calculations,
        COUNT(CASE WHEN applied = true THEN 1 END) as applied_count,
        AVG(calculation_time) as avg_calculation_time,
        AVG(discount_percentage) as avg_discount,
        SUM(discount) as total_discount_given
      FROM pricing_logs
      GROUP BY DATE_TRUNC('hour', created_at), societe_id, channel;

      CREATE UNIQUE INDEX ON pricing_stats_hourly (hour, societe_id, channel);
    `)

    await queryRunner.query(`
      CREATE MATERIALIZED VIEW rule_performance AS
      SELECT 
        rule_id,
        societe_id,
        COUNT(*) as usage_count,
        COUNT(CASE WHEN applied = true THEN 1 END) as applied_count,
        ROUND(
          (COUNT(CASE WHEN applied = true THEN 1 END)::decimal / COUNT(*) * 100), 2
        ) as conversion_rate,
        AVG(discount) as avg_discount,
        SUM(CASE WHEN applied = true THEN discount ELSE 0 END) as total_discount_given,
        MAX(created_at) as last_used
      FROM pricing_logs
      WHERE rule_id IS NOT NULL
      GROUP BY rule_id, societe_id;

      CREATE UNIQUE INDEX ON rule_performance (rule_id, societe_id);
    `)

    console.log('✅ Tables de pricing analytics créées avec succès')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les vues matérialisées
    await queryRunner.query('DROP MATERIALIZED VIEW IF EXISTS pricing_stats_hourly CASCADE')
    await queryRunner.query('DROP MATERIALIZED VIEW IF EXISTS rule_performance CASCADE')

    // Supprimer les tables dans l'ordre inverse
    await queryRunner.dropTable('webhook_deliveries', true)
    await queryRunner.dropTable('webhook_events', true) 
    await queryRunner.dropTable('webhook_subscriptions', true)
    await queryRunner.dropTable('sales_history', true)
    await queryRunner.dropTable('pricing_logs', true)

    console.log('❌ Tables de pricing analytics supprimées')
  }
}