// 剑
class Sword extends Weapon {
  constructor(config, owner) {
    super(config, owner);
    
    // 武器类型标识
    this.type = 'sword';
    
    // 剑的攻击时序（总共2秒一个周期）
    this.raiseTime = 0.2;      // 举起剑
    this.slashTime = 0.1;      // 加速劈下
    this.recoveryTime = 0.2;   // 攻击后摇
    this.totalAttackTime = this.raiseTime + this.slashTime + this.recoveryTime;
    
    // 当前攻击阶段
    this.attackPhase = 'idle'; // idle, raise, slash, recovery
    this.attackTimer = 0;
    
    // 剑的渲染参数（世界单位）
    this.baseScale = 1.0;
    this.currentScale = 1.0;
    this.rotation = 0; // 剑的旋转角度
    this.offsetX = 0;
    this.offsetY = 0;
    
    // 剑柄锚点（图片左下30%处）
    this.anchorX = 0.3;
    this.anchorY = 0.7;
    
    // 攻击范围
    this.attackRange = config.attackRange || 2.5; // 米
    this.maxTargets = config.maxTargets || 3;
    this.knockback = config.knockback || 2;
    
    // 拖尾效果
    this.trailPositions = [];
    this.maxTrailLength = 8;
  }
  
  // 检查目标是否在攻击范围内
  isInRange(target) {
    if (!target || !target.transform) return false;
    const distance = this.owner.transform.position.distance(target.transform.position);
    return distance <= this.attackRange;
  }

  // 触发攻击
  attack(targetDirection) {
    if (!this.canAttack()) return false;
    
    this.attacking = true;
    this.attackPhase = 'raise';
    this.attackTimer = 0;
    this.attackDirection = targetDirection || this.owner.facingDirection;
    
    return true;
  }

  // 更新
  update(deltaTime) {
    super.update(deltaTime);
    
    if (this.attacking) {
      this.attackTimer += deltaTime;
      
      // 根据攻击阶段更新动画
      if (this.attackPhase === 'raise') {
        this.updateRaisePhase();
        if (this.attackTimer >= this.raiseTime) {
          this.attackPhase = 'slash';
          this.attackTimer = this.raiseTime;
        }
      } else if (this.attackPhase === 'slash') {
        this.updateSlashPhase();
        if (this.attackTimer >= this.raiseTime + this.slashTime) {
          this.attackPhase = 'recovery';
          this.attackTimer = this.raiseTime + this.slashTime;
          
          // 在劈下阶段创建攻击判定
          this.performHit();
        }
      } else if (this.attackPhase === 'recovery') {
        this.updateRecoveryPhase();
        if (this.attackTimer >= this.totalAttackTime) {
          this.attackPhase = 'idle';
          this.attacking = false;
          this.cooldownTimer = this.cooldown;
          this.trailPositions = [];
        }
      }
    } else {
      // 待机状态 - 剑保持在角色侧面
      this.updateIdlePhase();
    }
  }

  // 举起剑阶段
  updateRaisePhase() {
    const t = (this.attackTimer) / this.raiseTime;
    
    // 从侧面举到头顶
    this.rotation = MathUtil.lerp(-45, -135, t) * Math.PI / 180;
    this.currentScale = MathUtil.lerp(1.0, 1.2, t);
    
    const facing = this.owner.facingDirection;
    this.offsetX = MathUtil.lerp(facing * 0.5, facing * 0.3, t);
    this.offsetY = MathUtil.lerp(0, -0.8, t);
  }

  // 劈下阶段
  updateSlashPhase() {
    const t = (this.attackTimer - this.raiseTime) / this.slashTime;
    const easeT = t * t; // 加速
    
    // 快速劈下，有夸张的旋转和位移
    this.rotation = MathUtil.lerp(-135, 45, easeT) * Math.PI / 180;
    this.currentScale = MathUtil.lerp(1.2, 1.4, easeT);
    
    const facing = this.owner.facingDirection;
    this.offsetX = MathUtil.lerp(facing * 0.3, facing * 0.8, easeT);
    this.offsetY = MathUtil.lerp(-0.8, 0.5, easeT);
    
    // 记录拖尾位置
    this.recordTrailPosition();
  }

  // 恢复阶段
  updateRecoveryPhase() {
    const t = (this.attackTimer - this.raiseTime - this.slashTime) / this.recoveryTime;
    
    // 从劈下位置恢复到待机
    this.rotation = MathUtil.lerp(45, -45, t) * Math.PI / 180;
    this.currentScale = MathUtil.lerp(1.4, 1.0, t);
    
    const facing = this.owner.facingDirection;
    this.offsetX = MathUtil.lerp(facing * 0.8, facing * 0.5, t);
    this.offsetY = MathUtil.lerp(0.5, 0, t);
    
    // 拖尾逐渐消失
    if (this.trailPositions.length > 0) {
      this.trailPositions.shift();
    }
  }

