import PocketBase from "pocketbase";

export let pb = new PocketBase();
window.pb = pb;

try {
  let authData = await pb.collection("users").authRefresh();

  if (
    authData.isValid &&
    (location.pathname == "/signin" || location.pathname == "/signup")
  ) {
    location.href = "/";
  } else {
    renderLoginInfo(authData);
  }
} catch (e) {
  if (location.pathname != "/signin" && location.pathname != "/signup") {
    location.href = "/signin";
  }
}

function renderLoginInfo(authData) {
  let loginInfoContainer = document.getElementById("login-info-container");
  let loginInfoTemplate = document.getElementById("login-info-template");
  if (!loginInfoContainer || !loginInfoTemplate) {
    return;
  }
  let content = loginInfoTemplate.content.cloneNode(true);
  let logout = content.querySelector("[data-action-logout]");
  if (logout) {
    logout.addEventListener("click", () => {
      pb.authStore.clear();
      location.href = "/signin";
    });
  }
  let userInfoContainer = content.querySelector("[data-user-email]");
  if (userInfoContainer) {
    userInfoContainer.innerText = authData?.record?.email;
  }
  loginInfoContainer.appendChild(content);
}
