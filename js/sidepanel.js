
  (function () {
    const collapse = document.querySelector('.navbar-collapse');
    const toggler = document.querySelector('.navbar-toggle') || document.querySelector('.navbar-toggler');

    // when bootstrap opens/closes it toggles class "in" (BS3) or "show" (BS4/5).
    // we use a MutationObserver to watch for that change and toggle body class.
    if (collapse) {
      const obs = new MutationObserver(() => {
        const isOpen = collapse.classList.contains('in') || collapse.classList.contains('show');
        document.body.classList.toggle('menu-open', !!isOpen);
      });
      obs.observe(collapse, { attributes: true, attributeFilter: ['class'] });
    }

    // auto-close when clicking any nav link (mobile)
    document.querySelectorAll('.navbar-default .navbar-nav a').forEach(a => {
      a.addEventListener('click', () => {
        // For BS3 remove 'in' class
        if (collapse.classList.contains('in')) collapse.classList.remove('in');
        // For BS4/5 remove 'show' and call collapse('hide') if using jQuery/Bootstrap JS
        if (collapse.classList.contains('show')) collapse.classList.remove('show');
        document.body.classList.remove('menu-open');
      });
    });
  })();

