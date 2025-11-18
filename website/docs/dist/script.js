// SOTA Template Suite Documentation Script

// Smooth scrolling for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Active navigation highlighting
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

function updateActiveNav() {
  const scrollY = window.pageYOffset;

  sections.forEach(section => {
    const sectionHeight = section.offsetHeight;
    const sectionTop = section.offsetTop - 100;
    const sectionId = section.getAttribute('id');

    if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
          link.classList.add('active');
        }
      });
    }
  });
}

window.addEventListener('scroll', updateActiveNav);
updateActiveNav();

// Add animation to cards on scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Observe all cards
document.querySelectorAll('.feature-card, .module-card, .example-card').forEach(card => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(20px)';
  card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(card);
});

// Performance metrics animation
function animateValue(element, start, end, duration) {
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const current = Math.floor(start + (end - start) * progress);
    element.textContent = current + '%';

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

// Animate metrics when in view
const metricsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const value = entry.target;
      const text = value.textContent;
      const match = text.match(/\d+/);

      if (match) {
        const endValue = parseInt(match[0]);
        value.textContent = '0%';
        animateValue(value, 0, endValue, 1500);
      }

      metricsObserver.unobserve(value);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.metric-value').forEach(metric => {
  metricsObserver.observe(metric);
});

// Copy code functionality
document.querySelectorAll('pre code').forEach(block => {
  const button = document.createElement('button');
  button.className = 'copy-button';
  button.textContent = 'Copy';
  button.style.cssText = `
    position: absolute;
    top: var(--spacing-sm);
    right: var(--spacing-sm);
    background: var(--color-tertiary);
    border: 1px solid var(--color-border);
    color: var(--color-text);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--border-radius);
    font-size: 0.75rem;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s ease;
  `;

  const pre = block.parentElement;
  pre.style.position = 'relative';
  pre.appendChild(button);

  pre.addEventListener('mouseenter', () => {
    button.style.opacity = '1';
  });

  pre.addEventListener('mouseleave', () => {
    button.style.opacity = '0';
  });

  button.addEventListener('click', () => {
    navigator.clipboard.writeText(block.textContent).then(() => {
      button.textContent = 'Copied!';
      setTimeout(() => {
        button.textContent = 'Copy';
      }, 2000);
    });
  });
});

// Add active nav style
const style = document.createElement('style');
style.textContent = `
  .nav-link.active {
    color: var(--color-accent);
  }

  .copy-button:hover {
    opacity: 1 !important;
    background: var(--color-primary);
  }
`;
document.head.appendChild(style);