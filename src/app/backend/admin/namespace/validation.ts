import Joi from "joi"

export const namespaceSettingsSchema = Joi.object().keys({
  booking_free_branches: Joi.array().items(Joi.string().trim().min(1).max(255)).max(20).required()
})
