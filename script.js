const filterButtons = document.querySelectorAll('.filter-button');
const menuCards = document.querySelectorAll('.menu-card');
const cartList = document.querySelector('#cart-list');
const cartTotal = document.querySelector('#cart-total');
let cart = [];

function formatPrice(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}

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
    renderCart();
  });
});

const choiceCards = document.querySelectorAll('[data-choice-group]');
const orderSummary = document.querySelector('.order-summary');
const orderButton = document.querySelector('#place-order');
const orderCount = document.querySelector('#order-count');
const selections = {};
let orders = 0;

function updateOrderSummary() {
  if (!orderSummary) return;

  const chosenItems = Object.values(selections);
  orderSummary.textContent = chosenItems.length
    ? chosenItems.join(' · ')
    : 'Pick your options above.';
}

choiceCards.forEach((card) => {
  const group = card.dataset.choiceGroup;
  const options = card.querySelectorAll('.choice-option');
  const clearButton = card.querySelector('.clear-selection');

  options.forEach((option) => {
    option.addEventListener('click', () => {
      options.forEach((item) => item.classList.toggle('selected', item === option));
      selections[group] = option.dataset.choice;
      updateOrderSummary();
    });
  });

  clearButton?.addEventListener('click', () => {
    options.forEach((option) => option.classList.remove('selected'));
    delete selections[group];
    updateOrderSummary();
  });
});

orderButton?.addEventListener('click', () => {
  if (!Object.keys(selections).length) {
    orderCount.textContent = 'Choose at least one option first.';
    return;
  }

  orders += 1;
  orderCount.textContent = `${orders} drink${orders === 1 ? '' : 's'} added.`;
});
