@description('Resource name prefix')
param prefix string

@description('Azure region')
param location string

@description('Log Analytics workspace ID')
param logAnalyticsWorkspaceId string

@description('Subnet ID for Container Apps')
param subnetId string

resource environment 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: '${prefix}-cae'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: reference(logAnalyticsWorkspaceId, '2023-09-01').customerId
        sharedKey: listKeys(logAnalyticsWorkspaceId, '2023-09-01').primarySharedKey
      }
    }
    vnetConfiguration: {
      infrastructureSubnetId: subnetId
      internal: false
    }
  }
}

output environmentId string = environment.id
output defaultDomain string = environment.properties.defaultDomain
