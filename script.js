class Database {
    static getName(){
        return localStorage['name'];
    }
    static setName(name){
        localStorage['name'] = name;
    }
    static getScores(){
        var scores = {
            "Reza 2M": 120,
            "Mohammad 1M": 60,

            "Saeed 3M": 180,
        };
        if(typeof localStorage['scores'] == 'undefined')
            var locastorageScores = {};
        else
            var locastorageScores = JSON.parse(localStorage['scores']);
        for(var i in locastorageScores)
            scores[i] = locastorageScores[i];
        var keys = Object.keys(scores).sort(function(a,b){
            return scores[b] -  scores[a];
        })
        var newObj = {};
        for(var i in keys){
            newObj[keys[i]] = scores[keys[i]] ;
        }
        return newObj;
    }
    static addScore(val){
        var name = Database.getName();
        if(typeof localStorage['scores'] == 'undefined')
            var locastorageScores = {};
        else
            var locastorageScores = JSON.parse(localStorage['scores']);
        locastorageScores[name] = val;
        localStorage['scores'] = JSON.stringify(locastorageScores);
    }
}

class Cordinates{
    static hasCollision(recto,rectp) {
        var rect1 = {
            width:recto.width,
            height:recto.height,
            x:recto.x * 30,
            y:recto.y * 30,
        };
        var rect2 = {
            width:rectp.width,
            height:rectp.height,
            x:rectp.x * 30,
            y:rectp.y * 30,
        };
        return (rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.height + rect1.y > rect2.y);
    }

}


class GameObject {
    constructor(type,classname,x,y,w,h){
        this.type = type;
        this.classname = classname;
        this.cord = {};
        this.cord.x = x;
        this.cord.y = y;
        this.cord.width = w;
        this.cord.height = h;
        this.animations = [];
        this.metastyle = '';
        this.active = 0;
    }

    initAnim(anim,length,ended=null){
        this.animations.push({
            body:anim,
            length:length,
            start:getGame().getFrame(),
            active:true,
            ended:ended
        })
    }

    runAnimes(){
        for(var i in this.animations){
            if(!this.animations[i].active) continue;
            if(getGame().getFramesPassed(this.animations[i].start) == (this.animations[i].length+1)) {
                if(this.animations[i].ended != null) {
                    this.animations[i].ended(this);
                }
                this.animations[i].active = false;
                continue;
            }
            this.animations[i].body(this , getGame().getFramesPassed(this.animations[i].start));
        }
    }

    getHTML(){
        var top = this.cord.y*30;
        var left = this.cord.x*30;
        return `<div class="${this.type} ${this.classname}" style="top: ${top}px;  left: ${left}px; ${this.metastyle}"></div>`;
    }

    goto(x,y,time,callback=null){
        var delta = Animation.deltaFinder(this.cord,{x:x,y:y},time);

        this.initAnim(function(object,time){
            object.cord.x+=delta.x;
            object.cord.y+=delta.y;
        },time,callback);
    }

    collisionCheck(type,onCollision){
        for(var i in getGame().DB){
            if(getGame().DB[i].active == 0 && getGame().DB[i].type == type){
                if(Cordinates.hasCollision(this.cord,getGame().DB[i].cord))
                {
                    onCollision(this,getGame().DB[i]);
                }
            };
        }

    }
    update(){}
}


class Enemy extends GameObject{
    constructor(classn,x,y,w,h){
        super('enemy',classn,x,y,w,h);
        this.activated = false;
        this.angle= 1;
        this.last_change = 0;
        this.last_shot = 0;
    }

    explode(){
        this.active = 1;
        this.goto(this.cord.x,this.cord.y-.2,3,function(obj){
            obj.active = 2;
        })
    }

