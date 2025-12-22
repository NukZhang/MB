// 碰撞器组件
class Collider {
  constructor(radius, mass) {
    this.radius = radius; // 碰撞半径（米）
    this.mass = mass || 1; // 质量
    this.enabled = true; // 是否启用碰撞
  }

  // 检查与另一个碰撞器是否重叠
  checkOverlap(otherCollider, thisPos, otherPos) {
    if (!this.enabled || !otherCollider.enabled) {
      return null;
    }

    const distance = thisPos.distance(otherPos);
    const minDistance = this.radius + otherCollider.radius;

    if (distance < minDistance) {
      // 有重叠
      const overlap = minDistance - distance;
      return {
        overlap: overlap,
        distance: distance,
        minDistance: minDistance
      };
    }

    return null;
  }
}
