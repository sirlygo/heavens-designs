const CART_STORAGE_KEY = "cart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
  } catch (error) {
    console.error("Unable to parse cart from storage", error);
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function updateCartCount() {
  const cartCountEl = document.getElementById("cart-count");
  if (!cartCountEl) return;
  const cart = getCart();
  cartCountEl.textContent = cart.length.toString();
}

function addToCart(name, price) {
  const cart = getCart();
  cart.push({ name, price: Number(price) });
  saveCart(cart);
  updateCartCount();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = `${name} added to cart!`;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

function attachContactFormHandler() {
  const form = document.querySelector(".contact-form form");
  if (!form) return;

  form.addEventListener("submit", event => {
    event.preventDefault();
    alert("Thank you! We'll be in touch soon.");
    form.reset();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  attachContactFormHandler();
});

window.addToCart = addToCart;
window.updateCartCount = updateCartCount;
