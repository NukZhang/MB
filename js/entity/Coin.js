// 金币
class Coin extends Entity {
  constructor(x, y) {
    super(x, y);
    this.type = 'coin';

    this.radius = 0.3; // 米
    this.spawnY = y;
    this.state = 'spawn'; // spawn -> idle -> collect
    this.velocity = new Vector2(
      MathUtil.randomFloat(-1.2, 1.2),
      MathUtil.randomFloat(-5.0, -3.5)
    );
    this.gravity = 14;
    this.pickupRadius = 1.4;
    this.collectSpeed = 14;
    this.bobTimer = MathUtil.randomFloat(0, Math.PI * 2);
  }

  update(deltaTime) {
    if (!this.active) return;

    if (this.state === 'spawn') {
      this.velocity.y += this.gravity * deltaTime;
      this.transform.translate(this.velocity.x * deltaTime, this.velocity.y * deltaTime);

      if (this.transform.position.y >= this.spawnY) {
        this.transform.position.y = this.spawnY;
        this.velocity.set(0, 0);
        this.state = 'idle';
      }
      return;
    }

    if (this.state === 'idle') {
      this.bobTimer += deltaTime * 4;

      const player = window.game && window.game.player;
      if (player && player.alive) {
        const distance = this.transform.position.distance(player.transform.position);
        if (distance <= this.pickupRadius) {
          this.state = 'collect';
        }
      }
      return;
    }

    if (this.state === 'collect') {
      const game = window.game;
      if (!game || !game.camera || !game.getCoinTargetScreenPosition) {
        this.active = false;
        if (game && game.addCoins) {
          game.addCoins(1);
        }
        return;
      }

      const targetScreen = game.getCoinTargetScreenPosition();
      const targetWorld = game.camera.screenToWorld(targetScreen);
      const toTarget = Vector2.sub(targetWorld, this.transform.position);
      const distance = toTarget.length();

      if (distance <= 0.2) {
        this.active = false;
        game.addCoins(1);
        return;
      }

      toTarget.normalize();
      const moveDistance = Math.min(distance, this.collectSpeed * deltaTime);
      this.transform.translate(toTarget.x * moveDistance, toTarget.y * moveDistance);
    }
  }

  render(context, camera) {
    if (!this.active) return;

    const screenPos = camera.worldToScreen(this.transform.position);
    const screenRadius = camera.worldToScreenDistance(this.radius);
    const bobOffset = this.state === 'idle' ? Math.sin(this.bobTimer) * screenRadius * 0.2 : 0;

    context.save();
    context.translate(screenPos.x, screenPos.y + bobOffset);

    context.fillStyle = '#f1c40f';
    context.beginPath();
    context.arc(0, 0, screenRadius, 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = '#f9e79f';
    context.lineWidth = 2;
    context.stroke();

    context.fillStyle = 'rgba(255, 255, 255, 0.7)';
    context.beginPath();
    context.arc(-screenRadius * 0.3, -screenRadius * 0.3, screenRadius * 0.25, 0, Math.PI * 2);
    context.fill();

    context.restore();
  }
}
