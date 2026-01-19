// 游戏核心类
class Game {
  constructor() {
    this.canvas = null;
    this.context = null;
    this.config = new ConfigManager();
    this.camera = null;
    this.map = null;
    this.input = null;
    this.player = null;
    this.collisionSystem = null;
    this.combatSystem = null;
    this.aiSystem = null;
    this.entities = []; // 所有实体列表
    this.coins = 0;
    this.upgradeThresholds = [10, 50];
    this.upgradeIndex = 0;
    this.upgradeActive = false;
    this.unlockedWeapons = { sword: false, bow: false, lance: false };
    this.upgradePanel = null;
    this.gameOver = false;
    this.gameOverOverlay = null;
    this.gameOverMessage = null;
    this.gameOverButton = null;
    this.level = 1;
    this.heroSelectPanel = null;
    this.selectedHero = null;
    this.awaitingHeroSelection = false;
    
    this.running = false;
    this.paused = false;
    this.lastTime = 0;
    
    this.initialized = false;
    this.buildings = []; // 建筑物列表
  }

  // 初始化游戏
  async init() {
    console.log('游戏初始化开始...');

    // 加载配置
    const loaded = await this.config.loadAll();
    if (!loaded) {
      throw new Error('配置加载失败');
    }

    // 创建Canvas
    this.canvas = document.getElementById('gameCanvas');
    this.context = this.canvas.getContext('2d');

    // 设置Canvas尺寸
    const canvasWidth = this.config.get('game.canvas.width');
    const canvasHeight = this.config.get('game.canvas.height');
    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;

    // 创建摄像机
    const worldWidth = this.config.get('game.world.mapWidth');
    const worldHeight = this.config.get('game.world.mapHeight');
    const pixelsPerMeter = this.config.get('game.world.pixelsPerMeter');
    
    this.camera = new Camera(canvasWidth, canvasHeight, worldWidth, worldHeight, pixelsPerMeter);

    // 创建地图
    this.map = new BattleMap({
      world: this.config.get('game.world'),
      map: this.config.get('map'),
      game: this.config.get('game')
    });

    // 创建输入管理器
    this.input = new Input(this.canvas);
    
    // 创建小地图
    this.minimap = new Minimap(this.canvas, this);

    // 创建升级面板
    this.upgradePanel = new UpgradePanel();
    this.createGameOverOverlay();
    this.heroSelectPanel = new HeroSelectPanel();
    
    // 设置输入管理器的小地图引用
    this.input.setMinimap(this.minimap);

    // 将game实例设为全局，方便武器系统访问
    window.game = this;

    // 初始化本局状态（等待角色选择）
    this.beginHeroSelection();

    this.initialized = true;
    console.log('游戏初始化完成');
  }

  // 创建测试敌人
  createTestEnemies() {
    // 获取配置
    const infantryConfig = this.config.get('character.infantry');
    const archerConfig = this.config.get('character.archer');
    const cavalryConfig = this.config.get('character.cavalry');
    const swordConfig = this.config.get('weapon.sword');
    const bowConfig = this.config.get('weapon.bow');
    const lanceConfig = this.config.get('weapon.lance');
    const mountConfig = this.config.get('mount.defaultHorse');
    
    // 创建步兵（近战）
    const infantryPositions = [
      { x: 75 + 15, y: 15 },
      { x: 75 + 18, y: 15 - 3 },
      { x: 75 + 20, y: 15 + 3 }
    ];
    
    infantryPositions.forEach(pos => {
      const infantry = new Infantry(pos.x, pos.y, 'enemy', infantryConfig, swordConfig);
      this.entities.push(infantry);
      this.collisionSystem.addEntity(infantry);
      this.combatSystem.addEntity(infantry);
      this.aiSystem.addEntity(infantry);
    });
    
    // 创建弓兵（远程）
    const archerPositions = [
      { x: 75 + 25, y: 15 - 5 },
      { x: 75 + 28, y: 15 + 5 }
    ];
    
    archerPositions.forEach(pos => {
      const archer = new Archer(pos.x, pos.y, 'enemy', archerConfig, bowConfig);
      this.entities.push(archer);
      this.collisionSystem.addEntity(archer);
      this.combatSystem.addEntity(archer);
      this.aiSystem.addEntity(archer);
    });
    
    // 创建骑兵（冲锋）
    const cavalryPositions = [
      { x: 75 + 30, y: 15 },
      { x: 75 + 35, y: 15 + 3 }
    ];
    
    cavalryPositions.forEach(pos => {
      const cavalry = new Cavalry(pos.x, pos.y, 'enemy', cavalryConfig, mountConfig, lanceConfig);
      this.entities.push(cavalry);
      this.collisionSystem.addEntity(cavalry);
      this.combatSystem.addEntity(cavalry);
      this.aiSystem.addEntity(cavalry);
    });

    console.log(`创建了 ${infantryPositions.length} 个步兵、${archerPositions.length} 个弓兵、${cavalryPositions.length} 个骑兵`);
  }

