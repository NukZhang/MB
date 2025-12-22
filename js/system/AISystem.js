// AI系统
class AISystem {
  constructor() {
    this.aiEntities = [];
  }
  
  // 添加AI实体
  addEntity(entity) {
    if (entity.hasComponent('ai') && !this.aiEntities.includes(entity)) {
      this.aiEntities.push(entity);
    }
  }
  
  // 移除AI实体
  removeEntity(entity) {
    const index = this.aiEntities.indexOf(entity);
    if (index > -1) {
      this.aiEntities.splice(index, 1);
    }
  }
  
  // 更新所有AI实体
  update(allEntities, deltaTime) {
    // 过滤掉已经死亡或不活跃的AI实体
    this.aiEntities = this.aiEntities.filter(entity => entity.active && entity.alive);
    
    for (const entity of this.aiEntities) {
      const ai = entity.getComponent('ai');
      if (ai && ai.enabled) {
        ai.update(entity, allEntities, deltaTime);
      }
    }
  }
  
  // 清空所有AI实体
  clear() {
    this.aiEntities = [];
  }
}
