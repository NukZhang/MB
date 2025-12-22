// 箭矢
class Arrow extends Entity {
  constructor(x, y, config, direction, owner) {
    super(x, y);
    this.type = 'arrow';
    this.team = owner.team;
    this.owner = owner;
    
    // 箭矢属性
    this.damage = config.damage || 30;
    this.speed = config.arrowSpeed || 15;
    this.range = config.range || 20;
    this.knockback = config.knockback || 1;
    
    // 飞行方向（归一化的向量）
    this.direction = direction.clone().normalize();
    
    // 飞行距离追踪
    this.traveledDistance = 0;
    
    // 命中目标集合（每个箭矢只能命中一个目标）
    this.hasHit = false;
    
  // 箭矢尺寸（根据角色尺寸比例缩放）
  // 玩家尺寸2.0米为基准，其他角色按比例缩放
  const sizeRatio = owner.radius / 1.0; // 1.0是玩家半径的一半
  this.length = 0.8 * sizeRatio; // 米
  this.width = 0.15 * sizeRatio; // 米
    
    // 加载图片
    this.image = null;
    this.imageLoaded = false;
    this.loadImage(config.imagePath || 'res/arrow.png');
    
    // 拖尾效果
    this.trailPositions = [];
    this.maxTrailLength = 8;
  }
  
  loadImage(path) {
    this.image = new Image();
    this.image.onload = () => {
      this.imageLoaded = true;
    };
    this.image.onerror = () => {
      console.error(`箭矢图片加载失败: ${path}`);
    };
    this.image.src = path;
  }
  
  update(deltaTime) {
    if (!this.active || this.hasHit) {
      this.active = false;
      return;
    }
    
    // 记录拖尾位置
    this.trailPositions.push(this.transform.position.clone());
    if (this.trailPositions.length > this.maxTrailLength) {
      this.trailPositions.shift();
    }
    
    // 移动箭矢
    const movement = this.direction.clone().multiply(this.speed * deltaTime);
    this.transform.translate(movement.x, movement.y);
    this.traveledDistance += movement.length();
    
    // 检查是否超出射程
    if (this.traveledDistance >= this.range) {
      this.active = false;
      return;
    }
    
    // 检查碰撞
    this.checkHit();
  }
  
  checkHit() {
    if (!window.game || !window.game.entities) return;
    
    for (const entity of window.game.entities) {
      // 跳过自己的队伍、已死亡、非活跃的实体
      if (entity.team === this.team || !entity.alive || !entity.active) continue;
      
      // 检查是否有碰撞器
      if (!entity.collider) continue;
      
      // 简单的圆形碰撞检测
      const distance = this.transform.position.distance(entity.transform.position);
      if (distance < entity.collider.radius) {
        this.hit(entity);
        break;
      }
    }
  }
  
  hit(target) {
    if (this.hasHit) return;
    
    this.hasHit = true;
    this.active = false;
    
    // 计算击退向量
    const knockbackVec = Vector2.multiply(this.direction, this.knockback);
    
    // 造成伤害（传递击退向量）
    if (target.takeDamage) {
      target.takeDamage(this.damage, knockbackVec);
    }
  }
  
  render(context, camera) {
    if (!this.active) return;
    
    const screenPos = camera.worldToScreen(this.transform.position);
    
    // 计算箭矢的旋转角度（指向飞行方向）
    const angle = Math.atan2(this.direction.y, this.direction.x);
    
    // 绘制拖尾
    if (this.trailPositions.length > 1) {
      context.save();
      context.lineCap = 'round';
      context.lineJoin = 'round';
      
      context.beginPath();
      for (let i = 0; i < this.trailPositions.length; i++) {
        const trailScreenPos = camera.worldToScreen(this.trailPositions[i]);
        
        if (i === 0) {
          context.moveTo(trailScreenPos.x, trailScreenPos.y);
        } else {
          context.lineTo(trailScreenPos.x, trailScreenPos.y);
        }
        
        // 渐变透明度和线宽
        const progress = i / this.trailPositions.length;
        const alpha = progress * 0.8; // 提高透明度到0.8
        context.strokeStyle = `rgba(200, 150, 100, ${alpha})`; // 更亮的棕色
        context.lineWidth = progress * 4; // 渐变线宽
        context.stroke();
        context.beginPath();
        context.moveTo(trailScreenPos.x, trailScreenPos.y);
      }
      
      context.restore();
    }
    
    if (this.imageLoaded) {
      // 使用图片渲染
      const screenLength = camera.worldToScreenDistance(this.length);
      const screenWidth = camera.worldToScreenDistance(this.width);
      
      context.save();
      context.translate(screenPos.x, screenPos.y);
      
      // 箭矢图片是斜45度向右上
      // 直接使用飞行角度,图片会自动对齐
      context.rotate(angle);
      
      // 箭矢从中心点发射
      context.drawImage(
        this.image,
        -screenLength / 2,
        -screenWidth / 2,
        screenLength,
        screenWidth
      );
      
      context.restore();
    } else {
      // 备用：用线条渲染箭矢
      context.save();
      context.strokeStyle = '#8B4513';
      context.lineWidth = 3;
      context.lineCap = 'round';
      
      const screenLength = camera.worldToScreenDistance(this.length);
      const endX = screenPos.x + Math.cos(angle) * screenLength;
      const endY = screenPos.y + Math.sin(angle) * screenLength;
      
      context.beginPath();
      context.moveTo(screenPos.x, screenPos.y);
      context.lineTo(endX, endY);
      context.stroke();
      
      // 箭头
      context.fillStyle = '#666';
      context.beginPath();
      context.arc(endX, endY, 3, 0, Math.PI * 2);
      context.fill();
      
      context.restore();
    }
  }
}
