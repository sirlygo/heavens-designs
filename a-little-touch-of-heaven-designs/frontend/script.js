const CART_STORAGE_KEY = "cart";

function normalizeCartItem(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const price = Number(item.price);
  const quantity = Number.isFinite(item.quantity) && item.quantity > 0 ? Math.floor(item.quantity) : 1;

  return {
    name: typeof item.name === "string" && item.name.trim() ? item.name : "Item",
    price: Number.isFinite(price) ? price : 0,
    quantity
  };
}

function normalizeCart(cart) {
  if (!Array.isArray(cart)) {
    return [];
  }

  const aggregated = new Map();

  cart.forEach(item => {
    const normalized = normalizeCartItem(item);
    if (!normalized) return;

    const key = `${normalized.name}::${normalized.price}`;
    if (aggregated.has(key)) {
      const existing = aggregated.get(key);
      existing.quantity += normalized.quantity;
    } else {
      aggregated.set(key, { ...normalized });
    }
  });

  return Array.from(aggregated.values());
}

function getCart() {
  try {
    const storedCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY));
    return normalizeCart(storedCart);
  } catch (error) {
    console.error("Unable to parse cart from storage", error);
    return [];
  }
}

function saveCart(cart) {
  const normalizedCart = normalizeCart(cart);
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalizedCart));
  return normalizedCart;
}

function getCartItemCount(cart = getCart()) {
  return cart.reduce((count, item) => count + item.quantity, 0);
}

