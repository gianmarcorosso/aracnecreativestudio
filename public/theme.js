(function () {
    const saved = localStorage.getItem('theme');
    const isDark = saved !== null
        ? saved === 'dark'
        : window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Only expose the theme as CSS variables. The shop pages (clothing, product)
    // are styled light-only for now, so body colors are not forced here.
    document.documentElement.style.setProperty('--bg', isDark ? '#000000' : '#ffffff');
    document.documentElement.style.setProperty('--fg', isDark ? '#ffffff' : '#000000');
})();
