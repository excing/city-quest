/**
 * Lightweight toast / confirm helpers for web UI.
 * Callers: views and ensureAuthenticated.
 */

let host: HTMLElement | null = null

function ensureHost(): HTMLElement {
  if (host && document.body.contains(host)) return host
  host = document.createElement('div')
  host.className = 'cq-toast-host'
  document.body.appendChild(host)
  return host
}

export function showToast(title: string, durationMs = 2000): void {
  const el = document.createElement('div')
  el.className = 'cq-toast'
  el.textContent = title
  const root = ensureHost()
  root.appendChild(el)
  window.setTimeout(() => {
    el.classList.add('cq-toast--out')
    window.setTimeout(() => {
      el.remove()
    }, 200)
  }, durationMs)
}

export function confirmDialog(options: {
  title: string
  content: string
  confirmText?: string
  cancelText?: string
}): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'cq-dialog-overlay'
    overlay.innerHTML = `
      <div class="cq-dialog" role="dialog" aria-modal="true">
        <div class="cq-dialog__title"></div>
        <div class="cq-dialog__content"></div>
        <div class="cq-dialog__actions">
          <button type="button" class="cq-dialog__btn cq-dialog__btn--cancel"></button>
          <button type="button" class="cq-dialog__btn cq-dialog__btn--ok"></button>
        </div>
      </div>
    `
    const titleEl = overlay.querySelector('.cq-dialog__title') as HTMLElement
    const contentEl = overlay.querySelector('.cq-dialog__content') as HTMLElement
    const cancelBtn = overlay.querySelector(
      '.cq-dialog__btn--cancel',
    ) as HTMLButtonElement
    const okBtn = overlay.querySelector(
      '.cq-dialog__btn--ok',
    ) as HTMLButtonElement
    titleEl.textContent = options.title
    contentEl.textContent = options.content
    cancelBtn.textContent = options.cancelText ?? '取消'
    okBtn.textContent = options.confirmText ?? '确定'

    const close = (result: boolean) => {
      overlay.remove()
      resolve(result)
    }
    cancelBtn.addEventListener('click', () => close(false))
    okBtn.addEventListener('click', () => close(true))
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close(false)
    })
    document.body.appendChild(overlay)
  })
}