  beginHeroSelection() {
    const heroes = this.getHeroOptions();
    if (!heroes || heroes.length === 0) {
      this.selectedHero = null;
      this.awaitingHeroSelection = false;
      this.setupSession();
      return;
    }

    this.awaitingHeroSelection = true;
    if (this.canvas) {
      this.canvas.style.pointerEvents = 'none';
    }

    if (this.heroSelectPanel) {
      this.heroSelectPanel.show(heroes, (hero) => {
        this.selectedHero = hero;
        this.awaitingHeroSelection = false;
        if (this.canvas) {
          this.canvas.style.pointerEvents = 'auto';
        }
        this.setupSession();
      });
    }
  }

  getHeroOptions() {
    const config = this.config.get('hero.heroes');
    if (Array.isArray(config)) return config;
    return [];
  }

  getSelectedHero() {
    const heroes = this.getHeroOptions();
    if (this.selectedHero) return this.selectedHero;
    return heroes.length > 0 ? heroes[0] : null;
  }

  // 初始化一局游戏的动态状态
  setupSession() {
    console.log('开始初始化游戏会话...');
    
    this.entities = [];
    this.buildings = [];
    this.coins = 0;
    this.upgradeIndex = 0;
    this.upgradeActive = false;
    this.unlockedWeapons = { sword: false, bow: false, lance: false };
    this.awaitingHeroSelection = false;

    if (this.upgradePanel) {
      this.upgradePanel.hide();
    }

    if (this.heroSelectPanel) {
      this.heroSelectPanel.hide();
    }

    if (this.gameOverOverlay) {
      this.gameOverOverlay.classList.add('hidden');
    }

    if (this.canvas) {
      this.canvas.style.pointerEvents = 'auto';
    }

    this.gameOver = false;

    this.collisionSystem = new CollisionSystem();
    this.combatSystem = new CombatSystem();
    this.aiSystem = new AISystem();

    console.log('创建建筑物...');
    this.createBuildings();
    
    console.log('创建玩家...');
    this.createPlayer();
    
    console.log('创建初始敌人...');
    this.createInitialEnemies();

    this.camera.follow(this.player);
    this.camera.position.copy(this.player.transform.position);
    this.camera.update(0);
    
    console.log('游戏会话初始化完成，准备开始游戏');
  }

  // 创建玩家（在己方建筑旁）
  createPlayer() {
    const basePlayerConfig = this.config.get('character.player');
    const hero = this.getSelectedHero();
    const heroStats = hero && hero.stats ? hero.stats : {};
    const heroColors = hero && hero.colors ? hero.colors : {};

    const playerConfig = {
      ...basePlayerConfig,
      ...heroStats,
      bodyColor: heroColors.body,
      headColor: heroColors.head,
      emblemColor: heroColors.accent,
      avatarText: hero && hero.avatarText ? hero.avatarText : '',
      avatarColor: heroColors.avatar || heroColors.body,
      avatarBorderColor: heroColors.accent || '#ffffff',
      heroName: hero && hero.name ? hero.name : ''
    };

    const mountConfig = {
      ...this.config.get('mount.defaultHorse'),
      ...(hero && hero.mount ? hero.mount : {})
    };
    const playerBuildingPos = this.config.get('map.playerBuilding');

    this.player = new Player(playerBuildingPos.x + 5, playerBuildingPos.y, playerConfig, mountConfig);
    this.entities.push(this.player);
    this.collisionSystem.addEntity(this.player);
    this.combatSystem.addEntity(this.player);

    const weaponInfo = hero && hero.weapon ? hero.weapon : { type: 'sword' };
    const weaponType = weaponInfo.type || 'sword';
    const baseWeaponConfig = this.config.get(`weapon.${weaponType}`) || {};
    const weaponConfig = {
      ...baseWeaponConfig,
      ...(weaponInfo.overrides || {})
    };

    // 为关羽和张飞设置专属武器图片
    const heroId = hero && hero.id ? hero.id : '';
    if (heroId === 'guanyu' && weaponType === 'sword') {
      weaponConfig.imagePath = 'res/guandao.png'; // 关羽的大刀
    } else if (heroId === 'zhangfei' && weaponType === 'sword') {
      weaponConfig.imagePath = 'res/snakeSpear.png'; // 张飞的蛇矛
    }

    let weapon = null;
    if (weaponType === 'bow') {
      weapon = new Bow(weaponConfig, this.player);
      this.unlockedWeapons.bow = true;
    } else if (weaponType === 'lance') {
      weapon = new Lance(weaponConfig, this.player);
      this.unlockedWeapons.lance = true;
    } else {
      weapon = new Sword(weaponConfig, this.player);
      this.unlockedWeapons.sword = true;
    }

    if (weapon) {
      this.player.equipWeapon(weapon);
    }
  }
  
