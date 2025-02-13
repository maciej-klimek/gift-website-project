let spawnClickCount = 0;
let timerClickCount = 0;
let timerInterval = null;
let gamePhase = "spawn";
let timerStartTime = 0;

document.addEventListener("DOMContentLoaded", () => {
  const baseButton = document.querySelector(".spawn-btn");
  const container = document.querySelector(".button-container");

  function spawnButton(event) {
    if (gamePhase !== "spawn" || spawnClickCount >= 20) return;

    const clickedButton = event.target;
    clickedButton.disabled = true; // Each button is clickable only once

    spawnClickCount++;

    const tempButton = document.createElement("button");
    tempButton.className = "spawn-btn";
    tempButton.innerText = "Click?";
    tempButton.dataset.spawned = "true";

    const rect = container.getBoundingClientRect();
    tempButton.style.position = "absolute";
    tempButton.style.left = Math.random() * (rect.width - 50) + "px";
    tempButton.style.top = Math.random() * (rect.height - 30) + "px";

    tempButton.addEventListener("click", spawnButton);
    container.appendChild(tempButton);

    setTimeout(() => {
      if (container.contains(tempButton)) {
        container.removeChild(tempButton);
      }
    }, 1000);

    if (spawnClickCount === 11) {
      gamePhase = "timer";
      baseButton.disabled = false; // Re-enable base button in timer phase
      baseButton.innerText = "Click!";
      startTimer();
    }
  }

  function startTimer() {
    const infoDisplay = document.createElement("div");
    infoDisplay.id = "info-display";
    infoDisplay.style.position = "fixed";
    infoDisplay.style.bottom = "20px";
    infoDisplay.style.left = "50%";
    infoDisplay.style.transform = "translateX(-50%)";
    infoDisplay.style.color = "white";
    infoDisplay.style.fontSize = "20px";
    document.body.appendChild(infoDisplay);

    // Change base button appearance
    baseButton.style.background = "darkred";
    baseButton.style.color = "white";

    updateTimerAndClicks(0);

    timerStartTime = Date.now();
    let resultLogged = false;

    timerInterval = setInterval(() => {
      const elapsed = Date.now() - timerStartTime;
      const secondsElapsed = Math.floor(elapsed / 1000);

      // If the button is clicked 23 times before the 11th second
      if (timerClickCount === 23 && secondsElapsed < 11) {
        baseButton.disabled = true;
        infoDisplay.innerText = "Oh... Too bad";
        setTimeout(() => {
          location.reload(); // Refresh the page
        }, 1000);
        clearInterval(timerInterval);
        return;
      }

      updateTimerAndClicks(elapsed);

      if (!resultLogged && elapsed >= 12000) {
        resultLogged = true;
        if (timerClickCount === 23) {
          console.log("You won! Click count: " + timerClickCount);
          showSecretCards();
        } else {
          console.log("You lost! Click count: " + timerClickCount);
        }
      }
    }, 50);
  }

  function updateTimerAndClicks(elapsed) {
    const sec = Math.floor(elapsed / 1000);
    const ms = elapsed % 1000;
    const infoDisplay = document.getElementById("info-display");
    infoDisplay.innerText = `${sec}.${ms.toString().padStart(3, "0")} | ${timerClickCount}`;
  }

  function handleBaseButtonClick() {
    if (gamePhase === "timer") {
      const elapsed = Date.now() - timerStartTime;
      if (elapsed < 12000) {
        timerClickCount++;
        updateTimerAndClicks(elapsed);
      }
    }
  }

  function showSecretCards() {
    container.style.display = "none";
    const infoDisplay = document.getElementById("info-display");
    if (infoDisplay) {
      infoDisplay.style.display = "none";
    }

    // Trigger the flash effect
    const flashEffect = document.createElement("div");
    flashEffect.className = "flash-effect";
    document.body.appendChild(flashEffect);

    // Remove the flash effect after animation
    setTimeout(() => {
      flashEffect.remove();
    }, 500); // Match duration of the animation

    // Display the secret container
    const secretContainer = document.getElementById("secret-container");
    secretContainer.style.display = "flex";
    secretContainer.style.position = "fixed";
    secretContainer.style.top = "50%";
    secretContainer.style.left = "50%";
    secretContainer.style.transform = "translate(-50%, -50%)";

    const cards = secretContainer.querySelectorAll(".card");
    cards.forEach((card) => {
      card.addEventListener("click", function () {
        if (this.getAttribute("data-revealed") === "true") return;
        fetch("/secret")
          .then((response) => response.json())
          .then((data) => {
            this.innerText = data.code;
            this.setAttribute("data-revealed", "true");
          })
          .catch((error) => console.error("Error fetching secret code:", error));
      });
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "d") {
      console.log("Debug mode activated: Instantly winning");
      showSecretCards();
    }
  });

  baseButton.addEventListener("click", (event) => {
    if (gamePhase === "spawn") {
      spawnButton(event);
    } else if (gamePhase === "timer") {
      handleBaseButtonClick();
    }
  });
});
