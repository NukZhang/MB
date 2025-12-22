// AI组件
class AI {
  constructor(config) {
    this.enabled = true;
    
    // AI行为类型: melee(近战), ranged(远程), cavalry(骑兵)
    this.behaviorType = config.behaviorType || 'melee';
    
    // 目标相关
    this.target = null;
    this.targetRefreshInterval = config.targetRefreshInterval || 3;
    this.targetRefreshTimer = 0;
    
    // 行为参数
    this.attackRange = config.attackRange || 2;
    this.chaseDistance = config.chaseDistance || 30;
    this.keepDistance = config.keepDistance || 0; // 保持距离（弓兵使用）
    
    // 状态
    this.state = 'IDLE';
    
    // 骑兵特有参数
    this.chargeTimer = 0;
    this.chargeCooldown = config.chargeCooldown || 3;
    this.isCharging = false;
    this.chargePhase = 'APPROACH'; // APPROACH(接近冲锋), CONTINUE(穿透前进), COOLDOWN(冷却调整)
    this.retreatDistance = config.retreatDistance || 15; // 穿透后的距离阈值
    this.chargeStartPos = null; // 记录开始冲锋的位置
    this.wasLanceCharging = false; // 上一帧骑枪是否在冲刺
    this.continueTimer = 0; // 穿透阶段计时器
  }
  
  // 查找目标
  findTarget(owner, entities) {
    let nearestEnemy = null;
    let nearestDistance = Infinity;
    
    const ownerPos = owner.transform.position;
    const enemyTeam = owner.team === 'player' ? 'enemy' : 'player';
    
    // 1. 首先查找敌方实体
    for (const entity of entities) {
      if (entity.team === enemyTeam && entity.alive && entity.active) {
        const distance = ownerPos.distance(entity.transform.position);
        
        // 只追击在追击距离内的目标
        if (distance < this.chaseDistance && distance < nearestDistance) {
          nearestDistance = distance;
          nearestEnemy = entity;
        }
      }
    }
    
    // 2. 如果没有找到敌方实体，查找敌方建筑
    if (!nearestEnemy && window.game && window.game.buildings) {
      const enemyBuilding = window.game.buildings.find(b => b.type === enemyTeam && b.health > 0);
      if (enemyBuilding) {
        // 创建一个虚拟的建筑目标对象，让士兵可以攻击
        nearestEnemy = {
          team: enemyTeam,
          alive: true,
          active: true,
          transform: { position: enemyBuilding.position },
          isBuilding: true, // 标记这是建筑目标
          building: enemyBuilding // 引用实际的建筑对象
        };
        console.log(`${owner.team}士兵没有找到敌人，向敌方建筑移动`);
      }
    }
    
    return nearestEnemy;
  }
  
  // 更新AI行为
  update(owner, entities, deltaTime) {
    if (!this.enabled) return;
    
    // 定期刷新目标
    this.targetRefreshTimer += deltaTime;
    if (this.targetRefreshTimer >= this.targetRefreshInterval) {
      this.target = this.findTarget(owner, entities);
      this.targetRefreshTimer = 0;
    }
    
    // 如果目标不存在或已死亡，尝试重新查找
    if (!this.target || !this.target.alive || !this.target.active) {
      this.target = this.findTarget(owner, entities);
    }
    
    // 根据行为类型执行不同的行为
    switch (this.behaviorType) {
      case 'melee':
        this.meleeBehavior(owner, deltaTime);
        break;
      case 'ranged':
        this.rangedBehavior(owner, deltaTime);
        break;
      case 'cavalry':
        this.cavalryBehavior(owner, deltaTime);
        break;
    }
  }
  
  // 近战行为（步兵）
  meleeBehavior(owner, deltaTime) {
    if (!this.target) {
      this.state = 'IDLE';
      owner.isMoving = false;
      return;
    }
    
    const ownerPos = owner.transform.position;
    const targetPos = this.target.transform.position;
    const distance = ownerPos.distance(targetPos);
    
    if (distance > this.attackRange) {
      // 靠近目标
      this.state = 'MOVE_TO_TARGET';
      const direction = Vector2.sub(targetPos, ownerPos).normalize();
      owner.move(direction);
    } else {
      // 在攻击范围内
      this.state = 'ATTACK';
      owner.isMoving = false;
      
      // 如果是建筑目标，则对建筑造成伤害
      if (this.target.isBuilding && this.target.building) {
        // 每次攻击对建筑造成10点伤害
        this.target.building.health = (this.target.building.health || 100) - 10;
        console.log(`士兵攻击建筑，建筑剩余血量: ${this.target.building.health}`);
        if (this.target.building.health <= 0) {
          console.log(`${owner.team}摧毁了敌方建筑！`);
        }
      } else {
        // 触发常规攻击
        if (owner.weapons && owner.weapons.length > 0) {
          const direction = targetPos.x > ownerPos.x ? 1 : -1;
          owner.facingDirection = direction;
          
          for (const weapon of owner.weapons) {
            if (weapon.canAttack()) {
              weapon.attack(direction);
              break;
            }
          }
        }
      }
    }
  }
  
