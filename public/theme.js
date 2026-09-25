(function () {
    const saved = localStorage.getItem('theme');
    const isDark = saved !== null
        ? saved === 'dark'
        : window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (isDark) {
        document.documentElement.style.setProperty('--bg', '#000000');
        document.documentElement.style.setProperty('--fg', '#ffffff');
        document.body.style.background = '#000000';
        document.body.style.color = '#ffffff';
    } else {
        document.documentElement.style.setProperty('--bg', '#ffffff');
        document.documentElement.style.setProperty('--fg', '#000000');
        document.body.style.background = '#ffffff';
        document.body.style.color = '#000000';
    }
})();