    update(){
        if(this.activated){

            if(this.cord.y >= 15){
                this.explode();
            }
            var shootdelay = 400;
            if(this.classname == 'enemy-4') shootdelay = 300;
            if(this.classname == 'enemy-3') shootdelay = 325;
            if(this.classname == 'enemy-2') shootdelay = 366;
            if(getGame().getFramesPassed(this.last_shot) > shootdelay && parseInt(Math.random() * 1000) % 10 == 0){
                this.last_shot = getGame().getFrame();
                getGame().DB.push(new AlienBullet(this.cord.x,this.cord.y+.3))
            }

            this.collisionCheck('bullet',function(obj1,obj2){
               obj1.explode();
               obj2.explode();
            });
            this.collisionCheck('laser',function(obj1,obj2){
                obj1.explode();
                obj2.explode();
            });
            this.collisionCheck('player',function(obj1,player){
                if(getGame().CONFIG.DEFAULTS.LIFE > 1){
                    getGame().CONFIG.DEFAULTS.LIFE--;
                    obj1.explode();
                    player.initAnim(function(object,time){
                        object.metastyle = "background-image:url('img/player_burn.png')"
                        var t = 2.5 - time;
                        object.cord.y+= t/20;
                    },5,function(object){
                        object.metastyle = "";
                    });
                }else{
                    getGame().CONFIG.DEFAULTS.INTERVAL = false;
                    $(".dead").slideDown(100);
                }
            })
            var m = 1;
            if(this.classname == 'enemy-4') m = 1.3;
            if(this.classname == 'enemy-3') m = 1.2;
            if(this.classname == 'enemy-2') m = 1.1;
            if(this.cord.x < 8 && this.cord.x > 2 && parseInt(Math.random() * 1000) % 10 == 0 && getGame().getFramesPassed(this.last_change) > 100){
                this.angle*=-1;
                this.last_change = getGame().getFrame();
            }
            if(this.angle == 1)
                this.cord.x+=.1 * m;
            if(this.angle == -1)
                this.cord.x-=.1  * m;
            this.cord.y+=0.01;
            if(this.angle == 1 && this.cord.x >=9){
                this.angle*=-1;
                this.cord.x=9;
            }
            if(this.angle == -1 && this.cord.x <= 0){
                this.angle*=-1;
                this.cord.x=0;
            }
        }
    }
    activate(right=false){
        this.active = 1;
        this.initAnim(function(object,time){
            var angle=time/50*180;
            var origin = 100 * time / 50;
            object.metastyle = `transform:rotate(${angle}deg) scale(1.5);z-index:999;`
        },50);
        var x = 0;
        if(right)x =9;

        this.goto(x,5,50,function(object){
           var x = parseInt(Math.random() * 1000) % 10;
            object.goto(x,6,50,function(object){
                object.metastyle = `transform:rotate(180deg) scale(1)`;
               object.active=0;
                object.activated = true;
            });
        });
    }
}

class Player extends GameObject{
    constructor(){
        super('player','player-control',4.5,15,20,20);
        this.LAST_SHOOT = -50;
        this.TEMP = 0;
        this.COOL =false;
        this.GOD_MODE=false;
        this.SHOT_MOD = 1;
    }

