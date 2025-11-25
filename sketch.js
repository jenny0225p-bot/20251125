let stopSheet;
let walkSheet;
let attackSheet;
let imagesLoaded = false;

let charX, charY; // 用來儲存角色的位置
let facingDirection = 1; // 角色面向的方向：1 是右邊, -1 是左邊
let charState = 'idle'; // 角色狀態: 'idle', 'walking', 'attacking'
let attackFrameCounter = 0; // 攻擊動畫的計數器

const moveSpeed = 4; // 角色移動速度

// 站立動畫的設定
const stopSpriteWidth = 880; // 站立圖片精靈的總寬度
const stopTotalFrames = 10;
const stopFrameH = 160; // 單一影格的高度

// 走路動畫的設定 (517px / 3 frames = 172.33px)
const walkTotalFrames = 3;
const walkSpriteWidth = 517; // 走路圖片精靈的總寬度
const walkFrameH = 156; // 走路動畫單一影格的高度

// 攻擊動畫的設定 (5275px / 12 frames)
const attackTotalFrames =15;
const attackSpriteWidth = 5275;
const attackFrameH = 198;

const scaleFactor = 2; // 放大倍率，可依喜好調整
const animSpeed = 4; // 動畫速度，數字越小動畫越快 (每 4 個 draw() 迴圈換一幀)

function preload() {
  // 使用載入成功/失敗回呼並把回傳的 img 指定回全域變數，確保取得正確的寬度/高度
  stopSheet = loadImage(
    '1/stop/stop.png',
    (img) => { stopSheet = img; checkAllImagesLoaded(); },
    (err) => { console.error('載入 stop.png 失敗，請確認路徑：', '1/stop/stop.png', err); }
  );
  walkSheet = loadImage(
    '1/walk/walk.png',
    (img) => { walkSheet = img; checkAllImagesLoaded(); },
    (err) => { console.error('載入 walk.png 失敗，請確認路徑：', '1/walk/walk.png', err); }
  );
  attackSheet = loadImage(
    '1/attrack/attrack.png',
    (img) => { attackSheet = img; checkAllImagesLoaded(); },
    (err) => { console.error('載入 attrack.png 失敗，請確認路徑：', '1/attrack/attrack.png', err); }
  );
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  noSmooth(); // 讓像素風格的圖片放大後保持清晰，不會模糊
  charX = width / 2; // 角色初始 X 位置
  charY = height / 2; // 角色初始 Y 位置
}

function checkAllImagesLoaded() {
  if (stopSheet?.width && walkSheet?.width && attackSheet?.width) imagesLoaded = true;
}

function draw() {
  background('#d1b3c4');

  if (!imagesLoaded) {
    push();
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(18);
    text('圖片尚未載入或路徑錯誤。請檢查 Console 的 404/Network。', width/2, height/2);
    pop();
    return;
  }

  let currentSheet, frameW, frameH, totalFrames;

  // 狀態管理
  // 如果正在攻擊，就不能被走路中斷
  if (charState !== 'attacking') {
    if (keyIsDown(RIGHT_ARROW) && !keyIsDown(LEFT_ARROW)) {
      charState = 'walking';
    } else if (keyIsDown(LEFT_ARROW) && !keyIsDown(RIGHT_ARROW)) {
      charState = 'walking';
    } else {
      charState = 'idle';
    }
  }

  // 根據狀態設定動畫和行為
  if (charState === 'attacking') {
    currentSheet = attackSheet;
    frameW = Math.floor(attackSpriteWidth / attackTotalFrames);
    frameH = attackFrameH;
    totalFrames = attackTotalFrames;

    // 取得攻擊動畫的當前影格索引 (0-indexed)
    const currentAttackFrame = floor(attackFrameCounter / animSpeed);

    // 當動畫在第 9 幀到第 15 幀時 (索引 8 到 14)，讓角色移動
    if (currentAttackFrame >= 8 && currentAttackFrame < 15) {
      const attackMoveSpeed = moveSpeed * 1.5; // 攻擊時的移動速度可以快一點
      const halfCharWidth = (frameW * scaleFactor) / 2;

      if (facingDirection === 1 && charX < width - halfCharWidth) { // 向右移動
        charX += attackMoveSpeed;
      } else if (facingDirection === -1 && charX > halfCharWidth) { // 向左移動
        charX -= attackMoveSpeed;
      }
    }

    // 攻擊動畫播放完畢
    if (attackFrameCounter >= totalFrames * animSpeed) {
      attackFrameCounter = 0; // 重置計數器給下一個動畫
      charState = 'idle'; // ***攻擊結束後，回到站立狀態***
    } else {
      attackFrameCounter++;
    }
  } else if (charState === 'walking') {
    if (keyIsDown(RIGHT_ARROW)) {
      currentSheet = walkSheet;
      frameW = Math.floor(walkSpriteWidth / walkTotalFrames);
      frameH = walkFrameH;
      totalFrames = walkTotalFrames;
      const halfCharWidth = (frameW * scaleFactor) / 2;
      if (charX < width - halfCharWidth) charX += moveSpeed;
      facingDirection = 1;
    } else if (keyIsDown(LEFT_ARROW)) {
      currentSheet = walkSheet;
      frameW = Math.floor(walkSpriteWidth / walkTotalFrames);
      frameH = walkFrameH;
      totalFrames = walkTotalFrames;
      const halfCharWidth = (frameW * scaleFactor) / 2;
      if (charX > halfCharWidth) charX -= moveSpeed;
      facingDirection = -1;
    }
  } else { // idle
    currentSheet = stopSheet;
    frameW = Math.floor(stopSpriteWidth / stopTotalFrames);
    frameH = stopFrameH;
    totalFrames = stopTotalFrames;
  }

  // 計算當前影格
  let currentFrame;
  if (charState === 'attacking') {
    // 讓攻擊動畫的每一幀都按順序播放，這樣角色和技能特效會一起出現並成長
    currentFrame = floor(attackFrameCounter / animSpeed);
  } else {
    currentFrame = floor(frameCount / animSpeed) % totalFrames;
  }
  const sx = currentFrame * frameW;
  const sy = 0;

  // 計算攻擊時的 Y 軸位移
  let yOffset = 0;
  if (charState === 'attacking') {
    // 使用 sin 函式製造一個從 0 -> 峰值 -> 0 的平滑上下移動曲線
    const attackProgress = (attackFrameCounter / (totalFrames * animSpeed)); // 0.0 ~ 1.0
    yOffset = -sin(attackProgress * PI) * 30; // 向上移動最多 30 像素
  }

  push(); // 儲存目前的繪圖狀態
  translate(charX, charY + yOffset); // 將畫布原點移動到角色的位置 (包含Y軸位移)
  scale(facingDirection, 1); // 根據面向的方向翻轉畫布 (x軸)

  image(
    currentSheet,
    0, 0, // 因為已經 translate，所以在新原點 (0,0) 繪製
    frameW * scaleFactor,
    frameH * scaleFactor,
    sx, sy,
    frameW, frameH
  );

  pop(); // 恢復原本的繪圖狀態
}

function keyPressed() {
  // 當按下空白鍵且角色不在攻擊狀態時，開始攻擊
  if (key === ' ' && charState !== 'attacking') {
    charState = 'attacking';
    attackFrameCounter = 0; // 重置攻擊動畫計數器
  }
}

function windowResized() {
  // 當瀏覽器視窗大小改變時，自動調整畫布大小
  resizeCanvas(windowWidth, windowHeight);
  // 避免角色在視窗縮放後位置跑掉，可以選擇是否要重置位置
  // charX = width / 2;
}
