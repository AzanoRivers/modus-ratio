export interface UploadOptions {
  onProgress?: (percent: number) => void
}

export async function uploadToR2(
  file: File,
  presignedUrl: string,
  options: UploadOptions = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && options.onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100)
        options.onProgress(percent)
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`R2 upload failed with status ${xhr.status}`))
      }
    }

    xhr.onerror = () => {
      reject(new Error('R2 upload failed: network error'))
    }

    xhr.open('PUT', presignedUrl)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })
}
