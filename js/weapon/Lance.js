// 骑枪
class Lance extends Weapon {
  constructor(config, owner) {
    super(config, owner);
    
    // 武器类型标识
    this.type = 'lance';
    
    // 骑枪属性
    this.speedThreshold = config.speedThreshold || 0.7; // 速度阈值（相对于最大速度）
    this.maxTargets = config.maxTargets || 5;
    this.knockback = config.knockback || 8; // 增加击退力度
    this.selfSlowdown = config.selfSlowdown || 0.6; // 击中后自身降速比例（0-1）
    
    // 骑枪状态
    this.state = 'idle'; // idle(竖直), ready(接近冲刺速度), charging(冲刺中), cooldown(冷却)
    this.stateTimer = 0;
    
    // 渲染参数
    this.rotation = -Math.PI / 2; // 当前旋转角度，-90度为竖直向上
    this.targetRotation = -Math.PI / 2;
    this.rotationSpeed = 10; // 旋转速度
    this.baseScale = 1.0;
    this.currentScale = 1.0;
    this.offsetX = 0;
    this.offsetY = -0.5; // 骑枪在角色上方
    
    // 冲刺状态
    this.chargeSpeed = 0; // 冲刺时的速度
    this.hasHitTarget = false; // 本次冲刺是否击中目标
    this.hitTargets = []; // 本次冲刺已击中的目标
    
    // 动画参数
    this.pulseTime = 0; // 脉冲动画时间（ready状态）
    
    // 骑枪图片路径
    this.imagePath = config.imagePath || 'res/lance.png';
    this.loadImage();
  }
  
  // 检查是否骑乘中
  isMounted() {
    return this.owner.mount && this.owner.mount.mounted;
  }
  
  // 检查目标是否在攻击范围内（冲刺时的前方扇形区域）
  isInRange(target) {
    if (!target || !target.transform || this.state !== 'charging') return false;
    
    const ownerPos = this.owner.transform.position;
    const targetPos = target.transform.position;
    const facing = this.owner.facingDirection;
    
    // 计算目标相对位置
    const dx = targetPos.x - ownerPos.x;
    const dy = targetPos.y - ownerPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 检查是否在前方
    if (dx * facing < 0) return false;
    
    // 检查是否在冲刺范围内（前方3米，宽度2米）
    const forwardDistance = Math.abs(dx);
    const lateralDistance = Math.abs(dy);
    
    return forwardDistance <= 3 && lateralDistance <= 1 && distance <= 3.5;
  }
  
  // 更新
  update(deltaTime) {
    super.update(deltaTime);
    
    // 只在骑乘时才激活
    if (!this.isMounted()) {
      this.state = 'idle';
      this.targetRotation = -Math.PI / 2;
      return;
    }
    
    // 获取当前速度比例
    const speedRatio = this.owner.physics.getSpeedRatio();
    
    // 状态机更新
    switch (this.state) {
      case 'idle':
        this.updateIdleState(speedRatio);
        break;
      case 'ready':
        this.updateReadyState(speedRatio, deltaTime);
        break;
      case 'charging':
        this.updateChargingState(speedRatio, deltaTime);
        break;
      case 'cooldown':
        this.updateCooldownState(deltaTime);
        break;
    }
    
    // 平滑旋转到目标角度
    this.smoothRotate(deltaTime);
  }
  
  // 待机状态
  updateIdleState(speedRatio) {
    // 骑枪竖直立起
    this.targetRotation = -Math.PI / 2;
    this.currentScale = 1.0;
    this.offsetX = 0;
    this.offsetY = -0.5;
    
    // 当速度接近最大速度时，进入ready状态
    if (speedRatio >= 0.9) {
      this.state = 'ready';
      this.stateTimer = 0;
      console.log('骑枪: 进入ready状态');
    }
  }
  
