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

    // 创建碰撞系统
    this.collisionSystem = new CollisionSystem();
    
    // 创建战斗系统
    this.combatSystem = new CombatSystem();
    
    // 创建AI系统
    this.aiSystem = new AISystem();
    
    // 将game实例设为全局，方便武器系统访问
    window.game = this;
    
    // 创建建筑物
    this.createBuildings();

    // 创建玩家（在己方建筑旁）
    const playerConfig = this.config.get('character.player');
    const mountConfig = this.config.get('mount.defaultHorse');
    const playerBuildingPos = this.config.get('map.playerBuilding');
    // 在建筑物前方5米处生成玩家
    this.player = new Player(playerBuildingPos.x + 5, playerBuildingPos.y, playerConfig, mountConfig);
    this.entities.push(this.player);
    this.collisionSystem.addEntity(this.player);
    this.combatSystem.addEntity(this.player);
    
    // 给玩家装备剑
    const swordConfig = this.config.get('weapon.sword');
    const sword = new Sword(swordConfig, this.player);
    this.player.equipWeapon(sword);
    
    // 给玩家装备弓
    const bowConfig = this.config.get('weapon.bow');
    const bow = new Bow(bowConfig, this.player);
    this.player.equipWeapon(bow);
    
    // 给玩家装备骑枪
    const lanceConfig = this.config.get('weapon.lance');
    const lance = new Lance(lanceConfig, this.player);
    this.player.equipWeapon(lance);

    // 摄像机跟随玩家
    this.camera.follow(this.player);

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
    this.combatSystem.renderDebug(this.context, this.camera);

    // 渲染UI（摇杆）
    this.input.render(this.context);
    
    // 渲染玩家HP（左上角）
    this.renderPlayerHP();
  }
  
  // 渲染玩家HP条
  renderPlayerHP() {
    if (!this.player || !this.player.alive) return;
    
    const ctx = this.context;
    const padding = 20;
    const barWidth = 200;
    const barHeight = 25;
    const x = padding;
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
