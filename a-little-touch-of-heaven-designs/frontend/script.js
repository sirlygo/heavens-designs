(function storefront() {
  const CART_STORAGE_KEY = "cart";
  const DEFAULT_STRIPE_KEY = "YOUR_STRIPE_PUBLISHABLE_KEY";
  const DEFAULT_BACKEND_URL = "https://your-backend-url.onrender.com";

  const FALLBACK_PRODUCTS = Object.freeze([
    {
      id: "custom-shirt",
      name: "Custom Shirt",
      price: 20,
      image:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80",
      description: "Soft cotton tees with your artwork pressed in vibrant colors.",
    },
    {
      id: "custom-hoodie",
      name: "Custom Hoodie",
      price: 35,
      image:
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80",
      description: "Cozy fleece hoodies personalized for gifts, teams, or events.",
    },
    {
      id: "custom-tote",
      name: "Custom Tote Bag",
      price: 15,
      image:
        "https://images.unsplash.com/photo-1503342452485-86eb59083b47?auto=format&fit=crop&w=600&q=80",
      description: "Reusable totes ready for monograms, quotes, and bold graphics.",
    },
    {
      id: "custom-apron",
      name: "Custom Apron",
      price: 28,
      image:
        "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=600&q=80",
      description: "Aprons for makers and bakers finished with durable vinyl art.",
    },
    {
      id: "vinyl-sticker-pack",
      name: "Vinyl Sticker Pack",
      price: 12,
      image:
        "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=600&q=80",
      description: "A bundle of custom die-cut stickers for laptops, bottles, and more.",
    },
  ]);

  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  let renderCartView = () => {};
  let productCatalog = FALLBACK_PRODUCTS;

  function slugify(text) {
    return (text || "")
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function toPositiveInteger(value, fallback = 1) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    const floored = Math.floor(parsed);
    return floored > 0 ? floored : fallback;
  }

  function normaliseCartItem(item) {
    if (!item || typeof item !== "object") return null;
    if (!item.name && !item.id) return null;

    const name = (item.name || "").toString().trim();
    const id = (item.id || slugify(name)).trim();
    if (!id || !name) return null;

    const price = Number(item.price);
    const quantity = toPositiveInteger(item.quantity, 1);

    return {
      id,
      name,
      price: Number.isFinite(price) ? price : 0,
      quantity,
    };
  }

  function normaliseProduct(product) {
    if (!product || typeof product !== "object") return null;

    const name = (product.name || "").toString().trim();
    if (!name) return null;

    const id = (product.id || slugify(name)).trim();
    if (!id) return null;

    const price = Number(product.price);
    const image = (product.image || "").toString().trim();
    const description = (product.description || "").toString().trim();

    return {
      id,
      name,
      price: Number.isFinite(price) ? price : 0,
      image,
      description,
    };
  }

  function parseInlineProducts() {
    const inlineScript = document.getElementById("product-data");
    if (!inlineScript) {
      return FALLBACK_PRODUCTS.slice();
    }

    try {
      const parsed = JSON.parse(inlineScript.textContent || "[]");
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return FALLBACK_PRODUCTS.slice();
      }

      const normalised = parsed.map(normaliseProduct).filter(Boolean);
      return normalised.length ? normalised : FALLBACK_PRODUCTS.slice();
    } catch (error) {
      console.warn("Unable to parse inline product data", error);
      return FALLBACK_PRODUCTS.slice();
    }
  }

  function getStoredCart() {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return [];

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      return parsed.map(normaliseCartItem).filter(Boolean);
    } catch (error) {
      console.error("Unable to read cart from storage", error);
      return [];
    }
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error("Unable to persist cart", error);
    }
  }

  function withCart(mutator) {
    const cart = getStoredCart();
    const nextCart = mutator(Array.isArray(cart) ? [...cart] : []);
    saveCart(nextCart);
    return nextCart;
  }

  function formatCurrency(amount) {
    return currencyFormatter.format(Number(amount) || 0);
  }

  function updateCartCount() {
    const cartCountEl = document.getElementById("cart-count");
    if (!cartCountEl) return;

    const count = getStoredCart().reduce((total, item) => total + item.quantity, 0);
    cartCountEl.textContent = count.toString();
    cartCountEl.setAttribute(
      "aria-label",
      `${count} item${count === 1 ? "" : "s"} in cart`
    );
  }

  function showToast(message) {
    if (!message) return;

    const existingToast = document.querySelector(".toast");
    existingToast?.remove();

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.textContent = message;

    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 2600);
  }

  function findProduct(productId) {
    return productCatalog.find(item => item.id === productId);
  }

  const cartActions = {
    add(productId) {
      const product = findProduct(productId);
      if (!product) return;

      withCart(cart => {
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
          existing.quantity += 1;
          return cart;
        }

        cart.push({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        });
        return cart;
      });

      updateCartCount();
      renderCartView();
      showToast(`${product.name} added to cart!`);
    },

    remove(productId) {
      let removedName = "";
      withCart(cart => {
        const next = cart.filter(item => {
          const keep = item.id !== productId;
          if (!keep) {
            removedName = item.name;
          }
          return keep;
        });
        return next;
      });

      updateCartCount();
      renderCartView();
      if (removedName) {
        showToast(`${removedName} removed from cart.`);
      }
    },

    changeQuantity(productId, delta) {
      if (!delta) return;

      let removed = false;
      let updatedName = "";

      const nextCart = withCart(cart => {
        const target = cart.find(item => item.id === productId);
        if (!target) return cart;

        target.quantity += delta;
        updatedName = target.name;

        if (target.quantity <= 0) {
          removed = true;
          return cart.filter(item => item.id !== productId);
        }

        target.quantity = toPositiveInteger(target.quantity, 1);
        return cart;
      });

      updateCartCount();
      renderCartView();

      if (removed && updatedName) {
        showToast(`${updatedName} removed from cart.`);
      }
      return nextCart;
    },

    clear({ silent = false } = {}) {
      saveCart([]);
      updateCartCount();
      renderCartView();
      if (!silent) {
        showToast("Cart cleared.");
      }
    },
  };

  function createProductCard(product) {
    const article = document.createElement("article");
    article.className = "product";

    const imageMarkup = product.image
      ? `<img src="${product.image}" alt="${product.name}">`
      : "";

    article.innerHTML = `
      ${imageMarkup}
      <h3>${product.name}</h3>
      <p class="product-price">${formatCurrency(product.price)}</p>
      ${product.description ? `<p class="product-description">${product.description}</p>` : ""}
      <button type="button" class="add-to-cart-btn" data-product-id="${product.id}">Add to Cart</button>
    `;

    return article;
  }

  function initShopPage() {
    const productsGrid = document.querySelector("[data-products-grid]");
    if (!productsGrid) return;

    productCatalog = parseInlineProducts();

    const fallbackNotice = productsGrid.querySelector("noscript");
    fallbackNotice?.remove();

    if (!productCatalog.length) {
      productsGrid.innerHTML =
        '<p class="empty-products">Products are on their way. Please check back soon!</p>';
      return;
    }

    const fragment = document.createDocumentFragment();
    productCatalog.forEach(product => {
      fragment.appendChild(createProductCard(product));
    });

    productsGrid.replaceChildren(fragment);

    productsGrid.addEventListener("click", event => {
      const target = event.target instanceof Element ? event.target : null;
      const button = target?.closest("button[data-product-id]");
      if (!button) return;

      const { productId } = button.dataset;
      if (productId) {
        cartActions.add(productId);
      }
    });
  }

  function summariseCart(cart) {
    return cart.reduce(
      (summary, item) => {
        summary.total += item.price * item.quantity;
        summary.count += item.quantity;
        return summary;
      },
      { total: 0, count: 0 }
    );
  }

  function initCartPage() {
    const cartPage = document.querySelector("[data-cart-page]");
    if (!cartPage) return;

    const cartItemsContainer = document.getElementById("cart-items");
    const cartTotalEl = document.getElementById("cart-total");
    const clearCartBtn = document.getElementById("clear-cart");
    const stripeCheckoutBtn = document.getElementById("stripe-checkout");
    const stripeKey = document.body?.dataset?.stripeKey || DEFAULT_STRIPE_KEY;
    const backendUrl = document.body?.dataset?.backendUrl || DEFAULT_BACKEND_URL;

    let stripeClient = null;
    if (typeof Stripe === "function" && stripeKey && !stripeKey.startsWith("YOUR_")) {
      try {
        stripeClient = Stripe(stripeKey);
      } catch (error) {
        console.error("Unable to initialise Stripe", error);
      }
    }

    let paypalButtonsInstance = null;

    function teardownPaypalButtons() {
      if (paypalButtonsInstance) {
        paypalButtonsInstance.close();
        paypalButtonsInstance = null;
      }
      const paypalContainer = document.getElementById("paypal-button-container");
      if (paypalContainer) {
        paypalContainer.innerHTML = "";
      }
    }

    function setupPaypalButtons(total) {
      const paypalContainer = document.getElementById("paypal-button-container");
      if (!paypalContainer) return;

      if (typeof paypal === "undefined") {
        paypalContainer.innerHTML = '<p class="payment-helper">PayPal checkout is unavailable right now.</p>';
        return;
      }

      teardownPaypalButtons();

      paypalButtonsInstance = paypal.Buttons({
        style: { layout: "horizontal" },
        createOrder: (_, actions) =>
          actions.order.create({
            purchase_units: [
              {
                amount: {
                  value: total.toFixed(2),
                },
              },
            ],
          }),
        onApprove: (_, actions) =>
          actions.order.capture().then(() => {
            showToast("Payment received! Thank you.");
            cartActions.clear({ silent: true });
          }),
        onCancel: () => {
          showToast("PayPal checkout cancelled.");
        },
        onError: error => {
          console.error("PayPal checkout failed", error);
          alert("We couldn't complete the PayPal payment. Please try again.");
        },
      });

      paypalButtonsInstance.render("#paypal-button-container");
    }

    renderCartView = function renderCartView() {
      if (!cartItemsContainer || !cartTotalEl) return;

      const cart = getStoredCart();

      if (!cart.length) {
        cartItemsContainer.innerHTML =
          '<p class="empty-cart">Your cart is empty. <a href="shop.html">Browse the shop</a> to find your next favourite piece.</p>';
        cartTotalEl.textContent = "0.00";
        if (stripeCheckoutBtn) {
          stripeCheckoutBtn.disabled = true;
          stripeCheckoutBtn.textContent = stripeClient
            ? "Pay with Card 💳"
            : "Card checkout unavailable";
        }
        teardownPaypalButtons();
        return;
      }

      const fragment = document.createDocumentFragment();
      const cartSummary = summariseCart(cart);

      cart.forEach(item => {
        const row = document.createElement("article");
        row.className = "cart-item";
        row.innerHTML = `
          <div>
            <h3>${item.name}</h3>
            <p>${formatCurrency(item.price)} each</p>
          </div>
          <div class="cart-item-controls" aria-label="Update quantity for ${item.name}">
            <button type="button" class="qty-btn" data-action="decrement" data-product-id="${item.id}" aria-label="Decrease quantity for ${item.name}">−</button>
            <span class="cart-item-qty" aria-live="polite">${item.quantity}</span>
            <button type="button" class="qty-btn" data-action="increment" data-product-id="${item.id}" aria-label="Increase quantity for ${item.name}">+</button>
            <button type="button" class="remove-btn" data-action="remove" data-product-id="${item.id}">Remove</button>
          </div>
        `;
        fragment.appendChild(row);
      });

      cartItemsContainer.replaceChildren(fragment);
      cartTotalEl.textContent = cartSummary.total.toFixed(2);

      if (stripeCheckoutBtn) {
        const hasStripe = Boolean(stripeClient);
        stripeCheckoutBtn.disabled = !hasStripe;
        stripeCheckoutBtn.textContent = hasStripe ? "Pay with Card 💳" : "Card checkout unavailable";
      }

      setupPaypalButtons(cartSummary.total);
    };

    cartItemsContainer?.addEventListener("click", event => {
      const target = event.target instanceof Element ? event.target : null;
      const button = target?.closest("button[data-product-id]");
      if (!button) return;

      const { productId, action } = button.dataset;
      if (!productId) return;

      if (action === "increment") {
        cartActions.changeQuantity(productId, 1);
      } else if (action === "decrement") {
        cartActions.changeQuantity(productId, -1);
      } else if (action === "remove") {
        cartActions.remove(productId);
      }
    });

    clearCartBtn?.addEventListener("click", () => {
      cartActions.clear();
    });

    stripeCheckoutBtn?.addEventListener("click", async () => {
      const cart = getStoredCart();
      if (!cart.length) {
        alert("Your cart is empty.");
        return;
      }

      if (!stripeClient) {
        alert("Card checkout isn't configured yet. Please choose PayPal or contact us to complete your order.");
        return;
      }

      const originalLabel = stripeCheckoutBtn.textContent;
      stripeCheckoutBtn.disabled = true;
      stripeCheckoutBtn.textContent = "Redirecting...";

      try {
        const response = await fetch(`${backendUrl.replace(/\/$/, "")}/create-checkout-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cart }),
        });

        if (!response.ok) {
          throw new Error(`Checkout session request failed with status ${response.status}`);
        }

        const session = await response.json();
        const result = await stripeClient.redirectToCheckout({ sessionId: session.id });
        if (result.error) {
          throw result.error;
        }
      } catch (error) {
        console.error("Stripe checkout failed", error);
        alert("We couldn't start the card checkout. Please try again later or choose PayPal.");
      } finally {
        stripeCheckoutBtn.disabled = false;
        stripeCheckoutBtn.textContent = originalLabel;
      }
    });

    renderCartView();
  }

  function initSuccessPage() {
    const successPage = document.querySelector("[data-success-page]");
    if (!successPage) return;
    localStorage.removeItem(CART_STORAGE_KEY);
    updateCartCount();
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
    initShopPage();
    initCartPage();
    initSuccessPage();
    updateCartCount();
    attachContactFormHandler();
  });

  window.StorefrontCart = {
    add: cartActions.add,
    remove: cartActions.remove,
    changeQuantity: cartActions.changeQuantity,
    clear: cartActions.clear,
    getCart: getStoredCart,
    updateCartCount,
  };
})();
