// 敌人基类
class Enemy extends Entity {
  constructor(x, y, config, team) {
    super(x, y);
    this.type = 'enemy';
    this.team = team || 'enemy'; // 队伍标识
    this.config = config;
    
    // 添加物理组件
    this.physics = this.addComponent('physics', new Physics({
      maxSpeed: config.maxSpeed,
      acceleration: config.acceleration,
      mass: config.mass
    }));

    // 添加碰撞组件
    this.radius = config.size / 2;
    this.collider = this.addComponent('collider', new Collider(this.radius, config.mass));

    // 渲染颜色（敌人用红色系）
    this.bodyColor = '#e74c3c';
    this.headColor = '#c0392b';

    // 面向方向
    this.facingDirection = -1; // 敌人初始面向左边

    // 移动状态
    this.isMoving = false;

    // 动画参数
    this.animationTime = 0;
    this.bodyBobPhase = 0;
    this.headBobPhase = 0.5;
    this.leanAngle = 0;

    // 生命值
    this.health = config.health || 100;
    this.maxHealth = this.health;
    this.alive = true;
    
    // 死亡状态
    this.dying = false; // 是否正在死亡
    this.deathTimer = 0; // 死亡计时器
    this.deathDuration = 1.5; // 死亡持续时间（秒）
    this.deathOpacity = 1.0; // 死亡时的透明度
    this.deathRotation = 0; // 死亡时的旋转角度
    this.deathRotationSpeed = 0; // 死亡旋转速度
    
    // 受击闪红效果
    this.hitFlashTimer = 0;
    this.hitFlashDuration = 0.5; // 闪红持续0.5秒
    this.isHitFlashing = false;
  }

  // 移动
  move(direction) {
    if (direction.length() > 0) {
      this.physics.applyAcceleration(direction);
      this.isMoving = true;
      
      // 更新面向方向
      if (Math.abs(direction.x) > 0.1) {
        this.facingDirection = direction.x > 0 ? 1 : -1;
      }
    } else {
      this.isMoving = false;
    }
  }

  // 受到伤害
  takeDamage(damage, knockback) {
    // 如果已经在死亡过程中，不再受到伤害
    if (this.dying) return;
    
    this.health -= damage;
    
    // 启动闪红效果
    this.isHitFlashing = true;
    this.hitFlashTimer = 0;
    
    // 应用击退
    if (knockback && this.physics) {
      this.physics.applyImpulse(knockback);
    }
    
    if (this.health <= 0) {
      this.health = 0;
      this.die(knockback); // 传递击退向量到死亡方法
    }
  }

  // 死亡
  die(knockback) {
    if (this.dying) return; // 防止重复触发
    
    this.dying = true;
    this.alive = false;
    this.deathTimer = 0;
    this.deathRotation = 0;
    
    // 根据击退方向设置旋转方向和速度（降低一半）
    if (knockback && knockback.length() > 0) {
      const knockbackSpeed = knockback.length();
      // 计算击退向量与x轴的叉积，判断是顺时针还是逆时针
      // 如果击退向量的y分量为正（向上击飞），则逆时针旋转；否则顺时针旋转
      const rotationSign = knockback.y > 0 ? 1 : -1;
      this.deathRotationSpeed = (knockbackSpeed + 2.5) * rotationSign;
    } else {
      // 没有击退向量时，使用当前速度决定旋转
      const speed = this.physics.velocity.length();
      this.deathRotationSpeed = (speed + 2.5) * (Math.random() > 0.5 ? 1 : -1);
    }
    
    // 禁用碰撞器（不再与其他实体碰撞）
    if (this.collider) {
      this.collider.enabled = false;
    }
    
    // 保存死亡时的摩擦力，然后移除摩擦力
    if (this.physics) {
      this.physics.originalFriction = this.physics.friction;
      this.physics.friction = 1.0; // 摩擦力设为1.0，意味着不衰减速度
    }
  }

  // 更新
  update(deltaTime) {
    // 如果正在死亡过程中
    if (this.dying) {
      this.deathTimer += deltaTime;
      
      // 计算透明度（线性淡出）
      this.deathOpacity = 1.0 - (this.deathTimer / this.deathDuration);
      
      // 更新死亡旋转角度
      this.deathRotation += this.deathRotationSpeed * deltaTime;
      
      // 死亡过程中仍然更新物理（保持被击飞的效果）
      const velocity = this.physics.update(deltaTime);
      this.transform.translate(velocity.x * deltaTime, velocity.y * deltaTime);
      
      // 死亡时间结束，彻底移除
      if (this.deathTimer >= this.deathDuration) {
        this.active = false;
      }
      return;
    }
    
    // 更新闪红效果计时器
    if (this.isHitFlashing) {
      this.hitFlashTimer += deltaTime;
      if (this.hitFlashTimer >= this.hitFlashDuration) {
        this.isHitFlashing = false;
        this.hitFlashTimer = 0;
      }
    }
    
    // 正常存活状态的更新
    if (!this.alive) return;

    // 更新物理
    const velocity = this.physics.update(deltaTime);
    this.transform.translate(velocity.x * deltaTime, velocity.y * deltaTime);

    // 更新动画
    if (this.isMoving) {
      this.animationTime += deltaTime * 10;
      
      const speedRatio = this.physics.getSpeedRatio();
      const targetLean = speedRatio * 0.15 * this.facingDirection;
      this.leanAngle = MathUtil.lerp(this.leanAngle, targetLean, deltaTime * 5);
    } else {
      this.animationTime = 0;
      this.leanAngle = MathUtil.lerp(this.leanAngle, 0, deltaTime * 8);
    }
  }

