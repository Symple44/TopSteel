# Production Environment Configuration for TopSteel

environment = "prod"
aws_region  = "eu-west-1"

# Networking
vpc_cidr = "10.0.0.0/16"

# Database Configuration
db_instance_class         = "db.r6g.xlarge"
db_allocated_storage      = 500
db_max_allocated_storage  = 2000
db_backup_retention_period = 30
db_multi_az               = true

# EKS Configuration
eks_cluster_version = "1.28"

eks_node_groups = {
  general = {
    min_size       = 3
    max_size       = 20
    desired_size   = 5
    instance_types = ["m6i.xlarge", "m6a.xlarge"]
    capacity_type  = "ON_DEMAND"
    disk_size      = 200
  }
  spot = {
    min_size       = 2
    max_size       = 10
    desired_size   = 4
    instance_types = ["m6i.large", "m6a.large", "m5.large", "m5a.large"]
    capacity_type  = "SPOT"
    disk_size      = 100
  }
  compute = {
    min_size       = 0
    max_size       = 10
    desired_size   = 2
    instance_types = ["c6i.2xlarge", "c6a.2xlarge"]
    capacity_type  = "ON_DEMAND"
    disk_size      = 100
  }
}

# ElastiCache Configuration
redis_node_type                  = "cache.r6g.large"
redis_num_cache_nodes            = 3
redis_automatic_failover_enabled = true

# S3 Configuration
s3_versioning_enabled = true
s3_lifecycle_rules = [
  {
    id     = "archive-old-files"
    status = "Enabled"
    transitions = [
      {
        days          = 30
        storage_class = "STANDARD_IA"
      },
      {
        days          = 90
        storage_class = "GLACIER"
      },
      {
        days          = 180
        storage_class = "DEEP_ARCHIVE"
      }
    ]
    expiration = {
      days = 730 # 2 years
    }
  }
]

# CloudFront Configuration
cloudfront_price_class = "PriceClass_All"
cloudfront_min_ttl     = 0
cloudfront_default_ttl = 86400    # 1 day
cloudfront_max_ttl     = 31536000 # 1 year

# WAF Configuration
waf_rate_limit = 10000 # requests per 5 minutes

# Monitoring
enable_monitoring = true
alarm_email      = "alerts@topsteel.fr"

# Secrets Management
secrets_rotation_days = 30

# Backup Configuration
backup_schedule       = "cron(0 2 * * ? *)" # Daily at 2 AM UTC
backup_retention_days = 90

# DNS Configuration
domain_name            = "topsteel.fr"
create_dns_zone       = false # Already exists
create_acm_certificate = true
acm_certificate_domain = "*.topsteel.fr"

# Tags
owner       = "Production Team"
cost_center = "Operations"