import("../pb.js");

let main = document.querySelector("main");
let cardTemplate = document.querySelector("template#card");

function createCard() {
  let content = cardTemplate.content.cloneNode(true);
  let component = content.querySelector("[component]");

  component.addEventListener("click", function (e) {
    let target = e.target;
    target.getAttributeNames().forEach((attrName) => {
      switch (attrName) {
        case "inc-counter": {
          let targetCounter = target.getAttribute("inc-counter");
          if (!targetCounter) {
            return;
          }
          let counter = this.querySelector(`[counter="${targetCounter}"]`);
          counter.innerText = Number(counter.innerText) + 1;
          return;
        }
        case "reset-counter": {
          let targetCounter = target.getAttribute("inc-counter");
          let counter;
          if (!targetCounter) {
            counter = target;
          } else {
            counter = this.querySelector(`[counter="${targetCounter}"]`);
          }
          counter.innerText = 0;
          return;
        }
      }
    });
  });

  return content;
}

main.appendChild(createCard());
main.appendChild(createCard());
