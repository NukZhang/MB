// 战斗系统 - 攻击判定
class CombatSystem {
  constructor() {
    this.hitboxes = []; // 活跃的攻击框
    this.entities = []; // 所有可被攻击的实体
  }

  // 添加实体
  addEntity(entity) {
    if (!this.entities.includes(entity)) {
      this.entities.push(entity);
    }
  }

  // 移除实体
  removeEntity(entity) {
    const index = this.entities.indexOf(entity);
    if (index > -1) {
      this.entities.splice(index, 1);
    }
  }

  // 创建攻击框
  createHitbox(hitboxData) {
    const hitbox = {
      owner: hitboxData.owner,
      position: hitboxData.position.clone(),
      radius: hitboxData.radius,
      damage: hitboxData.damage,
      knockback: hitboxData.knockback || 0,
      knockbackDirection: hitboxData.knockbackDirection || new Vector2(1, 0),
      maxTargets: hitboxData.maxTargets || 1,
      duration: hitboxData.duration || 0.1,
      timer: 0,
      hitEntities: [] // 已经击中的实体（避免重复击中）
    };
    
    this.hitboxes.push(hitbox);
    return hitbox;
  }

  // 更新
  update(deltaTime) {
    // 更新所有攻击框
    for (let i = this.hitboxes.length - 1; i >= 0; i--) {
      const hitbox = this.hitboxes[i];
      hitbox.timer += deltaTime;
      
      // 检测碰撞
      this.checkHitboxCollisions(hitbox);
      
      // 移除过期的攻击框
      if (hitbox.timer >= hitbox.duration || hitbox.hitEntities.length >= hitbox.maxTargets) {
        this.hitboxes.splice(i, 1);
      }
    }
  }

  // 检测攻击框与实体的碰撞
  checkHitboxCollisions(hitbox) {
    let hitCount = 0;
    
    for (const entity of this.entities) {
      // 跳过无效实体
      if (!entity.active || !entity.alive) continue;
      
      // 跳过攻击者自己
      if (entity === hitbox.owner) continue;
      
      // 跳过已经击中的实体
      if (hitbox.hitEntities.includes(entity)) continue;
      
      // 跳过同队实体（如果有队伍系统）
      if (entity.team && hitbox.owner.team && entity.team === hitbox.owner.team) continue;
      
      // 检查是否有碰撞器
      const collider = entity.getComponent('collider');
      if (!collider) continue;
      
      // 检测碰撞
      const distance = hitbox.position.distance(entity.transform.position);
      const hitDistance = hitbox.radius + collider.radius;
      
      if (distance < hitDistance) {
        // 击中！
        this.applyDamage(hitbox, entity);
        hitbox.hitEntities.push(entity);
        hitCount++;
        
        // 达到最大目标数
        if (hitCount >= hitbox.maxTargets) {
          break;
        }
      }
    }
  }

  // 应用伤害
  applyDamage(hitbox, target) {
    // 计算击退向量
    let knockbackVec = null;
    if (hitbox.knockback > 0) {
      knockbackVec = hitbox.knockbackDirection.clone().multiply(hitbox.knockback);
    }
    
    // 应用伤害（传递击退向量）
    if (target.takeDamage) {
      target.takeDamage(hitbox.damage, knockbackVec);
    }
    
    console.log(`${hitbox.owner.type} 攻击 ${target.type}，造成 ${hitbox.damage} 伤害`);
  }

  // 清空
  clear() {
    this.hitboxes = [];
    this.entities = [];
  }

  // 渲染调试信息
  renderDebug(context, camera) {
    if (!window.DEBUG) return;
    
    // 绘制所有活跃的攻击框
    for (const hitbox of this.hitboxes) {
      const screenPos = camera.worldToScreen(hitbox.position);
      const screenRadius = camera.worldToScreenDistance(hitbox.radius);
      
      context.strokeStyle = 'rgba(255, 255, 0, 0.6)';
      context.lineWidth = 3;
      context.beginPath();
      context.arc(screenPos.x, screenPos.y, screenRadius, 0, Math.PI * 2);
      context.stroke();
      
      context.fillStyle = 'rgba(255, 255, 0, 0.2)';
      context.fill();
    }
  }
}
