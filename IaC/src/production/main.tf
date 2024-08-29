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
  subscription_id = "36f0c050-1087-4637-8d2c-69624bcd2807"
}

locals {
  MONGO_URI                = ""
  MONGO_PARAMS             = ""
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
  name                = "send_email"
  namespace_id = azurerm_servicebus_namespace.sbus.id
  enable_partitioning = false
  max_delivery_count = 10
  lock_duration = "PT5M"

  depends_on = [
    azurerm_servicebus_namespace.sbus
  ]
}

resource "azurerm_servicebus_queue" "change_status" {
  name                = "change_status"
  namespace_id = azurerm_servicebus_namespace.sbus.id
  enable_partitioning = false
  max_delivery_count = 10
  lock_duration = "PT5M"

  depends_on = [
    azurerm_servicebus_namespace.sbus
  ]
}

resource "azurerm_servicebus_queue" "swap_workflow" {
  name                = "swap_workflow"
  namespace_id = azurerm_servicebus_namespace.sbus.id
  enable_partitioning = false
  max_delivery_count = 10
  lock_duration = "PT5M"

  depends_on = [
    azurerm_servicebus_namespace.sbus
  ]
}

resource "azurerm_servicebus_queue" "interaction" {
  name                = "interaction"
  namespace_id = azurerm_servicebus_namespace.sbus.id
  enable_partitioning = false
  max_delivery_count = 10
  lock_duration = "PT5M"

  depends_on = [
    azurerm_servicebus_namespace.sbus
  ]
}

resource "azurerm_servicebus_queue" "interaction_process" {
  name                = "interaction_process"
  namespace_id = azurerm_servicebus_namespace.sbus.id
  enable_partitioning = false
  max_delivery_count = 10
  lock_duration = "PT5M"

  depends_on = [
    azurerm_servicebus_namespace.sbus
  ]
}

resource "azurerm_servicebus_queue" "web_request" {
  name                = "web_request"
  namespace_id = azurerm_servicebus_namespace.sbus.id
  enable_partitioning = false
  max_delivery_count = 10
  lock_duration = "PT5M"

  depends_on = [
    azurerm_servicebus_namespace.sbus
  ]
}

resource "azurerm_servicebus_queue" "conditional" {
  name                = "conditional"
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

resource "azurerm_linux_function_app" "func1" {
  name                       = "dev-streamline-services"
  resource_group_name = azurerm_resource_group.rg_functions.name
  location            = azurerm_resource_group.rg_functions.location

  storage_account_name       = azurerm_storage_account.storage.name
  storage_account_access_key = azurerm_storage_account.storage.primary_access_key
  service_plan_id            = azurerm_service_plan.ASP-functionsrg-a025.id
  https_only = true

  app_settings = {
    "FUNCTIONS_WORKER_RUNTIME" = "node",
    "AZURE_SERVICE_BUS_CONNECTION_STRING" = azurerm_servicebus_namespace.sbus.default_primary_connection_string,
    "AZURE_STORAGE_CONNECTION_STRING" = azurerm_storage_account.storage.primary_connection_string,
    "MONGO_URI"                          = local.MONGO_URI,
    "MONGO_PARAMS"                       = local.MONGO_PARAMS,
    "JWT_SECRET": "UbF6O#71K5(",
    "JWT_RESET_PASSWORD_SECRET": "UbF6O#71K5(2",
    "FRONTEND_URL": "streamline.hml-tech4h.com.br",
    "EMAIL_ACCOUNT": "noreply@hml-tech4h.com.br",
    "SENDGRID_API_KEY": "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",
    "SENTRY_DSN" = "",
    "FRONTEND_URL": "streamline.hml-tech4h.com.br",
    "LOGGING": "false",
    NODE_ENV = "development"
  }
  site_config {
    cors {
      allowed_origins     = [azurerm_static_web_app.static.default_host_name, "streamline.hml-tech4h.com.br"]
      support_credentials = true
    }
    application_stack {
      node_version = "20"
    }
  }
  depends_on = [
    azurerm_service_plan.ASP-functionsrg-a025,
    azurerm_storage_account.storage,
    azurerm_servicebus_namespace.sbus,
    azurerm_static_web_app.static,
  ]
}