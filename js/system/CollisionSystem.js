// 碰撞系统
class CollisionSystem {
  constructor() {
    this.entities = [];
  }

  // 添加实体到碰撞系统
  addEntity(entity) {
    if (entity.hasComponent('collider')) {
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

  // 更新碰撞检测和响应
  update(deltaTime) {
    // 检测所有实体对之间的碰撞
    for (let i = 0; i < this.entities.length; i++) {
      const entityA = this.entities[i];
      if (!entityA.active) continue;

      const colliderA = entityA.getComponent('collider');
      const physicsA = entityA.getComponent('physics');
      
      if (!colliderA || !colliderA.enabled) continue;

      for (let j = i + 1; j < this.entities.length; j++) {
        const entityB = this.entities[j];
        if (!entityB.active) continue;

        const colliderB = entityB.getComponent('collider');
        const physicsB = entityB.getComponent('physics');
        
        if (!colliderB || !colliderB.enabled) continue;

        // 检查碰撞
        const overlapInfo = colliderA.checkOverlap(
          colliderB,
          entityA.transform.position,
          entityB.transform.position
        );

        if (overlapInfo) {
          // 有碰撞，进行推挤处理
          this.resolveCollision(
            entityA, entityB,
            colliderA, colliderB,
            physicsA, physicsB,
            overlapInfo
          );
        }
      }
    }
  }

  // 处理碰撞响应（推挤）
  resolveCollision(entityA, entityB, colliderA, colliderB, physicsA, physicsB, overlapInfo) {
    const posA = entityA.transform.position;
    const posB = entityB.transform.position;

    // 计算推挤方向（从B指向A）
    const direction = Vector2.sub(posA, posB);
    
    // 如果两个实体完全重合，给一个随机方向
    if (direction.length() < 0.001) {
      direction.set(Math.random() - 0.5, Math.random() - 0.5);
    }
    
    direction.normalize();

    // 根据质量比例分配推挤距离
    const totalMass = colliderA.mass + colliderB.mass;
    const pushA = overlapInfo.overlap * (colliderB.mass / totalMass);
    const pushB = overlapInfo.overlap * (colliderA.mass / totalMass);

    // 应用推挤位移
    const pushVectorA = Vector2.multiply(direction, pushA);
    const pushVectorB = Vector2.multiply(direction, -pushB);

    entityA.transform.position.add(pushVectorA);
    entityB.transform.position.add(pushVectorB);

    // 如果有物理组件，也影响速度（轻微的反弹效果）
    if (physicsA && physicsB) {
      const impulseStrength = 2; // 冲量强度
      
      // 计算相对速度
      const relativeVel = Vector2.sub(physicsA.velocity, physicsB.velocity);
      const velAlongNormal = relativeVel.dot(direction);

      // 只在物体相互接近时应用冲量
      if (velAlongNormal < 0) {
        const impulse = Vector2.multiply(direction, velAlongNormal * impulseStrength);
        
        physicsA.applyImpulse(Vector2.multiply(impulse, -colliderB.mass / totalMass));
        physicsB.applyImpulse(Vector2.multiply(impulse, colliderA.mass / totalMass));
      }
    }
  }

  // 清空所有实体
  clear() {
    this.entities = [];
  }
}
