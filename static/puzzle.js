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
    clickedButton.disabled = true;

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
      baseButton.disabled = false;
      baseButton.innerText = "Click!";
      startTimer();
    }
  }

  function startTimer() {
    const infoDisplay = document.createElement("div");
    infoDisplay.id = "info-display";
    infoDisplay.style.position = "fixed";
    infoDisplay.style.bottom = "100px";
    infoDisplay.style.left = "50%";
    infoDisplay.style.transform = "translateX(-50%)";
    infoDisplay.style.color = "white";
    infoDisplay.style.fontSize = "20px";
    document.body.appendChild(infoDisplay);

    baseButton.style.background = "darkred";
    baseButton.style.color = "white";

    updateTimerAndClicks(0);

    timerStartTime = Date.now();
    let resultLogged = false;

    timerInterval = setInterval(() => {
      const elapsed = Date.now() - timerStartTime;
      const secondsElapsed = Math.floor(elapsed / 1000);

      if (timerClickCount === 23 && secondsElapsed < 10) {
        baseButton.disabled = true;
        infoDisplay.innerText = "Oh... Too bad";
        setTimeout(() => {
          location.reload();
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

    const flashEffect = document.createElement("div");
    flashEffect.className = "flash-effect";
    document.body.appendChild(flashEffect);
    setTimeout(() => flashEffect.remove(), 1000);

    const secretContainer = document.getElementById("secret-container");
    secretContainer.style.display = "flex";
    secretContainer.style.position = "fixed";
    secretContainer.style.top = "40%";
    secretContainer.style.left = "50%";
    secretContainer.style.transform = "translate(-50%, -50%)";

    const cards = secretContainer.querySelectorAll(".card");

    let codeContainer = document.getElementById("steam-code-container");
    if (!codeContainer) {
      codeContainer = document.createElement("div");
      codeContainer.id = "steam-code-container";
      codeContainer.className = "hidden";
      codeContainer.innerHTML = `
    <p class="code-label">Your Steam Code:</p>
    <p class="steam-code"></p>
    <p class="erian-martin">From Erian and Martin with love, please enjoy ❤️</p>
    <button id="reveal-all-btn">Not happy with your choice?</button>
  `;
      secretContainer.appendChild(codeContainer);
    }

    document.getElementById("reveal-all-btn").addEventListener("click", function () {
      fetch("/allcodes")
        .then((response) => response.json())
        .then((data) => {
          const modal = document.createElement("div");
          modal.className = "modal";
          modal.innerHTML = `
        <div class="modal-content">
          <span class="modal-close">&times;</span>
          <p>Don't worry, u get them all anyway ;)</p>
          <p class="steam-code-modal">${data.obra}</p>
          <p class="steam-code-modal">${data.disco}</p>
          <p class="steam-code-modal">${data.baba}</p>
        </div>
      `;
          document.body.appendChild(modal);
          modal.querySelector(".modal-close").addEventListener("click", function () {
            modal.remove();
          });
        })
        .catch((error) => console.error("Error fetching all codes:", error));
    });

    let cardChosen = false;
    cards.forEach((card) => {
      card.addEventListener("click", function cardClickHandler() {
        if (cardChosen) return;
        cardChosen = true;

        const flashEffect = document.createElement("div");
        flashEffect.className = "flash-effect";
        document.body.appendChild(flashEffect);
        setTimeout(() => flashEffect.remove(), 1000);

        const header = secretContainer.querySelector("h2");
        if (header) {
          header.textContent = "Liked this game? Here's a much better one ;)";
        }

        this.classList.add("winner");
        this.setAttribute("data-revealed", "true");
        const winnerContent = this.querySelector(".card-content");
        if (winnerContent) {
          winnerContent.textContent = " ";
        }

        fetch("/secret")
          .then((response) => response.json())
          .then((data) => {
            document.querySelector(".steam-code").textContent = data.code;
            codeContainer.classList.remove("hidden");
          })
          .catch((error) => console.error("Error fetching secret code:", error));

        const nonWinningCards = [];
        cards.forEach((otherCard) => {
          if (otherCard !== this) {
            nonWinningCards.push(otherCard);
          }
        });
        if (nonWinningCards[0]) {
          nonWinningCards[0].classList.add("not-winner-disco");
          nonWinningCards[0].setAttribute("data-revealed", "true");
          const loserContent = nonWinningCards[0].querySelector(".card-content");
          if (loserContent) {
            loserContent.textContent = "X";
          }
        }
        if (nonWinningCards[1]) {
          nonWinningCards[1].classList.add("not-winner-baba");
          nonWinningCards[1].setAttribute("data-revealed", "true");
          const loserContent = nonWinningCards[1].querySelector(".card-content");
          if (loserContent) {
            loserContent.textContent = "X";
          }
        }

        cards.forEach((card) => {
          card.style.pointerEvents = "none";
        });
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
