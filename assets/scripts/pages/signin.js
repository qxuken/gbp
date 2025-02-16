import { pb } from "../pb.js";

let loginForm = document.getElementById("signin");
if (loginForm) {
  loginForm.addEventListener(
    "submit",
    (submitEvent) => {
      submitEvent.preventDefault();
      let formData = new FormData(submitEvent.target);
      pb.collection("users")
        .authWithPassword(formData.get("email"), formData.get("password"))
        .then((res) => {
          console.log("success", res);
          location.href = "/";
        })
        .catch((err) => {
          submitEvent.target.querySelector(".form-error").innerHTML =
            `<div class="error">${err.message}</div>`;
          console.log("error", err);
        });
    },
    false,
  );
}
