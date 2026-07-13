// Shared Property Inspector logic. Each action's inspector.html sets
// window.ACTION_UUID before loading this file.

let ACTION_SETTING = { style: 'default' };
let form = null;

function applySettingToForm() {
  if (!form) return;
  const style = ACTION_SETTING && ACTION_SETTING.style === 'pixel' ? 'pixel' : 'default';
  const radio = form.querySelector(`input[name="style"][value="${style}"]`);
  if (radio) radio.checked = true;
}

$UD.connect(window.ACTION_UUID);

$UD.onConnected(() => {
  form = document.querySelector('#property-inspector');

  const wrapper = document.querySelector('.udpi-wrapper');
  if (wrapper) wrapper.classList.remove('hidden');

  applySettingToForm();

  form.addEventListener('input', () => {
    const selected = form.querySelector('input[name="style"]:checked');
    ACTION_SETTING = { style: selected ? selected.value : 'default' };
    $UD.sendParamFromPlugin(ACTION_SETTING);
  });
});

function loadParam(jsonObj) {
  if (jsonObj && jsonObj.param) {
    ACTION_SETTING = jsonObj.param;
    applySettingToForm();
  }
}

$UD.onAdd(loadParam);
$UD.onParamFromApp(loadParam);
