const filterButtons = document.querySelectorAll('.filter-button');
const menuCards = document.querySelectorAll('.menu-card');
const cartList = document.querySelector('#cart-list');
const cartTotal = document.querySelector('#cart-total');
const fullCartList = document.querySelector('#full-cart-list');
const fullCartTotal = document.querySelector('#full-cart-total');
const checkoutButton = document.querySelector('#checkout-button');
const checkoutForm = document.querySelector('#checkout-form');
const checkoutMessage = document.querySelector('#checkout-message');
const confirmationPanel = document.querySelector('#confirmation-panel');
const confirmationDetails = document.querySelector('#confirmation-details');
const confirmationItems = document.querySelector('#confirmation-items');
const confirmationTotal = document.querySelector('#confirmation-total');
const drinkDialog = document.querySelector('#drink-dialog');
const dialogClose = document.querySelector('#dialog-close');
const dialogImage = document.querySelector('#drink-dialog-image');
const dialogTitle = document.querySelector('#drink-dialog-title');
const dialogDescription = document.querySelector('#drink-dialog-description');
const dialogAllergies = document.querySelector('#drink-dialog-allergies');
const addDetailedDrink = document.querySelector('#add-detailed-drink');
const sizePicker = document.querySelector('.size-picker');
const menuSizeOptions = document.querySelectorAll('input[name="menu-size"]');
let selectedMenuDrink = null;
const storedOrders = JSON.parse(localStorage.getItem('snowglobeOrders') || '[]');
let cart = storedOrders;

function formatPrice(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'CAD'
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
            <span>${formatPrice(item.price)} each</span>
          </span>
          <span class="cart-item-actions">
            <button class="quantity-button" type="button" data-cart-action="decrease" data-full-index="${index}" aria-label="Decrease ${item.name} quantity">−</button>
            <strong>${item.quantity || 1}</strong>
            <button class="quantity-button" type="button" data-cart-action="increase" data-full-index="${index}" aria-label="Increase ${item.name} quantity">+</button>
            <button class="remove-item" type="button" data-cart-action="remove" data-full-index="${index}">Remove</button>
          </span>
        </li>
      `
    )
    .join('');

  fullCartTotal.textContent = formatPrice(cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0));
  checkoutButton.disabled = false;

  fullCartList.querySelectorAll('[data-cart-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.fullIndex);
      const item = cart[index];
      const action = button.dataset.cartAction;
      item.quantity = item.quantity || 1;

      if (action === 'increase') item.quantity += 1;
      if (action === 'decrease') item.quantity -= 1;
      if (action === 'remove' || item.quantity < 1) cart.splice(index, 1);
      saveOrders(cart);
      renderFullCart();
    });
  });
}

checkoutForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!cart.length) return;

  const formData = new FormData(checkoutForm);
  const nextOrderNumber = Number(localStorage.getItem('snowglobeOrderNumber') || '0') + 1;
  localStorage.setItem('snowglobeOrderNumber', String(nextOrderNumber));
  const orderNumber = `SGC-${nextOrderNumber}`;
  const customerName = formData.get('customerName');
  const pickupTime = formData.get('pickupTime');
  const paymentMethod = formData.get('paymentMethod');
  const total = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  checkoutMessage.textContent = `Thanks, ${customerName}!`;
  confirmationDetails.textContent = `${orderNumber} is confirmed for ${pickupTime}. Payment: ${paymentMethod.toLowerCase()} at pickup.`;
  confirmationItems.innerHTML = cart.map((item) => `<li><span>${item.name} × ${item.quantity || 1}</span><strong>${formatPrice(item.price * (item.quantity || 1))}</strong></li>`).join('');
  confirmationTotal.textContent = formatPrice(total);
  confirmationPanel.hidden = false;
  checkoutForm.reset();
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
          <span class="cart-item-name">${item.name} × ${item.quantity || 1}</span>
          <span>${formatPrice(item.price * (item.quantity || 1))}</span>
        </li>
      `
    )
    .join('');

  const total = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
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

const drinkAllergies = {
  'Peppermint Cloud': 'milk, may contain soy',
  'Snowberry Latte': 'milk, may contain soy',
  'Cinnamon Snowcap': 'milk',
  'Frosted Mocha': 'milk, soy',
  'Maple Snow Latte': 'milk',
  'Gingerbread Latte': 'milk, wheat',
  'Blueberry Frost': 'milk',
  'Toasted Marshmallow Cocoa': 'milk, soy',
  'Winter Wonderland': 'milk, coconut',
  'Cookie Snowfall': 'milk, wheat, soy',
  'White Chocolate Blizzard': 'milk, soy',
  'Cozy Chocolate Chip Cookie': 'wheat, milk, soy',
  'Snowcap Croissant': 'wheat, milk, egg',
  'Frostbite Brownie': 'wheat, milk, egg, soy',
  'Snowflake Waffles': 'wheat, milk, egg',
  'Snowglobe Cheesecake': 'wheat, milk, egg',
  'Winter Berry Parfait': 'milk, may contain nuts',
  'Après-Ski Grilled Cheese': 'wheat, milk'
};

