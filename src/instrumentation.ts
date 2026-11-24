import { config, validateK8sConfig } from "@/config"

export const register = () => {
  const error = validateK8sConfig(config.k8s)
  if (error) throw error
}
