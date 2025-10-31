const bg = document.querySelector('.background-image');
const windowWidth = window.innerWidth / 5;
const windowHeight = window.innerHeight / 5;
let mouseTimeout;

bg.addEventListener('mousemove', (e) => {
  // Clear the timeout to reset the mouse inactivity delay
  clearTimeout(mouseTimeout);

  const mouseX = e.clientX / windowWidth;
  const mouseY = e.clientY / windowHeight;

  // Apply the new transform
  bg.style.transform = `translate3d(-${mouseX}%, -${mouseY}%, 0)`;
  
  // Set a timeout to apply the transition effect after mouse stops moving
  mouseTimeout = setTimeout(() => {
    // Apply the transition effect while keeping the current transform
    bg.style.transition = 'transform 0.15s ease-in-out';
  }, 300); // A short delay to ensure the transition is applied smoothly
});

bg.addEventListener('mouseleave', () => {
  // Apply the transition effect when mouse leaves the background area
  bg.style.transition = 'transform 0.50s ease-in-out';
});