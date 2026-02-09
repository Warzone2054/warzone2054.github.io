(function () {
  let popupContainer = document.getElementById('popup-container');
  let popupContent = document.getElementById('popup-content');
  window.document.addEventListener('DOMContentLoaded', function () {
    popupContainer = document.getElementById('popup-container');
    popupContent = document.getElementById('popup-content');
  });
  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  function hasMarked() {
    return window.marked && window.marked.parse;
  }
  let markedInitialized = false;
  function checkMarked() {
    if (hasMarked() && !markedInitialized) {
      const renderer = new marked.Renderer();
      renderer.html = escapeHtml
      marked.use({
        renderer: renderer,
        gfm: false,
      });
      markedInitialized = true;
    } else {
      markedInitialized = false;
    }
  }

  let emojiData = null;
  let reverseAliases = null;
  const fallbackAliases = {
    "fox": "fox_face",
  }

  async function fetchEmojiData() {
    reverseAliases = null;
    try {
      emojiData = await (await fetch('https://cdn.jsdelivr.net/npm/@emoji-mart/data')).json();
      if (!emojiData || !emojiData.emojis || !emojiData.aliases) {
        emojiData = null;
      }
      reverseAliases = Object.fromEntries(Object.entries(emojiData.aliases)
        .map(([key, value]) => [value, key]));
      for (const fallbackAlias in fallbackAliases) {
        const emojiId = fallbackAliases[fallbackAlias];
        if (!reverseAliases[emojiId]) {
          reverseAliases[emojiId] = fallbackAlias;
        }
      }
    } catch (e) {
      console.error('Failed to load emoji data:', e);
      emojiData = null;
    }
    window.W2054Popup.emojiData = emojiData;
  }

  function findEmojis(query) {
    if (!emojiData || !emojiData.emojis || !query) return [];
    const results = [];
    const lowerQuery = query.toLowerCase();

    for (const category in emojiData.emojis) {
      const emoji = emojiData.emojis[category];
      const emojiId = emoji.id;
      if (emojiId === undefined || !emojiId) continue;
      const emojiAlias = reverseAliases[emojiId];
      if (emojiId.startsWith(lowerQuery) || (emojiAlias && emojiAlias.startsWith(lowerQuery))) {
        results.push({
          id: emoji.id,
          alias: emojiAlias,
          native: emoji.skins[0].native,
          name: emoji.name
        });
      }
      if (results.length >= 10) break;
    }
    return results;
  }

  function replaceEmojiShortcodes(text) {
    if (!emojiData) return text;
    return text.replace(/:([a-zA-Z0-9_+-]+):/g, function (match, shortcode) {
      const emoji = emojiData.emojis[shortcode];
      if (emoji && emoji.skins && emoji.skins[0]) {
        return emoji.skins[0].native;
      }
      const emojiFallback = emojiData.emojis[emojiData.aliases[shortcode] || fallbackAliases[shortcode]];
      if (emojiFallback && emojiFallback.skins && emojiFallback.skins[0]) {
        return emojiFallback.skins[0].native;
      }
      return match;
    });
  }

  function showEmojiAutocomplete(textarea, emojis, cursorPos) {
    hideEmojiAutocomplete();

    if (emojis.length === 0) return;

    const autocomplete = document.createElement('div');
    autocomplete.id = 'emoji-autocomplete';
    autocomplete.className = 'emoji-autocomplete';
    autocomplete.style.cssText = 'position:absolute;background:var(--emoji-picker-background,#2a2a2a);' +
      'max-height:200px;overflow-y:auto;z-index:10000;';

    emojis.forEach((emoji, index) => {
      const item = document.createElement('div');
      let emojiId = emoji.id;
      const emojiAlias = emoji.alias;
      let emojiDisplay = ":" +emoji.id + ":";
      if (emojiAlias) {
        if (emojiId.startsWith(emojiAlias) || emojiAlias.length < Math.min(emojiId.length, 3)) {
          emojiDisplay = ":" + emojiAlias + ": " + emojiDisplay;
          emojiId = emojiAlias;
        } else if (emojiAlias.length < 16){
          emojiDisplay = emojiDisplay + " :" + emojiAlias + ":";
        }
      }
      item.style.cssText = 'padding:8px;cursor:pointer;display:flex;align-items:center;gap:8px;';
      item.innerHTML = `<span style="font-size:20px;">${emoji.native}</span><span>${emojiDisplay}</span>`;
      item.onmouseover = () => item.style.background = 'var(--emoji-picker-hover, #3a3a3a)';
      item.onmouseout = () => item.style.background = '';
      item.onclick = () => {
        const text = textarea.value;
        const colonPos = text.lastIndexOf(':', cursorPos - 1);
        const replacement =  ":" + emojiId + ":";
        textarea.value = text.substring(0, colonPos) + replacement + text.substring(cursorPos);
        textarea.setSelectionRange(colonPos + replacement.length, colonPos + replacement.length);
        hideEmojiAutocomplete();
        textarea.focus();
        textarea.dispatchEvent(new Event('input'));
      };
      autocomplete.appendChild(item);
    });

    const rect = textarea.getBoundingClientRect();
    autocomplete.style.left = rect.left + 'px';
    autocomplete.style.top = rect.bottom + 'px';

    document.body.appendChild(autocomplete);
  }

  function hideEmojiAutocomplete() {
    const existing = document.getElementById('emoji-autocomplete');
    if (existing) existing.remove();
  }

  function handleEmojiAutocomplete(textarea) {
    const cursorPos = textarea.selectionStart;
    const text = textarea.value.substring(0, cursorPos);
    const colonPos = text.lastIndexOf(':');

    if (colonPos === -1 || colonPos === 0 || text[colonPos - 1] === ':') {
      hideEmojiAutocomplete();
      return;
    }

    const beforeColon = text[colonPos - 1];
    if (beforeColon !== ' ' && beforeColon !== '\n' && colonPos !== 0) {
      hideEmojiAutocomplete();
      return;
    }

    const query = text.substring(colonPos + 1);
    if (query.includes(' ') || query.includes('\n')) {
      hideEmojiAutocomplete();
      return;
    }

    const emojis = findEmojis(query);
    showEmojiAutocomplete(textarea, emojis, cursorPos);
  }

  function W2054Popup() {
    this.content = [];
    this.isFinished = false;
    this.isForm = false;
    this.needNewline = false;
    this.needNewlineInline = false;
    this.textareasEmojiAutocomplete = [];
  }
  W2054Popup.prototype.assertNotFinished = function () {
    if (this.isFinished) {
      throw new Error("Popup finished! Try to create a new one instead of reusing an old one.");
    }
  }
  W2054Popup.prototype.assertForm = function () {
    if (!this.isForm) {
      throw new Error("Popup is not a form! Use the form() method first to use this method!");
    }
  }
  W2054Popup.prototype.checkNewLine = function () {
    if (this.needNewline || this.needNewlineInline) {
      this.newline();
    }
  }
  W2054Popup.prototype.checkNewLineInline = function () {
    this.needNewlineInline = true;
    if (this.needNewline) {
      this.newline();
    }
  }
  W2054Popup.prototype.eatNewLine = function () {
    this.assertNotFinished();
    this.needNewline = false;
    this.needNewlineInline = false;
  }
  W2054Popup.prototype.form = function (url) {
    this.assertNotFinished();
    this.checkNewLine();
    this.isForm = true;
    this.content.push("<form id='popup-form' action='" + url + "' method='POST' " +
      "onsubmit='W2054Popup.submitPopup();' oncancel='W2054Popup.closePopup();'>");
  }
  W2054Popup.prototype.text = function (text, style = "") {
    this.assertNotFinished();
    this.content.push(`<label style="${style}">${escapeHtml(text)}</label>`);
    this.needNewline = true;
  }
  W2054Popup.prototype.addButton = function(buttonText, onClick, style= "") {
    this.assertNotFinished();
    this.checkNewLineInline();
    this.content.push("<button onclick='" + onClick + "' class='button' style='" + style + "'>" + buttonText + "</button>");
  }
  W2054Popup.prototype.newline = function () {
    this.assertNotFinished();
    this.content.push("<br>\n");
    this.needNewlineInline = false;
    this.needNewline = false;
  }
  W2054Popup.prototype.constant = function (key, value) {
    this.assertForm();
    this.assertNotFinished();
    this.content.push(`<input type="hidden" name="${key}" value="${value}" />`);
  }
  W2054Popup.prototype.checkbox = function (id, text, checked = false, style = "") {
    this.assertForm();
    this.assertNotFinished();
    this.checkNewLineInline();
    this.content.push(`<input type="checkbox" id="${id}" style="${style}" ${checked ? "checked" : ""} />` +
      `<label for="${id}">${text}</label>`);
    this.needNewline = true;
  }
  W2054Popup.prototype.indexSelect = function (id, text, values, selectedIndex = 0, style = "") {
    this.assertForm();
    this.assertNotFinished();
    this.checkNewLineInline();
    this.content.push(`<label for="${id}">${text}</label>`);
    this.content.push(`<select id="${id}" name="${id}" style="${style}">`);
    for (let i = 0; i < values.length; i++) {
      this.content.push(`<option value="${i}" ${i === selectedIndex ? "selected" : ""}>${values[i]}</option>`);
    }
    this.content.push("</select>");
  }
  W2054Popup.prototype.markdown = function (text, style = "") {
    this.assertNotFinished();
    this.checkNewLine();
    if (hasMarked()) {
      text = marked.parse(text);
    } else {
      text = escapeHtml(text);
    }
    this.content.push(`<div class="markdown" style="${style}">${text}</div>`);
  }
  W2054Popup.prototype.markdownInput = function (id,  placeholder="", initialValue = "", style = "",
                                                 previewStyle="", allowEmojis = true) {
    this.assertForm();
    this.assertNotFinished();
    this.checkNewLine();
    if (hasMarked() || allowEmojis) {
      this.content.push(`<textarea id="${id}" name="${id}" placeholder="${placeholder}" class="input markdown-input" style="${style}" ` +
        `oninput="document.getElementById('${id}-preview').innerHTML = W2054Popup.formatLiveMarkdown(this.value);">${escapeHtml(initialValue)}</textarea>`);
      this.content.push(`<div id="${id}-preview" class="markdown markdown-preview" style="${previewStyle}">${W2054Popup.formatLiveMarkdown(initialValue)}</div>`);
    } else {
      this.content.push(`<textarea id="${id}" name="${id}" placeholder="${placeholder}" ` +
        `class="input markdown-input" style="${style}">${escapeHtml(initialValue)}</textarea>`);
    }
    if (allowEmojis) {
      this.textareasEmojiAutocomplete.push(id);
    }
  }
  W2054Popup.prototype.textInput = function (id, placeholder="", initialValue = "", style = "") {
    this.assertForm();
    this.assertNotFinished();
    this.checkNewLine();
    this.content.push(`<textarea id="${id}" name="${id}" placeholder="${placeholder}" class="input" style="${style}">${escapeHtml(initialValue)}</textarea>`);
  }
  W2054Popup.prototype.addFormCopyPasteButtons = function () {
    this.assertForm();
    this.assertNotFinished();
    this.addButton("Copy Form", "event.preventDefault(); W2054Popup.copyFormToClipboard(); return false;");
    this.addButton("Paste Form", "event.preventDefault(); W2054Popup.pasteFormFromClipboard(); return false;");
  }
  W2054Popup.prototype.finish = function () {
    this.assertNotFinished();
    this.checkNewLine();
    if (this.isForm) {
      this.content.push("<input type='submit' value='Submit' class='button' />");
      this.addButton("Cancel", "W2054Popup.closePopup()");
      this.content.push("</form>");
    } else {
      this.addButton("Close", "W2054Popup.closePopup()");
    }
    this.isFinished = true;
  }
  W2054Popup.prototype.open = function () {
    if (!this.isFinished) {
      this.finish();
    }
    popupContent.innerHTML = this.content.join("");
    popupContainer.style.display = "flex";
    if (emojiData) {
      setTimeout(() => {
        for (const textareaId of this.textareasEmojiAutocomplete) {
          const textarea = document.getElementById(textareaId);
          if (textarea) {
            console.log("Attaching emoji autocomplete to textarea:", textareaId);
            textarea.addEventListener('input', function () {
              handleEmojiAutocomplete(this);
            });
            textarea.addEventListener('blur', function () {
              setTimeout(hideEmojiAutocomplete, 200);
            });
            textarea.addEventListener('keydown', function (e) {
              if (e.key === 'Escape') {
                hideEmojiAutocomplete();
              }
            });
          } else {
            console.warn("Textarea with ID", textareaId, "not found, skipping emoji autocomplete setup.");
          }
        }
      }, 0);
    }
  }
  W2054Popup.prototype.close = function () {
    if (!this.isFinished) {
      throw new Error("Popup not finished!");
    }
    window.W2054Popup.closePopup();
  }
  window.W2054Popup = W2054Popup;
  window.W2054Popup.closePopup = function () {
    popupContainer.style.display = "none";
    popupContent.innerHTML = "";
  }
  window.W2054Popup.submitPopup = function () {
    const form = document.getElementById('popup-form');
    if (form != null && emojiData != null) {
      const textareas = form.querySelectorAll('textarea.markdown-input');
      textareas.forEach(textarea => {
        textarea.value = replaceEmojiShortcodes(textarea.value);
      });
      form.submit();
    }
    setTimeout(W2054Popup.closePopup, 1);
  }
  window.W2054Popup.formatLiveMarkdown = function (htmlContent) {
    if (!htmlContent) return "</br>";
    htmlContent = replaceEmojiShortcodes(htmlContent);
    return window.W2054Popup.formatMarkdown(htmlContent);
  }
  window.W2054Popup.formatMarkdown = function (htmlContent) {
    // htmlContent = escapeHtml(htmlContent);
    if (!hasMarked()) {
      return htmlContent;
    }
    htmlContent = marked.parse(htmlContent).replace('\\&', '\\\\&');
    // htmlContent = htmlContent.replace(/&lt;\/br&gt;/g, "<br>");
    htmlContent = htmlContent.replace(
      "<code>", `<span class="markdown-code" style="display: inline-block;"><code>`)
      .replace("</code>", "</code></span>");
    return htmlContent;
  }
  window.W2054Popup.resolveEmojis = function (date) {
    return replaceEmojiShortcodes(date);
  }
  window.W2054Popup.serializeFormToJson = function () {
    const form = document.getElementById('popup-form');
    if (!form) return null;
    const formData = {};
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      if (input.type === 'hidden') {
        if (input.name === 'action-type') {
          formData[input.name] = input.value;
        }
      } else if (input.type === 'checkbox') {
        formData[input.id] = input.checked;
      } else if (input.tagName === 'SELECT') {
        formData[input.id] = input.value;
      } else if (input.tagName === 'TEXTAREA') {
        formData[input.id] = input.value;
      }
    });
    return JSON.stringify(formData, null, 2);
  }
  window.W2054Popup.deserializeJsonToForm = function (jsonString) {
    const form = document.getElementById('popup-form');
    if (!form) return false;
    try {
      const formData = JSON.parse(jsonString);
      const formActionType = form.querySelector('[name="action-type"]');
      if (formActionType && (!formData['action-type'] || formActionType.value !== formData['action-type'])) {
        console.warn('Action type mismatch: form has "' +
          formActionType.value + '", JSON has "' + formData['action-type'] + '"');
        return false;
      }
      for (const key in formData) {
        const element = document.getElementById(key) || form.querySelector(`[name="${key}"]`);
        if (element && element.type !== 'hidden') {
          if (element.type === 'checkbox') {
            element.checked = formData[key];
          } else {
            element.value = formData[key];
            if (element.classList.contains('markdown-input')) {
              element.dispatchEvent(new Event('input'));
            }
          }
        }
      }
      return true;
    } catch (e) {
      console.error('Failed to deserialize form data:', e);
      return false;
    }
  }
  window.W2054Popup.copyFormToClipboard = function () {
    const json = W2054Popup.serializeFormToJson();
    if (json) {
      navigator.clipboard.writeText(json).catch(err => {
        console.error('Failed to copy to clipboard:', err);
        alert('Failed to copy to clipboard. Check console for details.\nFrom data:\n\n' + json);
      });
    }
  }
  window.W2054Popup.pasteFormFromClipboard = function () {
    navigator.clipboard.readText().then(text => {
      if (!W2054Popup.deserializeJsonToForm(text)) {
        alert('Failed to paste form data. Invalid JSON format.');
      }
    }).catch(err => {
      console.error('Failed to read from clipboard:', err);
      let text;
      if (err.message.contains('NotAllowedError')) {
        text = prompt('Clipboard access denied. Please paste the form data manually:');
      } else {
        text = prompt('Failed to read from clipboard. Please paste the form data manually:');
      }
      if (text) {
        if (!W2054Popup.deserializeJsonToForm(text)) {
          alert('Failed to paste form data. Invalid JSON format.');
        }
      }
    });
  }

  fetchEmojiData().then(function() {});
})()
