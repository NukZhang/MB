// 弓兵（远程AI）
class Archer extends Enemy {
  constructor(x, y, team, config, bowConfig) {
    super(x, y, config, team);
    
    // 弓兵特定颜色
    this.bodyColor = team === 'player' ? '#1abc9c' : '#e67e22';
    this.headColor = team === 'player' ? '#16a085' : '#d35400';
    
    // 装备弓
    this.bow = new Bow(bowConfig, this);
    this.weapons = [this.bow];
    
    // 添加AI组件
    const maxRange = bowConfig.range || 20;
    this.ai = this.addComponent('ai', new AI({
      behaviorType: 'ranged',
      targetRefreshInterval: 8,
      attackRange: maxRange,
      keepDistance: maxRange * 0.8,
      chaseDistance: maxRange + 5
    }));
  }
  
  update(deltaTime) {
    // 调用父类更新（处理物理、动画、死亡）
    super.update(deltaTime);
    
    // 如果死亡，不更新武器和AI
    if (this.dying || !this.alive) return;
    
    // 更新武器
    for (const weapon of this.weapons) {
      weapon.update(deltaTime);
    }
  }
  
  render(context, camera) {
    // 调用父类渲染
    super.render(context, camera);
    
    // 渲染武器
    if (this.alive || this.dying) {
      for (const weapon of this.weapons) {
        weapon.render(context, camera);
      }
    }
  }
}