  // 准备状态
  updateReadyState(speedRatio, deltaTime) {
    const facing = this.owner.facingDirection;
    
    // 骑枪开始放平，但还在微微抖动
    // 向右时0度（水平向右），向左时也用0度（因为会翻转）
    this.targetRotation = 0;
    
    // 位置向前突出一些
    this.offsetX = facing * 0.3;
    this.offsetY = -0.2;
    
    // 脉冲动画（准备冲刺的提示）
    this.pulseTime += deltaTime * 8;
    this.currentScale = 1.0 + Math.sin(this.pulseTime) * 0.05;
    
    this.stateTimer += deltaTime;
    
    // 速度达到最大时，进入冲刺状态
    if (speedRatio >= 1.0) {
      this.state = 'charging';
      this.chargeSpeed = speedRatio;
      this.hasHitTarget = false;
      this.hitTargets = [];
      this.attacking = true;
      console.log('骑枪: 开始冲刺！');
    }
    // 速度降低，返回idle
    else if (speedRatio < 0.85) {
      this.state = 'idle';
    }
  }
  
  // 冲刺状态
  updateChargingState(speedRatio, deltaTime) {
    const facing = this.owner.facingDirection;
    
    // 骑枪完全放平，更低，更向前
    // 向右向左都用0度（水平），翻转会自动处理方向
    this.targetRotation = 0;
    this.currentScale = 1.1;
    this.offsetX = facing * 0.6; // 向前突出更多
    this.offsetY = 0.1; // 更低，与马头齐平
    
    // 检测冲撞敌人
    this.detectChargeHit();
    
    // 结束冲刺的条件
    // 1. 速度降低到70%以下
    if (speedRatio < this.speedThreshold) {
      this.endCharge();
    }
    // 2. 或者已经击中目标并持续了0.3秒
    else if (this.hasHitTarget && this.stateTimer > 0.3) {
      this.endCharge();
    }
    
    this.stateTimer += deltaTime;
  }
  
  // 冷却状态
  updateCooldownState(deltaTime) {
    // 骑枪缓慢抬起
    this.targetRotation = -Math.PI / 2;
    this.currentScale = 1.0;
    this.offsetX = 0;
    this.offsetY = -0.5;
    
    this.stateTimer -= deltaTime;
    
    if (this.stateTimer <= 0) {
      this.state = 'idle';
      this.attacking = false;
      console.log('骑枪: 冷却完成');
    }
  }
  
  // 检测冲刺击中
  detectChargeHit() {
    if (!window.game || !window.game.entities) return;
    
    const ownerPos = this.owner.transform.position;
    const facing = this.owner.facingDirection;
    
    for (const entity of window.game.entities) {
      // 跳过已经击中的目标
      if (this.hitTargets.includes(entity.id)) continue;
      
      if (entity.team !== this.owner.team && entity.alive && entity.active) {
        // 检查是否在冲刺范围内
        if (this.isInRange(entity)) {
          this.performChargeHit(entity);
          this.hasHitTarget = true;
          this.hitTargets.push(entity.id);
          
          // 达到最大目标数后结束冲刺
          if (this.hitTargets.length >= this.maxTargets) {
            this.endCharge();
            break;
          }
        }
      }
    }
  }
  
  // 执行冲刺攻击
  performChargeHit(target) {
    if (!target || !target.takeDamage) return;
    
    const ownerPos = this.owner.transform.position;
    const targetPos = target.transform.position;
    const facing = this.owner.facingDirection;
    
    // 计算击退方向（冲刺方向+稍微向上）
    const knockbackDir = new Vector2(facing, -0.5).normalize();
    const knockbackForce = knockbackDir.multiply(this.knockback);
    
    // 对目标造成伤害和大击退
    target.takeDamage(this.damage, knockbackForce);
    
    // 对自己施加强力减速（冲撞的反作用力）
    if (this.owner.physics) {
      // 速度降低到原来的20%（更明显的减速）
      this.owner.physics.velocity.x *= 0.2;
      this.owner.physics.velocity.y *= 0.2;
      
      // 清除加速度，防止玩家输入立即恢复速度
      this.owner.physics.acceleration.x = 0;
      this.owner.physics.acceleration.y = 0;
      
      console.log(`骑枪冲刺击中目标！造成${this.damage}伤害，击退力${this.knockback}，自身速度降至20%`);
    }
    
    // 创建冲击特效（可选）
    this.createChargeEffect(targetPos);
  }
  
