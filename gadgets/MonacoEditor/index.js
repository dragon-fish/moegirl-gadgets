/**
 * MediaWiki Gadget MonacoEditor
 * @author Dragon-Fish <dragon-fish@qq.com>
 * @license MIT
 */
;(async () => {
  const textarea = document.querySelector('textarea#wpTextbox1')
  const language = getLangFromContentModel()
  if (!textarea || !language) return
  const initialValue = textarea.value
  const MONACO_CDN_BASE =
    window.MONACO_CDN_BASE ||
    'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min'
  const MONACO_EXTRA_LIBS = [
    ...[window.MONACO_EXTRA_LIBS || []],
    [
      'https://cdn.jsdelivr.net/npm/@wikimedia/types-wikimedia@0.4.1/MediaWiki.d.ts',
      'MediaWiki.d.ts',
    ],
    [
      'https://cdn.jsdelivr.net/npm/@types/jquery/JQuery.d.ts',
      'jquery/JQuery.d.ts',
    ],
    [
      'https://cdn.jsdelivr.net/npm/@types/jquery/JQueryStatic.d.ts',
      'jquery/JQueryStatic.d.ts',
    ],
    ['declare const $: JQueryStatic', 'jquery/JQueryGlobal.d.ts'],
  ]

  window.MonacoEnvironment = {
    ...window.MonacoEnvironment,
    baseUrl: MONACO_CDN_BASE,
    getWorkerUrl(workerId, label) {
      let path = 'base/worker/workerMain.js'

      if (label === 'json') {
        path = 'language/json/jsonWorker.js'
      } else if (label === 'css' || label === 'scss' || label === 'less') {
        path = 'language/css/cssWorker.js'
      } else if (
        label === 'html' ||
        label === 'handlebars' ||
        label === 'razor'
      ) {
        path = 'language/html/htmlWorker.js'
      } else if (label === 'typescript' || label === 'javascript') {
        path = 'language/typescript/tsWorker.js'
      }

      return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
self.MonacoEnvironment = {
    baseUrl: '${MONACO_CDN_BASE}'
}
importScripts('${MONACO_CDN_BASE}/vs/${path}')
        `)}`
    },
  }

  await loadScript(`${MONACO_CDN_BASE}/vs/loader.js`)
  const require = window.require
  require.config({
    paths: {
      vs: `${MONACO_CDN_BASE}/vs`,
    },
  })
  require(['vs/editor/editor.main'], () => {
    mw?.hook('monaco').fire(monaco)

    const container = document.createElement('div')
    container.style.width = '100%'
    container.style.height = '75vh'
    document
      .querySelector('form#editform .editOptions')
      ?.insertAdjacentElement('beforebegin', container)
    document.querySelector('form#editform .wikiEditor-ui').style.display =
      'none'
    textarea.style.display = 'none'

    const model = monaco.editor.createModel(initialValue, language)
    const editor = monaco.editor.create(container, {
      model,
      automaticLayout: true,
      theme: 'vs-dark',
      tabSize: 2,
    })

    model.onDidChangeContent(() => {
      textarea.value = model.getValue()
    })

    console.info('[MONACO] Rendered', editor, model)
    mw?.hook('monaco.editor').fire({
      editor,
      model,
      addExtraLib,
      addExternalExtraLib,
    })

    if (language === 'javascript') {
      addBatchExtraLibs(monaco, model, MONACO_EXTRA_LIBS)
    }
  })

  async function loadScript(src = '') {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = src
      document.body.appendChild(s)
      s.addEventListener('load', resolve)
      s.addEventListener('error', reject)
    })
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
      (nsNumber === 828 || ['scribunto', 'lua'].includes(contentModel)) &&
      !pageName.endsWith('/doc')
    ) {
      return 'lua'
    } else if (nsNumber === 274) {
      return 'html'
    } else if (pageName.endsWith('.json')) {
      return 'json'
    }
  }

  /**
   * @param monaco
   * @param model
   * @param {string} libSource
   * @param {string?} fileName
   */
  function addExtraLib(monaco, model, libSource, fileName = '') {
    const URI_NS = 'ts:mw'
    fileName = fileName || `${crypto.randomUUID()}.d.ts`
    monaco.languages.typescript.javascriptDefaults.addExtraLib(
      libSource,
      `${URI_NS}/${fileName}`
    )
    model.updateOptions({
      uri: monaco.Uri.parse(`${URI_NS}/main.js`),
    })
  }
  /**
   * @param monaco
   * @param model
   * @param {string} libUrl
   * @param {string?} fileName
   */
  async function addExternalExtraLib(monaco, model, libUrl, fileName) {
    const libSource = await fetch(libUrl).then((i) => i.text())
    fileName = fileName || libSource.split('/').pop()?.split('?')[0]
    return addExtraLib(monaco, model, libSource, fileName)
  }
  /**
   * internal helper function
   * @param {(string | [string, string])[]} libs
   */
  async function addBatchExtraLibs(monaco, model, libs = []) {
    return Promise.all(
      libs.map((lib) => {
        if (typeof lib === 'string') {
          lib = [lib]
        }
        if (!Array.isArray(lib)) return Promise.resolve(null)
        if (typeof lib?.[0] !== 'string') return Promise.resolve(null)
        const helper = lib[0]?.startsWith('http')
          ? addExternalExtraLib
          : addExtraLib
        return helper(monaco, model, lib[0], lib[1])
      })
    )
  }
})()
