import Joi from "joi"

import { ScaleAction, WorkloadKind } from "@/interfaces/stand-control.interface"

export const scaleSchema = Joi.object().keys({
  action: Joi.string()
    .valid(...Object.values(ScaleAction))
    .required(),
  workload: Joi.object().keys({
    kind: Joi.string()
      .valid(...Object.values(WorkloadKind))
      .required(),
    name: Joi.string()
      .pattern(/^[a-z0-9]([-a-z0-9.]*[a-z0-9])?$/)
      .max(253)
      .required()
  })
})
