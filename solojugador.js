document.addEventListener('DOMContentLoaded', () => {
  const radioButtons = document.querySelectorAll('.form-check-input');
  const stages = document.querySelectorAll('.selectStage');
  const chosenStage = document.querySelector('.chosenStage');
  const btnEscenario = document.getElementById('btnEscenario');

  let selectedStageId = null;

  radioButtons.forEach(button => {
    button.addEventListener('change', () => {
      stages.forEach(stage => stage.classList.remove('active'));
      const selectedStage = document.querySelector(`.selectStage[data-id="${button.id}"]`);
      if (selectedStage) {
        selectedStage.classList.add('active');
        selectedStageId = button.id;
      }

      if (btnEscenario) {
        chosenStage.setAttribute('aria-disabled', 'false');
        btnEscenario.removeAttribute('disabled');
      }
    });
  });

  btnEscenario.addEventListener('click', () => {
    if (selectedStageId) {
      localStorage.setItem('selectedStage', selectedStageId);
      window.location.href = 'soloHUD.html';
    }
  });
});
