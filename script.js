class Yang8192 {
  // 构造函数
  constructor() {
    this.grid = [];
    this.score = 0;
    this.best = +localStorage.getItem("zuihao") || 0;
    this.won = false;
    this.idCounter = 0;
    this.tileEls = new Map();
    this.init();
  }

  init() {
    this.buildGrid();
    this.attachEvents();
    this.reset();
  }

  buildGrid() {
    const gridEl = document.querySelector(".grid");
    gridEl.innerHTML = "";

    for (let i = 0; i < 16; i++) {
      gridEl.insertAdjacentHTML("beforeend", "<div class='cell'></div>");
    }
  }

  attachEvents() {
    document.addEventListener("keydown", (e) => {
      const dirs = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
      };

      if (dirs[e.key]) {
        e.preventDefault();
        this.move(dirs[e.key]);
      }
    });

    let startX, startY;

    document.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });

    document.addEventListener("touchend", (e) => {
      if (startX == null || startY == null) return;

      const deltaX = e.changedTouches[0].clientX - startX;
      const deltaY = e.changedTouches[0].clientY - startY;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // 横向滑动
        deltaX > 0 ? this.move("right") : this.move("left");
      } else {
        // 纵向滑动
        deltaY > 0 ? this.move("down") : this.move("up");
      }

      startX = startY = null;
    });
  }

  reset() {
    this.grid = Array.from({ length: 4 }, () => Array(4).fill(null));
    this.score = 0;
    this.won = false;
    this.clearTilesDom();
    this.addRandom();
    this.addRandom();
    this.render();
    this.updateScores();
  }

  clearTilesDom() {
    this.tileEls.forEach((el) => el.remove());
    this.tileEls.clear();
  }

  // 在随机空位生成一个数字（90% 概率为 2，10% 概率为 4）。
  addRandom() {
    const empties = [];

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (this.grid[i][j] == null) empties.push([i, j]);
      }
    }

    if (!empties.length) return;

    const [row, col] = empties[Math.floor(Math.random() * empties.length)];
    this.grid[row][col] = {
      value: Math.random() < 0.9 ? 2 : 4,
      id: ++this.idCounter,
    };
  }

  // 根据方向移动棋盘
  move(dir) {
    const before = JSON.stringify(this.grid);

    switch (dir) {
      case "left":
        this.grid = this.grid.map((row) => this.slide(row));
        break;
      case "right":
        this.grid = this.grid.map((row) => this.slide(row.reverse()).reverse());
        break;
      case "up":
        this.transpose();
        this.grid = this.grid.map((row) => this.slide(row));
        this.transpose();
        break;
      case "down":
        this.transpose();
        this.grid = this.grid.map((row) => this.slide(row.reverse()).reverse());
        this.transpose();
        break;
    }

    if (JSON.stringify(this.grid) !== before) {
      this.addRandom();
      this.render();
      this.updateScores();
      this.checkStatus();
    }
  }

  // 将一行（或一列）数字向左合并并补齐空位
  slide(row) {
    row = row.filter((cell) => cell);
    for (let i = 0; i < row.length - 1; i++) {
      if (row[i].value === row[i + 1].value) {
        row[i].value *= 2;
        this.score += row[i].value;
        row.splice(i + 1, 1);
      }
    }
    while (row.length < 4) row.push(null);
    return row;
  }

  // 矩阵求转置（行列互换）
  transpose() {
    this.grid = this.grid[0].map((_, i) => this.grid.map((row) => row[i]));
  }

  render() {
    const boardEl = document.querySelector(".board");
    const cellEls = Array.from(document.querySelectorAll(".grid .cell"));
    if (!cellEls.length) return;

    // 当前 step 存活的 id，用于判定哪些 DOM 需要删除
    const aliveIds = new Set();

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const tile = this.grid[r][c];
        if (!tile) continue;

        aliveIds.add(tile.id);

        let el = this.tileEls.get(tile.id);

        // 定位目标 cell
        const cellEl = cellEls[4 * r + c];
        const left = cellEl.offsetLeft + "px";
        const top = cellEl.offsetTop + "px";

        if (el) {
          // 若数字变化则更新 class 与文本
          if (!el.classList.contains(`tile-${tile.value}`)) {
            el.className = `tile tile-${tile.value}`;
            el.textContent = tile.value;
          }

          // 更新位置
          el.style.left = left;
          el.style.top = top;
        } else {
          el = document.createElement("div");
          el.className = `tile tile-${tile.value}`;
          el.textContent = tile.value;
          el.style.left = left;
          el.style.top = top;

          boardEl.appendChild(el);
          this.tileEls.set(tile.id, el);

          el.style.transform = "scale(0)";
          requestAnimationFrame(() => {
            el.style.transform = "scale(1)";
          });
        }
      }
    }

    // 删除已不存在的 DOM
    this.tileEls.forEach((el, id) => {
      if (!aliveIds.has(id)) {
        el.style.transform = "scale(0)";
        setTimeout(() => el.remove(), 150);
        this.tileEls.delete(id);
      }
    });
  }


  updateScores() {
    document.getElementById("score").textContent = this.score;

    if (this.score > this.best) {
      this.best = this.score;
      localStorage.setItem("zuihao", this.best);
    }

    document.getElementById("best").textContent = this.best;
  }

  movesAvailable() {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (this.grid[r][c] == null) return true;

        const val = this.grid[r][c].value;

        if (r < 3 && this.grid[r + 1][c] && this.grid[r + 1][c].value === val)
          return true;
        if (c < 3 && this.grid[r][c + 1] && this.grid[r][c + 1].value === val)
          return true;
      }
    }

    return false;
  }

  checkStatus() {
    const reachedGoal = this.grid.flat().some((t) => t && t.value === 8192);

    if (reachedGoal && !this.won) {
      this.won = true;
      this.showOverlay("won");
      return;
    }

    if (!this.movesAvailable()) {
      this.showOverlay("over");
    }
  }

  /**
   * 根据类型展示蒙层。
   * @param {"won" | "over"} type
   */
  showOverlay(type) {
    const overlayEl = document.getElementById(type === "won" ? "won" : "over");

    overlayEl.textContent = type === "won" ? "获得成就 “天才少年”" : "菜就多练";
    overlayEl.style.display = "flex";
    overlayEl.style.fontSize = "40px";
    overlayEl.style.color = "#fff";
    overlayEl.style.textAlign = "center";
    overlayEl.style.cursor = "pointer";

    overlayEl.onclick = () => {
      overlayEl.style.display = "none";
      if (type !== "won") this.reset();
    };
  }
}

// 程序入口
document.addEventListener("DOMContentLoaded", () => {
  window.game = new Yang8192();
  document.getElementById("new").onclick = () => window.game.reset();
});