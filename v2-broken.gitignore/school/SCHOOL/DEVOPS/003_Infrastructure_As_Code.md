# 003_Infrastructure_As_Code

> Terraform basics, Ansible, provisioning cloud resources programmatically.

## Level 1 — Intuition

### Concept

Infrastructure as Code (IaC) means defining servers, networks, and services in version-controlled configuration files instead of clicking through a web dashboard. You treat infrastructure like software: versioned, tested, reviewed, and automated.

```
BEFORE IaC:                              AFTER IaC:
Click → Wait → Configure → Forget        Write config → git push → Apply → Done
                                                        ↑
                                               Re-runnable, documented, repeatable
```

### Two Paradigms

| Approach | Tool | Style | Example |
|----------|------|-------|---------|
| Declarative | Terraform, CloudFormation | State what you WANT | "I want 3 servers" |
| Procedural | Ansible, Chef | State HOW to do it | "Install nginx, then..." |

## Level 2 — Practical

### Terraform Basics

```hcl
# main.tf — Declare what you want
terraform {
  required_providers {
    aws = { source = "hashicorp/aws" }
  }
}

provider "aws" {
  region = "us-east-1"
}

resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
  count         = 3

  tags = {
    Name = "web-server-${count.index}"
  }
}

resource "aws_security_group" "web_sg" {
  name = "web-sg"

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

```bash
# Terraform workflow
terraform init        # download providers, initialize
terraform plan        # preview changes
terraform apply       # create/update infrastructure
terraform destroy     # tear everything down

# State management
terraform state list                  # all managed resources
terraform state show aws_instance.web # inspect one resource
terraform output                      # see outputs
```

### Ansible Basics

```yaml
# playbook.yml — Define HOW to configure
- name: Configure web servers
  hosts: webservers
  become: yes

  tasks:
    - name: Install nginx
      apt:
        name: nginx
        state: present
        update_cache: yes

    - name: Copy website files
      copy:
        src: ./website/
        dest: /var/www/html/
        mode: '0644'

    - name: Start nginx
      systemd:
        name: nginx
        state: started
        enabled: yes
```

```bash
# Ansible basics
ansible all -m ping -i inventory.ini            # test connectivity
ansible-playbook -i inventory.ini playbook.yml  # run playbook
ansible-playbook playbook.yml --check           # dry run
ansible webservers -m setup                     # gather facts
```

```ini
# inventory.ini
[webservers]
web01 ansible_host=192.168.1.10 ansible_user=ubuntu
web02 ansible_host=192.168.1.11 ansible_user=ubuntu

[dbservers]
db01 ansible_host=192.168.1.20 ansible_user=ubuntu
```

## Level 3 — Systems

### Terraform State and Modules

```
State File:
┌────────────────────────────────────────┐
│ terraform.tfstate                      │
│ ┌────────────────────────────────────┐ │
│ │ Maps config → real resources      │ │
│ │ "aws_instance.web[0]" → i-abc123  │ │
│ │ "aws_instance.web[1]" → i-def456  │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
IMPORTANT: State is the source of truth.
- Store in remote backend (S3 + DynamoDB lock)
- NEVER edit manually
- DON'T commit to git (contains secrets)
```

```hcl
# Remote state with locking
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
  }
}

# Using modules (reusable components)
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  name   = "my-vpc"
  cidr   = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]
}

module "web_cluster" {
  source     = "./modules/web-cluster"
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.public_subnets
  min_size   = 2
  max_size   = 10
}
```

### Ansible Roles

```
roles/
└── nginx/
    ├── tasks/
    │   └── main.yml       # What to do
    ├── handlers/
    │   └── main.yml       # Restart triggers
    ├── templates/
    │   └── nginx.conf.j2  # Jinja2 templates
    ├── files/             # Static files
    ├── vars/
    │   └── main.yml       # Role variables
    └── defaults/
        └── main.yml       # Default variables
```

```yaml
# Using roles in playbook
- hosts: webservers
  roles:
    - role: nginx
      vars:
        nginx_port: 8080
    - role: monitoring
```

### Variable Management in Terraform

```hcl
# variables.tf
variable "environment" {
  type    = string
  default = "dev"
}
variable "instance_count" {
  type    = number
  default = 1
}

# terraform.tfvars (don't commit sensitive ones!)
environment     = "prod"
instance_count  = 5
```

## Level 4 — Expert

### CI/CD for Infrastructure

```yaml
# .github/workflows/terraform.yml
name: Terraform Apply
on:
  push:
    branches: [main]
    paths: ['terraform/**']

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - run: terraform init
        working-directory: ./terraform
      - run: terraform fmt -check
        working-directory: ./terraform
      - run: terraform plan -out=tfplan
        working-directory: ./terraform
      - run: terraform apply tfplan
        working-directory: ./terraform
```

### GitOps Principles

```
┌─────────────────────────────────────────┐
│              GITOPS FLOW                │
│  git push ─→ CI validates ─→ CD syncs  │
│                   ↓                     │
│         Desired state = Git state      │
│         Actual state → convergence     │
└─────────────────────────────────────────┘

Tools: ArgoCD, FluxCD — watch git repo, reconcile cluster
```

---

## Exercises

1. Write a Terraform config that creates an AWS EC2 instance with a security group allowing SSH and HTTP. Run `terraform plan` (no AWS account needed — create the file).
2. Write an Ansible playbook that installs and configures nginx on a local Ubuntu VM. Test with `--check` mode.
3. Create a Terraform module for a web server cluster. Parameterize instance count and instance type. Write a root module that uses it.

## Quiz

1. What's the difference between declarative and procedural IaC?
2. What is `terraform state` and why should you never edit it manually?
3. How do Ansible roles help organize playbooks?
4. What is GitOps and how does it differ from traditional CI/CD?
5. Why use remote state backends (like S3) for Terraform instead of local state?

---

## Navigation

**Parent**: [[000_DEVOPS_MOC|DEVOPS]]

**Synapses**:
- [[002_Linux_Administration|DEVOPS 002]] — Server config
- [[004_DNS_And_HTTP|NETWORKING 004]] — Web basics
- [[005_Testing_And_Packaging|PYTHON 005]] — CI/CD pipelines
