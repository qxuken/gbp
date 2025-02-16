import { pb } from "../pb.js";

let loginForm = document.getElementById("signup");
if (loginForm) {
  loginForm.addEventListener(
    "submit",
    (submitEvent) => {
      submitEvent.preventDefault();
      let formData = new FormData(submitEvent.target);
      let data = {
        email: formData.get("email"),
        password: formData.get("password"),
        passwordConfirm: formData.get("passwordConfirm"),
        emailVisibility: true,
      };
      pb.collection("users")
        .create(data)
        .then(() => pb.collection("users").requestVerification(data.email))
        .then(() => {
          location.href = "/confirm-email";
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