    update(){

        if(getGame().checkGameOver()){
            var time = parseInt(getGame().getFrame() / 50);
            Database.addScore(time);
            $(".scores").slideDown(100);
            getGame().updateScores();
            getGame().CONFIG.DEFAULTS.INTERVAL = false;
        }

        if(getGame().CONFIG.EVENTS.MOVE_PLAYER == 1)
            this.cord.x+=.1;
        if(getGame().CONFIG.EVENTS.MOVE_PLAYER == -1)
            this.cord.x-=.1;
        if(this.cord.x>=9)this.cord.x=9;
        if(this.cord.x<=.5)this.cord.x=.5;
        if(this.COOL){
            $(".tmp").css('background-color',"#FF3800");
        }else{
            $(".tmp").css('background-color',"#ff962b");
        }
        if(this.TEMP == 0){
            this.COOL =false;
        }
        if(!this.COOL && getGame().CONFIG.EVENTS.SHOOT && getGame().getFramesPassed(this.LAST_SHOOT) > 10){
            console.log('Shoot');
            this.LAST_SHOOT = getGame().getFrame();
            if(this.SHOT_MOD==4){getGame().DB.push(new Laser(this.cord.x+0.15,5.8))};
            if(this.SHOT_MOD==1){getGame().DB.push(new Bullet(this.cord.x+0.35,this.cord.y,true))};
            if(this.SHOT_MOD==3){
                getGame().DB.push(new Bullet(this.cord.x+0.35,this.cord.y));
                getGame().DB.push(new Bullet(this.cord.x+0.20,this.cord.y));
                getGame().DB.push(new Bullet(this.cord.x+0.05,this.cord.y));
                getGame().DB.push(new Bullet(this.cord.x+0.50,this.cord.y));
                getGame().DB.push(new Bullet(this.cord.x+0.65,this.cord.y));
            };
            if(this.SHOT_MOD==2){
                var obj = this;
                setTimeout(function(){
                    getGame().DB.push(new Bullet(obj.cord.x+0.35,obj.cord.y));
                    setTimeout(function(){
                        getGame().DB.push(new Bullet(obj.cord.x+0.35,obj.cord.y));
                        setTimeout(function(){
                            getGame().DB.push(new Bullet(obj.cord.x+0.35,obj.cord.y));
                            setTimeout(function(){
                                getGame().DB.push(new Bullet(obj.cord.x+0.35,obj.cord.y));
                            },50);
                        },50);
                    },50);
                },50);

                //getGame().DB.push(new Bullet(this.cord.x+0.35,this.cord.y));
                //getGame().DB.push(new Bullet(this.cord.x+0.35,this.cord.y));
                //getGame().DB.push(new Bullet(this.cord.x+0.35,this.cord.y));
            }
            this.initAnim(function(object,time){
                var t = 5 - time;
                object.cord.y+= t/20;
            },9);
            if(this.SHOT_MOD==4){
                this.TEMP += 50;
            }else  if(this.SHOT_MOD==2){
                this.TEMP += 25;
            }else {
                this.TEMP += 10;
            }
            if(this.TEMP>=100){
                this.COOL =true;
                this.TEMP = 100;
            }
        }else if(getGame().getFramesPassed(this.LAST_SHOOT) > 10){
            this.TEMP -= 5;
            if(this.TEMP <= 0) this.TEMP = 0;
        }
        $(".tmp").css('width',this.TEMP+"%");
    }
}

class Bullet extends GameObject{
    constructor(x,y,sniper=false){
        super('bullet','bullet-control',x,y,2,20);
        this.sniper = sniper;
    }
    update(){

        if(this.cord.y <= 6){
            this.explode();
        }else{
            if(this.sniper){
                this.cord.y -= 1.3;
            }else {
                this.cord.y -= .4;
            }
        }
    }

    explode(){
        this.active=1;
        this.initAnim(function(object,frame){
            var opacity = 1 - 1 * frame / 8;
            object.metastyle=`transform-origin:top center;opacity:${opacity};transform:scaley(${opacity})`;
        },8,function(object){
            object.active=2;
        })
    }
}

class Laser extends GameObject{
    constructor(x,y){
        super('laser','bullet-control',x,y,10,275);
        this.START_TIME = getGame().getFrame();
    }
    update(){
        if(getGame().getFramesPassed(this.START_TIME) > 7){
            this.explode();
        }
    }

    explode(){
        this.active=1;
        this.initAnim(function(object,frame){
            var opacity = 1 - 1 * frame / 8;
            object.metastyle=`transform-origin:top center;opacity:${opacity};transform:scaley(${opacity})`;
        },8,function(object){
            object.active=2;
        })
    }
}

class Heart extends GameObject{
    constructor(x,y){
        super('heart','heart-control',x,y,20,20);
        this.START_TIME = getGame().getFrame();
    }
    update(){
        this.cord.y+=.15;
        this.collisionCheck('bullet',function(obj1,obj2){
            obj1.explode();
            obj2.explode();
        });
        this.collisionCheck('laser',function(obj1,obj2){
            obj1.explode();
            obj2.explode();
        });
        this.collisionCheck('player',function(obj1,obj2){
            obj1.explode();
            getGame().CONFIG.DEFAULTS.LIFE++;
        });
        if(this.cord.y>15.5){
            this.explode();
        }
    }

    explode(){
        this.active=1;
        this.initAnim(function(object,frame){
            var opacity = 1 - 1 * frame / 8;
            object.metastyle=`transform-origin:top center;opacity:${opacity};transform:scaley(${opacity})`;
        },8,function(object){
            object.active=2;
        })
    }
}