  // 创建建筑物
  createBuildings() {
    const playerBuildingConfig = this.config.get('map.playerBuilding');
    const enemyBuildingConfig = this.config.get('map.enemyBuilding');
    
    // 创建玩家建筑物
    const playerBuilding = new Building(
      playerBuildingConfig.x,
      playerBuildingConfig.y,
      'player',
      playerBuildingConfig
    );
    
    // 创建敌人建筑物，设置出兵间隔为玩家建筑的80%（快20%）
    const enemyBuildingConfigWithFastSpawn = {
      ...enemyBuildingConfig,
      spawnInterval: (enemyBuildingConfig.spawnInterval || 10) * 0.8,  // 快20%
      firstSpawnTime: 2.4  // 第一波兵2.4秒后刷新（比玩家的3秒快20%）
    };
    
    const enemyBuilding = new Building(
      enemyBuildingConfig.x,
      enemyBuildingConfig.y,
      'enemy',
      enemyBuildingConfigWithFastSpawn
    );
    
    // 修改玩家建筑的第一波兵时间
    playerBuilding.firstSpawnTime = 3; // 玩家建筑第一波兵3秒后刷新
    
    this.buildings.push(playerBuilding);
    this.buildings.push(enemyBuilding);
    
    console.log('创建了玩家和敌人建筑物（敌人出兵速度更快20%）');
  }

  // 创建初始敌人
  createInitialEnemies() {
    console.log('创建初始敌人...');
    
    // 获取配置
    const infantryConfig = this.config.get('character.infantry');
    const archerConfig = this.config.get('character.archer');
    const cavalryConfig = this.config.get('character.cavalry');
    const swordConfig = this.config.get('weapon.sword');
    const bowConfig = this.config.get('weapon.bow');
    const lanceConfig = this.config.get('weapon.lance');
    const mountConfig = this.config.get('mount.defaultHorse');
    
    // 初始敌人位置（靠近敌方建筑）
    const enemyBuildingPos = this.config.get('map.enemyBuilding');
    const initialPositions = [
      // 步兵位置
      { x: enemyBuildingPos.x - 10, y: enemyBuildingPos.y - 5 },
      { x: enemyBuildingPos.x - 10, y: enemyBuildingPos.y + 5 },
      // 弓兵位置
      { x: enemyBuildingPos.x - 15, y: enemyBuildingPos.y },
      // 骑兵位置
      { x: enemyBuildingPos.x - 8, y: enemyBuildingPos.y }
    ];
    
    // 创建1个骑兵
    const cavalry = new Cavalry(
      initialPositions[3].x,
      initialPositions[3].y,
      'enemy',
      cavalryConfig,
      mountConfig,
      lanceConfig
    );
    this.entities.push(cavalry);
    this.collisionSystem.addEntity(cavalry);
    this.combatSystem.addEntity(cavalry);
    this.aiSystem.addEntity(cavalry);
    
    // 创建2个步兵
    for (let i = 0; i < 2; i++) {
      const infantry = new Infantry(initialPositions[i].x, initialPositions[i].y, 'enemy', infantryConfig, swordConfig);
      this.entities.push(infantry);
      this.collisionSystem.addEntity(infantry);
      this.combatSystem.addEntity(infantry);
      this.aiSystem.addEntity(infantry);
    }
    
    // 创建1个弓兵
    const archer = new Archer(initialPositions[2].x, initialPositions[2].y, 'enemy', archerConfig, bowConfig);
    this.entities.push(archer);
    this.collisionSystem.addEntity(archer);
    this.combatSystem.addEntity(archer);
    this.aiSystem.addEntity(archer);
    
    console.log('创建了初始敌人：1个骑兵，2个步兵，1个弓兵');
  }

