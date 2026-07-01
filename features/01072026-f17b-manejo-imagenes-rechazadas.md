# 01072026-f17b — Manejo de imágenes rechazadas por el modelo de IA

> Sub-plan **fuera de la numeración del fundational plan** (`29062026-fundation-plan.md`), pedido explícitamente por el usuario antes de F19 (deploy). Extiende F12 (extracción GPT-4o-mini), F13 (códigos de error), F17 (orquestación de errores) y F10 (rate limit).

- **Fase**: F17b - Manejo de imágenes rechazadas por el modelo de IA
- **Fecha**: 01-07-2026
- **Estado**: cerrada (implementada 01-07-2026)
- **Prerequisitos**: F12, F13, F17 (todos cerrados)
- **Bloquea**: nada directamente, pero se pidió antes de F19

---

## Objetivo

Antes de esta fase, si un usuario subía una imagen que no era un outfit (foto de un perro, un objeto, una captura de pantalla) o contenido prohibido, dos cosas podían pasar: el modelo alucinaba una descripción de todos modos, o el pipeline fallaba y todo colapsaba en un único mensaje genérico "algo salió mal, intenta de nuevo", sin que el usuario supiera por qué ni qué hacer distinto. Tampoco había ninguna medida contra usuarios que mandan imágenes inválidas a propósito repetidamente.

Esta fase agrega: (1) un criterio de aceptación explícito evaluado por el propio GPT-4o-mini, (2) mensajes específicos por motivo de rechazo con la acción correcta (subir otra imagen, no reintentar la misma), y (3) un bloqueo temporal de 15 minutos para IPs que acumulan rechazos repetidos.

---

## Decisiones tomadas (con el usuario)

| Decisión | Valor |
|---|---|
| Motivos de rechazo (lista cerrada) | `no_person_detected`, `image_quality_too_low`, `not_clothing_photo`, `inappropriate_content` |
| Quién decide el rechazo | GPT-4o-mini mismo, como paso 0 de su prompt, antes de describir |
| Umbral de abuso | 3 rechazos en 10 minutos → bloqueo de 15 minutos |
| Rechazos que cuentan para el bloqueo | Los 4 por igual, incluida mala calidad de imagen |
| Status HTTP | Rechazo de imagen = 422 (entrada inválida, no error de servidor). Fallo técnico genuino = 502, sin cambios |
| Alerta Resend | Solo en fallos técnicos genuinos, no en rechazos (son un resultado esperado del sistema, no una incidencia de infraestructura) |
| CTA del botón de error | Rechazo → "Subir otra imagen" (`resetForReanalysis`, vuelve al formulario). Fallo técnico → "Reintentar" (misma imagen, sin re-subir), sin cambios respecto a F17 |

---

## Entregables

| Entregable | Archivo |
|---|---|
| Prompt con paso de aceptación | `src/lib/prompts/gpt4oMini.ts` (editado) |
| Tipos de rechazo | `src/lib/outfitDescription.ts` (editado: `RejectionReasonKey`, `RejectedDescription`, `REJECTION_TO_ERROR_CODE`, `isRejectedDescription`) |
| Detección en la extracción | `src/lib/extractOutfitDescription.ts` (editado) |
| Códigos de error ampliados | `src/lib/analysisTypes.ts` (editado: `REJECTION_ERROR_CODES`, `isRejectionErrorCode`) |
| Propagación del código específico | `src/lib/analysisPipeline.ts` (editado) |
| Bloqueo de abuso en Redis | `src/lib/rateLimit.ts` (editado: `isRejectionBlocked`, `recordRejection`) |
| Respuesta de error con datos extra | `src/lib/apiResponse.ts` (editado: `err()` acepta `extra`) |
| Endpoint con status diferenciado | `src/pages/api/analyze.ts` (editado) |
| Store con bloqueo de rechazos | `src/store/appStore.ts` (editado: `rejectionBlockedUntil`) |
| Cliente lee el código real | `src/lib/useAnalysisFlow.ts` (editado) |
| i18n de mensajes por motivo | `src/i18n/types.ts`, `es.ts`, `en.ts` (editados) |
| UI con mensaje/CTA por código | `src/components/molecules/ProcessingError/ProcessingError.tsx` (reescrito) |
| Mensaje de límite generalizado | `src/components/molecules/UsageLimitMessage/UsageLimitMessage.tsx` (reescrito: props explícitas en vez de leer el store internamente, reusado para el bloqueo de rechazos) |
| Orquestación final | `src/components/organisms/FlowController/FlowController.tsx` (editado) |

---

## Cierre — Definition of Done

- GPT-4o-mini responde `{status: 'rejected', reason: <key>}` para imágenes no analizables, en vez de alucinar una descripción.
- Cada motivo de rechazo llega hasta la UI con su propio texto (ES/EN) y el botón "Subir otra imagen".
- Los fallos técnicos genuinos (Minimax caído, JSON inválido) siguen mostrando el mensaje genérico con "Reintentar" (sin re-subir), sin cambios de comportamiento.
- 3 rechazos de la misma IP en 10 minutos bloquean nuevos análisis por 15 minutos, con mensaje inline y cuenta regresiva.
- El bloqueo se revisa antes de llamar a GPT/Minimax (no gasta tokens en una IP ya bloqueada).
- Los rechazos no disparan alerta Resend (no son una incidencia de infraestructura); los fallos técnicos sí, sin cambios.
- `astro check` sin errores.

---

## Nota

No se probó en producción con imágenes reales rechazadas por OpenAI (requiere una llamada real a la API con una imagen que dispare cada motivo). Verificado por auditoría de código y tipos. Recomendado antes de F19: probar el flujo completo con al menos una imagen de cada motivo de rechazo (una foto de un objeto, una imagen borrosa a propósito) contra el endpoint real.
