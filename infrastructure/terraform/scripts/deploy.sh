#!/bin/bash
# Terraform Deployment Script for TopSteel Infrastructure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENTS=("dev" "staging" "prod")
TERRAFORM_VERSION="1.5.0"
AWS_REGION="${AWS_REGION:-eu-west-1}"

# Functions
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform is not installed"
        exit 1
    fi
    
    INSTALLED_VERSION=$(terraform version -json | jq -r '.terraform_version')
    if [ "$INSTALLED_VERSION" != "$TERRAFORM_VERSION" ]; then
        print_warning "Terraform version mismatch. Expected: $TERRAFORM_VERSION, Found: $INSTALLED_VERSION"
    fi
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials are not configured"
        exit 1
    fi
    
    # Check jq
    if ! command -v jq &> /dev/null; then
        print_error "jq is not installed"
        exit 1
    fi
    
    print_info "All prerequisites are met"
}

validate_environment() {
    local env=$1
    if [[ ! " ${ENVIRONMENTS[@]} " =~ " ${env} " ]]; then
        print_error "Invalid environment: $env. Valid environments are: ${ENVIRONMENTS[*]}"
        exit 1
    fi
}

init_terraform() {
    local env=$1
    print_info "Initializing Terraform for $env environment..."
    
    cd "environments/$env"
    
    terraform init \
        -backend-config="bucket=topsteel-terraform-state-$env" \
        -backend-config="key=infrastructure/terraform.tfstate" \
        -backend-config="region=$AWS_REGION" \
        -backend-config="dynamodb_table=topsteel-terraform-locks-$env" \
        -upgrade
    
    cd ../..
}

validate_terraform() {
    local env=$1
    print_info "Validating Terraform configuration for $env..."
    
    cd "environments/$env"
    terraform validate
    terraform fmt -check=true
    cd ../..
}

plan_terraform() {
    local env=$1
    local plan_file="$env.tfplan"
    
    print_info "Creating Terraform plan for $env..."
    
    cd "environments/$env"
    
    terraform plan \
        -var-file="terraform.tfvars" \
        -out="$plan_file"
    
    # Generate plan JSON for review
    terraform show -json "$plan_file" > "${plan_file}.json"
    
    # Summary of changes
    print_info "Plan summary:"
    terraform show "$plan_file" | grep -E "^  # |^Plan:"
    
    cd ../..
}

apply_terraform() {
    local env=$1
    local plan_file="environments/$env/$env.tfplan"
    
    if [ ! -f "$plan_file" ]; then
        print_error "Plan file not found. Run 'plan' first."
        exit 1
    fi
    
    print_warning "You are about to apply changes to $env environment"
    read -p "Are you sure? (yes/no): " confirmation
    
    if [ "$confirmation" != "yes" ]; then
        print_info "Apply cancelled"
        exit 0
    fi
    
    print_info "Applying Terraform changes for $env..."
    
    cd "environments/$env"
    terraform apply "$env.tfplan"
    
    # Save outputs
    terraform output -json > outputs.json
    
    cd ../..
    
    print_info "Terraform apply completed successfully"
}

destroy_terraform() {
    local env=$1
    
    print_warning "WARNING: You are about to DESTROY the $env environment"
    print_warning "This action cannot be undone!"
    read -p "Type the environment name to confirm ($env): " confirmation
    
    if [ "$confirmation" != "$env" ]; then
        print_info "Destroy cancelled"
        exit 0
    fi
    
    print_info "Destroying Terraform resources for $env..."
    
    cd "environments/$env"
    terraform destroy \
        -var-file="terraform.tfvars" \
        -auto-approve=false
    cd ../..
}

refresh_terraform() {
    local env=$1
    print_info "Refreshing Terraform state for $env..."
    
    cd "environments/$env"
    terraform refresh -var-file="terraform.tfvars"
    cd ../..
}

import_resource() {
    local env=$1
    local resource=$2
    local id=$3
    
    print_info "Importing resource $resource with ID $id into $env..."
    
    cd "environments/$env"
    terraform import -var-file="terraform.tfvars" "$resource" "$id"
    cd ../..
}

state_management() {
    local env=$1
    local action=$2
    
    cd "environments/$env"
    
    case $action in
        list)
            print_info "Listing Terraform state resources..."
            terraform state list
            ;;
        show)
            local resource=$3
            print_info "Showing state for $resource..."
            terraform state show "$resource"
            ;;
        rm)
            local resource=$3
            print_warning "Removing $resource from state..."
            terraform state rm "$resource"
            ;;
        mv)
            local source=$3
            local destination=$4
            print_info "Moving $source to $destination in state..."
            terraform state mv "$source" "$destination"
            ;;
        pull)
            print_info "Pulling current state..."
            terraform state pull > terraform.tfstate.backup
            ;;
        push)
            print_warning "Pushing state file..."
            terraform state push terraform.tfstate.backup
            ;;
        *)
            print_error "Unknown state action: $action"
            exit 1
            ;;
    esac
    
    cd ../..
}

