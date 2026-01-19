// 建筑物类
class Building {
  constructor(x, y, type, config) {
    this.position = new Vector2(x, y);
    this.type = type; // 'player' 或 'enemy'
    this.config = config;
    
    // 建筑物尺寸
    this.width = config.width || 4; // 米
    this.height = config.height || 6; // 米
    
    // 建筑物生命值
    this.maxHealth = config.health || 500;
    this.health = this.maxHealth;
    
    // 出兵相关
    this.spawnTimer = 0;
    this.spawnInterval = config.spawnInterval || 10; // 10秒
    this.lastSpawnTime = 0;
    this.firstSpawnTime = 3; // 第一波兵3秒后刷新
    this.hasFirstSpawned = false; // 是否已经生成第一波兵
    this.active = true;
    
    // 图片资源
    this.image = null;
    this.imageLoaded = false;
    this.loadImage(config.imagePath);
  }
  
  loadImage(path) {
    if (path) {
      this.image = new Image();
      this.image.onload = () => {
        this.imageLoaded = true;
      };
      this.image.onerror = () => {
        console.error(`建筑物图片加载失败: ${path}`);
      };
      this.image.src = path;
    }
  }
  
  // 更新
  update(deltaTime) {
    // 如果建筑物已被摧毁，不再更新
    if (this.health <= 0) {
      return;
    }
    
    // 更新计时器
    this.spawnTimer += deltaTime;
    
    // 检查是否到了第一波出兵时间
    if (!this.hasFirstSpawned && this.spawnTimer >= this.firstSpawnTime) {
      this.spawnUnits();
      this.lastSpawnTime = this.spawnTimer;
      this.hasFirstSpawned = true;
      console.log(`${this.type}建筑在${this.firstSpawnTime}秒后出兵`);
    }
    // 到达后续出兵时间
    else if (this.hasFirstSpawned && (this.spawnTimer - this.lastSpawnTime >= this.spawnInterval)) {
      this.spawnUnits();
      this.lastSpawnTime = this.spawnTimer;
    }
  }
  
  // 生成士兵
  spawnUnits() {
    if (!window.game || !window.game.addEntity) return;
    const game = window.game;
    
    // 士兵配置
    const infantryConfig = game.getUnitConfig('infantry', this.type);
    const archerConfig = game.getUnitConfig('archer', this.type);
    const cavalryConfig = game.getUnitConfig('cavalry', this.type);
    
    const mountConfig = game.config.get('mount.defaultHorse');
    const swordConfig = game.config.get('weapon.sword');
    const bowConfig = game.config.get('weapon.bow');
    const lanceConfig = game.config.get('weapon.lance');
    
    // 确定队伍
    const team = this.type;
    
    // 计算生成位置（建筑物前方的随机位置）
    const spawnOffset = 5; // 建筑物前方5米处
    const baseX = this.type === 'player' ? 
      this.position.x + spawnOffset : 
      this.position.x - spawnOffset;
    
    const spawnCounts = game.getSpawnCounts(team);

    // 生成步兵
    for (let i = 0; i < spawnCounts.infantry; i++) {
      const offsetX = (Math.random() - 0.5) * 4; // 随机偏移±2米
      const offsetY = (Math.random() - 0.5) * 3; // 随机偏移±1.5米
      
      const infantry = new Infantry(
        baseX + offsetX, 
        this.position.y + offsetY, 
        team, 
        infantryConfig, 
        swordConfig
      );
      
      game.addEntity(infantry);
      game.collisionSystem.addEntity(infantry);
      game.combatSystem.addEntity(infantry);
      game.aiSystem.addEntity(infantry);
    }
    
    // 生成弓兵
    for (let i = 0; i < spawnCounts.archer; i++) {
      const offsetX = (Math.random() - 0.5) * 4; // 随机偏移±2米
      const offsetY = (Math.random() - 0.5) * 3; // 随机偏移±1.5米
      
      const archer = new Archer(
        baseX + offsetX, 
        this.position.y + offsetY, 
        team, 
        archerConfig, 
        bowConfig
      );
      
      game.addEntity(archer);
      game.collisionSystem.addEntity(archer);
      game.combatSystem.addEntity(archer);
      game.aiSystem.addEntity(archer);
    }
    
    // 生成骑兵
    for (let i = 0; i < spawnCounts.cavalry; i++) {
      const offsetX = (Math.random() - 0.5) * 4; // 随机偏移±2米
      const offsetY = (Math.random() - 0.5) * 3; // 随机偏移±1.5米
      
      const cavalry = new Cavalry(
        baseX + offsetX, 
        this.position.y + offsetY, 
        team, 
        cavalryConfig, 
        mountConfig, 
        lanceConfig
      );
      
      game.addEntity(cavalry);
      game.collisionSystem.addEntity(cavalry);
      game.combatSystem.addEntity(cavalry);
      game.aiSystem.addEntity(cavalry);
    }
    
    console.log(`${this.type}建筑出兵: ${spawnCounts.infantry}步兵, ${spawnCounts.archer}弓兵, ${spawnCounts.cavalry}骑兵`);
  }
  
