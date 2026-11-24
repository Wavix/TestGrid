import { config, validateK8sConfig } from "./index"

describe("Kubernetes config", () => {
  it("is disabled unless K8S_ENABLED is set", () => {
    expect(config.k8s.enabled).toBe(false)
    expect(validateK8sConfig(config.k8s)).toBeNull()
  })

  it("names every missing variable when enabled", () => {
    const error = validateK8sConfig({ ...config.k8s, enabled: true, standLabel: "", testgridNamespace: "" })

    expect(error?.message).toBe("K8S_ENABLED=true requires K8S_STAND_LABEL, K8S_TESTGRID_NAMESPACE")
  })

  it("accepts an enabled config with the stand label and namespace set", () => {
    const error = validateK8sConfig({
      ...config.k8s,
      enabled: true,
      standLabel: "example.org/stand",
      testgridNamespace: "myorg"
    })

    expect(error).toBeNull()
  })
})
