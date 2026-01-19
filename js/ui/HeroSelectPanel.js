// 角色选择面板
class HeroSelectPanel {
  constructor() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'heroSelectOverlay';
    this.overlay.classList.add('hidden');

    this.panel = document.createElement('div');
    this.panel.className = 'hero-select-panel';

    this.title = document.createElement('div');
    this.title.className = 'hero-select-title';
    this.title.textContent = '选择角色';

    this.grid = document.createElement('div');
    this.grid.className = 'hero-grid';

    this.panel.appendChild(this.title);
    this.panel.appendChild(this.grid);
    this.overlay.appendChild(this.panel);

    document.body.appendChild(this.overlay);
  }

  show(heroes, onSelect) {
    this.onSelect = onSelect;
    this.grid.innerHTML = '';

    heroes.forEach(hero => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'hero-card';

      const avatar = document.createElement('div');
      avatar.className = 'hero-avatar';
      avatar.textContent = hero.avatarText || '';
      if (hero.colors && hero.colors.avatar) {
        avatar.style.background = hero.colors.avatar;
      }

      const name = document.createElement('div');
      name.className = 'hero-name';
      name.textContent = hero.name || '未知角色';

      const weapon = document.createElement('div');
      weapon.className = 'hero-weapon';
      const weaponName = hero.weapon && hero.weapon.name ? hero.weapon.name : '未知武器';
      weapon.textContent = `初始武器: ${weaponName}`;

      const stats = document.createElement('div');
      stats.className = 'hero-stats';

      const statsLines = this.buildStatsLines(hero);
      statsLines.forEach(text => {
        const line = document.createElement('div');
        line.textContent = text;
        stats.appendChild(line);
      });

      card.appendChild(avatar);
      card.appendChild(name);
      card.appendChild(weapon);
      card.appendChild(stats);

      card.addEventListener('click', () => {
        this.hide();
        if (this.onSelect) {
          this.onSelect(hero);
        }
      });

      this.grid.appendChild(card);
    });

    this.overlay.classList.remove('hidden');
  }

  hide() {
    this.overlay.classList.add('hidden');
  }

  buildStatsLines(hero) {
    const stats = hero.stats || {};
    const mount = hero.mount || {};
    const overrides = hero.weapon && hero.weapon.overrides ? hero.weapon.overrides : {};
    const cooldown = overrides.cooldown || 2.0;
    const speedValue = mount.maxSpeed || stats.maxSpeed || '-';
    const agilityValue = mount.acceleration || stats.acceleration || '-';

    return [
      `速度: ${speedValue}`,
      `灵活度: ${agilityValue}`,
      `攻击频率: ${(1 / cooldown).toFixed(2)}次/秒`,
      `伤害: ${overrides.damage || '-'}`,
      `击退: ${overrides.knockback || '-'}`,
      `攻击数: ${overrides.maxTargets || 1}`
    ];
  }
}