  getSpawnConfig() {
    return this.config.get('game.spawn') || { infantry: 4, archer: 2, cavalry: 1 };
  }

  getEnemyCountScale() {
    return 1 + (this.level - 1) * 0.2;
  }

  getEnemyHealthScale() {
    return 1 + (this.level - 1) * 0.25;
  }

  getSpawnCounts(team) {
    const base = this.getSpawnConfig();
    if (team !== 'enemy') {
      return { ...base };
    }

    const scale = this.getEnemyCountScale();
    return {
      infantry: Math.max(1, Math.ceil(base.infantry * scale)),
      archer: Math.max(0, Math.ceil(base.archer * scale)),
      cavalry: Math.max(0, Math.ceil(base.cavalry * scale))
    };
  }

  getUnitConfig(type, team) {
    const base = this.config.get(`character.${type}`);
    if (team !== 'enemy') return base;

    const scaled = {
      ...base,
      health: Math.round((base.health || 0) * this.getEnemyHealthScale())
    };
    return scaled;
  }

  // 启动游戏循环
  start() {
    if (!this.initialized) {
      console.error('游戏未初始化');
      return;
    }

    this.running = true;
    this.lastTime = performance.now();
    this.gameLoop();
    console.log('游戏开始');
  }

  // 游戏主循环
  gameLoop() {
    if (!this.running) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; // 转换为秒
    this.lastTime = currentTime;

    // 更新和渲染
    if (!this.paused) {
      this.update(deltaTime);
    }
    this.render();

    // 继续循环
    requestAnimationFrame(() => this.gameLoop());
  }

  // 更新游戏逻辑
  update(deltaTime) {
    // 限制deltaTime防止跳跃
    deltaTime = Math.min(deltaTime, 0.1);
    if (this.gameOver || this.awaitingHeroSelection) return;

    // 更新输入
    this.input.update();

    // 获取输入方向
    const direction = this.input.getDirection();
    
    // 玩家移动
    this.player.move(direction);
    
    // 更新所有实体
    this.entities.forEach(entity => {
      if (entity.active) {
        entity.update(deltaTime);
        // 限制实体在地图范围内
        this.map.clampPosition(entity.transform.position);
      }
    });

    // 更新AI系统
    this.aiSystem.update(this.entities, deltaTime);
    
    // 更新碰撞系统
    this.collisionSystem.update(deltaTime);
    
    // 更新战斗系统
    this.combatSystem.update(deltaTime);
    
    // 更新建筑物
    this.buildings.forEach(building => {
      building.update(deltaTime);
    });

    this.checkGameOver();
    if (this.gameOver) return;

    // 更新摄像机
    this.camera.update(deltaTime);
  }

  // 渲染游戏画面
  render() {
    // 清空画布
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 渲染地图
    this.map.render(this.context, this.camera);
    
    // 渲染建筑物
    this.buildings.forEach(building => {
      building.render(this.context, this.camera);
    });

    // 渲染所有实体
    this.entities.forEach(entity => {
      if (entity.active) {
        entity.render(this.context, this.camera);
      }
    });
    
    // 渲染战斗系统调试信息
    if (this.combatSystem) {
      this.combatSystem.renderDebug(this.context, this.camera);
    }

    // 渲染UI（摇杆和小地图）
    this.input.render(this.context);
    this.minimap.render(this.context);
    
    // 渲染玩家HP（左上角）
    this.renderPlayerHP();

    // 渲染金币计数条（右上角）
    this.renderCoinBar();

    // 渲染关卡信息
    this.renderLevelIndicator();
  }
  
