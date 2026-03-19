@description('Resource name prefix')
param prefix string

@description('Azure region')
param location string

@description('Container Apps Environment ID')
param environmentId string

@description('Container image')
param image string

@description('API URL')
param apiUrl string

@description('Minimum replicas')
param minReplicas int = 2

@description('Maximum replicas')
param maxReplicas int = 8

resource webApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: '${prefix}-web'
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    managedEnvironmentId: environmentId
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
        transport: 'http'
      }
      secrets: [
        {
          name: 'nextauth-secret'
          keyVaultUrl: 'https://${prefix}-kv${az.environment().suffixes.keyvaultDns}/secrets/nextauth-secret'
          identity: 'system'
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'web'
          image: image
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            { name: 'NODE_ENV', value: 'production' }
            { name: 'NEXT_PUBLIC_API_URL', value: '${apiUrl}/api/v1' }
            { name: 'NEXTAUTH_SECRET', secretRef: 'nextauth-secret' }
            { name: 'NEXTAUTH_URL', value: 'https://${prefix}-web.${az.environment().suffixes.azureContainerApps}' }
            { name: 'NEXT_TELEMETRY_DISABLED', value: '1' }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/'
                port: 3000
              }
              initialDelaySeconds: 15
              periodSeconds: 10
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/'
                port: 3000
              }
              initialDelaySeconds: 5
              periodSeconds: 5
            }
          ]
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'cpu-scaling'
            custom: {
              type: 'cpu'
              metadata: {
                type: 'Utilization'
                value: '70'
              }
            }
          }
        ]
      }
    }
  }
}

output fqdn string = webApp.properties.configuration.ingress.fqdn
output appId string = webApp.id
