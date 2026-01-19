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
    const weapon = hero.weapon || {};
    const overrides = weapon.overrides || {};
    
    // 基本属性
    const speedValue = mount.maxSpeed || stats.maxSpeed || '-';
    const agilityValue = mount.acceleration || stats.acceleration || '-';
    const healthValue = stats.health || '-';
    
    // 武器属性
    const weaponType = weapon.type || 'sword';
    const weaponName = weapon.name || '未知武器';
    const cooldown = overrides.cooldown || 2.0;
    const damage = overrides.damage || '-';
    const knockback = overrides.knockback || '-';
    const maxTargets = overrides.maxTargets || 1;
    const attackRange = overrides.attackRange || '-';
    
    // 攻击频率（次/秒）
    const attackFrequency = (1 / cooldown).toFixed(2);
    
    return [
      `速度: ${speedValue}`,
      `灵活度: ${agilityValue}`,
      `生命值: ${healthValue}`,
      `攻击频率: ${attackFrequency}次/秒`,
      `伤害: ${damage}`,
      `击退: ${knockback}`,
      `攻击范围: ${attackRange}米`,
      `最多攻击: ${maxTargets}个敌人`
    ];
  }
}