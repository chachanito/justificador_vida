(() => {
    'use strict';
    const key = 'justificador-vida-theme';
    let saved;
    try { saved = localStorage.getItem(key); } catch { }
    const initial = ['light','dark'].includes(saved) ? saved : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    function apply(theme) {
        document.documentElement.dataset.theme = theme;
        document.documentElement.classList.toggle('theme-dark', theme === 'dark');
        document.documentElement.style.colorScheme = theme;
    }
    apply(initial);
    document.addEventListener('DOMContentLoaded', () => {
        const select = document.getElementById('theme-select');
        select.value = document.documentElement.dataset.theme;
        select.addEventListener('change', () => {
            apply(select.value);
            try { localStorage.setItem(key, select.value); } catch { }
        });
    });
})();
