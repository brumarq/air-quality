{{- define "collector.fullname" -}}
{{ .Release.Name }}-collector
{{- end }}

{{- define "collector.labels" -}}
app.kubernetes.io/name: collector
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
{{- end }}

{{- define "collector.selectorLabels" -}}
app.kubernetes.io/name: collector
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