function openDrinkDialog(card) {
  selectedMenuDrink = card;
  const name = card.dataset.name;
  const price = Number(card.dataset.price);
  const image = card.querySelector('img');

  dialogTitle.textContent = name;
  dialogDescription.textContent = card.querySelector('.menu-card-content > p:last-of-type').textContent;
  dialogAllergies.textContent = drinkAllergies[name] || 'Please ask a team member for ingredient details';
  dialogImage.src = image?.src || '';
  dialogImage.alt = image?.alt || name;
  const isSnack = card.dataset.category === 'snack';
  sizePicker.hidden = isSnack;
  addDetailedDrink.textContent = isSnack ? 'Add snack to order' : 'Add drink to order';
  if (!isSnack) {
    document.querySelector('[data-size-price="Small"]').textContent = price.toFixed(2);
    document.querySelector('[data-size-price="Medium"]').textContent = (price + 0.6).toFixed(2);
    document.querySelector('[data-size-price="Large"]').textContent = (price + 0.8).toFixed(2);
  }
  menuSizeOptions[0].checked = true;
  drinkDialog.hidden = false;
  dialogClose.focus();
}

function closeDrinkDialog() {
  drinkDialog.hidden = true;
  selectedMenuDrink = null;
}

menuCards.forEach((card) => {
  card.addEventListener('click', (event) => {
    if (!event.target.closest('button')) openDrinkDialog(card);
  });
});

dialogClose?.addEventListener('click', closeDrinkDialog);
drinkDialog?.addEventListener('click', (event) => {
  if (event.target === drinkDialog) closeDrinkDialog();
});

addDetailedDrink?.addEventListener('click', () => {
  if (!selectedMenuDrink) return;

  const selectedSize = document.querySelector('input[name="menu-size"]:checked');
  const isSnack = selectedMenuDrink.dataset.category === 'snack';
  const size = selectedSize.value;
  const price = Number(selectedMenuDrink.dataset.price) + (isSnack ? 0 : Number(selectedSize.dataset.upgrade));
  const displayName = isSnack ? selectedMenuDrink.dataset.name : `${size} ${selectedMenuDrink.dataset.name}`;
  cart.push({ name: displayName, price });
  saveOrders(cart);
  renderCart();
  closeDrinkDialog();
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
  const flavorCount = getSelectedValues('flavor').length;
  const toppingCount = getSelectedValues('topping').length;
  const total = baseDrinkPrice + sizePrice + (flavorCount + toppingCount) * extraChoicePrice;

  return Math.min(total, maxDrinkPrice);
}

function updateOrderSummary() {
  if (!orderSummary) return;

  const size = selections.size || 'Size';
  const base = selections.base || 'Base';
  const flavors = getSelectedValues('flavor');
  const toppings = getSelectedValues('topping');
  const finish = selections.finish || 'Regular';

  const parts = [size, base];

  if (flavors.length) {
    parts.push(`flavors: ${flavors.join(', ')}`);
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
      if (group === 'flavor' || group === 'topping') {
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
          nextValues = [];
        } else {
          const withoutNoTopping = currentValues.filter((value) => value !== 'No extra topping');
          options.forEach((item) => {
            if (item.dataset.choice === 'No extra topping') {
              item.classList.remove('selected');
            }
          });
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

    if (group === 'flavor' || group === 'topping') {
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
  const flavors = getSelectedValues('flavor');
  const toppings = getSelectedValues('topping');
  const finish = selections.finish || 'Regular';
  const totalPrice = getDrinkPrice();

  const flavorText = flavors.length ? `with ${flavors.join(', ')}` : 'regular';
  const toppingText = toppings.length ? ` + ${toppings.join(', ')}` : '';
  const displayName = `${size} ${base} ${flavorText}${toppingText} • ${finish}`;

  customOrders.push({
    name: displayName,
    price: totalPrice
  });

  saveOrders(customOrders);
  renderCustomOrders();
  orderCount.textContent = `${customOrders.length} custom drink${customOrders.length === 1 ? '' : 's'} added.`;
});
