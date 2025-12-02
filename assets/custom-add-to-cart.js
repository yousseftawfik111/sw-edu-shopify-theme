/**
 * Custom Add to Cart functionality for PLP
 * Uses Shopify AJAX Cart API to add items
 */

(function() {
  'use strict';

  const SELECTORS = {
    FORM: '.add-to-cart-btn form',
    SUBMIT_BUTTON: 'button[type="submit"]',
    SPINNER: '.loading-overlay__spinner',
    VARIANT_INPUT: 'input[name="id"]',
    CART_NOTIFICATION: 'cart-notification',
    CART_DRAWER: 'cart-drawer',
    CART_DRAWER_ITEMS: 'cart-drawer-items'
  };
  
  const TIMEOUT_MS = 10000; // 10 seconds

  let cartElement = null;
    
  const getCartElement = () => {
    if (!cartElement) {
      cartElement = document.querySelector(SELECTORS.CART_NOTIFICATION) || 
                    document.querySelector(SELECTORS.CART_DRAWER);
    }
    return cartElement;
  };

  const setButtonState = (button, spinner, isLoading) => {
    const buttonText = button.querySelector('span');
    
    if (isLoading) {
      button.setAttribute('aria-disabled', 'true');
      button.disabled = true;
      button.classList.add('loading');
      buttonText?.classList.add('hidden');
      spinner?.classList.remove('hidden');
    } else {
      button.removeAttribute('aria-disabled');
      button.disabled = false;
      button.classList.remove('loading');
      buttonText?.classList.remove('hidden');
      spinner?.classList.add('hidden');
    }
  };

  const publishEvent = (eventType, data) => {
    if (typeof publish !== 'undefined' && typeof PUB_SUB_EVENTS !== 'undefined') {
      publish(eventType, data);
    }
  };

  const handleAddToCart = (form) => {
    const submitButton = form.querySelector(SELECTORS.SUBMIT_BUTTON);
    const variantIdInput = form.querySelector(SELECTORS.VARIANT_INPUT);
    
    if (!submitButton || !variantIdInput?.value) return;
    
    const variantId = variantIdInput.value;
    const cart = getCartElement();
    
    const spinner = form.querySelector(SELECTORS.SPINNER);

    setButtonState(submitButton, spinner, true);
    
    const formData = new FormData();
    formData.append('id', variantId);
    formData.append('quantity', 1);
    
    if (cart) {
      const cartDrawerItems = document.querySelector(SELECTORS.CART_DRAWER_ITEMS);
      const sectionsSource = cartDrawerItems || cart;
      const sectionsToRequest = sectionsSource.getSectionsToRender().map((section) => section.section);
      formData.append('sections', sectionsToRequest);
      formData.append('sections_url', window.location.pathname);
      cart.setActiveElement(submitButton);
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    fetch(window.routes.cart_add_url, {
      method: 'POST',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json'
      },
      body: formData,
      signal: controller.signal
    })
    .then(response => response.json())
    .then(data => {
      clearTimeout(timeoutId);
      
      // Shopify returns 200 OK even for errors, check status field
      if (data.status) {
        console.error('Add to cart error:', data);
        publishEvent(PUB_SUB_EVENTS.cartError, {
          source: 'custom-add-to-cart',
          productVariantId: variantId,
          errors: data.description,
          message: data.message
        });
        return;
      }
      
      publishEvent(PUB_SUB_EVENTS.cartUpdate, {
        source: 'custom-add-to-cart',
        productVariantId: variantId
      });
      
      if (cart) {
        cart.classList.remove('is-empty');
        cart.renderContents(data);
      } else {
        window.location.href = window.routes.cart_url;
      }
    })
    .catch(error => {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error('Request timeout');
        return;
      }
      
      console.error('Network error:', error);
    })
    .finally(() => {
      setButtonState(submitButton, spinner, false);
    });
  };

  const eventListeners = [];

  const cleanupAllEventListeners = () => {
    eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    eventListeners.length = 0;
  };
  
  const addTrackedListener = (element, event, handler) => {
    element.addEventListener(event, handler);
    eventListeners.push({ element, event, handler });
  };

  const initAddToCart = () => {
    cleanupAllEventListeners();
    
    const forms = document.querySelectorAll(SELECTORS.FORM);
    
    forms.forEach(form => {
      const submitButton = form.querySelector(SELECTORS.SUBMIT_BUTTON);
      
      if (submitButton && !submitButton.style.getPropertyValue('--button-width')) {
        const currentWidth = submitButton.offsetWidth;
        const currentHeight = submitButton.offsetHeight;
        submitButton.style.setProperty('--button-width', `${currentWidth}px`);
        submitButton.style.setProperty('--button-height', `${currentHeight}px`);
      }
      
      const submitHandler = (e) => {
        e.preventDefault();
        handleAddToCart(form);
      };
      addTrackedListener(form, 'submit', submitHandler);
    });
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAddToCart);
  } else {
    initAddToCart();
  }

})();
