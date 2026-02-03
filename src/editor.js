// Editor: inline content editing via contenteditable + GitHub API
// Loaded only when ?edit=true is in the URL
(function () {
  'use strict';

  var REPO_OWNER = 'OWNER';
  var REPO_NAME = 'REPO';
  var CONTENT_PATH = 'src/content.json';
  var STORAGE_KEY_TOKEN = 'nj-editor-token';
  var STORAGE_KEY_REPO = 'nj-editor-repo';

  var currentSha = null;
  var originalContent = null;
  var toolbar = null;
  var statusEl = null;

  // Load saved repo config
  function loadRepoConfig() {
    var saved = localStorage.getItem(STORAGE_KEY_REPO);
    if (saved) {
      try {
        var config = JSON.parse(saved);
        REPO_OWNER = config.owner || REPO_OWNER;
        REPO_NAME = config.name || REPO_NAME;
      } catch (e) { /* ignore */ }
    }
  }

  // Resolve a dot-separated path to set a value on an object
  // Supports numeric keys as array indices
  function setByPath(obj, path, value) {
    var keys = path.split('.');
    var current = obj;

    for (var i = 0; i < keys.length - 1; i++) {
      var key = keys[i];
      var nextKey = keys[i + 1];
      var isNextNumeric = /^\d+$/.test(nextKey);

      if (current[key] === undefined) {
        current[key] = isNextNumeric ? [] : {};
      }
      current = current[key];
    }

    var finalKey = keys[keys.length - 1];
    current[finalKey] = value;
  }

  function getByPath(obj, path) {
    return path.split('.').reduce(function (acc, key) {
      return acc != null ? acc[key] : undefined;
    }, obj);
  }

  // Create the editor toolbar
  function createToolbar() {
    toolbar = document.createElement('div');
    toolbar.className = 'editor-toolbar';
    toolbar.innerHTML =
      '<div class="editor-toolbar__inner">' +
        '<span class="editor-toolbar__status">Modo de Edição</span>' +
        '<div class="editor-toolbar__actions">' +
          '<button class="editor-toolbar__btn editor-toolbar__btn--cancel" type="button">Cancelar</button>' +
          '<button class="editor-toolbar__btn editor-toolbar__btn--publish" type="button">Publicar</button>' +
        '</div>' +
      '</div>';

    // Inject toolbar styles
    var style = document.createElement('style');
    style.textContent =
      '.editor-toolbar {' +
        'position: fixed; top: 0; left: 0; right: 0; z-index: 9999;' +
        'background: oklch(0.210 0.010 90); color: white;' +
        'font-family: Inter, system-ui, sans-serif;' +
        'box-shadow: 0 0.125rem 0.5rem oklch(0% 0 0 / 0.15);' +
      '}' +
      '.editor-toolbar__inner {' +
        'max-width: 68.75rem; margin: 0 auto;' +
        'display: flex; align-items: center; justify-content: space-between;' +
        'padding: 0.75rem 1.25rem; gap: 1rem;' +
      '}' +
      '.editor-toolbar__status {' +
        'font-size: 0.875rem; font-weight: 600;' +
      '}' +
      '.editor-toolbar__actions { display: flex; gap: 0.5rem; }' +
      '.editor-toolbar__btn {' +
        'padding: 0.5rem 1rem; border-radius: 0.375rem; border: none;' +
        'font-size: 0.875rem; font-weight: 600; cursor: pointer;' +
        'font-family: inherit; transition: opacity 0.15s;' +
      '}' +
      '.editor-toolbar__btn:hover { opacity: 0.85; }' +
      '.editor-toolbar__btn:disabled { opacity: 0.5; cursor: not-allowed; }' +
      '.editor-toolbar__btn--cancel {' +
        'background: transparent; color: white; border: 1px solid oklch(0.5 0 0);' +
      '}' +
      '.editor-toolbar__btn--publish {' +
        'background: oklch(0.470 0.115 195); color: white;' +
      '}' +
      '.editor-toolbar__status--error { color: oklch(0.65 0.2 25); }' +
      '.editor-toolbar__status--success { color: oklch(0.75 0.15 145); }';

    document.head.appendChild(style);
    document.body.prepend(toolbar);

    // Add top padding to body so content isn't hidden behind toolbar
    document.body.style.paddingTop = '3.5rem';

    statusEl = toolbar.querySelector('.editor-toolbar__status');

    toolbar.querySelector('.editor-toolbar__btn--cancel').addEventListener('click', cancel);
    toolbar.querySelector('.editor-toolbar__btn--publish').addEventListener('click', publish);
  }

  function setStatus(text, type) {
    statusEl.textContent = text;
    statusEl.className = 'editor-toolbar__status';
    if (type) {
      statusEl.className += ' editor-toolbar__status--' + type;
    }
  }

  // Get or prompt for GitHub PAT
  function getToken() {
    var token = localStorage.getItem(STORAGE_KEY_TOKEN);
    if (token) return token;

    token = prompt(
      'Token de acesso GitHub (Personal Access Token)\n\n' +
      'Para editar o conteúdo, precisa de um token com permissão "Contents: Read and write".\n\n' +
      'Crie em: github.com > Settings > Developer settings > Personal access tokens > Fine-grained tokens\n\n' +
      'O token fica guardado localmente neste browser.'
    );

    if (token) {
      localStorage.setItem(STORAGE_KEY_TOKEN, token.trim());
    }
    return token ? token.trim() : null;
  }

  // Prompt for repo config if defaults are placeholders
  function ensureRepoConfig() {
    loadRepoConfig();

    if (REPO_OWNER === 'OWNER' || REPO_NAME === 'REPO') {
      var input = prompt(
        'Repositório GitHub (formato: owner/repo)\n\n' +
        'Exemplo: nuno-jorge/nuno-jorge.github.io'
      );

      if (input && input.includes('/')) {
        var parts = input.split('/');
        REPO_OWNER = parts[0].trim();
        REPO_NAME = parts[1].trim();
        localStorage.setItem(STORAGE_KEY_REPO, JSON.stringify({
          owner: REPO_OWNER,
          name: REPO_NAME
        }));
      } else {
        return false;
      }
    }
    return true;
  }

  // Fetch current content.json from GitHub to get SHA
  async function fetchCurrentContent(token) {
    var url = 'https://api.github.com/repos/' + REPO_OWNER + '/' + REPO_NAME + '/contents/' + CONTENT_PATH;

    var response = await fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      throw new Error('Erro ao aceder ao repositório (' + response.status + '). Verifique o token e o repositório.');
    }

    var data = await response.json();
    currentSha = data.sha;

    // Decode content from base64
    var decoded = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
    originalContent = JSON.parse(decoded);
    return originalContent;
  }

  // Enable contenteditable on all data-content elements
  function enableEditing() {
    document.body.classList.add('is-editing');

    var elements = document.querySelectorAll('[data-content]');
    elements.forEach(function (el) {
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('spellcheck', 'true');

      // Prevent Enter from creating divs; insert plain line break or do nothing
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
        }
      });

      // Prevent paste from bringing in formatting
      el.addEventListener('paste', function (e) {
        e.preventDefault();
        var text = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, text);
      });
    });
  }

  // Collect edited content from DOM into content.json structure
  function collectContent() {
    var content = JSON.parse(JSON.stringify(originalContent));

    var elements = document.querySelectorAll('[data-content]');
    elements.forEach(function (el) {
      var path = el.getAttribute('data-content');
      var text = el.textContent.trim();

      // Check if the original value was a string
      var originalVal = getByPath(originalContent, path);
      if (typeof originalVal === 'string' || originalVal === undefined) {
        setByPath(content, path, text);
      }
    });

    return content;
  }

  // Publish: commit content.json to GitHub
  async function publish() {
    var token = getToken();
    if (!token) {
      setStatus('Publicação cancelada: sem token.', 'error');
      return;
    }

    if (!ensureRepoConfig()) {
      setStatus('Publicação cancelada: repositório não configurado.', 'error');
      return;
    }

    var publishBtn = toolbar.querySelector('.editor-toolbar__btn--publish');
    publishBtn.disabled = true;
    setStatus('A publicar...');

    try {
      // Re-fetch SHA in case someone else published
      await fetchCurrentContent(token);

      var content = collectContent();
      var encoded = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));

      var url = 'https://api.github.com/repos/' + REPO_OWNER + '/' + REPO_NAME + '/contents/' + CONTENT_PATH;

      var response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Atualizar conteúdo via editor',
          content: encoded,
          sha: currentSha
        })
      });

      if (!response.ok) {
        var err = await response.json();
        throw new Error(err.message || 'Erro ' + response.status);
      }

      setStatus('Publicado com sucesso! O site atualiza em ~60 segundos.', 'success');
      originalContent = content;

    } catch (e) {
      setStatus('Erro: ' + e.message, 'error');
    } finally {
      publishBtn.disabled = false;
    }
  }

  function cancel() {
    var url = window.location.href.replace(/[?&]edit(=[^&]*)?/, '').replace(/[?&]$/, '');
    window.location.href = url || window.location.pathname;
  }

  // Initialize
  async function init() {
    createToolbar();
    setStatus('A carregar conteúdo...');

    var token = getToken();
    if (!token) {
      setStatus('Modo de edição (offline: alterações não serão publicadas)');
      enableEditing();
      return;
    }

    if (!ensureRepoConfig()) {
      setStatus('Modo de edição (offline: repositório não configurado)');
      enableEditing();
      return;
    }

    try {
      await fetchCurrentContent(token);
      enableEditing();
      setStatus('Modo de Edição');
    } catch (e) {
      setStatus('Erro ao carregar: ' + e.message + ' (edição offline)', 'error');
      enableEditing();
    }
  }

  init();
})();
