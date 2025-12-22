// 弓
class Bow extends Weapon {
  constructor(config, owner) {
    super(config, owner);
    
    // 武器类型标识
    this.type = 'bow';
    
    // 弓的属性
    this.arrowSpeed = config.arrowSpeed || 15;
    this.range = config.range || 20;
    this.knockback = config.knockback || 1;
    
    // 瞄准目标
    this.currentTarget = null;
    this.targetRotation = 0; // 目标旋转角度
    this.currentRotation = -Math.PI / 4; // 当前旋转角度（默认斜45度向右上）
    this.rotationSpeed = 8; // 旋转速度（弧度/秒）
    
    // 弓的渲染参数
    this.baseScale = 1.0;
    this.offsetX = 0;
    this.offsetY = -0.3; // 弓在角色稍上方
    
    // 射击动画
    this.drawProgress = 0; // 拉弓进度 0-1
    this.drawSpeed = 5; // 拉弓速度
    this.releaseTime = 0.15; // 释放动画时间
    this.releaseTimer = 0;
    
    // 箭矢配置
    this.arrowConfig = {
      damage: this.damage,
      arrowSpeed: this.arrowSpeed,
      range: this.range,
      knockback: this.knockback,
      imagePath: 'res/arrow.png'
    };
  }
  
  // 检查目标是否在攻击范围内
  isInRange(target) {
    if (!target || !target.transform) return false;
    const distance = this.owner.transform.position.distance(target.transform.position);
    return distance <= this.range;
  }
  
  // 寻找目标
  findTarget() {
    if (!window.game || !window.game.entities) return null;
    
    let nearestEnemy = null;
    let nearestDistance = Infinity;
    
    for (const entity of window.game.entities) {
      if (entity.team !== this.owner.team && entity.alive && entity.active) {
        const distance = this.owner.transform.position.distance(entity.transform.position);
        if (distance < this.range && distance < nearestDistance) {
          nearestDistance = distance;
          nearestEnemy = entity;
        }
      }
    }
    
    return nearestEnemy;
  }
  
  // 触发攻击
  attack(target) {
    if (!this.canAttack()) return false;
    
    this.attacking = true;
    this.drawProgress = 0;
    this.currentTarget = target || this.findTarget();
    
    return true;
  }
  
  // 发射箭矢
  fireArrow() {
    // 使用当前的旋转角度来计算射击方向，而不是依赖目标
    // 这样即使目标消失，箭矢也会朝弓指向的方向射击
    const direction = new Vector2(
      Math.cos(this.currentRotation),
      Math.sin(this.currentRotation)
    );
    
    this.createArrow(direction);
    
    // 进入释放动画
    this.releaseTimer = this.releaseTime;
    this.attacking = false;
    this.cooldownTimer = this.cooldown;
  }
  
  // 创建箭矢
  createArrow(direction) {
    const ownerPos = this.owner.transform.position;
    
    // 箭矢从弓的位置发射
    const arrowStartPos = new Vector2(
      ownerPos.x + direction.x * 0.5,
      ownerPos.y + direction.y * 0.5
    );
    
    const arrow = new Arrow(
      arrowStartPos.x,
      arrowStartPos.y,
      this.arrowConfig,
      direction,
      this.owner
    );
    
    if (window.game) {
      window.game.addEntity(arrow);
    }
  }
  
  // 更新
  update(deltaTime) {
    super.update(deltaTime);
    
    // 更新释放动画
    if (this.releaseTimer > 0) {
      this.releaseTimer -= deltaTime;
      this.drawProgress = Math.max(0, this.releaseTimer / this.releaseTime);
    }
    
    // 只在非攻击状态时更新瞄准和旋转
    if (!this.attacking) {
      // 寻找并瞄准目标
      this.currentTarget = this.findTarget();
      
      // 计算目标旋转角度
      if (this.currentTarget && this.currentTarget.alive) {
        const targetPos = this.currentTarget.transform.position;
        const ownerPos = this.owner.transform.position;
        const dx = targetPos.x - ownerPos.x;
        const dy = targetPos.y - ownerPos.y;
        
        // 计算朝向目标的角度
        this.targetRotation = Math.atan2(dy, dx);
      } else {
        // 没有目标时，指向面朝方向的45度斜上方
        this.targetRotation = this.owner.facingDirection > 0 ? -Math.PI / 4 : -3 * Math.PI / 4;
      }
      
      // 平滑旋转到目标角度（避免跳变）
      let angleDiff = this.targetRotation - this.currentRotation;
      
      // 处理角度环绕问题（-π到π）
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      
      // 平滑插值
      const rotationStep = this.rotationSpeed * deltaTime;
      if (Math.abs(angleDiff) < rotationStep) {
        this.currentRotation = this.targetRotation;
      } else {
        this.currentRotation += Math.sign(angleDiff) * rotationStep;
      }
    }
    
    // 拉弓动画（攻击时）
    if (this.attacking) {
      this.drawProgress += this.drawSpeed * deltaTime;
      if (this.drawProgress >= 1.0) {
        this.drawProgress = 1.0;
        this.fireArrow();
      }
    }
  }
  
  // 渲染
  render(context, camera) {
    if (!this.imageLoaded) return;
    
    const ownerPos = this.owner.transform.position;
    const worldPos = new Vector2(
      ownerPos.x + this.offsetX,
      ownerPos.y + this.offsetY
    );
    
    const screenPos = camera.worldToScreen(worldPos);
    
    // 计算渲染尺寸（根据角色尺寸比例缩放）
    // 玩家尺寸2.0米为基准，其他角色按比例缩放
    const sizeRatio = this.owner.radius / 1.0; // 1.0是玩家半径的一半
    const baseWidth = 1.0 * sizeRatio;
    const baseHeight = 1.0 * sizeRatio;
    const screenWidth = camera.worldToScreenDistance(baseWidth * this.baseScale);
    const screenHeight = camera.worldToScreenDistance(baseHeight * this.baseScale);
    
    context.save();
    context.translate(screenPos.x, screenPos.y);
    
    // 弓图片本身是45度向右上，渲染时需要加上45度补偿
    // 这样当 currentRotation = 0 (水平向右) 时，图片会旋转45度显示为向右上
    context.rotate(this.currentRotation + Math.PI / 4);
    
    // 拉弓时的缩放效果（稍微缩小表示拉紧）
    const drawScale = 1.0 - this.drawProgress * 0.1;
    context.scale(drawScale, drawScale);
    
    // 绘制弓（锚点在中心）
    context.drawImage(
      this.image,
      -screenWidth / 2,
      -screenHeight / 2,
      screenWidth,
      screenHeight
    );
    
    context.restore();
    
    // 调试：绘制射程范围
    if (window.DEBUG && this.currentTarget) {
      const targetScreenPos = camera.worldToScreen(this.currentTarget.transform.position);
      context.strokeStyle = 'rgba(0, 255, 0, 0.3)';
      context.lineWidth = 2;
      context.setLineDash([5, 5]);
      context.beginPath();
      context.moveTo(screenPos.x, screenPos.y);
      context.lineTo(targetScreenPos.x, targetScreenPos.y);
      context.stroke();
      context.setLineDash([]);
    }
  }
}
