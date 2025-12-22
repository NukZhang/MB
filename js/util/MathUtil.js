// 数学工具函数
const MathUtil = {
  // 限制数值范围
  clamp: function(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },

  // 线性插值
  lerp: function(start, end, t) {
    return start + (end - start) * t;
  },

  // 角度转弧度
  degToRad: function(degrees) {
    return degrees * Math.PI / 180;
  },

  // 弧度转角度
  radToDeg: function(radians) {
    return radians * 180 / Math.PI;
  },

  // 随机整数
  randomInt: function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // 随机浮点数
  randomFloat: function(min, max) {
    return Math.random() * (max - min) + min;
  },

  // 角度差（带方向）
  angleDifference: function(angle1, angle2) {
    let diff = angle2 - angle1;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return diff;
  },

  // 平滑角度插值
  lerpAngle: function(start, end, t) {
    const diff = this.angleDifference(start, end);
    return start + diff * t;
  }
};
