import type { RecommendationKey } from '@/lib/analysisTypes'

export interface Translations {
  siteName: string
  common: {
    back: string
    optional: string
    loading: string
    error: string
    close: string
  }
  home: {
    title: string
    subtitle: string
    description: string
    analyzeButton: string
    usageLimitTitle:    string
    usageLimitBody:     string
    usageLimitResetsAt: string
    usageLimitMinutes:  string
    imageBlockTitle: string
    imageBlockBody:  string
  }
  form: {
    dropzoneLabel: string
    dropzoneHint: string
    dropzoneDrag: string
    dropzoneConverting: string
    dropzoneChange: string
    dropzoneRemove: string
    styleLabel: string
    styles: {
      urbano: string
      alternativo: string
      casual: string
      semiformal: string
      formal: string
      formalUrbano: string
      formalAlternativo: string
      oldmoney: string
      punkRock: string
      gotico: string
      geek: string
      miEstilo: string
    }
    heightLabel: string
    heightUnit: string
    skinColorLabel: string
    skinColors: {
      fair: string
      light: string
      medium: string
      dark: string
      deepDark: string
      ebony: string
    }
    buildLabel: string
    buildParts: {
      upper: string
      lower: string
    }
    buildTypes: {
      slim: string
      athletic: string
      uniform: string
      thick: string
    }
    genderLabel: string
    genderNote: string
    genderOptional: string
    genderPrefLabel: string
    genderPrefs: {
      fem: string
      masc: string
      nonbinary: string
      fluid: string
    }
    captchaLabel: string
    captchaHint: string
    captchaRefresh: string
  }
  warnings: {
    privacy: string
    stylePersonal: string
    imageQuality: string
  }
  loader: {
    uploading:  string
    almostDone: string
    analyzing:  string
    messages: {
      generic: string[]
      byStyle: Record<'urbano' | 'alternativo' | 'casual' | 'semiformal' | 'formal' | 'formalUrbano' | 'formalAlternativo' | 'oldmoney' | 'punkRock' | 'gotico' | 'geek' | 'miEstilo', string[]>
    }
  }
  results: {
    ratioForStyleLabel: string
    detectedStyleLabel: string
    noStyleDetected:  string
    dimensionsTitle:  string
    warningsTitle:    string
    highlightTitle:   string
    recsTitle:        string
    styleDisclaimer:  string
    reanalyzeButton:  string
    noHighlight:      string
  }
  nav: {
    laboratory: string
    otherProjects: string
    cta: string
    comingSoon: string
    createdBy: string
    logoAlt: string
    githubLabel: string
    projects: {
      cartum: { title: string; description: string }
      suportum: { title: string; description: string }
      vamoGps: { title: string; description: string }
      pixelatam: { title: string; description: string }
      plantum: { title: string; description: string }
      codepass: { title: string; description: string }
      modusRatio: { title: string; description: string }
      quantum: { title: string; description: string }
    }
  }
  errors: {
    notFound: {
      code: string
      title: string
      message: string
      cta: string
    }
    serverError: {
      code: string
      title: string
      message: string
      cta: string
    }
    tooManyRequests: {
      code: string
      title: string
      message: string
      cta: string
    }
    rateLimit: {
      title: string
      subtitle: string
      waitMessage: string
    }
    usageLimit: {
      title: string
      message: string
      resetAt: string
    }
    imageFormat: string
    imageSize: string
    imageHeicFailed: string
    uploadFailed: string
    analysisFailed: string
  }
  emails: {
    ipBannedSubject: string
    ipBannedBody: string
    aiFailedSubject: string
    aiFailedBody: string
    r2FailedSubject: string
    r2FailedBody: string
  }
  analysis: {
    dimensions: Record<'colorHarmony' | 'styleCoherence' | 'fitAndSilhouette' | 'originality' | 'contextFit', string>
    dimensionDescriptions: Record<'colorHarmony' | 'styleCoherence' | 'fitAndSilhouette' | 'originality' | 'contextFit', string>
    warnings:   Record<'colors_clash' | 'pattern_overload' | 'ill_fitted' | 'occasion_mismatch' | 'accessories_missing' | 'layering_issue' | 'proportion_imbalance', string>
    highlights: Record<'great_color_combo' | 'statement_piece' | 'well_fitted' | 'cohesive_look' | 'unique_style', string>
    semaphore:  Record<'green' | 'yellow' | 'red', string>
    processingError: {
      title:   string
      message: string
      cta:     string
    }
    // Keyed por AnalysisErrorCode (UPPER_SNAKE_CASE), no por RejectionReasonKey
    // del modelo: es el mismo código que viaja hasta el store (analysisError).
    rejectionReasons: Record<'NO_PERSON_DETECTED' | 'IMAGE_QUALITY_TOO_LOW' | 'NOT_CLOTHING_PHOTO' | 'INAPPROPRIATE_CONTENT', {
      title:   string
      message: string
    }>
    rejectionCta: string
  }
  recommendations: Record<RecommendationKey, string>
}
