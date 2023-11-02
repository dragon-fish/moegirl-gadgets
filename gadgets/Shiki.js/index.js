/**
 * MediaWiki Gadget Shiki.js Code Highlighter
 * @author Dragon-Fish <dragon-fish@qq.com>
 * @license MIT
 */
;(async () => {
  const targets = document.querySelectorAll([
    'pre.highlight',
    'pre.hljs',
    'pre.prettyprint',
    'pre.mw-code',
    'pre[lang]',
    'code[lang]',
    'pre[data-lang]',
    'code[data-lang]',
  ])

  if (!targets.length) {
    return console.info('[SHIKI]', 'No targets found')
  } else {
    console.info('[SHIKI]', 'Found targets', targets.length, targets)
    main(await import('https://unpkg.com/shikiji?module'), targets)
  }

  async function main(shiki, targets) {
    await injectStyles()
    const hlBlocks = await Promise.all(
      Array.from(targets).map((el) => renderBlock(shiki, el))
    )
    await Promise.all(
      hlBlocks.filter((i) => !!i).map((el) => applyLineNumbers(el))
    )
  }

  async function injectStyles() {
    const sheet = new CSSStyleSheet()
    await sheet.replace(`
#mw-content-text pre code {
  all: unset;
}
`)
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]
    return true
  }

  function getLangFromContentModel() {
    const nsNumber = mw.config.get('wgNamespaceNumber')
    const pageName = mw.config.get('wgPageName')
    const contentModel = mw.config.get('wgPageContentModel', '').toLowerCase()
    if (pageName.endsWith('.js') || contentModel === 'javascript') {
      return 'javascript'
    } else if (pageName.endsWith('.css') || contentModel === 'css') {
      return 'css'
    } else if (
      // Lua
      (nsNumber === 828 || ['scribunto', 'lua'].includes(contentModel)) &&
      !pageName.endsWith('/doc')
    ) {
      return 'lua'
    }
  }

  /**
   *
   * @param {HTMLElement} el
   */
  function getLangFromElement(el) {
    const lang =
      el.getAttribute('lang') ||
      el.dataset.lang ||
      Array.from(el.classList).find(
        (c) => c.startsWith('language-') || c.startsWith('lang-')
      )
    if (lang) {
      return lang.includes('-') ? lang.split('-')[1] : lang
    }
    return ''
  }

  /**
   * @param {any} shikiji
   * @param {HTMLElement} el
   * @returns {Promise<HTMLElement | null>}
   */
  function renderBlock(shikiji, el) {
    if (el.classList.contains('shiki') || !!el.dataset.shiki) {
      return Promise.resolve(null)
    }
    const lang = getLangFromElement(el) || getLangFromContentModel()
    console.info('[SHIKI]', 'Rendering', el, lang)
    if (!lang) {
      return Promise.resolve(null)
    }
    return shikiji
      .codeToHtml(el.innerText.trimEnd(), { lang, theme: 'one-dark-pro' })
      .then(function (html) {
        el.style.display = 'none'
        el.dataset.shiki = 'true'
        const wrapper = document.createElement('div')
        wrapper.innerHTML = html
        const pre = wrapper.querySelector('pre')
        el.insertAdjacentElement('afterend', pre)
        return pre
      })
      .catch(function (e) {
        console.error('[SHIKI] Render failed', el, e)
        return null
      })
  }

  /**
   * @param {HTMLElement} pre
   */
  function applyLineNumbers(pre) {
    const lineFromRaw = pre.dataset.lineFrom || pre.dataset.from
    const lineEmphaticRaw =
      pre.dataset.lineEmphatic ||
      pre.dataset.emphatic ||
      pre.dataset.linePin ||
      pre.dataset.pin ||
      ''

    const lineFrom = Math.max(parseInt(lineFromRaw, 10) || 1, 1)
    const emphaticLines = lineEmphaticRaw
      .split(',')
      .map((n) => parseInt(n.trim(), 10))

    /** @type {{ no: number; emphatic: boolean }[]} */
    const linesStore = []

    /** @type {HTMLSpanElement} */
    const code = pre.querySelector('code')
    code.querySelectorAll('span.line').forEach((line, i) => {
      const no = lineFrom + i
      const emphatic = emphaticLines.includes(no)
      linesStore.push({ no, emphatic })
      line.dataset.line = no
      if (emphatic) {
        line.classList.add('emphatic')
      }
    })

    const lineNumsCode = document.createElement('code')
    lineNumsCode.innerHTML = linesStore
      .map((conf) => {
        const line = document.createElement('span')
        line.classList.add('line', 'line-number')
        line.dataset.line = conf.no
        if (conf.emphatic) {
          line.classList.add('emphatic')
        }
        line.innerText = conf.no.toString()
        return line.outerHTML
      })
      .join('\n')

    pre.style.display = 'flex'
    pre.style.flexDirection = 'row-reverse'

    code.style.flex = '1 1 auto'
    code.style.whiteSpace = 'pre'
    code.style.overflowX = 'auto'

    lineNumsCode.classList.add('line-numbers')
    lineNumsCode.style.cssText = `text-align: center; padding-right: 0.5em; user-select: none; pointer-events: none;`

    pre.insertAdjacentElement('beforeend', lineNumsCode)

    return pre
  }
})()
