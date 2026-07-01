import type { APIRoute } from 'astro'
import {
  ok, err, getIP, checkUsage, recordUsage, banIP,
  isRejectionBlocked, recordRejection, isRejectionErrorCode,
  deleteR2Object, cleanupOrphanUploads, sendAlertEmail,
} from '@/lib'
import { runAnalysisPipeline, AnalysisError } from '@/lib/analysisPipeline'
import type { AnalysisResults } from '@/lib/analysisTypes'
import type { FormParams } from '@/components/organisms/HomeForm'

interface RequestBody {
  objectKey:  string
  formParams: FormParams
}

function isValidBody(body: unknown): body is RequestBody {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>
  return (
    typeof b.objectKey === 'string' &&
    b.objectKey.length > 0 &&
    b.formParams !== null &&
    typeof b.formParams === 'object'
  )
}

export const POST: APIRoute = async ({ request, locals }) => {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return err('INVALID_JSON', 'Request body is not valid JSON', 400)
  }

  if (!isValidBody(body)) {
    return err('BAD_REQUEST', 'Missing objectKey or formParams', 400)
  }

  const ip    = getIP(request)
  const usage = await checkUsage(ip)

  if (!usage.allowed) {
    if (usage.shouldBan) await banIP(ip)
    return err('USAGE_LIMIT_EXCEEDED', 'Hourly limit reached', 429)
  }

  // Bloqueo por abuso de imágenes rechazadas: se revisa antes de gastar
  // tokens de IA. Independiente del límite de 25/hora y del ban de seguridad.
  const rejectionBlock = await isRejectionBlocked(ip)
  if (rejectionBlock.blocked) {
    return err(
      'IMAGE_REJECTION_BLOCKED',
      'Too many rejected images from this IP',
      429,
      { resetAt: rejectionBlock.resetAt },
    )
  }

  let results: AnalysisResults
  try {
    results = await runAnalysisPipeline({
      objectKey:  body.objectKey,
      formParams: body.formParams,
      locale:     locals.language,
    })
  } catch (e) {
    await cleanupOrphanUploads()
    const errorCode = e instanceof AnalysisError ? e.code : 'UNEXPECTED'
    console.error('[analyze] pipeline failed:', errorCode, e)

    if (isRejectionErrorCode(errorCode)) {
      // El modelo decidió que la imagen no es analizable: no es un fallo del
      // servidor. Cuenta hacia el bloqueo de abuso, no dispara alerta Resend.
      await recordRejection(ip)
      return err(errorCode, errorCode, 422)
    }

    // Fallo técnico genuino: alerta best-effort, no bloquea ni altera la respuesta
    sendAlertEmail({
      subject: `[Modus Ratio] AI pipeline failed - ${errorCode}`,
      body:    `IP: ${ip}\nError: ${errorCode}\nTimestamp: ${new Date().toISOString()}`,
    }).catch((resendErr) => {
      console.error('[analyze] Resend alert failed:', resendErr)
    })
    return err('AI_ANALYSIS_FAILED', errorCode, 502)
  }

  await recordUsage(ip)
  if (usage.shouldBan) await banIP(ip)

  await deleteR2Object(body.objectKey)
  await cleanupOrphanUploads()

  return ok(results)
}
