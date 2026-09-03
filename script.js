const filterButtons = document.querySelectorAll('.filter-button');
const menuCards = document.querySelectorAll('.menu-card');
const cartList = document.querySelector('#cart-list');
const cartTotal = document.querySelector('#cart-total');
const fullCartList = document.querySelector('#full-cart-list');
const fullCartTotal = document.querySelector('#full-cart-total');
const checkoutButton = document.querySelector('#checkout-button');
const checkoutMessage = document.querySelector('#checkout-message');
const storedOrders = JSON.parse(localStorage.getItem('snowglobeOrders') || '[]');
let cart = storedOrders;

function formatPrice(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}

function saveOrders(orders) {
  localStorage.setItem('snowglobeOrders', JSON.stringify(orders));
}

function renderFullCart() {
  if (!fullCartList || !fullCartTotal) return;

  if (!cart.length) {
    fullCartList.innerHTML = '<li class="empty-cart">Your cart is empty.</li>';
    fullCartTotal.textContent = '$0.00';
    checkoutButton.disabled = true;
    return;
  }

  fullCartList.innerHTML = cart
    .map(
      (item, index) => `
        <li>
          <span class="custom-cart-item">
            <strong>${item.name}</strong>
            <span>${formatPrice(item.price)}</span>
          </span>
          <button class="remove-item" type="button" data-full-index="${index}">Remove</button>
        </li>
      `
    )
    .join('');

  fullCartTotal.textContent = formatPrice(cart.reduce((sum, item) => sum + item.price, 0));
  checkoutButton.disabled = false;

  fullCartList.querySelectorAll('[data-full-index]').forEach((button) => {
    button.addEventListener('click', () => {
      cart.splice(Number(button.dataset.fullIndex), 1);
      saveOrders(cart);
      renderFullCart();
    });
  });
}

checkoutButton?.addEventListener('click', () => {
  checkoutMessage.textContent = 'Thanks! Your order is ready for pickup.';
});

function renderCart() {
  if (!cartList || !cartTotal) return;

  if (!cart.length) {
    cartList.innerHTML = '<li class="empty-cart">No drinks added yet.</li>';
    cartTotal.textContent = '$0.00';
    return;
  }

  cartList.innerHTML = cart
    .map(
      (item) => `
        <li>
          <span class="cart-item-name">${item.name}</span>
          <span>${formatPrice(item.price)}</span>
        </li>
      `
    )
    .join('');

  const total = cart.reduce((sum, item) => sum + item.price, 0);
  cartTotal.textContent = formatPrice(total);
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const category = button.dataset.category;

    filterButtons.forEach((item) => {
      const isActive = item === button;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-pressed', String(isActive));
    });

    menuCards.forEach((card) => {
      const matches = category === 'all' || card.dataset.category.includes(category);
      card.hidden = !matches;
    });
  });
});

menuCards.forEach((card) => {
  const button = card.querySelector('.select-button');

  button?.addEventListener('click', () => {
    const name = card.dataset.name;
    const price = Number(card.dataset.price);

    cart.push({ name, price });
    saveOrders(cart);
    renderCart();
  });
});

renderFullCart();

const choiceCards = document.querySelectorAll('[data-choice-group]');
const orderSummary = document.querySelector('.order-summary');
const orderButton = document.querySelector('#place-order');
const orderCount = document.querySelector('#order-count');
const customOrderList = document.querySelector('#custom-order-list');
const customOrderTotal = document.querySelector('#custom-order-total');
const selections = {};
let customOrders = storedOrders;

const sizePrices = {
  Small: 0,
  Medium: 0.6,
  Large: 0.8
};

const baseDrinkPrice = 4.25;
const extraChoicePrice = 0.6;
const maxExtras = 6;
const maxDrinkPrice = 20;

function getSelectedValues(group) {
  const value = selections[group];

  if (Array.isArray(value)) {
    return value;
  }

  return value ? [value] : [];
}

function getDrinkPrice() {
  const sizePrice = sizePrices[selections.size] || 0;
  const flavorCount = getSelectedValues('flavour').length;
  const toppingCount = getSelectedValues('topping').length;
  const total = baseDrinkPrice + sizePrice + (flavorCount + toppingCount) * extraChoicePrice;

  return Math.min(total, maxDrinkPrice);
}

