export interface K8sConfig {
  enabled: boolean
  standLabel: string
  testgridNamespace: string
  kindLabel: string
  ownerAnnotation: string
  apiUrl: string
  tokenFile: string
  caFile: string
}

const SERVICE_ACCOUNT_DIR = "/var/run/secrets/kubernetes.io/serviceaccount"

export const config = {
  jiraUrl: process.env.NEXT_PUBLIC_JIRA_URL || "",
  jiraTaskReplaceFrom: process.env.JIRA_TASK_REPLACE_FROM || "",
  jiraTaskReplaceTo: process.env.JIRA_TASK_REPLACE_TO || "",
  k8s: {
    enabled: process.env.K8S_ENABLED === "true",
    standLabel: process.env.K8S_STAND_LABEL || "",
    testgridNamespace: process.env.K8S_TESTGRID_NAMESPACE || "",
    kindLabel: process.env.K8S_STAND_KIND_LABEL || "",
    ownerAnnotation: process.env.K8S_STAND_OWNER_ANNOTATION || "",
    apiUrl: process.env.K8S_API_URL || "https://kubernetes.default.svc",
    tokenFile: process.env.K8S_TOKEN_FILE ?? `${SERVICE_ACCOUNT_DIR}/token`,
    caFile: process.env.K8S_CA_FILE ?? `${SERVICE_ACCOUNT_DIR}/ca.crt`
  } satisfies K8sConfig
}

export const validateK8sConfig = (k8s: K8sConfig): Error | null => {
  if (!k8s.enabled) return null

  const missing = [!k8s.standLabel && "K8S_STAND_LABEL", !k8s.testgridNamespace && "K8S_TESTGRID_NAMESPACE"].filter(
    Boolean
  )

  if (!missing.length) return null

  return new Error(`K8S_ENABLED=true requires ${missing.join(", ")}`)
}
