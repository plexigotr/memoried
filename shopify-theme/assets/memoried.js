document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#MemoriedMenu');
  if (menuButton && menu) {
    menuButton.addEventListener('click', () => {
      const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!isOpen));
      menu.classList.toggle('is-open', !isOpen);
    });
    menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
      menuButton.setAttribute('aria-expanded', 'false');
      menu.classList.remove('is-open');
    }));
  }

  document.querySelectorAll('[data-variant-selector]').forEach((select) => {
    const form = select.closest('form');
    const price = form && form.querySelector('[data-product-price]');
    if (!price) return;
    select.addEventListener('change', () => {
      const option = select.options[select.selectedIndex];
      price.textContent = option.dataset.price || '';
    });
  });

  document.querySelectorAll('[data-variant-option]').forEach((option) => {
    option.addEventListener('change', () => {
      const form = option.closest('form');
      if (!form) return;
      form.querySelectorAll('.memoried-package-option').forEach((card) => {
        card.classList.toggle('is-selected', card.contains(option));
      });
      const price = form.querySelector('[data-product-price]');
      if (price) price.textContent = option.dataset.price || '';
    });
  });
});
