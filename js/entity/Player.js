// 玩家角色
class Player extends Entity {
  constructor(x, y, config, mountConfig) {
    super(x, y);
    this.type = 'player';
    this.team = 'player'; // 队伍标识
    this.config = config;
    
    // 添加物理组件
    this.physics = this.addComponent('physics', new Physics({
      maxSpeed: config.maxSpeed,
      acceleration: config.acceleration,
      mass: config.mass
    }));

    // 角色尺寸（半径）
    this.radius = config.size / 2;
    
    // 添加碰撞组件
    this.collider = this.addComponent('collider', new Collider(this.radius, config.mass));
    
    // 渲染颜色
    this.bodyColor = '#4a90e2';
    this.headColor = '#6fa8dc';

    // 面向方向（1为右，-1为左）
    this.facingDirection = 1;
    
    // 移动状态
    this.isMoving = false;
    
    // 动画参数
    this.animationTime = 0;
    this.bodyBobPhase = 0;
    this.headBobPhase = 0.5;
    this.leanAngle = 0; // 倾斜角度
    
    // 骑乘组件
    this.mount = null;
    if (mountConfig) {
      this.mount = this.addComponent('mount', new Mount(mountConfig, this));
      this.mount.mount(); // 初始骑马
    }
    
    // 武器列表
    this.weapons = [];
    
    // 生命值
    this.health = config.health || 2000;
    this.maxHealth = this.health;
    this.alive = true;
    
    // 死亡状态
    this.dying = false;
    this.deathTimer = 0;
    this.deathDuration = 1.5;
    this.deathOpacity = 1.0;
    this.deathRotation = 0;
    this.deathRotationSpeed = 0;
    
    // 受击闪红效果
    this.hitFlashTimer = 0;
    this.hitFlashDuration = 0.5; // 闪红持续0.5秒
    this.isHitFlashing = false;
  }
  
  // 装备武器
  equipWeapon(weapon) {
    this.weapons.push(weapon);
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
    if (this.dying) return;
    
    this.dying = true;
    this.alive = false;
    this.deathTimer = 0;
    this.deathRotation = 0;
    
    // 根据击退方向设置旋转方向和速度（降低一半）
    if (knockback && knockback.length() > 0) {
      const knockbackSpeed = knockback.length();
      // 根据击退向量的y分量判断旋转方向
      const rotationSign = knockback.y > 0 ? 1 : -1;
      this.deathRotationSpeed = (knockbackSpeed + 2.5) * rotationSign;
    } else {
      // 没有击退向量时，使用当前速度决定旋转
      const speed = this.physics.velocity.length();
      this.deathRotationSpeed = (speed + 2.5) * (Math.random() > 0.5 ? 1 : -1);
    }
    
    // 禁用碰撞器
    if (this.collider) {
      this.collider.enabled = false;
    }
    
    // 移除摩擦力
    if (this.physics) {
      this.physics.originalFriction = this.physics.friction;
      this.physics.friction = 1.0;
    }
    
    console.log('玩家死亡！');
  }
  
