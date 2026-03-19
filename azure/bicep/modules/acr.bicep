@description('Resource name prefix')
param prefix string

@description('Azure region')
param location string

@description('ACR SKU')
@allowed(['Basic', 'Standard', 'Premium'])
param sku string = 'Standard'

var acrName = replace('${prefix}acr', '-', '')

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  sku: {
    name: sku
  }
  properties: {
    adminUserEnabled: false
    publicNetworkAccess: 'Enabled'
  }
}

output loginServer string = acr.properties.loginServer
output acrId string = acr.id
output acrName string = acr.name
