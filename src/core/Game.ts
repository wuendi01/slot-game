import * as PIXI from 'pixi.js';
import Loader from './Loader';
import PlayButton from './PlayButton';
import Background from './Background';
import ReelsContainer from './ReelsContainer';
import Scoreboard from './Scoreboard';
import VictoryScreen from './VictoryScreen';

declare function js_wrapped_EX_Krilloud_Create(a:string, b:string): Promise<number>;
declare function js_wrapped_EX_Krilloud_Init(a:number, b:number, c:number, d:number, e:number): Promise<number>;
declare function js_wrapped_EX_Krilloud_Load(a:string, b:number, c:number, d:string): Promise<number>;
declare function js_wrapped_EX_Krilloud_MainLoop(): Promise<void>;
declare function js_wrapped_EX_Krilloud_Play(a:string, b:number): Promise<number>;
declare function js_wrapped_EX_Krilloud_ReadKVar_FLOAT(a:string, b:number): Promise<number>; 
declare function js_wrapped_EX_Krilloud_UpdateKVar_FLOAT(a:string, b:number, c:number): Promise<void>; 


export default class Game {
    public app: PIXI.Application;
    private playBtn: PlayButton;
    private reelsContainer: ReelsContainer;
    private scoreboard: Scoreboard;
    private victoryScreen: VictoryScreen;
    public firstPlayCalled: boolean;
    private krillLoaded: boolean;
    private gameLoaded: boolean;
    private loader: Loader;

    constructor() {
        this.krillLoaded = false
        this.gameLoaded = false
        this.app = new PIXI.Application({ width: 960, height: 536 });
        window.document.body.appendChild(this.app.view);
        this.loader = new Loader(this.app, this.createKrill.bind(this));
        this.firstPlayCalled = false
        window.addEventListener('click', async () => {
            this.firstPlay()
        })
        
    }
    
    private checkLoaded() {
        if(this.krillLoaded && this.gameLoaded) {
            let loadingScreen = this.loader.getLoadingScreen()
            this.app.stage.removeChild(loadingScreen);
        }
    }
    
    private async init() {
        this.createScene();
        this.createPlayButton();
        this.createReels();
        this.createScoreboard();
        this.createVictoryScreen();
        this.gameLoaded = true
        this.checkLoaded()
    }
    

    private async krilloud_Init()
    {
        let global_relativeWebPath = "public/";
        setTimeout(async () => {
            await js_wrapped_EX_Krilloud_Init(1,0,0,0,2);
            const loadCanvasSound =  await js_wrapped_EX_Krilloud_Load("music,UI",2, 3, "")
            const loadReel = await js_wrapped_EX_Krilloud_Load("ruleta",1, 0, "")
            const fruits =  await js_wrapped_EX_Krilloud_Load("fruits",1, 0, "")
            await Promise.all([loadCanvasSound, loadReel, fruits])

            const mainLoop = await js_wrapped_EX_Krilloud_MainLoop()
            this.krillLoaded = true
            this.checkLoaded()
            this.init()
        }, 1000)         
    }

    public async firstPlay () {
        if(!this.firstPlayCalled) {
            this.firstPlayCalled = true     
        }
    }

    private createKrill() {
        const result = js_wrapped_EX_Krilloud_Create('public/','')
        setTimeout(() => {
            this.krilloud_Init()
        }, 2000)  
    }

    private createScene() {
        const bg = new Background(this.app.loader);
        this.app.stage.addChild(bg.sprite);
    }

    private createPlayButton() {
        this.playBtn = new PlayButton(this.app, this.handleStart.bind(this));
        this.app.stage.addChild(this.playBtn.sprite);
    }

    private createReels() {
        this.reelsContainer = new ReelsContainer(this.app);
        this.app.stage.addChild(this.reelsContainer.container);
    }

    private createScoreboard() {
        this.scoreboard = new Scoreboard(this.app);
        this.app.stage.addChild(this.scoreboard.container);
    }

    private createVictoryScreen() {
        this.victoryScreen = new VictoryScreen(this.app);
        this.app.stage.addChild(this.victoryScreen.container);
    }

    async handleStart() {
        this.firstPlay()
        this.scoreboard.decrement();
        this.playBtn.setDisabled();
        this.reelsContainer.spin()
            .then(this.processSpinResult.bind(this));
    }

    private async processSpinResult(isWin: boolean) {
        if (isWin) {
            this.scoreboard.increment();
            this.victoryScreen.show();
            let win_loose = await js_wrapped_EX_Krilloud_ReadKVar_FLOAT("win_loose", 3)
            if(win_loose != 0) {
                await js_wrapped_EX_Krilloud_UpdateKVar_FLOAT("win_loose", 3, 0)
            }
            const playBackgroundSound = await js_wrapped_EX_Krilloud_Play("UI",3)
        } else {
            let win_loose = await js_wrapped_EX_Krilloud_ReadKVar_FLOAT("win_loose", 3)
            if(win_loose != 1) {
                await js_wrapped_EX_Krilloud_UpdateKVar_FLOAT("win_loose", 3, 1)
            }
            const playBackgroundSound = await js_wrapped_EX_Krilloud_Play("UI",3)

        }

        if (!this.scoreboard.outOfMoney) this.playBtn.setEnabled();
    }
    
}

