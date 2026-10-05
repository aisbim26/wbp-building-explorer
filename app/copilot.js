// Local interface preview. It never calls an AI service or persists messages.
export function initCopilotPreview({getContext, onOpen}) {
  const $ = id => document.getElementById(id);
  const panel = $('copilot-panel');
  const launcher = $('copilot-launcher');
  const input = $('copilot-input');
  const log = $('copilot-messages');
  const prompts = {
    step: 'Explain this step',
    compare: 'Compare the two options',
    help: 'What can you help with?'
  };

  function updateContext() {
    const context = getContext();
    $('copilot-context').textContent = context ? `${context.title} · ${context.progress}%` : 'Preparing your project…';
  }

  function setOpen(open) {
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    launcher.setAttribute('aria-label', open ? 'Close AI Copilot preview' : 'Open AI Copilot preview');
    if (open) {
      onOpen();
      updateContext();
      // Focus the close control, avoiding an unsolicited mobile keyboard.
      $('copilot-close').focus({preventScroll:true});
    } else launcher.focus({preventScroll:true});
  }

  function appendMessage(role, paragraphs, source) {
    const article = document.createElement('article');
    article.className = `chat-message ${role}`;
    const author = document.createElement('span');
    author.className = 'chat-author';
    author.textContent = role === 'user' ? 'YOU' : 'COPILOT · PREVIEW';
    article.append(author);
    for (const text of paragraphs) {
      const p = document.createElement('p');
      p.textContent = text;
      article.append(p);
    }
    if (source) {
      const note = document.createElement('span');
      note.className = 'chat-source';
      note.textContent = `Viewer data · ${source}`;
      article.append(note);
    }
    log.append(article);
    log.scrollTop = log.scrollHeight;
  }

  function send(text, kind) {
    if (!text.trim()) return;
    const context = getContext();
    appendMessage('user', [text.trim()]);
    let answer;
    if (kind === 'step' && context) {
      answer = context.views.map(v => `${v.title} · Step ${v.step} of ${v.total}\n${v.caption.title}\n${v.caption.description}`);
    } else if (kind === 'compare') {
      answer = [
        'Option 1 — Demolition and Construction sequences with Re-use existing piles and additional piles.',
        'Option 2 — Demolition and construction sequences with Cellular Raft Foundation.',
        'Open New foundations to compare the two models with linked views. Each option follows its own sequence; the shared progress does not represent matching construction time.'
      ];
    } else if (kind === 'help') {
      answer = ['This preview can show the current step and the two foundation option descriptions.', 'The future Copilot can be designed around model questions and navigation. Those AI features are not connected in this preview.'];
    } else {
      answer = ['Your message is shown here so you can preview the conversation layout. An AI answer is not generated yet.', 'Try “Explain this step” to see a reply using the current model information.'];
    }
    appendMessage('assistant', answer, kind === 'step' && context ? context.title : null);
    input.value = '';
    $('copilot-send').disabled = true;
  }

  launcher.addEventListener('click', () => setOpen(panel.hidden));
  $('copilot-close').addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !panel.hidden && !document.querySelector('dialog[open]')) {
      e.preventDefault();
      setOpen(false);
    }
  });
  document.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click', () => send(prompts[button.dataset.prompt], button.dataset.prompt)));
  input.addEventListener('input', () => { $('copilot-send').disabled = !input.value.trim(); });
  $('copilot-form').addEventListener('submit', e => {
    e.preventDefault();
    const text = input.value.trim();
    const kind = Object.keys(prompts).find(key => prompts[key].toLowerCase() === text.toLowerCase());
    send(text, kind);
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      $('copilot-form').requestSubmit();
    }
  });
  window.addEventListener('wbp:statechange', () => { if (!panel.hidden) updateContext(); });
}
