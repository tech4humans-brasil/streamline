terraform {
  required_providers {
    azurerm = {
      source = "hashicorp/azurerm"
      version = "3.97.1"
    }
  }
}

provider "azurerm" {
  features {}
  subscription_id = "36f0c050-1087-4637-8d2c-69624bcd2807"
}

resource "azurerm_resource_group" "rg" {
  name     = "sbus-rg"
  location = "eastus2"
}

resource "azurerm_servicebus_namespace" "sbus" {
  name                = "dev-streamline-sbus"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  sku                 = "Basic"
  minimum_tls_version = "1.2"
  public_network_access_enabled = true

  depends_on = [
    azurerm_resource_group.rg
  ]
}

resource "azurerm_servicebus_queue" "send_email" {
  name                = "dev-send_email"
  namespace_id = azurerm_servicebus_namespace.sbus.id
  enable_partitioning = false
  max_delivery_count = 10
  lock_duration = "PT5M"

  depends_on = [
    azurerm_servicebus_namespace.sbus
  ]
}

resource "azurerm_servicebus_queue" "change_status" {
  name                = "dev-change_status"
  namespace_id = azurerm_servicebus_namespace.sbus.id
  enable_partitioning = false
  max_delivery_count = 10
  lock_duration = "PT5M"

  depends_on = [
    azurerm_servicebus_namespace.sbus
  ]
}

resource "azurerm_servicebus_queue" "swap_workflow" {
  name                = "dev-swap_workflow"
  namespace_id = azurerm_servicebus_namespace.sbus.id
  enable_partitioning = false
  max_delivery_count = 10
  lock_duration = "PT5M"

  depends_on = [
    azurerm_servicebus_namespace.sbus
  ]
}

resource "azurerm_servicebus_queue" "interaction" {
  name                = "dev-interaction"
  namespace_id = azurerm_servicebus_namespace.sbus.id
  enable_partitioning = false
  max_delivery_count = 10
  lock_duration = "PT5M"

  depends_on = [
    azurerm_servicebus_namespace.sbus
  ]
}

resource "azurerm_servicebus_queue" "evaluated" {
  name                = "dev-evaluated"
  namespace_id = azurerm_servicebus_namespace.sbus.id
  enable_partitioning = false
  max_delivery_count = 10
  lock_duration = "PT5M"

  depends_on = [
    azurerm_servicebus_namespace.sbus
  ]
}

resource "azurerm_servicebus_queue" "interaction_process" {
  name                = "dev-interaction_process"
  namespace_id = azurerm_servicebus_namespace.sbus.id
  enable_partitioning = false
  max_delivery_count = 10
  lock_duration = "PT5M"

  depends_on = [
    azurerm_servicebus_namespace.sbus
  ]
}

resource "azurerm_servicebus_queue" "evaluation_process" {
  name                = "dev-evaluation_process"
  namespace_id = azurerm_servicebus_namespace.sbus.id
  enable_partitioning = false
  max_delivery_count = 10
  lock_duration = "PT5M"

  depends_on = [
    azurerm_servicebus_namespace.sbus
  ]
}

resource "azurerm_servicebus_queue" "web_request" {
  name                = "dev-web_request"
  namespace_id = azurerm_servicebus_namespace.sbus.id
  enable_partitioning = false
  max_delivery_count = 10
  lock_duration = "PT5M"

  depends_on = [
    azurerm_servicebus_namespace.sbus
  ]
}

resource "azurerm_servicebus_queue" "conditional" {
  name                = "dev-conditional"
  namespace_id = azurerm_servicebus_namespace.sbus.id
  enable_partitioning = false
  max_delivery_count = 10
  lock_duration = "PT5M"

  depends_on = [
    azurerm_servicebus_namespace.sbus
  ]
}

resource "azurerm_resource_group" "rg_static" {
  name     = "static-web-app-rg"
  location = "eastus2"
  
}

resource "azurerm_static_web_app" "static" {
  name                = "dev-streamline"
  resource_group_name = azurerm_resource_group.rg_static.name
  location            = azurerm_resource_group.rg_static.location
  sku_tier = "Free"
  sku_size = "Free"

  depends_on = [
    azurerm_resource_group.rg_static
  ]
}

resource "azurerm_resource_group" "rg_functions" {
  name     = "functions-rg"
  location = "eastus2"

  depends_on = [
    azurerm_resource_group.rg_static,
    azurerm_resource_group.rg,
    azurerm_servicebus_namespace.sbus,
  ]
}

resource "azurerm_storage_account" "storage" {
  name                     = "streamlinefiles"
  resource_group_name      = azurerm_resource_group.rg_functions.name
  location                 = azurerm_resource_group.rg_functions.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  depends_on = [
    azurerm_resource_group.rg_functions
  ]
}

resource "azurerm_service_plan" "ASP-functionsrg-a025" {
  name                = "dev-streamline-serv-plan"
  location            = azurerm_resource_group.rg_functions.location
  resource_group_name = azurerm_resource_group.rg_functions.name
  sku_name = "Y1"
  os_type = "Linux"
  depends_on = [
    azurerm_resource_group.rg_functions
  ]
}

resource "azurerm_resource_group" "rg_mongo" {
  name     = "static-data-rg"
  location = "eastus2"
}

resource "azurerm_cosmosdb_account" "cosmos" {
  kind                = "MongoDB"
  location            =  azurerm_resource_group.rg_mongo.location
  name                = "dev-streamline-mongo"
  offer_type          = "Standard"
  resource_group_name = azurerm_resource_group.rg_mongo.name
  tags = {
    defaultExperience       = "Azure Cosmos DB for MongoDB API"
    hidden-cosmos-mmspecial = ""
  }
  consistency_policy {
    consistency_level = "Session"
  }
  geo_location {
    failover_priority = 0
    location          = "eastus2"
  }
  enable_free_tier = true

  depends_on = [
    azurerm_resource_group.rg_mongo
  ]
}


resource "azurerm_linux_function_app" "func1" {
  name                       = "streamline-services"
  resource_group_name = azurerm_resource_group.rg_functions.name
  location            = azurerm_resource_group.rg_functions.location

  storage_account_name       = azurerm_storage_account.storage.name
  storage_account_access_key = azurerm_storage_account.storage.primary_access_key
  service_plan_id            = azurerm_service_plan.ASP-functionsrg-a025.id

  app_settings = {
    "FUNCTIONS_WORKER_RUNTIME" = "node",
    "AZURE_SERVICE_BUS_CONNECTION_STRING" = azurerm_servicebus_namespace.sbus.default_primary_connection_string,
    AZURE_STORAGE_CONNECTION_STRING = azurerm_storage_account.storage.primary_connection_string,
    "MONGO_URI": azurerm_cosmosdb_account.cosmos.connection_strings[0],
    "JWT_SECRET": "",
    "JWT_RESET_PASSWORD_SECRET": "",
    "FRONTEND_URL": "",
    "EMAIL_ACCOUNT": "noreply@hml-tech4h.com.br",
    "SENDGRID_API_KEY": "",
    "SENTRY_DSN" = "",
    NODE_ENV = "development"
  }
  site_config {
    cors {
      allowed_origins     = ["*"]
      support_credentials = false
    }
    application_stack {
      node_version = "20"
    }
  }
  depends_on = [
    azurerm_service_plan.ASP-functionsrg-a025,
    azurerm_storage_account.storage,
    azurerm_servicebus_namespace.sbus,
    azurerm_cosmosdb_account.cosmos,
  ]
}