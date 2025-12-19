import { setSearchTerm, setPropSearchTerm, updateView } from './state.js';

document.addEventListener('DOMContentLoaded', () => {
  const nameInput = document.getElementById('artifact-search');
  const propInput = document.getElementById('artifact-prop-search');
  const toggleBtn = document.getElementById('toggle-prop-search');

  if (nameInput) {
    nameInput.addEventListener('input', e => {
      setSearchTerm(e.target.value);
    });
  }

  if (propInput) {
    propInput.addEventListener('input', e => {
      setPropSearchTerm(e.target.value);
    });
  }

  if (toggleBtn && propInput) {
    toggleBtn.addEventListener('click', () => {
      propInput.classList.toggle('hidden');

      if (propInput.classList.contains('hidden')) {
        propInput.value = '';
        setPropSearchTerm('');
      } else {
        propInput.focus();
      }
    });
  }

  updateView();
});
