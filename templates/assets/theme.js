(() => {
  'use strict';
  const root = document.documentElement;
  const highlighterURL = new URL('highlight.min.js', document.currentScript.src);
  highlighterURL.search = document.currentScript.src.split('?')[1] || '';
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  let toastTimer;
  const toast = message => { const el = $('.toast'); if (!el) return; el.textContent = message; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 2800); };
  let mode = 'light';
  try { mode = localStorage.getItem('s4a-theme') || 'light'; } catch (_) {}
  const setMode = value => {root.dataset.colorScheme = value; $('[data-theme-toggle]')?.setAttribute('aria-label', value === 'dark' ? '切换浅色模式' : '切换深色模式');};
  setMode(mode);
  $('[data-theme-toggle]')?.addEventListener('click', () => {mode = root.dataset.colorScheme === 'dark' ? 'light' : 'dark'; setMode(mode); try { localStorage.setItem('s4a-theme', mode); } catch (_) {} });
  const menu = $('#mobile-nav');
  $('[data-menu-toggle]')?.addEventListener('click', event => {menu.hidden = !menu.hidden; event.currentTarget.setAttribute('aria-expanded', String(!menu.hidden));});
  document.addEventListener('keydown', event => {if(event.key === 'Escape' && menu && !menu.hidden){menu.hidden=true; $('[data-menu-toggle]').setAttribute('aria-expanded','false');$('[data-menu-toggle]').focus();} if((event.metaKey || event.ctrlKey) && event.key.toLowerCase()==='k' && $('[data-search]')){event.preventDefault();openSearch();}});
  function openSearch(){ if (window.SearchWidget?.open) window.SearchWidget.open(); else toast('搜索组件正在加载，请稍后重试'); }
  $('[data-search]')?.addEventListener('click', openSearch);
  $$('.desktop-nav a').forEach(link => { try {const url = new URL(link.href);if(url.origin===location.origin && url.pathname === location.pathname)link.setAttribute('aria-current','page');} catch(_){} });
  async function copy(text, button, label) {try {await navigator.clipboard.writeText(text); toast(label); if(button){ const previous=button.textContent;button.textContent='已复制';setTimeout(()=>button.textContent=previous,2000);}} catch(_){toast('浏览器未允许复制，请手动选择内容复制');} }
  $('[data-copy-link]')?.addEventListener('click', event => copy(location.href.split('#')[0], event.currentTarget, '文章链接已复制'));
  let syncReadingSidebar = () => {};
  const content = $('#article-content');
  if(content){
    $$('.prose table').forEach(table=>{const wrap=document.createElement('div');wrap.className='table-scroll';wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label','可横向滚动的数据表格');table.before(wrap);wrap.append(table);});
    const plainBlocks = [];
    $$('pre', content).forEach(pre => {
      // Shiki owns its toolbar and copy action, including asynchronous upgrades.
      // Do not wrap its source pre or move it out of the custom element.
      if (pre.closest('.code-shell')) return;
      if (pre.closest('shiki-code') && document.body.dataset.shikiEnabled === 'true') return;
      let code = $('code', pre);
      if (!code) {code = document.createElement('code');code.textContent = pre.textContent;pre.replaceChildren(code);}
      const text = code.textContent;
      const classes = [...code.classList, ...pre.classList];
      const languageClass = classes.find(name => /^(language|lang)-/.test(name));
      const language = languageClass?.replace(/^(language|lang)-/, '') ||
        (classes.includes('sourceCode') ? classes.find(name => name !== 'sourceCode') : '') ||
        code.dataset.language || pre.dataset.language || '';
      const noHighlight = classes.some(name => /^(no-highlight|nohighlight)$/.test(name)) || /^(text|txt|plaintext|plain)$/i.test(language);
      const shell = document.createElement('div');
      shell.className = 'code-shell';
      const toolbar = document.createElement('div');
      toolbar.className = 'code-actions';
      const label = document.createElement('span');
      label.textContent = language ? language.toUpperCase() : 'CODE';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'copy-code';
      button.textContent = '复制代码';
      button.addEventListener('click', () => copy(text, button, '代码已复制'));
      toolbar.append(label, button);
      pre.before(shell);
      shell.append(toolbar, pre);
      if (!pre.hasAttribute('tabindex')) pre.tabIndex = 0;
      if (!pre.hasAttribute('aria-label')) pre.setAttribute('aria-label', '代码，可横向滚动');
      plainBlocks.push({code, text, language, label, noHighlight});
    });
    if (plainBlocks.some(block => !block.noHighlight)) {
      const script = document.createElement('script');
      script.src = highlighterURL.href;
      script.onload = () => {
        const highlighter = window.s4aHighlight;
        if (!highlighter) return;
        for (const {code, text, language, label, noHighlight} of plainBlocks) {
          if (noHighlight || text.length > 100000) continue;
          try {
            let result;
            if (language) {
              if (!highlighter.getLanguage(language)) continue;
              result = highlighter.highlight(text, {language, ignoreIllegals: true});
            } else if (/\bpublic\s+(?:static\s+)?(?:class|interface|enum|void)\b|\bSystem\.out\.(?:print|println)\s*\(/.test(text)) {
              result = highlighter.highlight(text, {language: 'java', ignoreIllegals: true});
            } else {
              result = highlighter.highlightAuto(text, ['java', 'xml', 'groovy', 'yaml', 'properties', 'bash', 'json', 'javascript', 'typescript', 'sql', 'python', 'kotlin'].filter(name => highlighter.getLanguage(name)));
              if (!result.language || result.relevance < 5) continue;
            }
            // Only insert escaped markup produced by the bundled highlighter.
            code.innerHTML = result.value;
            code.classList.add('hljs');
            code.dataset.highlighted = 'true';
            label.textContent = (language || result.language).toUpperCase();
          } catch (_) { /* Keep the original readable code if highlighting fails. */ }
        }
      };
      document.head.append(script);
    }
    const rt=$('[data-read-time]');if(rt)rt.textContent=`约 ${Math.max(1,Math.ceil(content.textContent.length/450))} 分钟阅读`;
    const headings=$$('h2,h3',content), toc=$('[data-toc]');
    if(toc){headings.forEach((heading,index)=>{if(!heading.id){let id=`section-${index+1}`;while(document.getElementById(id))id+='-s';heading.id=id;}const li=document.createElement('li');if(heading.tagName==='H3')li.className='sub';const link=document.createElement('a');link.href='#'+encodeURIComponent(heading.id);link.textContent=heading.textContent;li.append(link);toc.append(li);});const aside=$('.reading-aside'),panel=$('.toc-panel'),ad=$('[data-sidebar-ad]',aside || document);syncReadingSidebar=()=>{const hasAd=ad && !ad.hidden && getComputedStyle(ad).display!=='none';if(panel)panel.hidden=!headings.length;if(aside){aside.hidden=!headings.length && !hasAd;aside.classList.toggle('reading-aside-with-ad',Boolean(hasAd));}$('.reading-layout')?.classList.toggle('reading-layout-without-toc',!headings.length && !hasAd);};syncReadingSidebar();matchMedia('(max-width: 820px)').addEventListener('change',syncReadingSidebar);if(headings.length){const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){$$('a',toc).forEach(a=>a.classList.toggle('active',decodeURIComponent(a.hash.slice(1))===entry.target.id));}}},{rootMargin:'-5% 0px -65% 0px'});headings.forEach(h=>observer.observe(h));}}
  }
  const sidebarAd = $('[data-sidebar-ad]');
  const adUnit = sidebarAd && $('[data-theme-ad]', sidebarAd);
  if (adUnit) {
    const collapseAd = () => {sidebarAd.hidden = true; syncReadingSidebar();};
    const statusObserver = new MutationObserver(() => {
      if (adUnit.dataset.adStatus === 'unfilled') {collapseAd(); statusObserver.disconnect();}
    });
    statusObserver.observe(adUnit, {attributes: true, attributeFilter: ['data-ad-status']});
    const visibilityObserver = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting) || sidebarAd.getBoundingClientRect().width === 0) return;
      visibilityObserver.disconnect();
      if (adUnit.dataset.adsbygoogleStatus || adUnit.dataset.themeAdInitialized) return;
      adUnit.dataset.themeAdInitialized = 'true';
      let script = [...document.scripts].find(el => {
        try {const url = new URL(el.src);return url.hostname === 'pagead2.googlesyndication.com' && url.pathname === '/pagead/js/adsbygoogle.js';} catch (_) {return false;}
      });
      if (!script) {
        script = document.createElement('script');
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(adUnit.dataset.adClient);
        script.addEventListener('error', collapseAd, {once: true});
        document.head.append(script);
      } else {
        script.addEventListener('error', collapseAd, {once: true});
      }
      try {(window.adsbygoogle = window.adsbygoogle || []).push({});} catch (_) {collapseAd();}
    }, {rootMargin: '200px 0px'});
    visibilityObserver.observe(sidebarAd);
  }
  $('[data-tag-filter]')?.addEventListener('input', event=>{const value=event.target.value.trim().toLocaleLowerCase();let visible=0;$$('[data-tag-item]').forEach(item=>{item.hidden=!$('strong',item).textContent.toLocaleLowerCase().includes(value);if(!item.hidden)visible++;});$('[data-tag-empty]').hidden=visible>0;});
  const top=$('[data-back-top]'), progress=$('.reading-progress');
  function onScroll(){if(top)top.hidden=window.scrollY<500;if(progress && content){const start=content.getBoundingClientRect().top+window.scrollY;const distance=Math.max(1,content.offsetHeight-innerHeight);const ratio=Math.max(0,Math.min(1,(window.scrollY-start)/distance));progress.style.width=ratio*100+'%';}}
  let ticking=false;window.addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(()=>{onScroll();ticking=false;});ticking=true;}},{passive:true});window.addEventListener('resize',onScroll);top?.addEventListener('click',()=>{window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});onScroll();
})();