  // 渲染玩家HP条
  renderPlayerHP() {
    if (!this.player || !this.player.alive) return;
    
    const ctx = this.context;
    const padding = 20;
    const barWidth = 200;
    const barHeight = 25;
    const avatarRadius = 18;
    const hasAvatar = this.player.avatarText && this.player.avatarText.length > 0;
    const x = hasAvatar ? padding + avatarRadius * 2 + 10 : padding;
    const y = padding;
    
    // 计算生命值比例
    const healthRatio = this.player.health / this.player.maxHealth;
    
    // 绘制背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x, y, barWidth, barHeight);
    
    // 绘制生命值条
    const hpColor = healthRatio > 0.6 ? '#2ecc71' : (healthRatio > 0.3 ? '#f39c12' : '#e74c3c');
    ctx.fillStyle = hpColor;
    ctx.fillRect(x + 2, y + 2, (barWidth - 4) * healthRatio, barHeight - 4);
    
    // 绘制边框
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);
    
    // 绘制HP文字
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const hpText = `HP: ${Math.ceil(this.player.health)} / ${this.player.maxHealth}`;
    ctx.fillText(hpText, x + barWidth / 2, y + barHeight / 2);

    // 绘制头像
    if (hasAvatar) {
      const avatarX = padding + avatarRadius;
      const avatarY = y + barHeight / 2;

      ctx.fillStyle = this.player.avatarColor || '#666666';
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = this.player.avatarBorderColor || '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.player.avatarText, avatarX, avatarY);
    }
  }

  // 渲染当前关卡
  renderLevelIndicator() {
    const ctx = this.context;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`LEVEL ${this.level}`, this.canvas.width / 2, 18);
  }

  // 渲染金币计数条
  renderCoinBar() {
    const ctx = this.context;
    const layout = this.getCoinBarLayout();
    const x = layout.x;
    const y = layout.y;
    const barWidth = layout.width;
    const barHeight = layout.height;
    const iconRadius = layout.iconRadius;

    const nextThreshold = this.getNextUpgradeThreshold();
    const lastThreshold = this.getLastUpgradeThreshold();
    let progress = 1;
    let label = `${this.coins}`;

    if (nextThreshold) {
      const span = nextThreshold - lastThreshold;
      progress = MathUtil.clamp((this.coins - lastThreshold) / span, 0, 1);
      label = `${this.coins}/${nextThreshold}`;
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(x, y, barWidth, barHeight);

    const progressHeight = 4;
    ctx.fillStyle = 'rgba(241, 196, 15, 0.8)';
    ctx.fillRect(x + 2, y + barHeight - progressHeight - 2, (barWidth - 4) * progress, progressHeight);

    const iconX = x + iconRadius + 8;
    const iconY = y + barHeight / 2;
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(iconX, iconY, iconRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#f9e79f';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, iconX + iconRadius + 8, iconY);
  }

  createGameOverOverlay() {
    this.gameOverOverlay = document.createElement('div');
    this.gameOverOverlay.id = 'gameOverOverlay';
    this.gameOverOverlay.classList.add('hidden');

    const panel = document.createElement('div');
    panel.className = 'gameover-panel';

    const title = document.createElement('div');
    title.className = 'gameover-title';
    title.textContent = '游戏结束';

    this.gameOverMessage = document.createElement('div');
    this.gameOverMessage.className = 'gameover-message';
    this.gameOverMessage.textContent = '';

    this.gameOverButton = document.createElement('button');
    this.gameOverButton.type = 'button';
    this.gameOverButton.className = 'gameover-btn';
    this.gameOverButton.textContent = '下一局';
    this.gameOverButton.addEventListener('click', () => {
      this.startNextLevel();
    });

    panel.appendChild(title);
    panel.appendChild(this.gameOverMessage);
    panel.appendChild(this.gameOverButton);
    this.gameOverOverlay.appendChild(panel);
    document.body.appendChild(this.gameOverOverlay);
  }

  checkGameOver() {
    if (this.gameOver) return;
    const playerBuilding = this.buildings.find(b => b.type === 'player');
    const enemyBuilding = this.buildings.find(b => b.type === 'enemy');

    const playerDown = playerBuilding && playerBuilding.health <= 0;
    const enemyDown = enemyBuilding && enemyBuilding.health <= 0;

    if (playerDown && enemyDown) {
      this.endGame('平局', false);
    } else if (playerDown) {
      this.endGame('红方胜利', false);
    } else if (enemyDown) {
      this.endGame('蓝方胜利', true);
    }
  }

  endGame(resultText, canContinue) {
    if (this.gameOver) return;
    this.gameOver = true;
    this.paused = true;
    this.running = false;

    if (this.upgradePanel) {
      this.upgradePanel.hide();
      this.upgradeActive = false;
    }

    if (this.canvas) {
      this.canvas.style.pointerEvents = 'none';
    }

    if (this.gameOverOverlay && this.gameOverMessage) {
      this.gameOverMessage.textContent = resultText;
      if (this.gameOverButton) {
        this.gameOverButton.classList.toggle('hidden', !canContinue);
      }
      this.gameOverOverlay.classList.remove('hidden');
    }
  }

  startNextLevel() {
    if (!this.gameOver) return;

    this.level += 1;
    this.setupSession();
    this.lastTime = performance.now();
    this.running = true;
    this.paused = false;
    this.gameLoop();
  }

  getCoinBarLayout() {
    const padding = 20;
    const barWidth = 160;
    const barHeight = 24;
    const x = this.canvas.width - barWidth - padding;
    const y = this.minimap ? this.minimap.y + this.minimap.height + 12 : padding;

    return {
      x,
      y,
      width: barWidth,
      height: barHeight,
      iconRadius: 9
    };
  }

  getCoinTargetScreenPosition() {
    const layout = this.getCoinBarLayout();
    return new Vector2(layout.x + layout.iconRadius + 8, layout.y + layout.height / 2);
  }

  spawnCoin(position) {
    if (!position) return;
    const coin = new Coin(position.x, position.y);
    this.addEntity(coin);
  }

  addCoins(amount) {
    this.coins += amount;
    this.checkUpgrades();
  }

  getNextUpgradeThreshold() {
    return this.upgradeThresholds[this.upgradeIndex] || null;
  }

  getLastUpgradeThreshold() {
    if (this.upgradeIndex <= 0) return 0;
    return this.upgradeThresholds[this.upgradeIndex - 1];
  }

  checkUpgrades() {
    if (this.upgradeActive || this.awaitingHeroSelection) return;
    const nextThreshold = this.getNextUpgradeThreshold();
    if (nextThreshold && this.coins >= nextThreshold) {
      this.openUpgradePanel();
    }
  }

  openUpgradePanel() {
    const options = this.getUpgradeOptions();
    if (!this.upgradePanel || options.length === 0) {
      this.upgradeIndex += 1;
      return;
    }

    this.upgradeActive = true;
    this.pause();
    if (this.canvas) {
      this.canvas.style.pointerEvents = 'none';
    }

    this.upgradePanel.show(options, (weaponType) => {
      this.unlockWeapon(weaponType);
      this.upgradeActive = false;
      this.upgradeIndex += 1;
      if (this.canvas) {
        this.canvas.style.pointerEvents = 'auto';
      }
      this.resume();
    });
  }

  getUpgradeOptions() {
    const options = [];
    if (!this.unlockedWeapons.sword) {
      options.push({ type: 'sword', label: '解锁剑' });
    }
    if (!this.unlockedWeapons.bow) {
      options.push({ type: 'bow', label: '解锁弓' });
    }
    if (!this.unlockedWeapons.lance) {
      options.push({ type: 'lance', label: '解锁骑枪' });
    }
    return options;
  }

  unlockWeapon(type) {
    if (!this.player) return;

    if (type === 'sword' && !this.unlockedWeapons.sword) {
      const swordConfig = this.config.get('weapon.sword');
      const sword = new Sword(swordConfig, this.player);
      this.player.equipWeapon(sword);
      this.unlockedWeapons.sword = true;
      console.log('解锁剑');
    }

    if (type === 'bow' && !this.unlockedWeapons.bow) {
      const bowConfig = this.config.get('weapon.bow');
      const bow = new Bow(bowConfig, this.player);
      this.player.equipWeapon(bow);
      this.unlockedWeapons.bow = true;
      console.log('解锁弓');
    }

    if (type === 'lance' && !this.unlockedWeapons.lance) {
      const lanceConfig = this.config.get('weapon.lance');
      const lance = new Lance(lanceConfig, this.player);
      this.player.equipWeapon(lance);
      this.unlockedWeapons.lance = true;
      console.log('解锁骑枪');
    }
  }

  // 暂停游戏
  pause() {
    this.paused = true;
    console.log('游戏暂停');
  }

  // 恢复游戏
  resume() {
    this.paused = false;
    this.lastTime = performance.now();
    console.log('游戏恢复');
  }

  // 停止游戏
  stop() {
    this.running = false;
    console.log('游戏停止');
  }
  
  // 添加实体（用于动态生成，如箭矢）
  addEntity(entity) {
    this.entities.push(entity);
  }
}