  // 远程行为（弓兵）
  rangedBehavior(owner, deltaTime) {
    if (!this.target) {
      this.state = 'IDLE';
      owner.isMoving = false;
      return;
    }
    
    const ownerPos = owner.transform.position;
    const targetPos = this.target.transform.position;
    const distance = ownerPos.distance(targetPos);
    
    // 保持在理想距离（最大射程的80%）
    if (distance > this.keepDistance) {
      // 太远，接近目标
      this.state = 'MOVE_TO_TARGET';
      const direction = Vector2.sub(targetPos, ownerPos).normalize();
      owner.move(direction);
    } else if (distance < this.keepDistance * 0.7) {
      // 太近，保持距离
      this.state = 'KEEP_DISTANCE';
      const direction = Vector2.sub(ownerPos, targetPos).normalize();
      owner.move(direction);
    } else {
      // 在理想范围内，停止移动并攻击
      this.state = 'ATTACK';
      owner.isMoving = false;
      
      // 朝向目标
      owner.facingDirection = targetPos.x > ownerPos.x ? 1 : -1;
      
      // 如果是建筑目标，则对建筑造成伤害
      if (this.target.isBuilding && this.target.building) {
        // 远程单位每次攻击对建筑造成15点伤害
        this.target.building.health = (this.target.building.health || 100) - 15;
        console.log(`弓兵攻击建筑，建筑剩余血量: ${this.target.building.health}`);
        if (this.target.building.health <= 0) {
          console.log(`${owner.team}摧毁了敌方建筑！`);
        }
      } else {
        // 触发常规攻击
        if (owner.weapons && owner.weapons.length > 0) {
          const direction = targetPos.x > ownerPos.x ? 1 : -1;
          
          for (const weapon of owner.weapons) {
            if (weapon.canAttack()) {
              weapon.attack(direction);
              break;
            }
          }
        }
      }
    }
  }
  
  // 骑兵行为（来回冲锋）
  cavalryBehavior(owner, deltaTime) {
    if (!this.target) {
      this.state = 'IDLE';
      owner.isMoving = false;
      this.chargePhase = 'APPROACH';
      return;
    }
    
    const ownerPos = owner.transform.position;
    const targetPos = this.target.transform.position;
    const distance = ownerPos.distance(targetPos);
    
    // 更新冲锋冷却
    if (this.chargeTimer > 0) {
      this.chargeTimer -= deltaTime;
      if (this.chargeTimer <= 0) {
        // 冷却结束，重新开始接近
        this.chargePhase = 'APPROACH';
        this.chargeStartPos = null;
        console.log('骑兵冷却完成，开始新一轮冲锋');
      }
    }
    
    // 检查骑枪是否在冲刺状态
    const lance = owner.weapons && owner.weapons.find(w => w.type === 'lance');
    const isLanceCharging = lance && lance.state === 'charging';
    const wasCharging = this.wasLanceCharging;
    this.wasLanceCharging = isLanceCharging;
    
    // 根据当前阶段执行不同行为
    switch (this.chargePhase) {
      case 'APPROACH':
        // 接近阶段：全速向目标冲锋
        this.state = 'CHARGE_APPROACH';
        
        // 持续向目标移动，加速到最大速度触发骑枪冲刺
        const approachDir = Vector2.sub(targetPos, ownerPos).normalize();
        owner.move(approachDir);
        
        // 检测冲锋触发：骑枪刚开始冲刺
        if (isLanceCharging && !wasCharging) {
          this.chargeStartPos = ownerPos.clone();
          console.log('骑兵触发骑枪冲刺！');
        }
        
        // 检测冲锋完成：骑枪冲刺结束
        if (this.chargeStartPos && wasCharging && !isLanceCharging) {
          // 如果目标是建筑，则对建筑造成伤害
          if (this.target.isBuilding && this.target.building) {
            // 骑兵冲锋对建筑造成30点伤害
            this.target.building.health = (this.target.building.health || 100) - 30;
            console.log(`骑兵冲锋攻击建筑，建筑剩余血量: ${this.target.building.health}`);
            if (this.target.building.health <= 0) {
              console.log(`${owner.team}摧毁了敌方建筑！`);
            }
          }
          
          // 冲刺结束，立即切换到穿透阶段
          this.chargePhase = 'CONTINUE';
          this.continueTimer = 3.0; // 继续前进3秒，穿过敌阵（增加穿透时间）
          console.log('骑枪冲刺完成，继续向前穿透');
        }
        break;
        
      case 'CONTINUE':
        // 穿透阶段：保持方向继续前进，穿过目标
        this.state = 'CHARGE_CONTINUE';
        this.continueTimer -= deltaTime;
        
        if (this.continueTimer > 0) {
          // 保持当前朝向继续前进（不转向目标）
          const continueDir = new Vector2(owner.facingDirection, 0);
          owner.move(continueDir);
        } else {
          // 穿透完成，进入冷却并准备下一轮
          this.chargePhase = 'COOLDOWN';
          this.chargeTimer = this.chargeCooldown;
          this.chargeStartPos = null;
          console.log('骑兵穿透完成，进入冷却等待下次冲锋');
        }
        break;
        
      case 'COOLDOWN':
        // 冷却阶段：调整位置，准备下一次冲锋
        this.state = 'CHARGE_COOLDOWN';
        
        // 更宽松的远离判定：距离超过10米即可开始转向
        const minRetreatDistance = 10; // 降低远离距离要求
        
        if (distance > minRetreatDistance) {
          // 已经够远了，开始缓慢转向目标方向
          const toTargetDir = Vector2.sub(targetPos, ownerPos).normalize();
          
          // 缓慢移动，不要加速太快（等待冷却）
          owner.move(toTargetDir.multiply(0.4));
          
          // 更新朝向
          if (targetPos.x !== ownerPos.x) {
            owner.facingDirection = targetPos.x > ownerPos.x ? 1 : -1;
          }
        } else {
          // 还不够远，继续向当前方向移动
          const continueDir = new Vector2(owner.facingDirection, 0);
          owner.move(continueDir.multiply(0.5));
        }
        
        // 冷却结束后自动切换到 APPROACH（在上面的 chargeTimer 更新中）
        break;
    }
  }
}
