// 升级面板
class UpgradePanel {
  constructor() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'upgradeOverlay';
    this.overlay.classList.add('hidden');

    this.panel = document.createElement('div');
    this.panel.className = 'upgrade-panel';

    this.title = document.createElement('div');
    this.title.className = 'upgrade-title';
    this.title.textContent = '升级选择';

    this.description = document.createElement('div');
    this.description.className = 'upgrade-desc';
    this.description.textContent = '选择一种武器解锁';

    this.buttons = document.createElement('div');
    this.buttons.className = 'upgrade-buttons';

    this.panel.appendChild(this.title);
    this.panel.appendChild(this.description);
    this.panel.appendChild(this.buttons);
    this.overlay.appendChild(this.panel);

    document.body.appendChild(this.overlay);

    // 键盘支持相关
    this.selectedIndex = 0;
    this.options = [];
    this.onSelect = null;
    this.setupKeyboardEvents();
  }

  setupKeyboardEvents() {
    document.addEventListener('keydown', (e) => {
      if (this.overlay.classList.contains('hidden')) return;

      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          e.preventDefault();
          this.selectPrevious();
          break;
        case 'arrowdown':
        case 's':
          e.preventDefault();
          this.selectNext();
          break;
        case 'enter':
        case ' ': // 空格键
          e.preventDefault();
          this.confirmSelection();
          break;
      }
    });
  }

  selectPrevious() {
    this.selectedIndex--;
    if (this.selectedIndex < 0) {
      this.selectedIndex = this.options.length - 1;
    }
    this.updateSelection();
  }

  selectNext() {
    this.selectedIndex++;
    if (this.selectedIndex >= this.options.length) {
      this.selectedIndex = 0;
    }
    this.updateSelection();
  }

  confirmSelection() {
    if (this.options[this.selectedIndex]) {
      this.hide();
      if (this.onSelect) {
        this.onSelect(this.options[this.selectedIndex].type);
      }
    }
  }

  updateSelection() {
    const buttons = this.buttons.querySelectorAll('.upgrade-btn');
    buttons.forEach((button, index) => {
      if (index === this.selectedIndex) {
        button.classList.add('selected');
      } else {
        button.classList.remove('selected');
      }
    });
  }

  show(options, onSelect) {
    this.onSelect = onSelect;
    this.options = options;
    this.selectedIndex = 0;
    this.buttons.innerHTML = '';

    options.forEach(option => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'upgrade-btn';
      button.textContent = option.label;
      button.addEventListener('click', () => {
        this.hide();
        if (this.onSelect) {
          this.onSelect(option.type);
        }
      });

      this.buttons.appendChild(button);
    });

    // 更新选择状态
    this.updateSelection();
    this.overlay.classList.remove('hidden');
  }

  hide() {
    this.overlay.classList.add('hidden');
  }
}