class AlienBullet extends GameObject{
    constructor(x,y){
        super('alien-bullet','bullet-control',x,y,2,20);
    }
    update(){
        this.collisionCheck('laser',function(obj1,obj2){
            obj1.explode();
            obj2.explode();
        });
        this.collisionCheck('bullet',function(obj1,obj2){
            obj1.explode();
            obj2.explode();
        });
        this.collisionCheck('player',function(obj1,player){
            if(getGame().CONFIG.DEFAULTS.LIFE > 1){
                getGame().CONFIG.DEFAULTS.LIFE--;
                obj1.explode();
                player.initAnim(function(object,time){
                    object.metastyle = "background-image:url('img/player_burn.png')"
                    var t = 2.5 - time;
                    object.cord.y+= t/20;
                },5,function(object){
                    object.metastyle = "";
                });
            }else{
                getGame().CONFIG.DEFAULTS.INTERVAL = false;
                $(".dead").slideDown(100);
            }
        })
        if(this.cord.y >= 15){
            this.explode();
        }else{
            this.cord.y+=.7;
        }
    }

    explode(){
        this.active=1;
        this.initAnim(function(object,frame){
            var opacity = 1 - 1 * frame / 8;
            object.metastyle=`transform-origin:top center;opacity:${opacity};transform:scaley(${opacity})`;
        },8,function(object){
            object.active=2;
        })
    }
}


/**
 * @property DB GameObject[]
 */
class Game {
    constructor(){
        this.CONFIG = {
            EVENTS:{
                MOVE_PLAYER:0,
                SHOOT:false
            },
            DEFAULTS:{
                LIFE:3,
                FRAME:0,
                PLAYER_ID:0,
                INTERVAL:true
            }
        }
        this.DB = [];
    }

    checkGameOver(){
        for(var i in getGame().DB){
            if(getGame().DB[i].type == 'enemy' && getGame().DB[i].active != 2)return false;
        }
        return true;
    }

    getFrame(){
        return getGame().CONFIG.DEFAULTS.FRAME;
    }
    getFramesPassed(frame){
        return (getGame().getFrame() - frame);
    }

    Init(){
        getGame().generateDefaultDB();
        getGame().render();
        getGame().update();
        getGame().setupEvents();
    }

    render(){
        $(".game").html('');
        for(var i in this.DB){
            if(this.DB[i].active != 2)
                $(".game").append(this.DB[i].getHTML());
        }
    }

    generateDefaultDB(){
        this.DB = [];
        this.DB.push(new Enemy('enemy-4',3,0,20,20));
        this.DB.push(new Enemy('enemy-4',6,0,20,20));
        for(var i = 2 ; i <= 7 ; i++    ){
            this.DB.push(new Enemy('enemy-3',i,1,20,20));
        }
        for(var i = 1 ; i <= 8 ; i++    ){
            this.DB.push(new Enemy('enemy-2',i,2,20,20));
        }
        for(var i = 0 ; i <= 9 ; i++    ){
            this.DB.push(new Enemy('enemy-1',i,3,20,20));
        }
        for(var i = 0 ; i <= 9 ; i++    ){
            this.DB.push(new Enemy('enemy-1',i,4,20,20));
        }
        for(var i = 0 ; i <= 9 ; i++    ){
            this.DB.push(new Enemy('enemy-1',i,5,20,20));
        }
        this.CONFIG.DEFAULTS.PLAYER_ID = this.DB.push(new Player()) -1     ;

    }