  // 待机阶段
  updateIdlePhase() {
    const facing = this.owner.facingDirection;
    this.rotation = -45 * Math.PI / 180;
    this.currentScale = 1.0;
    this.offsetX = facing * 0.5;
    this.offsetY = 0;
  }

  // 记录拖尾位置
  recordTrailPosition() {
    const ownerPos = this.owner.transform.position;
    const swordTipPos = this.getSwordTipPosition();
    
    this.trailPositions.push({
      x: swordTipPos.x,
      y: swordTipPos.y,
      alpha: 1.0
    });
    
    if (this.trailPositions.length > this.maxTrailLength) {
      this.trailPositions.shift();
    }
  }

  // 获取剑尖位置
  getSwordTipPosition() {
    const ownerPos = this.owner.transform.position;
    const facing = this.owner.facingDirection;
    
    // 计算剑的长度方向
    const swordLength = 1.5; // 米
    const tipX = ownerPos.x + this.offsetX + Math.cos(this.rotation + Math.PI/4) * swordLength * facing;
    const tipY = ownerPos.y + this.offsetY + Math.sin(this.rotation + Math.PI/4) * swordLength;
    
    return new Vector2(tipX, tipY);
  }

  // 执行攻击判定
  performHit() {
    if (!window.game || !window.game.combatSystem) return;
    
    const ownerPos = this.owner.transform.position;
    
    // 创建攻击框数据
    const hitboxData = {
      owner: this.owner,
      position: new Vector2(
        ownerPos.x + this.owner.facingDirection * this.attackRange / 2,
        ownerPos.y
      ),
      radius: this.attackRange,
      damage: this.damage,
      knockback: this.knockback,
      knockbackDirection: new Vector2(this.owner.facingDirection, -0.3).normalize(),
      maxTargets: this.maxTargets,
      duration: 0.1 // 攻击框持续时间
    };
    
    window.game.combatSystem.createHitbox(hitboxData);
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
    const facing = this.owner.facingDirection;
    
    // 计算渲染尺寸（基于世界单位，并根据角色尺寸比例缩放）
    // 玩家尺寸2.0米为基准，其他角色按比例缩放
    const sizeRatio = this.owner.radius / 1.0; // 1.0是玩家半径的一半
    const baseWidth = 1.2 * sizeRatio; // 米
    const baseHeight = 1.2 * sizeRatio; // 米
    const screenWidth = camera.worldToScreenDistance(baseWidth * this.currentScale);
    const screenHeight = camera.worldToScreenDistance(baseHeight * this.currentScale);
    
    // 渲染拖尾
    if (this.trailPositions.length > 1) {
      context.save();
      context.lineCap = 'round';
      context.lineJoin = 'round';
      
      for (let i = 0; i < this.trailPositions.length - 1; i++) {
        const alpha = (i / this.trailPositions.length) * 0.5;
        const width = (i / this.trailPositions.length) * 8;
        
        const p1 = camera.worldToScreen(new Vector2(this.trailPositions[i].x, this.trailPositions[i].y));
        const p2 = camera.worldToScreen(new Vector2(this.trailPositions[i + 1].x, this.trailPositions[i + 1].y));
        
        context.strokeStyle = `rgba(255, 255, 100, ${alpha})`;
        context.lineWidth = width;
        context.beginPath();
        context.moveTo(p1.x, p1.y);
        context.lineTo(p2.x, p2.y);
        context.stroke();
      }
      
      context.restore();
    }
    
    // 渲染剑
    context.save();
    context.translate(screenPos.x, screenPos.y);
    
    // 面向左侧时，翻转并保持45度基础角度
    if (facing < 0) {
      context.scale(-1, 1);
      context.rotate(this.rotation);
    } else {
      // 面向右侧时正常旋转
      context.rotate(this.rotation);
    }
    
    // 绘制剑（锚点在左下30%处）
    context.drawImage(
      this.image,
      -screenWidth * this.anchorX,
      -screenHeight * this.anchorY,
      screenWidth,
      screenHeight
    );
    
    context.restore();
    
    // 调试：绘制攻击范围
    if (window.DEBUG && this.attackPhase === 'slash') {
      const attackPos = camera.worldToScreen(new Vector2(
        ownerPos.x + facing * this.attackRange / 2,
        ownerPos.y
      ));
      const attackRadius = camera.worldToScreenDistance(this.attackRange);
      
      context.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      context.lineWidth = 2;
      context.beginPath();
      context.arc(attackPos.x, attackPos.y, attackRadius, 0, Math.PI * 2);
      context.stroke();
    }
  }
}
