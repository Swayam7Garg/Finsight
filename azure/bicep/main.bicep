@description('Environment name')
@allowed(['dev', 'staging', 'production'])
param environment string

@description('Azure region for resources')
param location string = resourceGroup().location

@description('Domain name for the application')
param domainName string = ''

@description('Container image for API')
param apiImage string

@description('Container image for Web')
param webImage string

@secure()
@description('JWT Secret')
param jwtSecret string

@secure()
@description('JWT Refresh Secret')
param jwtRefreshSecret string

@secure()
@description('NextAuth Secret')
param nextAuthSecret string

@secure()
@description('MongoDB Connection String')
param mongoDbUri string

var prefix = 'ww-${environment}'

module vnet 'modules/vnet.bicep' = {
  name: '${prefix}-vnet'
  params: {
    prefix: prefix
    location: location
  }
}

module logAnalytics 'modules/log-analytics.bicep' = {
  name: '${prefix}-logs'
  params: {
    prefix: prefix
    location: location
    retentionDays: environment == 'production' ? 90 : 30
  }
}

module acr 'modules/acr.bicep' = {
  name: '${prefix}-acr'
  params: {
    prefix: prefix
    location: location
    sku: environment == 'production' ? 'Premium' : 'Standard'
  }
}

module keyVault 'modules/key-vault.bicep' = {
  name: '${prefix}-kv'
  params: {
    prefix: prefix
    location: location
    jwtSecret: jwtSecret
    jwtRefreshSecret: jwtRefreshSecret
    nextAuthSecret: nextAuthSecret
    mongoDbUri: mongoDbUri
  }
}

module cosmosDb 'modules/cosmos-db.bicep' = {
  name: '${prefix}-cosmos'
  params: {
    prefix: prefix
    location: location
    environment: environment
    vnetId: vnet.outputs.vnetId
    subnetId: vnet.outputs.databaseSubnetId
  }
}

module containerAppsEnv 'modules/container-apps-env.bicep' = {
  name: '${prefix}-cae'
  params: {
    prefix: prefix
    location: location
    logAnalyticsWorkspaceId: logAnalytics.outputs.workspaceId
    subnetId: vnet.outputs.containerAppsSubnetId
  }
}

module apiApp 'modules/container-app-api.bicep' = {
  name: '${prefix}-api'
  params: {
    prefix: prefix
    location: location
    environmentId: containerAppsEnv.outputs.environmentId
    image: apiImage
    keyVaultName: keyVault.outputs.keyVaultName
    minReplicas: environment == 'production' ? 3 : environment == 'staging' ? 2 : 1
    maxReplicas: environment == 'production' ? 10 : 5
  }
}

module webApp 'modules/container-app-web.bicep' = {
  name: '${prefix}-web'
  params: {
    prefix: prefix
    location: location
    environmentId: containerAppsEnv.outputs.environmentId
    image: webImage
    apiUrl: 'https://${apiApp.outputs.fqdn}'
    minReplicas: environment == 'production' ? 3 : environment == 'staging' ? 2 : 1
    maxReplicas: environment == 'production' ? 8 : 4
  }
}

module frontDoor 'modules/front-door.bicep' = if (environment == 'production' || environment == 'staging') {
  name: '${prefix}-fd'
  params: {
    prefix: prefix
    apiHostname: apiApp.outputs.fqdn
    webHostname: webApp.outputs.fqdn
    domainName: domainName
  }
}

output apiUrl string = apiApp.outputs.fqdn
output webUrl string = webApp.outputs.fqdn
output acrLoginServer string = acr.outputs.loginServer
