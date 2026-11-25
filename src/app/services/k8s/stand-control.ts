import { config } from "@/config"

import { K8sClusterClient } from "./cluster.client"
import { PrometheusClient } from "./prometheus.client"
import { StandControlService } from "./stand-control.service"

export const createStandControlService = (): StandControlService =>
  new StandControlService({
    cluster: new K8sClusterClient(config.k8s),
    metrics: new PrometheusClient(config.k8s.prometheusUrl),
    deleteEnabled: config.k8s.deleteEnabled,
    selfDeployment: config.k8s.selfDeployment
  })
