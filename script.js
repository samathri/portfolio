document.addEventListener("DOMContentLoaded", () => {
    const mainContent = document.getElementById("mainContent");
  
    // Show main content after 2s + animation time (drop + swing)
    setTimeout(() => {
      mainContent.style.display = "block";
    }, 4000);
  
    // Hamburger toggle
    const hamburger = document.getElementById("hamburger");
    const slideNav = document.getElementById("slideNav");
  
    hamburger.addEventListener("click", () => {
      slideNav.classList.toggle("active");
    });
  
    // Close slide-nav on link click
    document.querySelectorAll(".slide-nav a").forEach(link => {
      link.addEventListener("click", () => {
        slideNav.classList.remove("active");
      });
    });
  });
  

  const closeBtn = document.getElementById("closeBtn");

  closeBtn.addEventListener("click", () => {
    slideNav.classList.remove("active");
  });


  // on scroll
  let lastScrollTop = 0;
  const navbar = document.querySelector(".custom-nav");

  window.addEventListener("scroll", function () {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > lastScrollTop) {
      // Scrolling Down
      navbar.style.top = "-100px"; // hide navbar
    } else {
      // Scrolling Up
      navbar.style.top = "0"; // show navbar
      navbar.classList.add("scrolled");
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // avoid negative values
  });



  



// about me icons
const robot = document.querySelector(".robot-image");
const container = document.querySelector(".image-container");

container.addEventListener("mousemove", (e) => {
  const x = (e.offsetX / container.offsetWidth - 0.5) * 30;
  const y = (e.offsetY / container.offsetHeight - 0.5) * -30;
  robot.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
});

container.addEventListener("mouseleave", () => {
  robot.style.transform = `rotateY(0deg) rotateX(0deg)`;
});







// contact 

document.querySelector(".contact-form").addEventListener("submit", function (e) {
    e.preventDefault();
    alert("Thanks for reaching out! I’ll get back to you soon. 😊");
    this.reset(); // Clears the form
  });
  