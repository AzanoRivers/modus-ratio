import OpenAI from 'openai'
import { env } from '@/lib/env'

// Base URL confirmada contra la API real de OpenCode Go (GET /v1/models).
// No cambiar sin volver a verificar ahí primero.
export const scoringClient = new OpenAI({
  apiKey:  env.opencode.apiKey,
  baseURL: 'https://opencode.ai/zen/go/v1',
})

// Modelo de scoring (dimensiones, puntaje global y recomendaciones del
// outfit): glm-5.2. Antes era minimax-m3, de ahí que este archivo se haya
// llamado "minimax.ts"; se renombró a algo neutral al modelo para no volver
// a quedar desactualizado en el próximo cambio.
// Se cambió porque minimax-m3 razona en un bloque <think> embebido en el
// propio content que en producción llegó a tardar 40-59s+ (y a veces se
// truncaba). Medido contra el prompt real: minimax-m3 40-59s+, kimi-k2.6
// ~21s solo para un campo, deepseek-v4-flash 35s, glm-5.2 30s con mejor
// apego a la disciplina de calibración anti-inflación del prompt. glm-5.2
// además devuelve su razonamiento en un campo `reasoning_content` separado,
// no embebido en `content`, así que no emite <think>.
export const SCORING_MODEL = 'glm-5.2'