function getCartTotal(cart = getCart()) {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

function formatCurrency(value) {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

function updateCartCount() {
  const cartCountEl = document.getElementById("cart-count");
  if (!cartCountEl) return;
  const cart = getCart();
  cartCountEl.textContent = getCartItemCount(cart).toString();
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

function addToCart(name, price) {
  const cart = getCart();
  const numericPrice = Number(price);
  const existingItem = cart.find(item => item.name === name && item.price === numericPrice);

  if (existingItem) {
    existingItem.quantity += 1;
    showToast(`Added another ${name} to your cart.`);
  } else {
    cart.push({ name, price: numericPrice, quantity: 1 });
    showToast(`${name} added to cart!`);
  }

  saveCart(cart);
  updateCartCount();
}

function clearCart() {
  saveCart([]);
  updateCartCount();
}

function removeFromCart(index) {
  const cart = getCart();
  if (index < 0 || index >= cart.length) return;
  cart.splice(index, 1);
  saveCart(cart);
  updateCartCount();
}

function setItemQuantity(index, quantity) {
  const cart = getCart();
  if (index < 0 || index >= cart.length) return;

  const sanitizedQuantity = Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;
  cart[index].quantity = sanitizedQuantity;
  saveCart(cart);
  updateCartCount();
}

let stripeInstance;

function getStripeInstance() {
  if (!stripeInstance && typeof Stripe === "function") {
    stripeInstance = Stripe("YOUR_STRIPE_PUBLISHABLE_KEY");
  }
  return stripeInstance;
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

function initializeCartPage() {
  const cartItemsContainer = document.getElementById("cart-items");
  const cartTotalEl = document.getElementById("cart-total");
  if (!cartItemsContainer || !cartTotalEl) return;

  const clearCartBtn = document.getElementById("clear-cart");
  const stripeButton = document.getElementById("stripe-checkout");
  const paypalContainer = document.getElementById("paypal-button-container");

  const updateStripeButtonState = hasItems => {
    if (!stripeButton) return;
    stripeButton.disabled = !hasItems;
    if (hasItems) {
      stripeButton.removeAttribute("aria-disabled");
    } else {
      stripeButton.setAttribute("aria-disabled", "true");
    }
  };

  const renderCart = () => {
    const cart = getCart();
    cartItemsContainer.innerHTML = "";

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
      cartTotalEl.textContent = "0.00";
      updateStripeButtonState(false);
      return;
    }

    cart.forEach((item, index) => {
      const wrapper = document.createElement("div");
      wrapper.className = "cart-item";
      wrapper.innerHTML = `
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <p>$${formatCurrency(item.price)} each</p>
        </div>
        <div class="cart-item-controls">
          <div class="quantity-control" aria-label="Adjust quantity for ${item.name}">
            <button type="button" class="quantity-btn" data-direction="decrease" data-index="${index}" aria-label="Decrease quantity for ${item.name}">−</button>
            <input type="number" min="1" class="cart-item-quantity" data-index="${index}" value="${item.quantity}" aria-label="Quantity for ${item.name}">
            <button type="button" class="quantity-btn" data-direction="increase" data-index="${index}" aria-label="Increase quantity for ${item.name}">+</button>
          </div>
          <p class="cart-item-line-total">$${formatCurrency(item.price * item.quantity)}</p>
          <button type="button" class="cart-item-remove" data-index="${index}">Remove</button>
        </div>
      `;

      cartItemsContainer.appendChild(wrapper);
    });

    cartTotalEl.textContent = formatCurrency(getCartTotal(cart));
    updateStripeButtonState(true);
  };

  cartItemsContainer.addEventListener("click", event => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.matches(".quantity-btn")) {
      const index = Number(target.dataset.index);
      const direction = target.dataset.direction;
      const cart = getCart();
      const item = cart[index];
      if (!item) return;

      const newQuantity = direction === "decrease" ? item.quantity - 1 : item.quantity + 1;
      if (newQuantity <= 0) {
        removeFromCart(index);
      } else {
        setItemQuantity(index, newQuantity);
      }
      renderCart();
    }

    if (target.matches(".cart-item-remove")) {
      const index = Number(target.dataset.index);
      removeFromCart(index);
      renderCart();
    }
  });

  cartItemsContainer.addEventListener("change", event => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !target.matches(".cart-item-quantity")) {
      return;
    }

    const index = Number(target.dataset.index);
    const value = Math.floor(Number(target.value));

    if (!Number.isFinite(value) || value <= 0) {
      const cart = getCart();
      target.value = cart[index] ? cart[index].quantity : 1;
      return;
    }

    setItemQuantity(index, value);
    renderCart();
  });

  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", () => {
      clearCart();
      renderCart();
    });
  }

  if (stripeButton) {
    stripeButton.addEventListener("click", async () => {
      const cart = getCart();
      if (!cart.length) return;

      const stripe = getStripeInstance();
      if (!stripe) {
        alert("Stripe checkout is unavailable right now. Please try again later.");
        return;
      }

      stripeButton.disabled = true;
      stripeButton.dataset.loading = "true";
      const originalText = stripeButton.textContent;
      stripeButton.textContent = "Redirecting…";

      try {
        const response = await fetch("https://your-backend-url.onrender.com/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cart })
        });

        if (!response.ok) {
          throw new Error(`Checkout session request failed with status ${response.status}`);
        }

        const session = await response.json();
        const { error } = await stripe.redirectToCheckout({ sessionId: session.id });
        if (error) {
          console.error("Stripe checkout failed", error);
          alert("Unable to start checkout. Please try again.");
        }
      } catch (error) {
        console.error("Error starting Stripe checkout", error);
        alert("We couldn't start checkout. Please try again.");
      } finally {
        stripeButton.disabled = false;
        delete stripeButton.dataset.loading;
        stripeButton.textContent = originalText;
      }
    });
  }

  if (paypalContainer) {
    if (typeof paypal !== "undefined" && paypal?.Buttons) {
      paypal.Buttons({
        createOrder: (data, actions) => {
          const total = formatCurrency(getCartTotal());
          return actions.order.create({
            purchase_units: [{ amount: { value: total } }]
          });
        },
        onApprove: (data, actions) =>
          actions.order.capture().then(() => {
            alert("Thank you for your order!");
            clearCart();
            renderCart();
          }),
        onError: error => {
          console.error("PayPal checkout failed", error);
          alert("We couldn't process PayPal checkout. Please try again.");
        }
      }).render("#paypal-button-container");
    } else {
      paypalContainer.innerHTML = '<p class="checkout-placeholder">PayPal checkout is unavailable right now.</p>';
    }
  }

  renderCart();
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  attachContactFormHandler();
  initializeCartPage();
});

window.addToCart = addToCart;
window.updateCartCount = updateCartCount;
window.removeFromCart = removeFromCart;
