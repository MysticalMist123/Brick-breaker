//-------------------------------------------INITIAL SETUP----------------------------------------------------------------------

const canvas = document.createElement("canvas")

canvas.setAttribute("id","canvas")

document.body.append(canvas)

const ctx = canvas.getContext("2d")
canvas.width = 700
canvas.height = 500

let r = 4
let c = 4
let padding = 30
let gap = 2
let height_to_canvas_ratio = 0.4 //values between 0 and 1
let gen_color = "#4334eb"
let bat_h = 8
let bat_w = 100
let ball_radius = 5
let ball_color = "yellow"

let brick_width = ((canvas.width - 2*padding)/c) - 2*gap
let brick_height = ((canvas.height*height_to_canvas_ratio - 2*padding)/r) - 2*gap
let total_brick_width = brick_width+2*gap
let total_brick_height = brick_height+2*gap
for(let i=0;i<r;i++)
{
    for(let j=0;j<c;j++)
    {
        Fill(ctx,gen_color,()=>{
            Rect(index_to_coord({i:i,j:j}),brick_width,brick_height)
        })
    }
}
let bat_pos = {x:canvas.width/2-bat_w/2,y:canvas.height-20}
Fill(ctx,gen_color,()=>{
    Rect(bat_pos,bat_w,bat_h)
})
let ball_pos = {x:bat_pos.x+bat_w/2,y:bat_pos.y-ball_radius-1}
Fill(ctx,ball_color,()=>{
    Arc(ball_pos,ball_radius,0,2*Math.PI)
})
//-------------------------------------------BASIC FUNCTIONS--------------------------------------------------------------------

function index_to_coord(indices)
{
    return {x: indices.j*total_brick_width + gap + padding ,y: indices.i*total_brick_height + gap + padding}
}
function Stroke(ctx,color,width,func){
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    func()
    ctx.stroke();
}
function Fill(ctx,color,func){
    ctx.beginPath();
    ctx.fillStyle = color;
    func()
    ctx.fill();
}

function Arc(pos,radius,start_angle,end_angle){
    ctx.arc(pos.x,pos.y,radius,start_angle,end_angle)
}
function Rect(pos,width,height){
    ctx.rect(pos.x,pos.y,width,height);
}
function Ellipse(pos,r1,r2,rotation=0,start=0,end=2*Math.PI){
    ctx.ellipse(pos.x, pos.y,r1,r2,rotation,start,2*end);
}

function Line(pos1,pos2,color,width,dotted = false,dash = 5,space = 50){
    Stroke(ctx,color,width,()=>{
        if (dotted){
            ctx.setLineDash([dash, space])
        }
        ctx.moveTo( pos1.x,pos1.y );
        ctx.lineTo( pos2.x,pos2.y );
    })
}
function get_cell_color(indices)
{
    let start = index_to_coord(indices)
    let colors = ctx.getImageData(start.x,start.y,brick_width,brick_height).data
    if(colors[0]==67 && colors[1]==52 && colors[2]==235)
        return 1
    else return 0
}

//----------------------------------BAT MOVEMENTS-----------------------------------------------------------------------------------

let speed = 0.05 //values between 0 and 1
let bat_id = null
document.body.addEventListener("keydown",(event)=>{
    if(!event.repeat)
        switch(event.key){
            case "ArrowLeft":
                requestAnimationFrame(moveLeft)
                break;
            case "ArrowRight":
                requestAnimationFrame(moveRight)
                break;
        }
})
document.body.addEventListener("keyup",()=>{
    cancelAnimationFrame(bat_id)
})
function moveLeft()
{
    if(bat_pos.x!=0)
    {
        ctx.clearRect(bat_pos.x,bat_pos.y,bat_w,bat_h)
        Fill(ctx,gen_color,()=>{
            bat_pos = {x:bat_pos.x-speed*bat_w,y:bat_pos.y}
            Rect(bat_pos,bat_w,bat_h)
        })
        bat_id = requestAnimationFrame(moveLeft)
    }
}
function moveRight()
{
    if(bat_pos.x!=canvas.width-bat_w)
    {
        ctx.clearRect(bat_pos.x,bat_pos.y,bat_w,bat_h)
        Fill(ctx,gen_color,()=>{
            bat_pos = {x:bat_pos.x+speed*bat_w,y:bat_pos.y}
            Rect(bat_pos,bat_w,bat_h)
        })
        bat_id = requestAnimationFrame(moveRight)
    }
}

