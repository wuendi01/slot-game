import * as PIXI from 'pixi.js';
import Game from './Game';
import Reel from './Reel';
declare function js_wrapped_EX_Krilloud_Play(a:string, b:number): Promise<number>;
declare function js_wrapped_EX_Krilloud_UpdateKVar_INT(a:string, b:number, c:number): Promise<void>; 
declare function js_wrapped_EX_Krilloud_StopTag(a:string, b:number): Promise<number>;


export default class ReelsContainer {
    public readonly reels: Array<Reel> = [];
    public readonly container: PIXI.Container;

    constructor(app: PIXI.Application) {
        const REEL_OFFSET_LEFT = 70;
        const NUMBER_OF_REELS = 3;
        this.container = new PIXI.Container();

        for (let i = 0; i < NUMBER_OF_REELS; i++) {
            const reel = new Reel(app, i);
            this.reels.push(reel);
            this.container.addChild(reel.container);
        }
        this.container.x = REEL_OFFSET_LEFT;   
    }

    async spin() {
        // Overall time of spinning = shiftingDelay * this.reels.length
        //
        const shiftingDelay = 500;
        const start = Date.now();
        const reelsToSpin = [...this.reels];

        if(!Game.prototype.firstPlayCalled) {
            const playBackgroundSound = await js_wrapped_EX_Krilloud_Play("music",3)
            Game.prototype.firstPlayCalled = true     
        }
        
        const playReel1 =  await js_wrapped_EX_Krilloud_Play("ruleta",0) 
        
        for await (let value of this.infiniteSpinning(reelsToSpin)) {
            const shiftingWaitTime = (this.reels.length - reelsToSpin.length + 1) * shiftingDelay;
            
            if (Date.now() >= start + shiftingWaitTime) {
                var reelStopped = reelsToSpin.shift()
                var reelTexture = reelStopped ? reelStopped.sprites[2].texture.textureCacheIds[0] : null 

                let textureId = reelStopped?.textures.findIndex(item => item.textureCacheIds[0] === reelTexture)
                if(textureId !== undefined) {
                    await js_wrapped_EX_Krilloud_UpdateKVar_INT("fruits", 0, textureId)
                    const playFruit =  await js_wrapped_EX_Krilloud_Play("fruits",0)
                }                
            }

            if (!reelsToSpin.length) {
                await js_wrapped_EX_Krilloud_StopTag("ruleta", 0)
                break;
            } 
        }

        // reel.sprites[2] - Middle visible symbol of the reel
        return this.checkForWin(this.reels.map(reel => reel.sprites[2]));
    }

    private async* infiniteSpinning(reelsToSpin: Array<Reel>) {
        while (true) {
            const spinningPromises = reelsToSpin.map(reel => reel.spinOneTime());
            await Promise.all(spinningPromises);
            this.blessRNG();
            yield;
        }
    }

    private checkForWin(symbols: Array<PIXI.Sprite>): boolean {
        // Set of strings: 'SYM1', 'SYM2', ...
        //
        const combination: Set<string> = new Set();
        symbols.forEach(symbol => combination.add(symbol.texture.textureCacheIds[0].split('.')[0]));
        if (combination.size === 1 && !combination.has('SYM1')) return true;
        return combination.size === 2 && combination.has('SYM1');
    }

    private blessRNG() {
        this.reels.forEach(reel => {
            reel.sprites[0].texture = reel.textures[Math.floor(Math.random() * reel.textures.length)];
        });
    }
}