function updateOrderSummary() {
  if (!orderSummary) return;

  const size = selections.size || 'Size';
  const base = selections.base || 'Base';
  const flavours = getSelectedValues('flavour');
  const toppings = getSelectedValues('topping');
  const finish = selections.finish || 'Regular';

  const parts = [size, base];

  if (flavours.length) {
    parts.push(`flavors: ${flavours.join(', ')}`);
  }

  if (toppings.length) {
    parts.push(`toppings: ${toppings.join(', ')}`);
  }

  parts.push(finish);

  orderSummary.textContent = selections.size && selections.base
    ? parts.join(' · ')
    : 'Pick your options above.';
}

function renderCustomOrders() {
  if (!customOrderList || !customOrderTotal) return;

  if (!customOrders.length) {
    customOrderList.innerHTML = '<li class="empty-cart">No custom drinks yet.</li>';
    customOrderTotal.textContent = '$0.00';
    return;
  }

  customOrderList.innerHTML = customOrders
    .map(
      (item, index) => `
        <li>
          <span class="custom-cart-item">
            <strong>${item.name}</strong>
            <span>${formatPrice(item.price)}</span>
          </span>
          <button class="remove-item" type="button" data-index="${index}">Remove</button>
        </li>
      `
    )
    .join('');

  const total = customOrders.reduce((sum, item) => sum + item.price, 0);
  customOrderTotal.textContent = formatPrice(total);

  customOrderList.querySelectorAll('.remove-item').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.index);
      customOrders.splice(index, 1);
      saveOrders(customOrders);
      renderCustomOrders();
    });
  });
}

choiceCards.forEach((card) => {
  const group = card.dataset.choiceGroup;
  const options = card.querySelectorAll('.choice-option');
  const clearButton = card.querySelector('.clear-selection');

  options.forEach((option) => {
    option.addEventListener('click', () => {
      if (group === 'flavour' || group === 'topping') {
        const currentValues = getSelectedValues(group);
        const selectedChoice = option.dataset.choice;
        const isActive = currentValues.includes(selectedChoice);

        if (!isActive && currentValues.length >= maxExtras) {
          return;
        }

        let nextValues;

        if (group === 'topping' && selectedChoice === 'No extra topping') {
          options.forEach((item) => item.classList.remove('selected'));
          option.classList.add('selected');
          nextValues = isActive ? [] : [selectedChoice];
        } else {
          const withoutNoTopping = currentValues.filter((value) => value !== 'No extra topping');
          option.classList.toggle('selected', !isActive);
          nextValues = isActive
            ? withoutNoTopping.filter((value) => value !== selectedChoice)
            : [...withoutNoTopping, selectedChoice];
        }

        selections[group] = nextValues;
        card.querySelector('.selection-count').textContent = `${nextValues.length}/${maxExtras} selected`;
      } else {
        options.forEach((item) => item.classList.toggle('selected', item === option));
        selections[group] = option.dataset.choice;
      }

      updateOrderSummary();
    });
  });

  clearButton?.addEventListener('click', () => {
    options.forEach((option) => option.classList.remove('selected'));

    if (group === 'flavour' || group === 'topping') {
      selections[group] = [];
      card.querySelector('.selection-count').textContent = `0/${maxExtras} selected`;
    } else {
      delete selections[group];
    }

    updateOrderSummary();
  });
});

orderButton?.addEventListener('click', () => {
  if (!selections.size || !selections.base) {
    orderCount.textContent = 'Choose a size and base first.';
    return;
  }

  const size = selections.size;
  const base = selections.base;
  const flavours = getSelectedValues('flavour');
  const toppings = getSelectedValues('topping');
  const finish = selections.finish || 'Regular';
  const totalPrice = getDrinkPrice();

  const flavourText = flavours.length ? `with ${flavours.join(', ')}` : 'regular';
  const toppingText = toppings.length ? ` + ${toppings.join(', ')}` : '';
  const displayName = `${size} ${base} ${flavourText}${toppingText} • ${finish}`;

  customOrders.push({
    name: displayName,
    price: totalPrice
  });

  saveOrders(customOrders);
  renderCustomOrders();
  orderCount.textContent = `${customOrders.length} custom drink${customOrders.length === 1 ? '' : 's'} added.`;
});
