import OpenAI from 'openai'
import { env } from '@/lib/env'

export const openai = new OpenAI({
  apiKey:  env.modelImage.apiKey,
  baseURL: env.modelImage.baseUrl,
})
