// 使用 Expectimax + 启发式评估

(function(){
    const DIRS = ["up","right","down","left"]; // 搜索顺序
    const PROB_2 = 0.9;

    // 深拷贝当前棋盘
    function clone(grid){
        return grid.map(row=>row.map(cell=>cell?{...cell}:null));
    }

    /**
     * 根据给定方向尝试执行一次移动
     * @returns {null | {grid: Array, scoreGain: number}}
     */
    function tryMove(grid, dir){
        const size=4;
        let moved=false;
        let scoreGain=0;
        let newGrid=clone(grid);
        const rotateTimes = {left:0,up:1,right:2,down:3}[dir];
        for(let r=0;r<rotateTimes;r++) newGrid = rotateLeft(newGrid);
        for(let i=0;i<size;i++){
            const originalRow = newGrid[i].map(c=>c?c.value:0);
            let row = newGrid[i].filter(c=>c);
            for(let j=0;j<row.length-1;j++){
                if(row[j].value===row[j+1].value){
                    row[j].value*=2;
                    scoreGain+=row[j].value;
                    row.splice(j+1,1);
                }
            }
            while(row.length<size) row.push(null);
            const newRowValues = row.map(c=>c?c.value:0);
            if(originalRow.some((v,idx)=>v!==newRowValues[idx])) moved = true;
            newGrid[i]=row;
        }
        for(let r=0;r<(4-rotateTimes)%4;r++) newGrid = rotateLeft(newGrid);
        return moved?{grid:newGrid,scoreGain}:null;
    }

    function rotateLeft(mat){
        const n=mat.length;
        const res=Array.from({length:n},()=>Array(n).fill(null));
        for(let i=0;i<n;i++) for(let j=0;j<n;j++) res[n-1-j][i]=mat[i][j];
        return res;
    }

    // 启发式评估函数
    function heuristic(grid){
        let empty=0, monotonic=0, maxTile=0;
        for(let i=0;i<4;i++){
            let prev=0;
            for(let j=0;j<4;j++){
                const cell=grid[i][j];
                if(!cell){empty++;continue;}
                maxTile=Math.max(maxTile,cell.value);
                const v=Math.log2(cell.value);
                if(j>0){monotonic += v - prev;}
                prev=v;
            }
        }
        return empty*1000 + maxTile + monotonic*10;
    }

    function expectimax(grid, depth){
        if(depth===0) return {score:heuristic(grid)};
        let bestScore=-Infinity, bestDir=null;
        for(const dir of DIRS){
            const res=tryMove(grid,dir);
            if(!res) continue;
            const {grid:childGrid}=res;
            const expScore = chance(childGrid, depth-1).score;
            if(expScore>bestScore){bestScore=expScore;bestDir=dir;}
        }
        return {score:bestScore,dir:bestDir};
    }

    function chance(grid, depth){
        const empties=[];
        for(let i=0;i<4;i++) for(let j=0;j<4;j++) if(!grid[i][j]) empties.push([i,j]);
        if(!empties.length) return {score:heuristic(grid)};
        let total=0;
        for(const [i,j] of empties){
            for(const {value,prob} of [{value:2,prob:PROB_2},{value:4,prob:1-PROB_2}]){
                const g=clone(grid);
                g[i][j]={value};
                total+=prob*expectimax(g,depth).score;
            }
        }
        return {score:total/empties.length};
    }

    let intervalId=null, running=false;
    function step(){
        if(!window.game || window.game.won){stop();return;}
        const {dir}=expectimax(window.game.grid,3);
        if(dir) {
            window.game.move(dir);
        } else {
            // 兜底处理
            for(const d of DIRS){
                if(typeof window.game.move === "function"){
                    window.game.move(d);
                }
            }
        }
    }

    function start(speed=75){if(intervalId) return;intervalId=setInterval(step,speed);running=true;}
    function stop(){if(intervalId){clearInterval(intervalId);intervalId=null;}running=false;}

    window.autoPlayer={start,stop,isRunning:()=>running};

    window.addEventListener('DOMContentLoaded',()=>{
        const btn=document.getElementById('ai-toggle');
        if(!btn) return;
        btn.addEventListener('click',()=>{
            if(window.autoPlayer.isRunning()){stop();btn.textContent='AI运行';}
            else{start();btn.textContent='停止自动';}
        });
    });
})();