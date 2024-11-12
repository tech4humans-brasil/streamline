terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "3.97.1"
    }
  }
}

provider "azurerm" {
  features {}
  subscription_id = "76a1e361-6171-48aa-b143-27f24f8aacde"
}

resource "azurerm_resource_group" "rg" {
  name     =var.RESOURCE_GROUP
  location =var.LOCATION
}

resource "azurerm_servicebus_namespace" "sbus" {
  name                = "prod-streamline-sbus"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  sku                 = "Basic"
  minimum_tls_version = "1.2"
  public_network_access_enabled = true
}

resource "azurerm_servicebus_queue" "queues" {
  count               = 7
  name                = element(["send_email", "change_status", "swap_workflow", "interaction", "interaction_process", "web_request", "conditional", "script"], count.index)
  namespace_id        = azurerm_servicebus_namespace.sbus.id
  max_delivery_count  = 2
  lock_duration       = "PT5M"
}

resource "azurerm_static_web_app" "static" {
  name                = "prod-streamline"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku_tier            = "Free"
  sku_size            = "Free"
}

resource "azurerm_static_site_custom_domain" "custom_domain" {
  static_site_id = azurerm_static_web_app.static.id
  domain_name    = vars.FRONTEND_URL
}

resource "azurerm_cosmosdb_account" "cosmosdb" {
name                      = "prod-streamline-cosmosdb"
  location                  = azurerm_resource_group.rg.location
  resource_group_name       = azurerm_resource_group.rg.name
  offer_type                = "Standard"
  kind                      = "MongoDB"
  mongo_server_version = "4.2"

  consistency_policy {
    consistency_level       = "BoundedStaleness"
    max_interval_in_seconds = 300
    max_staleness_prefix    = 100000
  }
  geo_location {
    location          = azurerm_resource_group.rg.location
    failover_priority = 0
  }
  capabilities {
    name = "EnableServerless"
  }

  backup {
    type = "Continuous"
  }
}


resource "azurerm_log_analytics_workspace" "log" {
  name                = "prod-streamline-workspace"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

resource "azurerm_application_insights" "log" {
  name                = "prod-streamline-insights"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  workspace_id        = azurerm_log_analytics_workspace.log.id
  application_type    = "web"
}

output "instrumentation_key" {
  value = azurerm_application_insights.log.instrumentation_key
  sensitive = true
}

output "app_id" {
  value = azurerm_application_insights.log.app_id
}

resource "azurerm_storage_account" "storage" {
  name                     = "prodstreamlinefiles"
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_storage_account" "func-storage" {
  name                     = "funcstreamlinestorage"
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_service_plan" "service_plan" {
  count               = 1
  name                = element(["prod-streamline-serv-plan", "prod-assistant-serv-plan"], count.index)
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  sku_name            = "Y1"
  os_type             = "Linux"
}

locals {
  MONGO_URI = split("?", azurerm_cosmosdb_account.cosmosdb.primary_mongodb_connection_string)[0]
  MONGO_PARAMS = split("?", azurerm_cosmosdb_account.cosmosdb.primary_mongodb_connection_string)[1]
}

resource "azurerm_linux_function_app" "function_apps" {
  count = 1
  name  = element(["prod-streamline-services", "prod-assistant-services"], count.index)
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  service_plan_id     = azurerm_service_plan.service_plan[count.index].id
  storage_account_name       = azurerm_storage_account.func-storage.name
  storage_account_access_key = azurerm_storage_account.func-storage.primary_access_key
  https_only                 = true
  webdeploy_publish_basic_authentication_enabled = true

  app_settings = {
    "FUNCTIONS_WORKER_RUNTIME" = element(["node", "python"], count.index)
    "APPINSIGHTS_INSTRUMENTATIONKEY"       = azurerm_application_insights.log.instrumentation_key
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = azurerm_application_insights.log.connection_string
    "AzureWebJobsStorage"      = azurerm_storage_account.func-storage.primary_connection_string
    "AZURE_SERVICE_BUS_CONNECTION_STRING" = azurerm_servicebus_namespace.sbus.default_primary_connection_string
    "AZURE_STORAGE_CONNECTION_STRING"     = azurerm_storage_account.storage.primary_connection_string
    "MONGO_URI"                           = local.MONGO_URI
    "MONGO_PARAMS"                        = local.MONGO_PARAMS
    "JWT_SECRET"                          =var.JWT_SECRET
    "JWT_RESET_PASSWORD_SECRET"           =var.JWT_RESET_PASSWORD_SECRET
    "FRONTEND_URL"                        =var.FRONTEND_URL
    "EMAIL_ACCOUNT"                       =var.EMAIL_ACCOUNT
    "SENDGRID_API_KEY"                    =var.SENDGRID_API_KEY
    "LOGGING"                             = "false"
    "NODE_ENV"                            =var.NODE_ENV
    "SENTRY_DNS"                          = ""
    "DISCORD_WEBHOOK_URL"                 =var.DISCORD_WEBHOOK_URL
  }

  site_config {
    cors {
      allowed_origins     = [var.FRONTEND_URL, azurerm_static_web_app.static.default_host_name]
      support_credentials = true
    }
    application_stack {
      node_version   = count.index == 0 ? "20" : null
      python_version = count.index == 1 ? "3.12" : null
    }

  }

  depends_on = [ 
    azurerm_application_insights.log, 
    azurerm_cosmosdb_account.cosmosdb, 
    azurerm_servicebus_namespace.sbus, 
    azurerm_storage_account.storage, 
    azurerm_storage_account.func-storage,
    azurerm_static_web_app.static
  ]
}