cost_estimation() {
    local env=$1
    print_info "Estimating costs for $env environment..."
    
    cd "environments/$env"
    
    # Use Infracost if available
    if command -v infracost &> /dev/null; then
        infracost breakdown --path . --terraform-var-file terraform.tfvars
    else
        print_warning "Infracost is not installed. Install it for cost estimation."
    fi
    
    cd ../..
}

security_scan() {
    local env=$1
    print_info "Running security scan for $env environment..."
    
    cd "environments/$env"
    
    # Use tfsec if available
    if command -v tfsec &> /dev/null; then
        tfsec . --tfvars-file terraform.tfvars
    else
        print_warning "tfsec is not installed. Install it for security scanning."
    fi
    
    # Use checkov if available
    if command -v checkov &> /dev/null; then
        checkov -d . --framework terraform
    else
        print_warning "checkov is not installed. Install it for compliance scanning."
    fi
    
    cd ../..
}

generate_docs() {
    print_info "Generating Terraform documentation..."
    
    # Use terraform-docs if available
    if command -v terraform-docs &> /dev/null; then
        terraform-docs markdown . > TERRAFORM_DOCS.md
        print_info "Documentation generated in TERRAFORM_DOCS.md"
    else
        print_warning "terraform-docs is not installed. Install it for documentation generation."
    fi
}

backup_state() {
    local env=$1
    local backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
    
    print_info "Backing up state for $env environment..."
    
    mkdir -p "$backup_dir"
    
    # Download state from S3
    aws s3 cp \
        "s3://topsteel-terraform-state-$env/infrastructure/terraform.tfstate" \
        "$backup_dir/$env-terraform.tfstate"
    
    print_info "State backed up to $backup_dir"
}

# Main script
main() {
    case "${1:-}" in
        init)
            validate_environment "$2"
            check_prerequisites
            init_terraform "$2"
            ;;
        validate)
            validate_environment "$2"
            check_prerequisites
            validate_terraform "$2"
            ;;
        plan)
            validate_environment "$2"
            check_prerequisites
            plan_terraform "$2"
            ;;
        apply)
            validate_environment "$2"
            check_prerequisites
            apply_terraform "$2"
            ;;
        destroy)
            validate_environment "$2"
            check_prerequisites
            destroy_terraform "$2"
            ;;
        refresh)
            validate_environment "$2"
            check_prerequisites
            refresh_terraform "$2"
            ;;
        import)
            validate_environment "$2"
            check_prerequisites
            import_resource "$2" "$3" "$4"
            ;;
        state)
            validate_environment "$2"
            check_prerequisites
            state_management "$2" "${@:3}"
            ;;
        cost)
            validate_environment "$2"
            cost_estimation "$2"
            ;;
        security)
            validate_environment "$2"
            security_scan "$2"
            ;;
        docs)
            generate_docs
            ;;
        backup)
            validate_environment "$2"
            backup_state "$2"
            ;;
        all)
            validate_environment "$2"
            check_prerequisites
            init_terraform "$2"
            validate_terraform "$2"
            security_scan "$2"
            plan_terraform "$2"
            cost_estimation "$2"
            ;;
        *)
            echo "TopSteel Infrastructure Terraform Deployment Script"
            echo ""
            echo "Usage: $0 <command> <environment> [options]"
            echo ""
            echo "Commands:"
            echo "  init <env>                    Initialize Terraform"
            echo "  validate <env>                Validate Terraform configuration"
            echo "  plan <env>                    Create Terraform plan"
            echo "  apply <env>                   Apply Terraform changes"
            echo "  destroy <env>                 Destroy Terraform resources"
            echo "  refresh <env>                 Refresh Terraform state"
            echo "  import <env> <resource> <id>  Import existing resource"
            echo "  state <env> <action> [args]   State management operations"
            echo "  cost <env>                    Estimate infrastructure costs"
            echo "  security <env>                Run security scans"
            echo "  docs                          Generate documentation"
            echo "  backup <env>                  Backup state file"
            echo "  all <env>                     Run all checks and create plan"
            echo ""
            echo "Environments: ${ENVIRONMENTS[*]}"
            exit 0
            ;;
    esac
}

# Run main function
main "$@"