//----------------------------------------------BALL MOVEMENTS------------------------------------------------------------------------

let ball_x_velocity = 2
let ball_y_velocity = 2
let ball_velocity = {x:ball_x_velocity,y:-ball_y_velocity}

let id = null
window.requestAnimationFrame(moveBall)
function moveBall()
{
    Fill(ctx,"rgb(10, 10, 150)",()=>{
        Arc(ball_pos,ball_radius+1,0,2*Math.PI)
    })
    Fill(ctx,ball_color,()=>{
        ball_pos = {x:ball_pos.x+ball_x_velocity,y:ball_pos.y-ball_y_velocity}
        Arc(ball_pos,ball_radius,0,2*Math.PI)
    })
    id = window.requestAnimationFrame(moveBall)
    check_change()
}

function check_change()
{
    if(ball_pos.x<=ball_radius || ball_pos.x>=canvas.width-ball_radius)
        ball_x_velocity =-ball_x_velocity
    if(ball_pos.y<=ball_radius)
        ball_y_velocity =-ball_y_velocity
    if(ball_pos.y>=canvas.height)
    {
        console.log("GAME OVER!")
        cancelAnimationFrame(id)
    }
    // if(ball_pos.y>=bat_pos.y-ball_radius)
    //     ball_y_velocity =-ball_y_velocity
    let c = ball_collision()
    if(c!=null)//if no collision, c is null. else, c is the constant to be added to velocity of ball 
    {
        ball_y_velocity =-ball_y_velocity
        ball_x_velocity+=c
        check_win_condition()
    }
    return 1
}

function ball_collision()
{
    let sqaure_ball_pos = {x:ball_pos.x-ball_radius,y:ball_pos.y-ball_radius}
    for(let i=0;i<r;i++)
    {
        for(let j=0;j<c;j++)
        {
            if(get_cell_color({i,j}))
            {
                coord = index_to_coord({i,j})
                if(coord.x<=sqaure_ball_pos.x+2*ball_radius+1 && sqaure_ball_pos.x<=coord.x+brick_width+1 &&
                    coord.y<=sqaure_ball_pos.y+2*ball_radius+1 && sqaure_ball_pos.y<=coord.y+brick_height+1)
                    {
                        ctx.clearRect(coord.x,coord.y,brick_width,brick_height)
                        if(sqaure_ball_pos.x-coord.x<=brick_width/2-ball_radius) //left side
                        {
                            return -(1-(sqaure_ball_pos.x+2*ball_radius-coord.x)/(brick_width/2))
                        }
                        else
                        {
                            return (sqaure_ball_pos.x-(coord.x+brick_width))/(brick_width/2)
                        }
                    }
            }
        }
    }
    if(bat_pos.x<=sqaure_ball_pos.x+2*ball_radius+1 && sqaure_ball_pos.x<=bat_pos.x+brick_width+1 &&
        bat_pos.y<=sqaure_ball_pos.y+2*ball_radius+1 && sqaure_ball_pos.y<=bat_pos.y+brick_height+1)
        {
            if(sqaure_ball_pos.x-bat_pos.x<=brick_width/2-ball_radius) //left side
            {
                return -Math.abs(1-(sqaure_ball_pos.x+2*ball_radius-bat_pos.x)/(brick_width/2))
            }
            else
            {
                return Math.abs(sqaure_ball_pos.x-(bat_pos.x+brick_width))/(brick_width/2)
            } 
        }
    return null
}

//---------------------------------------------WIN CONDITION----------------------------------------------------------

function check_win_condition()
{
    for(let i=0;i<r;i++)
    {
        for(let j=0;j<c;j++)
        {
            if(get_cell_color({i,j}))
            {
                return
            }
        }
    }
    cancelAnimationFrame(id)
    console.log("GAME OVER! YOU WIN!!!!")
}