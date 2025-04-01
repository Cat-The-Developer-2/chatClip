document.addEventListener("DOMContentLoaded", function () {
  // Mobile menu toggle
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  // Ensure Lucide is loaded
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  } else {
    console.error(
      "Lucide is not defined. Make sure the script is properly loaded."
    );
    return; // Stop execution if Lucide is missing
  }

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", function () {
      navLinks.classList.toggle("active");

      // Change icon based on menu state
      const icon = menuToggle.querySelector("[data-lucide]");
      if (navLinks.classList.contains("active")) {
        icon.setAttribute("data-lucide", "x");
      } else {
        icon.setAttribute("data-lucide", "menu");
      }

      // Re-initialize icons
      lucide.createIcons();
    });
  }

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();

      // Close mobile menu if open
      if (navLinks.classList.contains("active")) {
        navLinks.classList.remove("active");
        const icon = menuToggle.querySelector("[data-lucide]");
        icon.setAttribute("data-lucide", "menu");
        lucide.createIcons();
      }

      const targetId = this.getAttribute("href");
      if (targetId === "#") return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80, // Offset for header
          behavior: "smooth",
        });
      }
    });
  });

  // Add active class to nav links based on scroll position
  const sections = document.querySelectorAll("section[id]");

  function highlightNavLink() {
    const scrollPosition = window.scrollY + 100;

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute("id");

      if (
        scrollPosition >= sectionTop &&
        scrollPosition < sectionTop + sectionHeight
      ) {
        document
          .querySelector(`.nav-links a[href="#${sectionId}"]`)
          ?.classList.add("active");
      } else {
        document
          .querySelector(`.nav-links a[href="#${sectionId}"]`)
          ?.classList.remove("active");
      }
    });
  }

  window.addEventListener("scroll", highlightNavLink);

  // Add CSS for active nav links and mobile menu
  const style = document.createElement("style");
  style.textContent = `
        .nav-links a.active {
            color: var(--primary-color);
            font-weight: 600;
        }
        
        @media (max-width: 768px) {
            .nav-links.active {
                display: flex;
                flex-direction: column;
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background-color: var(--white);
                padding: 1.5rem;
                box-shadow: var(--shadow-md);
                z-index: 100;
            }
        }
    `;
  document.head.appendChild(style);
});