  // 渲染
  render(context, camera) {
    // 死亡过程中也要渲染（带透明度）
    if (!this.alive && !this.dying) return;

    const screenPos = camera.worldToScreen(this.transform.position);
    const screenRadius = camera.worldToScreenDistance(this.radius);

    // 动画偏移
    let bodyBobOffset = 0;
    let headBobOffset = 0;
    let bodySquash = 1.0;
    let bodyStretch = 1.0;
    
    if (this.isMoving) {
      bodyBobOffset = Math.sin(this.animationTime + this.bodyBobPhase) * screenRadius * 0.15;
      headBobOffset = Math.sin(this.animationTime + this.headBobPhase) * screenRadius * 0.25;
      
      const bouncePhase = Math.abs(Math.sin(this.animationTime));
      bodySquash = 1.0 + bouncePhase * 0.1;
      bodyStretch = 1.0 - bouncePhase * 0.1;
    }

    context.save();
    
    // 如果正在死亡，应用透明度
    if (this.dying) {
      context.globalAlpha = this.deathOpacity;
    }
    

    
    context.translate(screenPos.x, screenPos.y);
    
    // 死亡时应用旋转，否则应用倾斜
    if (this.dying) {
      context.rotate(this.deathRotation);
    } else if (this.leanAngle !== 0) {
      context.rotate(this.leanAngle);
    }

    // 绘制身体
    // 如果正在闪红，使用更亮的颜色
    if (this.isHitFlashing) {
      // 使用闪烁效果，快速切换颜色
      const flashInterval = 0.1; // 每0.1秒闪烁一次
      const flashPhase = Math.floor(this.hitFlashTimer / flashInterval) % 2;
      if (flashPhase === 0) {
        context.fillStyle = '#ffffff'; // 白色，与红色形成鲜明对比
      } else {
        context.fillStyle = this.bodyColor;
      }
    } else {
      context.fillStyle = this.bodyColor;
    }
    
    context.beginPath();
    context.ellipse(
      0, 
      bodyBobOffset, 
      screenRadius * 0.7 * bodySquash,
      screenRadius * 0.7 * bodyStretch,
      0,
      0, 
      Math.PI * 2
    );
    context.fill();

    context.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    context.lineWidth = 2;
    context.stroke();

    // 绘制头部
    const headX = this.facingDirection * screenRadius * 0.15;
    const headY = -screenRadius * 0.6 + headBobOffset;
    
    // 如果正在闪红，头部也使用更亮的颜色
    if (this.isHitFlashing) {
      // 使用闪烁效果，快速切换颜色
      const flashInterval = 0.1; // 每0.1秒闪烁一次
      const flashPhase = Math.floor(this.hitFlashTimer / flashInterval) % 2;
      if (flashPhase === 0) {
        context.fillStyle = '#ffffff'; // 白色，与红色形成鲜明对比
      } else {
        context.fillStyle = this.headColor;
      }
    } else {
      context.fillStyle = this.headColor;
    }
    
    context.beginPath();
    context.arc(headX, headY, screenRadius * 0.45, 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    context.lineWidth = 2;
    context.stroke();

    // 绘制眼睛
    context.fillStyle = '#ffffff';
    context.beginPath();
    context.arc(
      headX + this.facingDirection * screenRadius * 0.15, 
      headY - screenRadius * 0.05, 
      screenRadius * 0.08, 
      0, 
      Math.PI * 2
    );
    context.fill();
    
    context.fillStyle = '#000000';
    context.beginPath();
    context.arc(
      headX + this.facingDirection * screenRadius * 0.18, 
      headY - screenRadius * 0.05, 
      screenRadius * 0.04, 
      0, 
      Math.PI * 2
    );
    context.fill();

    context.restore();

    // 只在活着时绘制生命值条
    if (!this.dying) {
      this.renderHealthBar(context, screenPos, screenRadius);
    }

    // 调试：绘制碰撞圆
    if (window.DEBUG) {
      context.strokeStyle = '#ff0000';
      context.lineWidth = 1;
      context.beginPath();
      context.arc(screenPos.x, screenPos.y, screenRadius, 0, Math.PI * 2);
      context.stroke();
    }
  }

  // 渲染生命值条
  renderHealthBar(context, screenPos, screenRadius) {
    const barWidth = screenRadius * 2;
    const barHeight = 4;
    const barY = screenPos.y - screenRadius * 1.3;

    // 背景
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    context.fillRect(screenPos.x - barWidth / 2, barY, barWidth, barHeight);

    // 生命值
    const healthRatio = this.health / this.maxHealth;
    context.fillStyle = healthRatio > 0.5 ? '#2ecc71' : (healthRatio > 0.25 ? '#f39c12' : '#e74c3c');
    context.fillRect(screenPos.x - barWidth / 2, barY, barWidth * healthRatio, barHeight);
  }
}
