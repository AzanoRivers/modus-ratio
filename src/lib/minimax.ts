import OpenAI from 'openai'
import { env } from '@/lib/env'

// Base URL confirmada contra la API real de OpenCode Go (GET /v1/models).
// No cambiar sin volver a verificar ahí primero.
export const minimax = new OpenAI({
  apiKey:  env.opencode.apiKey,
  baseURL: 'https://opencode.ai/zen/go/v1',
})

// Modelo de scoring: glm-5.2, NO Minimax (el nombre del módulo/cliente quedó
// del modelo original por el que se decidió no renombrar todo el pipeline).
// Se cambió porque minimax-m3 razona en un bloque <think> embebido en el
// propio content que en producción llegó a tardar 40-59s+ (y a veces se
// truncaba). Medido contra el prompt real: minimax-m3 40-59s+, kimi-k2.6
// ~21s solo para un campo, deepseek-v4-flash 35s, glm-5.2 30s con mejor
// apego a la disciplina de calibración anti-inflación del prompt. glm-5.2
// además devuelve su razonamiento en un campo `reasoning_content` separado,
// no embebido en `content`, así que no emite <think>.
export const MINIMAX_MODEL = 'glm-5.2'