  // 创建冲击特效
  createChargeEffect(position) {
    // TODO: 可以添加粒子特效或闪光效果
    // 暂时留空，后续可以扩展
  }
  
  // 结束冲刺
  endCharge() {
    this.state = 'cooldown';
    this.stateTimer = this.cooldown;
    this.cooldownTimer = this.cooldown;
    console.log('骑枪: 冲刺结束，进入冷却');
  }
  
  // 平滑旋转
  smoothRotate(deltaTime) {
    let angleDiff = this.targetRotation - this.rotation;
    
    // 处理角度环绕
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    
    // 平滑插值
    const rotationStep = this.rotationSpeed * deltaTime;
    if (Math.abs(angleDiff) < rotationStep) {
      this.rotation = this.targetRotation;
    } else {
      this.rotation += Math.sign(angleDiff) * rotationStep;
    }
  }
  
  // 渲染
  render(context, camera) {
    if (!this.imageLoaded || !this.isMounted()) return;
    
    const ownerPos = this.owner.transform.position;
    const facing = this.owner.facingDirection;
    
    // 计算骑枪位置（使用动态偏移）
    const worldPos = new Vector2(
      ownerPos.x + this.offsetX,
      ownerPos.y + this.offsetY
    );
    
    const screenPos = camera.worldToScreen(worldPos);
    
    // 计算渲染尺寸（根据角色尺寸比例缩放）
    // 玩家尺寸2.0米为基准，其他角色按比例缩放
    const sizeRatio = this.owner.radius / 1.0; // 1.0是玩家半径的一半
    const baseWidth = 1.5 * sizeRatio; // 骑枪较长
    const baseHeight = 1.5 * sizeRatio;
    const screenWidth = camera.worldToScreenDistance(baseWidth * this.currentScale);
    const screenHeight = camera.worldToScreenDistance(baseHeight * this.currentScale);
    
    context.save();
    context.translate(screenPos.x, screenPos.y);
    
    // ready状态时添加发光效果
    if (this.state === 'ready') {
      context.shadowBlur = 10;
      context.shadowColor = 'rgba(255, 200, 0, 0.8)';
    }
    // charging状态时添加更强的发光
    else if (this.state === 'charging') {
      context.shadowBlur = 20;
      context.shadowColor = 'rgba(255, 100, 0, 1.0)';
    }
    
    // 根据面向方向渲染
    // 骑枪图片是45度向右上，所以需要补偿45度
    if (facing < 0) {
      // 向左时：先水平翻转，然后用相同的旋转角度
      context.scale(-1, 1);
      context.rotate(this.rotation + Math.PI / 4);
    } else {
      // 向右时：直接旋转
      context.rotate(this.rotation + Math.PI / 4);
    }
    
    // 绘制骑枪（锚点在底部中心，即枪柄位置）
    context.drawImage(
      this.image,
      -screenWidth * 0.3,
      -screenHeight * 0.7,
      screenWidth,
      screenHeight
    );
    
    context.restore();
    
    // 调试：绘制冲刺范围
    if (window.DEBUG && this.state === 'charging') {
      const chargePos = new Vector2(
        ownerPos.x + facing * 1.5,
        ownerPos.y
      );
      const chargeScreenPos = camera.worldToScreen(chargePos);
      const chargeWidth = camera.worldToScreenDistance(3);
      const chargeHeight = camera.worldToScreenDistance(2);
      
      context.strokeStyle = 'rgba(255, 100, 0, 0.5)';
      context.lineWidth = 2;
      context.strokeRect(
        chargeScreenPos.x - (facing > 0 ? 0 : chargeWidth),
        chargeScreenPos.y - chargeHeight / 2,
        chargeWidth,
        chargeHeight
      );
    }
  }
}
