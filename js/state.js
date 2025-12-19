// state.js — единый источник состояния приложения

import { ARTIFACTS_DATA } from './data.js';
import { renderArtifacts } from './ui.js';

/* =====================
   STATE
===================== */

const state = {
  searchTerm: '',        // поиск по названию
  propSearchTerm: ''     // поиск по характеристикам
};

/* =====================
   HELPERS
===================== */

function isPusto(artifact) {
  return artifact.label === 'Пусто';
}

/**
 * Проверка совпадения по характеристикам
 * Ищет И в props, И в extraProps
 */
function matchesPropSearch(artifact, term) {
  if (!term) return true;

  const search = term.toLowerCase();

  const allProps = [
    ...(artifact.props || []),
    ...(artifact.extraProps || [])
  ];

  return allProps.some(prop =>
    prop.name?.toLowerCase().includes(search)
  );
}

function getFilteredArtifacts() {
  let result = [...ARTIFACTS_DATA];

  // убрать "Пусто"
  result = result.filter(a => !isPusto(a));

  // ✅ сортировка по алфавиту (RU)
  result.sort((a, b) =>
    a.label.localeCompare(b.label, 'ru', { sensitivity: 'base' })
  );

  // поиск по названию
  if (state.searchTerm) {
    result = result.filter(a =>
      a.label.toLowerCase().includes(state.searchTerm)
    );
  }

  // поиск по характеристикам (основные + дополнительные)
  if (state.propSearchTerm) {
    result = result.filter(a =>
      [...(a.props || []), ...(a.extraProps || [])]
        .some(prop =>
          prop.name.toLowerCase().includes(state.propSearchTerm)
        )
    );
  }

  return result;
}

/* =====================
   PUBLIC API
===================== */

export function setSearchTerm(value) {
  state.searchTerm = value.toLowerCase().trim();
  updateView();
}

export function setPropSearchTerm(value) {
  state.propSearchTerm = value.toLowerCase().trim();
  updateView();
}

export function updateView() {
  const filtered = getFilteredArtifacts();
  renderArtifacts(filtered);
}
