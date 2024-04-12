import Joi from "joi"

export const schema = Joi.object().keys({
  user_name: Joi.string().min(1).required(),
  user_email: Joi.string().min(1).required(),
  repository: Joi.string().min(1).required(),
  namespace: Joi.string().min(1).required(),
  branch: Joi.string().min(1).required(),
  stand: Joi.string().min(1).required(),
  user_login: Joi.string(),
  user_id: Joi.string()
})