  // 渲染
  render(context, camera) {
    const screenPos = camera.worldToScreen(this.position);
    const screenWidth = camera.worldToScreenDistance(this.width);
    const screenHeight = camera.worldToScreenDistance(this.height);
    
    // 如果没有图片，使用简单形状代替
    if (!this.imageLoaded) {
      context.fillStyle = this.type === 'player' ? '#3498db' : '#e74c3c';
      context.fillRect(
        screenPos.x - screenWidth / 2,
        screenPos.y - screenHeight / 2,
        screenWidth,
        screenHeight
      );
      
      // 绘制旗帜
      context.fillStyle = this.type === 'player' ? '#2980b9' : '#c0392b';
      context.beginPath();
      context.moveTo(screenPos.x, screenPos.y - screenHeight / 2);
      context.lineTo(screenPos.x + screenWidth / 2, screenPos.y - screenHeight);
      context.lineTo(screenPos.x, screenPos.y - screenHeight / 4);
      context.closePath();
      context.fill();
    } else {
      // 使用图片渲染
      context.drawImage(
        this.image,
        screenPos.x - screenWidth / 2,
        screenPos.y - screenHeight / 2,
        screenWidth,
        screenHeight
      );
    }
    
    // 渲染生命值条
    if (this.health < this.maxHealth) {
      const hpBarWidth = screenWidth * 1.2;
      const hpBarHeight = 8;
      const hpBarY = screenPos.y - screenHeight / 2 - 15;
      
      // 背景
      context.fillStyle = 'rgba(0, 0, 0, 0.5)';
      context.fillRect(
        screenPos.x - hpBarWidth / 2,
        hpBarY,
        hpBarWidth,
        hpBarHeight
      );
      
      // HP条
      const healthRatio = this.health / this.maxHealth;
      const hpColor = healthRatio > 0.6 ? '#2ecc71' : (healthRatio > 0.3 ? '#f39c12' : '#e74c3c');
      context.fillStyle = hpColor;
      context.fillRect(
        screenPos.x - hpBarWidth / 2 + 1,
        hpBarY + 1,
        (hpBarWidth - 2) * healthRatio,
        hpBarHeight - 2
      );
      
      // 边框
      context.strokeStyle = '#ffffff';
      context.lineWidth = 1;
      context.strokeRect(
        screenPos.x - hpBarWidth / 2,
        hpBarY,
        hpBarWidth,
        hpBarHeight
      );
    }
    
    // 渲染计时器（调试用）
    if (window.DEBUG) {
      const progress = (this.spawnTimer - this.lastSpawnTime) / this.spawnInterval;
      context.fillStyle = 'rgba(255, 255, 255, 0.8)';
      context.fillRect(screenPos.x - 30, screenPos.y - screenHeight / 2 - 20, 60 * progress, 5);
      
      context.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      context.strokeRect(screenPos.x - 30, screenPos.y - screenHeight / 2 - 20, 60, 5);
      
      context.fillStyle = 'rgba(255, 255, 255, 0.8)';
      context.font = '12px Arial';
      context.textAlign = 'center';
      context.fillText(`${Math.ceil(this.spawnInterval - (this.spawnTimer - this.lastSpawnTime))}s`, screenPos.x, screenPos.y - screenHeight / 2 - 25);
    }
  }
}
