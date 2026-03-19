@description('Resource name prefix')
param prefix string

@description('Azure region')
param location string

@description('Retention period in days')
param retentionDays int = 30

resource workspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${prefix}-logs'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: retentionDays
  }
}

output workspaceId string = workspace.id
output workspaceName string = workspace.name