  // 自动攻击（检测范围内的敌人）
  autoAttack() {
    if (!window.game || !window.game.entities) return;
    
    // 检查是否有武器正在攻击
    const anyWeaponAttacking = this.weapons.some(w => w.attacking);
    
    // 只有在没有武器攻击时，才允许新的攻击
    if (anyWeaponAttacking) return;
    
    // 查找最近的敌人（使用较大的范围来涵盖所有武器）
    let nearestEnemy = null;
    let nearestDistance = Infinity;
    const maxAttackRange = 25; // 最大检测范围（涵盖弓的射程）
    
    for (const entity of window.game.entities) {
      if (entity.team === 'enemy' && entity.alive && entity.active) {
        const distance = this.transform.position.distance(entity.transform.position);
        if (distance < maxAttackRange && distance < nearestDistance) {
          nearestDistance = distance;
          nearestEnemy = entity;
        }
      }
    }
    
    // 如果有敌人在范围内，让每个武器根据自己的范围判断是否攻击
    if (nearestEnemy) {
      const direction = nearestEnemy.transform.position.x > this.transform.position.x ? 1 : -1;
      
      for (const weapon of this.weapons) {
        // 让武器自己判断距离是否在攻击范围内
        if (weapon.canAttack() && weapon.isInRange && weapon.isInRange(nearestEnemy)) {
          weapon.attack(direction);
          break; // 只触发一个武器的攻击
        }
      }
    }
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

  // 更新
  update(deltaTime) {
    // 如果正在死亡过程中
    if (this.dying) {
      this.deathTimer += deltaTime;
      
      // 计算透明度
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
    
    // 正常更新物理
    const velocity = this.physics.update(deltaTime);
    this.transform.translate(velocity.x * deltaTime, velocity.y * deltaTime);

    // 更新动画时间
    if (this.isMoving) {
      this.animationTime += deltaTime * 10; // 动画速度
      
      // 根据速度调整倾斜角度（向前倾）
      const speedRatio = this.physics.getSpeedRatio();
      const targetLean = speedRatio * 0.15 * this.facingDirection;
      this.leanAngle = MathUtil.lerp(this.leanAngle, targetLean, deltaTime * 5);
    } else {
      this.animationTime = 0;
      this.leanAngle = MathUtil.lerp(this.leanAngle, 0, deltaTime * 8);
    }
    
    // 更新骑乘组件
    if (this.mount) {
      this.mount.update(deltaTime);
    }
    
    // 更新武器
    for (const weapon of this.weapons) {
      weapon.update(deltaTime);
    }
    
    // 自动攻击
    this.autoAttack();
  }

  // 渲染
  render(context, camera) {
    // 死亡过程中也要渲染
    if (!this.alive && !this.dying) return;
    
    const screenPos = camera.worldToScreen(this.transform.position);
    const screenRadius = camera.worldToScreenDistance(this.radius);

    // 计算动画偏移（类似忍者奔跑的跳跃效果）
    let bodyBobOffset = 0;
    let headBobOffset = 0;
    let bodySquash = 1.0;
    let bodyStretch = 1.0;
    
    if (this.isMoving) {
      // 身体和头部有不同的摆动相位，制造奔跑感
      bodyBobOffset = Math.sin(this.animationTime + this.bodyBobPhase) * screenRadius * 0.15;
      headBobOffset = Math.sin(this.animationTime + this.headBobPhase) * screenRadius * 0.25;
      
      // 挤压和拉伸效果
      const bouncePhase = Math.abs(Math.sin(this.animationTime));
      bodySquash = 1.0 + bouncePhase * 0.1; // 水平挤压
      bodyStretch = 1.0 - bouncePhase * 0.1; // 垂直拉伸
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

    // 绘制身体（椭圆形，表现挤压拉伸）
    // 如果正在闪红，使用红色调的颜色
    if (this.isHitFlashing) {
      // 使用闪烁效果，快速切换红色
      const flashInterval = 0.1; // 每0.1秒闪烁一次
      const flashPhase = Math.floor(this.hitFlashTimer / flashInterval) % 2;
      if (flashPhase === 0) {
        context.fillStyle = '#ff8080'; // 浅红色
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

    // 身体轮廓
    context.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    context.lineWidth = 2;
    context.stroke();

    // 绘制头部（在身体上方，前后晃动）
    const headX = this.facingDirection * screenRadius * 0.15;
    const headY = -screenRadius * 0.6 + headBobOffset;
    
    // 如果正在闪红，头部也使用红色调
    if (this.isHitFlashing) {
      // 使用闪烁效果，快速切换红色
      const flashInterval = 0.1; // 每0.1秒闪烁一次
      const flashPhase = Math.floor(this.hitFlashTimer / flashInterval) % 2;
      if (flashPhase === 0) {
        context.fillStyle = '#ff8080'; // 浅红色
      } else {
        context.fillStyle = this.headColor;
      }
    } else {
      context.fillStyle = this.headColor;
    }
    
    context.beginPath();
    context.arc(
      headX, 
      headY, 
      screenRadius * 0.45, 
      0, 
      Math.PI * 2
    );
    context.fill();

    // 头部轮廓
    context.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    context.lineWidth = 2;
    context.stroke();

    // 绘制眼睛（面向方向）
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
    
    // 眼珠
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

    // 渲染马（在角色之后，覆盖在人上）
    if (this.mount) {
      this.mount.render(context, camera);
    }

    // 最后渲染武器（显示在最上层）
    for (const weapon of this.weapons) {
      weapon.render(context, camera);
    }

    // 调试：绘制碰撞圆
    if (window.DEBUG) {
      context.strokeStyle = '#00ff00';
      context.lineWidth = 1;
      context.beginPath();
      context.arc(screenPos.x, screenPos.y, screenRadius, 0, Math.PI * 2);
      context.stroke();
    }
  }
}
