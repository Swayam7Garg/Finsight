{{/*
Chart name, truncated to 63 chars.
*/}}
{{- define "finsight.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Fully qualified app name, truncated to 63 chars.
*/}}
{{- define "finsight.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Chart label value.
*/}}
{{- define "finsight.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels applied to all resources.
*/}}
{{- define "finsight.commonLabels" -}}
helm.sh/chart: {{ include "finsight.chart" . }}
app.kubernetes.io/part-of: finsight
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
{{- end }}

{{/* ---- API labels ---- */}}

{{- define "finsight.api.selectorLabels" -}}
app.kubernetes.io/name: {{ include "finsight.fullname" . }}-api
app.kubernetes.io/component: api
{{- end }}

{{- define "finsight.api.labels" -}}
{{ include "finsight.commonLabels" . }}
{{ include "finsight.api.selectorLabels" . }}
{{- end }}

{{/* ---- Web labels ---- */}}

{{- define "finsight.web.selectorLabels" -}}
app.kubernetes.io/name: {{ include "finsight.fullname" . }}-web
app.kubernetes.io/component: web
{{- end }}

{{- define "finsight.web.labels" -}}
{{ include "finsight.commonLabels" . }}
{{ include "finsight.web.selectorLabels" . }}
{{- end }}

{{/* ---- MCP labels ---- */}}

{{- define "finsight.mcp.selectorLabels" -}}
app.kubernetes.io/name: {{ include "finsight.fullname" . }}-mcp
app.kubernetes.io/component: mcp
{{- end }}

{{- define "finsight.mcp.labels" -}}
{{ include "finsight.commonLabels" . }}
{{ include "finsight.mcp.selectorLabels" . }}
{{- end }}

{{/* ---- Agentic AI labels ---- */}}

{{- define "finsight.agenticAi.selectorLabels" -}}
app.kubernetes.io/name: {{ include "finsight.fullname" . }}-agentic-ai
app.kubernetes.io/component: agentic-ai
{{- end }}

{{- define "finsight.agenticAi.labels" -}}
{{ include "finsight.commonLabels" . }}
{{ include "finsight.agenticAi.selectorLabels" . }}
{{- end }}

{{/* ---- Secret name (supports existingSecret) ---- */}}

{{- define "finsight.secretName" -}}
{{- if .Values.existingSecret }}
{{- .Values.existingSecret }}
{{- else }}
{{- include "finsight.fullname" . }}-secrets
{{- end }}
{{- end }}

{{/* ---- ConfigMap name (supports existingConfigMap) ---- */}}

{{- define "finsight.configMapName" -}}
{{- if .Values.existingConfigMap }}
{{- .Values.existingConfigMap }}
{{- else }}
{{- include "finsight.fullname" . }}-config
{{- end }}
{{- end }}

{{/* ---- Namespace ---- */}}

{{- define "finsight.namespace" -}}
{{- default .Release.Namespace .Values.namespace.name }}
{{- end }}