    update(){
        setInterval(function(){
            if(!getGame().CONFIG.DEFAULTS.INTERVAL) return ;
            getGame().CONFIG.DEFAULTS.FRAME++;
            if(getGame().getFrame() % 50 == 0){
                var time = getGame().getFrame() / 50;
                $("#time").text(time);
            }
            if(getGame().getFrame() % 800 == 0 || getGame().getFrame() == 200){
                var x = (parseInt(Math.random() * 1000) % 90) / 10;
                getGame().DB.push(new Heart(x,0));
            }
            var life = "";
            for(var i = 0 ; i <getGame().CONFIG.DEFAULTS.LIFE ; i ++ ){
                life+=`<div class="player" style="position:static;"></div>`;
                //
            }
            for(var i = getGame().CONFIG.DEFAULTS.LIFE ; i < 3 ; i ++ ){
                life+=`<div class="player" style="position:static;background-image:url('img/player_burn.png')"></div>`;
            }
            $(".life").html(life);
            if(getGame().getFrame() % 150 == 0){
                var object = null;
                for (var i in getGame().DB){
                    if(getGame().DB[i].type == 'enemy' && !getGame().DB[i].activated && getGame().DB[i].active == 0){
                        if(object == null) object = getGame().DB[i];
                        else{
                            if(object.cord.x > getGame().DB[i].cord.x) object = getGame().DB[i];
                            if(object.cord.x == getGame().DB[i].cord.x)
                                if(object.cord.y < getGame().DB[i].cord.y) object = getGame().DB[i];
                        }
                    }
                }

                if(object!= null)object.activate();

                var object = null;
                for (var i in getGame().DB){
                    if(getGame().DB[i].type == 'enemy' && !getGame().DB[i].activated && getGame().DB[i].active == 0){
                        if(object == null) object = getGame().DB[i];
                        else{
                            if(object.cord.x < getGame().DB[i].cord.x) object = getGame().DB[i];
                            if(object.cord.x == getGame().DB[i].cord.x)
                                if(object.cord.y < getGame().DB[i].cord.y) object = getGame().DB[i];
                        }
                    }
                }

                if(object!= null)object.activate(true);
            }
            for(var i in getGame().DB){
                if(getGame().DB[i].active != 2){
                    getGame().DB[i].runAnimes();
                    if(getGame().DB[i].active == 0)
                        getGame().DB[i].update();
                }
            }

            getGame().render();

        },20);
    }

    setupEvents(){
        $(document).keydown(function(e){
            if(e.keyCode == 49) getGame().activeGun(1);
            if(e.keyCode == 50) getGame().activeGun(2);
            if(e.keyCode == 51) getGame().activeGun(3);
            if(e.keyCode == 52) getGame().activeGun(4);
            if(e.keyCode == 37) getGame().CONFIG.EVENTS.MOVE_PLAYER = -1; else if(e.keyCode == 39) getGame().CONFIG.EVENTS.MOVE_PLAYER = 1;
            if(e.keyCode == 32) getGame().CONFIG.EVENTS.SHOOT = true;

        });
        $(document).keyup(function(e){
            if(e.keyCode == 37 || e.keyCode == 39) getGame().CONFIG.EVENTS.MOVE_PLAYER=0;
            if(e.keyCode == 32) getGame().CONFIG.EVENTS.SHOOT = false;
        });

    }

    activeGun(g){
        $(".gun").removeClass('active');
        $('.gun'+g).addClass('active');
        getGame().DB[getGame().CONFIG.DEFAULTS.PLAYER_ID].SHOT_MOD = g;
        getGame().DB[getGame().CONFIG.DEFAULTS.PLAYER_ID].SHOT_MOD = g;
    }

    fetchNameUI(){
        var name = $("#nametxt").val();
        if(name.length < 3 || name.length > 20){
            alert("Name must be between 3 - 20 characters");
            return ;
        }
        Database.setName(name);
        $(".start-page").slideUp(200);
        getGame().Init();

    }

    updateScores(){
        var scores = Database.getScores();
        $("#items").html(" ");
        var i = 0;
        for(var name in scores){
            i++;
            var value = scores[name];
            var html = `<li>#${i} ${name} - ${value}</li>`;
            $("#items").append(html);
        }
    }
}


class Animation {
    static deltaFinder(cord1,cord2,time){
        var x = (cord2.x - cord1.x)   / time;
        var y = (cord2.y - cord1.y)   / time;
        return {
            x:x,
            y:y
        };
    }
}


function start(){
    getGame().fetchNameUI();
}




var _game = new Game();
/**
 * @return Game
 */
function getGame(){
    return _game;
}


/**
 * PRODUCTION PART ONLY
 **/
$(function(){
    Database.setName("Mohammad");
    $(".start-page").slideUp(200);
    getGame().Init();
});

function restart(){
    window.location.reload();
}