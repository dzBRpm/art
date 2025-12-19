// ui.js — отвечает ТОЛЬКО за UI: рендер и модальные окна

import { ARTIFACTS_DATA } from './data.js';

/* =====================
   Константы и состояние
===================== */

const VALUE_CLASSES = [
  'value-gray',
  'value-white',
  'value-green',
  'value-blue',
  'value-orange'
];

let zIndexCounter = 10;
let currentPropMode = 'main'; // main | extra

/* =====================
   Вспомогательные
===================== */

function isPusto(artifact) {
  return artifact.label === 'Пусто';
}

function closeAllModals() {
  document.querySelectorAll('.modal').forEach(modal => {
    if (!modal.classList.contains('pinned')) {
      modal.remove();
    }
  });
}

/* =====================
   Рендер иконок
===================== */

export function renderArtifacts(artifacts) {
  const container = document.getElementById('icon-list-container');
  container.innerHTML = '';

  if (!artifacts || artifacts.length === 0) {
    container.innerHTML =
      '<p style="color:#ff4747;margin-left:20px;">Артефакты не найдены.</p>';
    return;
  }

  artifacts.forEach(artifact => {
    const wrapper = document.createElement('div');
    wrapper.className = 'icon-wrapper';

    const label = document.createElement('span');
    label.className = 'icon-label';
    label.textContent = artifact.label;

    const img = document.createElement('img');
    img.src = artifact.img;
    img.alt = artifact.label;
    img.className = `custom-icon border-${artifact.border}`;

    if (!isPusto(artifact)) {
      img.addEventListener('click', e => openModal(artifact, e));
    } else {
      img.style.opacity = '0.5';
      img.style.cursor = 'default';
    }

    wrapper.append(label, img);
    container.appendChild(wrapper);
  });
}

/* =====================
   Модалка
===================== */

function openModal(artifact, event) {
  event.stopPropagation();
  closeAllModals();

  const modalEl = document.createElement('div');
  modalEl.className = 'modal';
  modalEl.style.display = 'block';

  modalEl.innerHTML = getModalContentHTML(artifact);
  document.body.appendChild(modalEl);

  // Ждём, пока браузер посчитает размеры
  requestAnimationFrame(() => {
    const targetIcon = event.target.closest('.custom-icon');
	positionModal(modalEl, targetIcon);
  });

  zIndexCounter++;
  modalEl.style.zIndex = zIndexCounter;

  setupModalControls(modalEl);
  setupDrag(modalEl);
  setupPropertySwitch(modalEl, artifact);
}

function getModalContentHTML(artifact) {
  return `
    <div class="modal-content">
      <div class="pin-button">📌</div>
      <span class="close">&times;</span>

      <div class="artifact-header">
        <div class="artifact-name">«${artifact.label}»</div>

        <div class="modal-switch">
          <button class="prop-toggle active" data-type="main">Основные</button>
          <button class="prop-toggle" data-type="extra">Дополнительные</button>
        </div>
      </div>

      <p class="artifact-description">${artifact.desc}</p>

      <div class="divider"></div>

      <div class="artifact-properties"></div>
    </div>
  `;
}
/* =====================
   Характеристики
===================== */

function renderProperties(modalEl, artifact) {
  const container = modalEl.querySelector('.artifact-properties');
  container.innerHTML = '';

  const props =
    currentPropMode === 'main'
      ? artifact.props
      : artifact.extraProps;

  if (!props || props.length === 0) {
    container.innerHTML =
      '<p style="opacity:.6;margin-top:10px;">Нет данных</p>';
    return;
  }

  props.forEach(prop => {
    const values = prop.values
      .map((val, i) => `<span class="${VALUE_CLASSES[i]}">${val}</span>`)
      .join('');

    const effectClass = prop.neg
      ? 'negative-effect'
      : prop.pos
      ? 'positive-effect'
      : '';

    container.insertAdjacentHTML(
      'beforeend',
      `
        <div class="artifact-property ${effectClass}">
          <span class="property-name">${prop.name}</span>
          <div class="property-values">${values}</div>
        </div>
      `
    );
  });
}

function setupPropertySwitch(modalEl, artifact) {
  currentPropMode = 'main';

  const buttons = modalEl.querySelectorAll('.prop-toggle');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      currentPropMode = btn.dataset.type;

      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      renderProperties(modalEl, artifact);
    });
  });

  if (!artifact.extraProps || artifact.extraProps.length === 0) {
    const extraBtn = modalEl.querySelector('[data-type="extra"]');
    if (extraBtn) extraBtn.style.display = 'none';
  }

  renderProperties(modalEl, artifact);
}

/* =====================
   Позиционирование
===================== */

function positionModal(modal, targetEl) {
  if (!targetEl) return;

  const OFFSET_BOTTOM = -40; // ⬆️ поднимаем модалку, если она снизу
  const OFFSET_TOP = 23;    // обычный отступ сверху
  const padding = 10;

  const rect = targetEl.getBoundingClientRect();

  const wrapper = targetEl.closest('.icon-wrapper');
  const labelEl = wrapper?.querySelector('.icon-label');
  const labelHeight = labelEl ? labelEl.offsetHeight : 0;

  const modalW = modal.offsetWidth;
  const modalH = modal.offsetHeight;

  // центрируем по иконке
  let left = rect.left + rect.width / 2 - modalW / 2;

  // по умолчанию — ПОД иконкой
  let top = rect.bottom + OFFSET_BOTTOM;

  // если снизу нет места — НАД иконкой
  if (rect.bottom + modalH > window.innerHeight) {
    top = rect.top - modalH - OFFSET_TOP - labelHeight;
  }

  // защита от выхода за экран
  left = Math.max(
    padding,
    Math.min(left, window.innerWidth - modalW - padding)
  );

  top = Math.max(
    padding,
    Math.min(top, window.innerHeight - modalH - padding)
  );

  modal.style.left = `${left + window.scrollX}px`;
  modal.style.top = `${top + window.scrollY}px`;
}

/* =====================
   Контролы
===================== */

function setupModalControls(modalEl) {
  modalEl.querySelector('.close')
    .addEventListener('click', () => modalEl.remove());

  modalEl.querySelector('.pin-button')
    .addEventListener('click', () => {
      modalEl.classList.toggle('pinned');
      zIndexCounter++;
      modalEl.style.zIndex = zIndexCounter;
    });
}

/* =====================
   Drag & Drop
===================== */

function setupDrag(modalEl) {
  let startX = 0;
  let startY = 0;
  let dragging = false;

  const header = modalEl.querySelector('.modal-content');

  header.addEventListener('mousedown', e => {
    if (e.target.closest('.close') || e.target.closest('.pin-button')) return;

    dragging = true;
    startX = e.clientX - modalEl.offsetLeft;
    startY = e.clientY - modalEl.offsetTop;

    zIndexCounter++;
    modalEl.style.zIndex = zIndexCounter;

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  function onMove(e) {
    if (!dragging) return;

    modalEl.style.left = `${e.clientX - startX}px`;
    modalEl.style.top = `${e.clientY - startY}px`;
  }

  function onUp() {
    dragging = false;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }
}
